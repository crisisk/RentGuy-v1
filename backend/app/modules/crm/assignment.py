"""
Lead assignment module for automatic lead routing and prioritization.
AI-Generated with Claude Haiku, adapted for RentGuy CRM.
"""

import logging
from typing import Optional, Dict
from sqlalchemy.orm import Session

from app.modules.crm.models import CRMLead

logger = logging.getLogger(__name__)

# Assignment rules configuration
ASSIGNMENT_RULES: Dict[str, Dict[str, str]] = {
    "bruiloft": {
        "priority": "high",
        "notes": "Bruiloft - Wedding specialist needed. High value event.",
        "team": "wedding_specialists"
    },
    "bedrijfsfeest": {
        "priority": "medium",
        "notes": "Bedrijfsfeest - Corporate event. Professional setup required.",
        "team": "corporate"
    },
    "verjaardag": {
        "priority": "normal",
        "notes": "Verjaardagsfeest - Standard party package.",
        "team": "general"
    },
    "feest": {
        "priority": "normal",
        "notes": "Algemeen feest - Standard DJ package.",
        "team": "general"
    },
    "default": {
        "priority": "normal",
        "notes": "Standaard event - General handling.",
        "team": "general"
    }
}


def assign_lead(lead: CRMLead, db: Session) -> CRMLead:
    """
    Assign priority and routing info to a lead based on event type.

    Args:
        lead: CRMLead object to be assigned
        db: Database session

    Returns:
        CRMLead: Updated lead with assignment details
    """
    try:
        # Get event type (normalize to lowercase)
        event_type = (lead.event_type or "").lower().strip()

        # Look up assignment rule
        rule = ASSIGNMENT_RULES.get(event_type, ASSIGNMENT_RULES["default"])

        # Check if CRMLead model has these fields
        # If not, we'll just log the assignment
        try:
            if hasattr(lead, 'priority'):
                lead.priority = rule["priority"]
                logger.info(f"Set priority={rule['priority']} for lead {lead.id}")
        except Exception as e:
            logger.warning(f"Could not set priority field: {e}")

        try:
            if hasattr(lead, 'assignment_notes'):
                lead.assignment_notes = rule["notes"]
        except Exception as e:
            logger.warning(f"Could not set assignment_notes field: {e}")

        # Log assignment
        logger.info(
            f"Lead {lead.id} assigned: "
            f"event_type={event_type}, "
            f"priority={rule['priority']}, "
            f"team={rule['team']}"
        )

        # Commit changes if fields were updated
        try:
            db.commit()
            db.refresh(lead)
        except Exception as e:
            logger.warning(f"Could not commit lead assignment: {e}")
            db.rollback()

        return lead

    except Exception as e:
        logger.error(f"Lead assignment failed for lead {lead.id}: {str(e)}", exc_info=True)
        db.rollback()
        # Don't raise - return original lead
        return lead


def get_assignment_team(event_type: str) -> str:
    """
    Get team assignment based on event type.

    Args:
        event_type: Type of event

    Returns:
        str: Team identifier
    """
    event_type = (event_type or "").lower().strip()
    rule = ASSIGNMENT_RULES.get(event_type, ASSIGNMENT_RULES["default"])
    return rule["team"]


def get_assignment_priority(event_type: str) -> str:
    """
    Get priority level based on event type.

    Args:
        event_type: Type of event

    Returns:
        str: Priority level (high, medium, normal)
    """
    event_type = (event_type or "").lower().strip()
    rule = ASSIGNMENT_RULES.get(event_type, ASSIGNMENT_RULES["default"])
    return rule["priority"]


def update_assignment_rules(new_rules: Dict[str, Dict[str, str]]) -> bool:
    """
    Update assignment rules configuration.

    Args:
        new_rules: New rules dictionary

    Returns:
        bool: Success status
    """
    try:
        global ASSIGNMENT_RULES
        ASSIGNMENT_RULES.update(new_rules)
        logger.info(f"Updated assignment rules: {list(new_rules.keys())}")
        return True
    except Exception as e:
        logger.error(f"Failed to update assignment rules: {e}")
        return False
