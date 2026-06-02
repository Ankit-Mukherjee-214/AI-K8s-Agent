from typing import List, Dict, Any, Optional
from .executor import executor

class LogsCollector:
    def collect(self, pod_name: str, namespace: str, tail_lines: int = 50, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetches logs for a specific pod in a namespace.
        """
        args = ["logs", pod_name, "-n", namespace, f"--tail={tail_lines}"]
        result = executor.run(args, context=context)
        
        if not result["success"]:
            # Try with --all-containers if first attempt fails (common for multi-container pods)
            args.append("--all-containers")
            result = executor.run(args, context=context)

        return {
            "pod": pod_name,
            "namespace": namespace,
            "success": result["success"],
            "logs": result["output"] if result["success"] else f"Error fetching logs: {result['error']}"
        }

    def collect_for_unhealthy(self, problematic_pods: List[Dict[str, Any]], context: Optional[str] = None) -> List[Dict[str, Any]]:
        all_logs = []
        for pod in problematic_pods[:5]:  # Limit to first 5 problematic pods
            all_logs.append(self.collect(pod["name"], pod["namespace"], context=context))
        return all_logs

logs_collector = LogsCollector()
