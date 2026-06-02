from typing import List, Dict, Any, Optional
from .executor import executor

class DeploymentInspector:
    def inspect(self, context: Optional[str] = None) -> Dict[str, Any]:
        result = executor.run(["get", "deployments", "-A"], json_output=True, context=context)
        
        if not result["success"]:
            return {"unhealthy_deployments": [], "error": result["error"]}

        deployments = result["output"].get("items", [])
        unhealthy_deployments = []

        for deploy in deployments:
            name = deploy["metadata"]["name"]
            namespace = deploy["metadata"]["namespace"]
            status = deploy.get("status", {})
            
            replicas = status.get("replicas", 0)
            ready_replicas = status.get("readyReplicas", 0)
            updated_replicas = status.get("updatedReplicas", 0)
            available_replicas = status.get("availableReplicas", 0)
            
            is_unhealthy = (
                replicas != ready_replicas or
                replicas != available_replicas or
                replicas != updated_replicas
            )

            if is_unhealthy:
                conditions = status.get("conditions", [])
                failure_reason = "Unknown"
                for cond in conditions:
                    if cond.get("type") == "Available" and cond.get("status") == "False":
                        failure_reason = cond.get("message", "Not available")
                    elif cond.get("type") == "Progressing" and cond.get("status") == "False":
                        failure_reason = cond.get("message", "Rollout failed")

                unhealthy_deployments.append({
                    "name": name,
                    "namespace": namespace,
                    "desired": replicas,
                    "ready": ready_replicas,
                    "available": available_replicas,
                    "reason": failure_reason
                })

        return {
            "unhealthy_deployments": unhealthy_deployments
        }

deployment_inspector = DeploymentInspector()
