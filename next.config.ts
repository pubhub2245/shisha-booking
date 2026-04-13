import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjdxhvggsqxscblmfutw.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHhodmdnc3F4c2NibG1mdXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODYwOTMsImV4cCI6MjA5MTY2MjA5M30.ymHM3oo1F1h23e4tgSojcDZHE17cpf-Opx3-9ElrHHk',
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjdxhvggsqxscblmfutw.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHhodmdnc3F4c2NibG1mdXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODYwOTMsImV4cCI6MjA5MTY2MjA5M30.ymHM3oo1F1h23e4tgSojcDZHE17cpf-Opx3-9ElrHHk',
  },
};

export default nextConfig;
