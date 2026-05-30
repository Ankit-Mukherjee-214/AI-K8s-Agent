import json
from typing import Dict, Any

class PromptBuilder:
    @staticmethod
    def build_troubleshooting_prompt(investigation_data: Dict[str, Any]) -> str:
        """
        Constructs a structured prompt for the LLM based on Kubernetes evidence.
        """
        prompt = f"""
Analyze the following Kubernetes investigation evidence and provide a diagnosis.

### Evidence:
{json.dumps(investigation_data, indent=2)}

### Requirements:
As a Senior Kubernetes SRE, identify the root cause and suggest specific fixes.
You MUST return a JSON object with the following structure:
{{
  "root_cause": "Brief description of the root cause",
  "explanation": "Detailed explanation of why this is happening",
  "fix": "Actionable steps to fix the issue",
  "kubectl_command": "Specific kubectl commands to execute for the fix",
  "prevention": "How to prevent this in the future",
  "confidence": <integer between 0 and 100>,
  "confidence_reasoning": "Brief explanation for the confidence score"
}}

Focus on correlation between pods, logs, and events.
If no issues are found, state that the cluster appears healthy.
"""
        return prompt

prompt_builder = PromptBuilder()
