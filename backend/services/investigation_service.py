from typing import Dict, Any
from loguru import logger
from .pod_inspector import pod_inspector
from .logs_collector import logs_collector
from .events_analyzer import events_analyzer
from .deployment_inspector import deployment_inspector
from .network_inspector import network_inspector

class InvestigationService:
    def run_full_investigation(self) -> Dict[str, Any]:
        logger.info("Starting full Kubernetes investigation...")
        
        # 1. Check Pods
        pods_info = pod_inspector.inspect()
        
        # 2. Collect Logs for problematic pods
        logs_info = []
        if not pods_info["healthy"]:
            logs_info = logs_collector.collect_for_unhealthy(pods_info["problematic_pods"])
            
        # 3. Analyze Events
        events_info = events_analyzer.analyze()
        
        # 4. Inspect Deployments
        deploy_info = deployment_inspector.inspect()
        
        # 5. Check Networking
        network_info = network_inspector.inspect()
        
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
