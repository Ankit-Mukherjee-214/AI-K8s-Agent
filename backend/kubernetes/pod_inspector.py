from typing import List, Dict, Any, Optional
from .executor import executor

class PodInspector:
    UNHEALTHY_STATUSES = [
        "CrashLoopBackOff",
        "ImagePullBackOff",
        "Pending",
        "Error",
        "OOMKilled",
        "ContainerCreating",
        "Terminating",
        "Evicted",
        "ErrImagePull"
    ]

    def inspect(self, context: Optional[str] = None) -> Dict[str, Any]:
        result = executor.run(["get", "pods", "-A"], json_output=True, context=context)
        
        if not result["success"]:
            return {"healthy": True, "problematic_pods": [], "error": result["error"]}

        pods = result["output"].get("items", [])
        problematic_pods = []

        for pod in pods:
            name = pod["metadata"]["name"]
            namespace = pod["metadata"]["namespace"]
            status_info = pod.get("status", {})
            phase = status_info.get("phase", "Unknown")
            
            # Check container statuses for specific wait reasons
            container_statuses = status_info.get("containerStatuses", [])
            state_reason = None
            
            for cs in container_statuses:
                waiting = cs.get("state", {}).get("waiting", {})
                terminated = cs.get("state", {}).get("terminated", {})
                
                if waiting:
                    state_reason = waiting.get("reason")
                elif terminated:
                    state_reason = terminated.get("reason")
                
                if state_reason in self.UNHEALTHY_STATUSES:
                    break
            
            # If no container-specific reason, check phase
            if not state_reason and phase in ["Pending", "Failed"]:
                state_reason = phase

            if state_reason or phase not in ["Running", "Succeeded"]:
                problematic_pods.append({
                    "name": name,
                    "namespace": namespace,
                    "status": state_reason or phase,
                    "phase": phase
                })

        return {
            "healthy": len(problematic_pods) == 0,
            "problematic_pods": problematic_pods
        }

pod_inspector = PodInspector()
