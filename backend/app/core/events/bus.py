from typing import Callable, Dict, List, Any

Handler = Callable[[Any], None]

class EventBus:
    def __init__(self):
        self._subs: Dict[str, List[Handler]] = {}

    def subscribe(self, event_type: str, handler: Handler):
        self._subs.setdefault(event_type, []).append(handler)

    def publish(self, event: Any):
        for h in self._subs.get(getattr(event, "event_type", ""), []):
            try:
                h(event)
            except Exception:
                pass

bus = EventBus()
