import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Client } from "pg"

async function findUserByEmail(email: string) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await pg.connect()
  const result = await pg.query(
    `SELECT u.id, u.email, u.password, u.name, u.rank, u.first_name, u.last_name, u.status, u."unitId",
            r.name as role_name
     FROM users u
     JOIN roles r ON r.id = u."roleId"
     WHERE u.email = $1`,
    [email]
  )
  await pg.end()
  return result.rows[0] || null
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await findUserByEmail(credentials.email)

        if (!user || user.status !== "ACTIVE") {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role_name,
          unitId: user.unitId,
          rank: user.rank,
          firstName: user.first_name,
          lastName: user.last_name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.unitId = user.unitId
        token.rank = user.rank
        token.firstName = user.firstName
        token.lastName = user.lastName
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.unitId = token.unitId as string | undefined
        session.user.rank = token.rank as string | undefined
        session.user.firstName = token.firstName as string | undefined
        session.user.lastName = token.lastName as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
