import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role: string
    unitId?: string | null
    rank?: string | null
    firstName?: string | null
    lastName?: string | null
    photoUrl?: string | null
  }

  interface Session {
    user: {
      id: string
      role: string
      unitId?: string | null
      rank?: string | null
      firstName?: string | null
      lastName?: string | null
      photoUrl?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    unitId?: string | null
    rank?: string | null
    firstName?: string | null
    lastName?: string | null
    photoUrl?: string | null
  }
}
