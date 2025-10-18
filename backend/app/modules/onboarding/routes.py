from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .repo import OnboardingRepo
from .schemas import StepOut, ProgressOut, CompleteIn, TipOut
from app.modules.platform.mailer import send_email

router = APIRouter()

@router.get("/onboarding/steps", response_model=list[StepOut])
def get_steps(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","crew","viewer"))):
    repo = OnboardingRepo(db); repo.ensure_seed(); db.commit()
    return repo.list_steps()

@router.get("/onboarding/progress", response_model=list[ProgressOut])
def get_progress(user_email: str, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","crew","viewer"))):
    repo = OnboardingRepo(db)
    return repo.progress_for(user_email)

@router.post("/onboarding/complete", response_model=dict)
def complete_step(payload: CompleteIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","crew","viewer"))):
    repo = OnboardingRepo(db)
    repo.mark_complete(payload.user_email, payload.step_code)
    db.commit()
    return {"ok": True}

@router.get("/onboarding/tips", response_model=list[TipOut])
def tips(module: str = "", db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","crew","viewer"))):
    repo = OnboardingRepo(db)
    return repo.list_tips(module or None)

@router.post("/onboarding/send-welcome", response_model=dict)
def send_welcome(to_email: str, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    subj = "Welkom bij MR-DJ Enterprise – jouw backstage assistent"
    body = (
        "Welkom bij MR-DJ Enterprise Suite!\n\n"
        "Volg de onboarding checklist om je eerste show te plannen, crew uit te nodigen en je templates te activeren. "
        "Hulp nodig? Antwoord op deze mail en ons team helpt je direct verder."
    )
    ok = send_email(to_email, subj, body)
    return {"ok": bool(ok)}
