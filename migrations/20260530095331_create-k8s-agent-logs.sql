CREATE TABLE k8s_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now() NOT NULL,
  pod_name text NOT NULL,
  log_level text NOT NULL,
  message text NOT NULL
);

-- Enable RLS
ALTER TABLE k8s_agent_logs ENABLE ROW LEVEL SECURITY;

-- Allow project_admin to do everything (default in InsForge for migrations)
-- Add any other RLS policies here if needed later.
