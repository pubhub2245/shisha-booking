import type { NextConfig } from "next";

// Supabase の anon key は公開前提のため直接埋め込む。
// Vercel 等に古い値の環境変数が残っていると "Invalid API key" になるので、
// env の上書きを受けずに常にここで固定する。
const SUPABASE_URL = 'https://zjdxhvggsqxscblmfutw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHhodmdnc3F4c2NibG1mdXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODYwOTMsImV4cCI6MjA5MTY2MjA5M30.ymHM3oo1F1h23e4tgSojcDZHE17cpf-Opx3-9ElrHHk'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
