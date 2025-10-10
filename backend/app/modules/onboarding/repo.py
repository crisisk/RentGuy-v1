import json
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from .models import OnboardingStep, UserProgress, Tip


def _load_defaults() -> dict:
    """Load the MR-DJ onboarding defaults shared with the frontend."""

    try:
        root_path = Path(__file__).resolve().parents[4]
    except IndexError:
        root_path = Path(__file__).resolve().parent

    candidates = [
        root_path / "mr_dj_onboarding.json",
        Path(__file__).resolve().with_name("mr_dj_onboarding.json"),
    ]

    for candidate in candidates:
        if candidate.exists():
            with candidate.open(encoding="utf-8") as handle:
                return json.load(handle)

    return {"steps": [], "tips": []}


DEFAULT_CONFIG = _load_defaults()
DEFAULT_STEPS = DEFAULT_CONFIG.get("steps", [])
DEFAULT_TIPS = DEFAULT_CONFIG.get("tips", [])


class OnboardingRepo:
    def __init__(self, db: Session):
        self.db = db

    def ensure_seed(self):
        self._seed_steps()
        self._seed_tips()
        self.db.flush()

    def _seed_steps(self):
        existing = {s.code for s in self.db.execute(select(OnboardingStep)).scalars().all()}
        for step in DEFAULT_STEPS:
            code = step.get("code")
            title = step.get("title")
            description = step.get("description", "")
            if not code or not title or code in existing:
                continue
            self.db.add(OnboardingStep(code=code, title=title, description=description))

    def _seed_tips(self):
        existing = {(t.module, t.message) for t in self.db.execute(select(Tip)).scalars().all()}
        for tip in DEFAULT_TIPS:
            module = tip.get("module")
            message = tip.get("message")
            cta = tip.get("cta", "")
            if not module or not message or (module, message) in existing:
                continue
            self.db.add(Tip(module=module, message=message, cta=cta, active=True))

    def list_steps(self):
        return self.db.execute(select(OnboardingStep).order_by(OnboardingStep.id)).scalars().all()

    def list_tips(self, module: str | None = None):
        q = select(Tip).where(Tip.active == True)
        if module:
            q = q.where(Tip.module == module)
        return self.db.execute(q).scalars().all()

    def progress_for(self, email: str):
        return self.db.execute(select(UserProgress).where(UserProgress.user_email == email)).scalars().all()

    def mark_complete(self, email: str, step_code: str):
        row = self.db.execute(
            select(UserProgress).where(UserProgress.user_email == email, UserProgress.step_code == step_code)
        ).scalar_one_or_none()
        if row:
            row.status = "complete"
            row.completed_at = datetime.utcnow()
        else:
            self.db.add(
                UserProgress(
                    user_email=email,
                    step_code=step_code,
                    status="complete",
                    completed_at=datetime.utcnow(),
                )
            )
        self.db.flush()
