CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    root_cause TEXT,
    explanation TEXT,
    fix TEXT,
    kubectl_command TEXT,
    confidence INTEGER,
    namespace TEXT,
    status TEXT
);

-- Enable RLS
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own investigations"
ON public.investigations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investigations"
ON public.investigations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
