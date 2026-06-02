import subprocess
import json
from loguru import logger
from typing import List, Optional, Dict, Any

class KubectlExecutor:
    def __init__(self):
        self.base_cmd = ["kubectl"]
        self._setup_kubeconfig()

    def _setup_kubeconfig(self):
        """
        Creates a patched version of the kubeconfig for use within Docker.
        """
        import os
        import shutil
        
        orig_config = os.environ.get("KUBECONFIG", "/root/.kube/config")
        self.patched_config = "/tmp/kubeconfig_patched"
        
        if os.path.exists(orig_config):
            try:
                with open(orig_config, "r") as f:
                    content = f.read()
                
                # Replace localhost with host.docker.internal for Kind clusters
                patched_content = content.replace("127.0.0.1", "host.docker.internal")
                
                with open(self.patched_config, "w") as f:
                    f.write(patched_content)
                
                logger.info(f"Patched kubeconfig created at {self.patched_config}")
            except Exception as e:
                logger.error(f"Failed to patch kubeconfig: {e}")
                self.patched_config = orig_config
        else:
            self.patched_config = orig_config

    def run(self, args: List[str], json_output: bool = False, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a kubectl command and returns the output.
        """
        import os
        env = os.environ.copy()
        env["KUBECONFIG"] = self.patched_config

        full_cmd = self.base_cmd.copy()
        # Add insecure flag to handle certificate name mismatch (host.docker.internal vs localhost)
        full_cmd += ["--insecure-skip-tls-verify"]
        
        if context:
            full_cmd += ["--context", context]
            
        full_cmd += args
        if json_output:
            full_cmd += ["-o", "json"]

        cmd_str = " ".join(full_cmd)
        logger.info(f"Executing: {cmd_str}")

        try:
            result = subprocess.run(
                full_cmd,
                capture_output=True,
                text=True,
                check=False,
                env=env
            )

            if result.returncode != 0:
                # Special handling for common connectivity errors
                err_msg = result.stderr.strip()
                if "connection to the server" in err_msg.lower() or "refused" in err_msg.lower():
                    friendly_err = f"Unable to connect to Kubernetes cluster ({context or 'default'}). Please verify your cluster access."
                else:
                    friendly_err = err_msg

                logger.error(f"Command failed: {err_msg}")
                return {
                    "success": False,
                    "error": friendly_err,
                    "output": None
                }

            output = result.stdout.strip()
            
            if json_output and output:
                try:
                    return {
                        "success": True,
                        "error": None,
                        "output": json.loads(output)
                    }
                except json.JSONDecodeError:
                    logger.error("Failed to parse JSON output")
                    return {
                        "success": False,
                        "error": "JSON parse error",
                        "output": output
                    }

            return {
                "success": True,
                "error": None,
                "output": output
            }

        except Exception as e:
            logger.exception(f"Unexpected error running command: {e}")
            return {
                "success": False,
                "error": f"An internal error occurred: {str(e)}",
                "output": None
            }

    def list_contexts(self) -> List[str]:
        """Lists available contexts in the kubeconfig."""
        result = self.run(["config", "get-contexts", "-o", "name"])
        if result["success"] and result["output"]:
            # Filter out empty lines and trim
            return [line.strip() for line in result["output"].split("\n") if line.strip()]
        return []

executor = KubectlExecutor()
