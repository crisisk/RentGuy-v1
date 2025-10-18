"""CRM module exposes shared utilities for lead and deal management."""

from .routes import router  # noqa: F401
from .service import CRMService  # noqa: F401
from .models import CRMLead, CRMDeal, CRMActivity, CRMPipeline, CRMPipelineStage, CRMAutomationRun  # noqa: F401

__all__ = [
    "router",
    "CRMService",
    "CRMLead",
    "CRMDeal",
    "CRMActivity",
    "CRMPipeline",
    "CRMPipelineStage",
    "CRMAutomationRun",
]
