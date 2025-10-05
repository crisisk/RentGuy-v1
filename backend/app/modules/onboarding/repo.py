from sqlalchemy.orm import Session
from sqlalchemy import select, update
from datetime import datetime
from .models import OnboardingStep, UserProgress, Tip

DEFAULT_STEPS = [
    ("welcome", "Welkom bij Rentguy", "Een korte tour en je eerste project maken."),
    ("project", "Maak je eerste project", "Voeg een klant en datumrange toe."),
    ("crew", "Voeg je eerste crewlid toe", "Nodig iemand uit via e-mail."),
    ("booking", "Maak een crewbooking", "Plan iemand op je project en stuur een uitnodiging."),
    ("scan", "Scan een item", "Open de PWA-scanner en boek een item uit."),
    ("transport", "Genereer een transportbrief", "Maak een route en exporteer de PDF."),
    ("invoice", "Maak een factuur", "Genereer een factuur voor je project."),
]

class OnboardingRepo:
    def __init__(self, db: Session):
        self.db = db

    def ensure_seed(self):
        # seed steps if not exist
        existing = {s.code for s in self.db.execute(select(OnboardingStep)).scalars().all()}
        for code, title, desc in DEFAULT_STEPS:
            if code not in existing:
                self.db.add(OnboardingStep(code=code, title=title, description=desc))
        self.db.flush()

    def list_steps(self):
        return self.db.execute(select(OnboardingStep).order_by(OnboardingStep.id)).scalars().all()

    def list_tips(self, module: str | None = None):
        q = select(Tip).where(Tip.active==True)
        if module:
            q = q.where(Tip.module==module)
        return self.db.execute(q).scalars().all()

    def progress_for(self, email: str):
        return self.db.execute(select(UserProgress).where(UserProgress.user_email==email)).scalars().all()

    def mark_complete(self, email: str, step_code: str):
        # upsert
        row = self.db.execute(select(UserProgress).where(UserProgress.user_email==email, UserProgress.step_code==step_code)).scalar_one_or_none()
        if row:
            row.status = "complete"
            row.completed_at = datetime.utcnow()
        else:
            self.db.add(UserProgress(user_email=email, step_code=step_code, status="complete", completed_at=datetime.utcnow()))
        self.db.flush()
