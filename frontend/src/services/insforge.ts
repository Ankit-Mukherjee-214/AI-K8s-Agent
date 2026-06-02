import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!insforgeUrl || !insforgeAnonKey) {
  console.warn('InsForge environment variables are missing');
}

export const insforge = createClient({
  baseUrl: insforgeUrl || '',
  anonKey: insforgeAnonKey || '',
});
