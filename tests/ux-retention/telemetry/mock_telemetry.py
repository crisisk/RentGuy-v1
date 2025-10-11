#!/usr/bin/env python3
"""Seed mock telemetry events aligned with RentGuy UX funnels."""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_PATH = REPO_ROOT / 'tests/ux-retention/reports/telemetry_seed_events.json'

PERSONA_FLOWS = {
    'Renske': 'inventory_to_quote',
    'Lisa': 'quote_to_payment',
    'Wouter': 'pick_pack_load',
    'Said': 'crew_shift',
    'Inge': 'transport_planning',
    'CFO': 'billing_collections',
}

EVENT_SEQUENCE = [
    'search_started',
    'search_completed',
    'quote_created',
    'booking_started',
    'booking_completed',
    'payment_succeeded',
    'pick_started',
    'pick_completed',
    'loadout_done',
    'return_checked',
]


@dataclass
class TelemetryEvent:
    name: str
    persona: str
    flow: str
    properties: Dict[str, str]
    timestamp: str


def build_events() -> Iterable[TelemetryEvent]:
    now = datetime.now(timezone.utc)
    for persona, flow in PERSONA_FLOWS.items():
        for index, event_name in enumerate(EVENT_SEQUENCE):
            yield TelemetryEvent(
                name=event_name,
                persona=persona,
                flow=flow,
                properties={
                    'environment': 'staging',
                    'sequence': str(index + 1),
                    'ga4_id': 'G-RENTGUY000',
                    'matomo_site_id': '7',
                },
                timestamp=(now).isoformat(),
            )


def write_events(events: Iterable[TelemetryEvent], destination: Path) -> None:
    payload: List[Dict[str, object]] = [asdict(event) for event in events]
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')


def main() -> None:
    events = list(build_events())
    write_events(events, OUTPUT_PATH)
    print(f'Wrote {len(events)} mock telemetry events to {OUTPUT_PATH.relative_to(REPO_ROOT)}')


if __name__ == '__main__':
    main()
