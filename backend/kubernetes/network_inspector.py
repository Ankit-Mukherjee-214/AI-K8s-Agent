from typing import List, Dict, Any
from .executor import executor

class NetworkInspector:
    def inspect(self) -> Dict[str, Any]:
        # Check Services
        svc_result = executor.run(["get", "svc", "-A"], json_output=True)
        
        # Check Endpoints
        ep_result = executor.run(["get", "endpoints", "-A"], json_output=True)

        if not svc_result["success"]:
            return {"services": [], "error": svc_result["error"]}

        services = svc_result["output"].get("items", [])
        endpoints = ep_result["output"].get("items", []) if ep_result["success"] else []
        
        network_issues = []

        for svc in services:
            name = svc["metadata"]["name"]
            namespace = svc["metadata"]["namespace"]
            spec = svc.get("spec", {})
            svc_type = spec.get("type")
            
            # Match endpoints with service
            svc_endpoints = next((ep for ep in endpoints if ep["metadata"]["name"] == name and ep["metadata"]["namespace"] == namespace), None)
            
            has_subsets = svc_endpoints and "subsets" in svc_endpoints
            
            if not has_subsets and svc_type != "ExternalName":
                network_issues.append({
                    "name": name,
                    "namespace": namespace,
                    "type": svc_type,
                    "issue": "No active endpoints (selector might not match any pods)"
                })

        return {
            "network_issues": network_issues
        }

network_inspector = NetworkInspector()
