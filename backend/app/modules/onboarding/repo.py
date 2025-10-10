from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from .models import OnboardingStep, UserProgress, Tip

DEFAULT_STEPS = [
    ("welcome", "Welkom bij MR-DJ Enterprise", "Activeer de launch checklist en stel je MR-DJ voorkeuren in."),
    ("project", "Plan je eerste MR-DJ show", "Maak een project aan met klant, locaties en podiumtijd."),
    ("crew", "Nodig crewleden uit", "Verstuur MR-DJ briefings naar technici en DJ's."),
    ("booking", "Plan een crewbooking", "Koppel een team aan het project en stuur draaiboeken."),
    ("scan", "Scan je gear", "Gebruik de PWA om decks, speakers en lichten te scannen."),
    ("transport", "Genereer een transportbrief", "Maak een route en deel de logistieke briefing."),
    ("invoice", "Activeer facturatie", "Genereer en verstuur een factuur vanuit het project."),
    ("templates", "Personaliseer MR-DJ templates", "Stem crew-, transport- en factuursjablonen af op jullie huisstijl."),
]

DEFAULT_TIPS = [
    ("projects", "Gebruik de MR-DJ showbuilder om events modulair te plannen en dubbele boekingen te voorkomen.", "Open de planner"),
    ("crew", "Activeer automatische briefings zodat technici de MR-DJ draaiboeken per shift ontvangen.", "Configureer crewbriefing"),
    ("inventory", "Bundel decks, microfoons en effecten tot MR-DJ kits zodat warehouse scanning sneller gaat.", "Maak een gear kit"),
    ("warehouse", "Gebruik de PWA-scanner bij in- en uitgifte voor realtime magazijnstatus.", "Start mobiele scanner"),
    ("transport", "Plan ritten met MR-DJ routekaarten en deel de QR-code met chauffeurs.", "Genereer transportbrief"),
    ("billing", "Koppel projecten direct aan je MR-DJ factuursjabloon en verstuur met één klik.", "Maak factuur"),
    ("templates", "Werk met de MR-DJ branding kit voor offertes, crewbriefings en QR-check-ins.", "Open templatebeheer"),
]


class OnboardingRepo:
    def __init__(self, db: Session):
        self.db = db

    def ensure_seed(self):
        self._seed_steps()
        self._seed_tips()
        self.db.flush()

    def _seed_steps(self):
        existing = {s.code for s in self.db.execute(select(OnboardingStep)).scalars().all()}
        for code, title, desc in DEFAULT_STEPS:
            if code not in existing:
                self.db.add(OnboardingStep(code=code, title=title, description=desc))

    def _seed_tips(self):
        existing = {(t.module, t.message) for t in self.db.execute(select(Tip)).scalars().all()}
        for module, message, cta in DEFAULT_TIPS:
            if (module, message) not in existing:
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
