CREATE TABLE IF NOT EXISTS public.investigation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    investigation_id UUID REFERENCES public.investigations(id) ON DELETE CASCADE,
    message TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.investigation_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view progress for their investigations"
ON public.investigation_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = investigation_progress.investigation_id
        AND investigations.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert progress for their investigations"
ON public.investigation_progress
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = investigation_progress.investigation_id
        AND investigations.user_id = auth.uid()
    )
);

-- Add service role bypass or admin access if needed, 
-- but since we use API_KEY in backend, it bypasses RLS if it's a service key.
-- In InsForge, createAdminClient uses the API key which has full access.
