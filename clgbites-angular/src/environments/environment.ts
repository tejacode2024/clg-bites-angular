// ============================================================
// REPLACE THESE VALUES WITH YOUR SUPABASE PROJECT CONFIG
// Steps:
// 1. Go to https://supabase.com → New Project
// 2. After project is ready → Settings → API
// 3. Copy "Project URL" and "anon public" key
// ============================================================
export const environment = {
  production: false,
  supabase: {
    url: 'https://rnkuzdanyvncgwwnwbzc.supabase.co',        // e.g. https://abcxyz.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJua3V6ZGFueXZuY2d3d253YnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzE3MDQsImV4cCI6MjA4ODUwNzcwNH0.N17J-hxPcNgcsjIRzxQ4uyfd0bl-ITNLaR-zpBUi2V4',       // long JWT key from Settings → API
  },
  adminPassword: 'clgbites@admin2024',        // change this to your own password
};
