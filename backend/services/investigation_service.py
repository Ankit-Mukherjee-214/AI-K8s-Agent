from typing import Dict, Any, Optional
from loguru import logger
from kubernetes.pod_inspector import pod_inspector
from kubernetes.logs_collector import logs_collector
from kubernetes.events_analyzer import events_analyzer
from kubernetes.deployment_inspector import deployment_inspector
from kubernetes.network_inspector import network_inspector
from .insforge_service import insforge_service

class InvestigationService:
    async def run_full_investigation(self, investigation_id: str, context: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"Starting full Kubernetes investigation for {investigation_id} (Context: {context or 'default'})...")
        
        # 1. Check Pods
        await insforge_service.publish_progress(investigation_id, "Checking Pods...")
        pods_info = pod_inspector.inspect(context=context)
        
        # Check for immediate connectivity error
        if "error" in pods_info and "Unable to connect" in pods_info["error"]:
            return {"error": pods_info["error"]}

        # 2. Collect Logs for problematic pods
        await insforge_service.publish_progress(investigation_id, "Reading Logs...")
        logs_info = []
        if not pods_info.get("healthy", True):
            logs_info = logs_collector.collect_for_unhealthy(pods_info.get("problematic_pods", []), context=context)
            
        # 3. Analyze Events
        await insforge_service.publish_progress(investigation_id, "Analyzing Events...")
        events_info = events_analyzer.analyze(context=context)
        
        # 4. Inspect Deployments
        await insforge_service.publish_progress(investigation_id, "Inspecting Deployments...")
        deploy_info = deployment_inspector.inspect(context=context)
        
        # 5. Check Networking
        await insforge_service.publish_progress(investigation_id, "Checking Networking...")
        network_info = network_inspector.inspect(context=context)
        
        investigation_payload = {
            "pods": pods_info,
            "logs": logs_info,
            "events": events_info,
            "deployments": deploy_info,
            "network": network_info
        }
        
        logger.info("Investigation complete.")
        return investigation_payload

investigation_service = InvestigationService()
