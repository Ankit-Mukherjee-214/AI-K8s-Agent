from typing import List, Dict, Any
from .executor import executor

class EventsAnalyzer:
    INTERESTING_REASONS = [
        "FailedScheduling",
        "BackOff",
        "FailedMount",
        "FailedPull",
        "ErrImagePull",
        "Unhealthy",
        "Failed",
        "Killing"
    ]

    def analyze(self) -> Dict[str, Any]:
        result = executor.run(["get", "events", "-A", "--sort-by=.lastTimestamp"], json_output=True)
        
        if not result["success"]:
            return {"events": [], "error": result["error"]}

        events = result["output"].get("items", [])
        critical_events = []

        # Get the most recent 20 events that match our interesting reasons
        for event in reversed(events):
            reason = event.get("reason")
            if reason in self.INTERESTING_REASONS or event.get("type") == "Warning":
                critical_events.append({
                    "reason": reason,
                    "message": event.get("message"),
                    "object": f"{event.get('involvedObject', {}).get('kind')}/{event.get('involvedObject', {}).get('name')}",
                    "namespace": event.get("metadata", {}).get("namespace"),
                    "type": event.get("type"),
                    "count": event.get("count"),
                    "last_timestamp": event.get("lastTimestamp")
                })
            
            if len(critical_events) >= 20:
                break

        return {
            "critical_events": critical_events
        }

events_analyzer = EventsAnalyzer()
