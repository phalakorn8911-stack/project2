// Single source of truth for required environment variables.
// Used by /api/health to fail fast with a clear message instead of cryptic 500s.
export const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export function missingEnv(): string[] {
  return REQUIRED_ENV.filter((k) => !process.env[k])
}
