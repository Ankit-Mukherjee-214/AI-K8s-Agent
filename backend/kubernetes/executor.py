import subprocess
import json
from loguru import logger
from typing import List, Optional, Dict, Any

class KubectlExecutor:
    def __init__(self):
        self.base_cmd = ["kubectl"]

    def run(self, args: List[str], json_output: bool = False) -> Dict[str, Any]:
        """
        Executes a kubectl command and returns the output.
        """
        full_cmd = self.base_cmd + args
        if json_output:
            full_cmd += ["-o", "json"]

        cmd_str = " ".join(full_cmd)
        logger.info(f"Executing: {cmd_str}")

        try:
            result = subprocess.run(
                full_cmd,
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode != 0:
                logger.error(f"Command failed: {result.stderr}")
                return {
                    "success": False,
                    "error": result.stderr.strip(),
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
                "error": str(e),
                "output": None
            }

executor = KubectlExecutor()
