from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings

from .schemas import (
    SSOCallbackRequest,
    SSOCallbackResponse,
    SSOLoginRequest,
    SSOLoginResponse,
    TokenOut,
    UserCreate,
    UserLogin,
    UserOut,
    UserRoleUpdate,
)
from .models import User
from .repo import UserRepo
from .security import create_access_token, hash_password, verify_password
from .deps import (
    get_db,
    get_sso_client,
    get_sso_state_store,
    require_role,
)
from .sso import (
    AzureB2CSSOClient,
    AzureSSOError,
    SSOState,
    SSOStateStore,
    code_challenge,
    generate_code_verifier,
    generate_state,
)

ASSIGNABLE_ROLES = ("planner", "crew", "warehouse", "finance", "viewer", "admin")
ACCESSIBLE_ROLES = ASSIGNABLE_ROLES + ("pending",)

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    repo = UserRepo(db)
    if repo.by_email(payload.email):
        raise HTTPException(409, "Email already registered")
    u = User(email=payload.email, password_hash=hash_password(payload.password), role=payload.role)
    repo.add(u)
    db.commit()
    return UserOut(id=u.id, email=u.email, role=u.role)

@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    repo = UserRepo(db)
    u = repo.by_email(payload.email)
    if not u or not verify_password(payload.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(u.email)
    return TokenOut(access_token=token)

@router.get("/me", response_model=UserOut)
def me(user=Depends(require_role(*ACCESSIBLE_ROLES))):
    return UserOut(id=user.id, email=user.email, role=user.role)


@router.post("/role", response_model=UserOut)
def select_role(
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_role("pending")),
):
    if payload.role not in ASSIGNABLE_ROLES:
        raise HTTPException(400, "Invalid role selection")

    user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(id=user.id, email=user.email, role=user.role)


@router.post("/sso/login", response_model=SSOLoginResponse, status_code=status.HTTP_201_CREATED)
async def start_sso_login(
    payload: SSOLoginRequest,
    response: Response,
    request: Request,
    store: SSOStateStore = Depends(get_sso_state_store),
    client: AzureB2CSSOClient = Depends(get_sso_client),
):
    redirect_uri = payload.redirect_uri or settings.MRDJ_SSO_REDIRECT_URI
    if not redirect_uri:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "SSO redirect URI is not configured")

    state = generate_state()
    verifier = generate_code_verifier()
    challenge = code_challenge(verifier)

    return_url = payload.return_url or settings.MRDJ_PLATFORM_REDIRECT_URL

    await store.save(
        SSOState(
            state=state,
            code_verifier=verifier,
            redirect_uri=redirect_uri,
            return_url=return_url,
            created_at=datetime.now(tz=timezone.utc),
        )
    )

    cookie_secure = request.url.scheme == "https"
    response.set_cookie(
        "mrdj_sso_state",
        state,
        max_age=store.ttl_seconds,
        httponly=True,
        secure=cookie_secure,
        samesite="lax",
    )

    auth_url = client.build_authorization_url(
        redirect_uri=redirect_uri,
        state=state,
        code_challenge_value=challenge,
    )

    return SSOLoginResponse(
        authorization_url=auth_url,
        state=state,
        code_challenge=challenge,
        expires_in=store.ttl_seconds,
    )


def _extract_tenant(claims: dict) -> str | None:
    tenant_claim = claims.get("tenant") or claims.get("extension_Tenant") or claims.get("extension_tenant")
    if isinstance(tenant_claim, str) and tenant_claim.startswith("tenant:"):
        return tenant_claim.split(":", 1)[1]
    if isinstance(tenant_claim, str):
        return tenant_claim
    return None


def _resolve_role(claims: dict, existing_role: str) -> str:
    roles_claim = claims.get("roles") or claims.get("extension_Roles") or claims.get("extension_roles")
    preferred: str | None = None
    if isinstance(roles_claim, str):
        if roles_claim in ASSIGNABLE_ROLES:
            preferred = roles_claim
    elif isinstance(roles_claim, list):
        for candidate in roles_claim:
            if isinstance(candidate, str) and candidate in ASSIGNABLE_ROLES:
                preferred = candidate
                break
    if preferred:
        return preferred
    if existing_role in ACCESSIBLE_ROLES:
        return existing_role
    return "viewer"


@router.post("/sso/callback", response_model=SSOCallbackResponse)
async def complete_sso_login(
    payload: SSOCallbackRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    store: SSOStateStore = Depends(get_sso_state_store),
    client: AzureB2CSSOClient = Depends(get_sso_client),
):
    cookie_state = request.cookies.get("mrdj_sso_state")
    if cookie_state and cookie_state != payload.state:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "State parameter mismatch")

    stored = await store.pop(payload.state)
    if not stored:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "State expired or unknown")

    try:
        token_payload = await client.exchange_code(
            code=payload.code,
            redirect_uri=stored.redirect_uri,
            code_verifier=stored.code_verifier,
        )
    except AzureSSOError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    claims = client.parse_id_token(token_payload["id_token"])
    email = claims.get("email") or claims.get("preferred_username")
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "IdP response missing email claim")

    tenant = _extract_tenant(claims)
    if tenant != "mrdj":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "User is not authorised for this tenant")

    repo = UserRepo(db)
    user = repo.by_email(email)
    if not user:
        resolved_role = _resolve_role(claims, "viewer")
        user = User(
            email=email,
            password_hash="!sso-login",
            role=resolved_role,
        )
        repo.add(user)
    else:
        user.role = _resolve_role(claims, user.role)
        db.add(user)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.email)
    redirect_target = payload.return_url or stored.return_url or settings.MRDJ_PLATFORM_REDIRECT_URL
    response.delete_cookie("mrdj_sso_state")

    return SSOCallbackResponse(
        session_token=access_token,
        redirect_url=redirect_target,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        tenant="mrdj",
    )
