import { z } from "zod";

import { database } from "@/db/raw";
import { verifyPassword, sessionCookie } from "@/lib/auth";
import { createSession } from "@/lib/auth-db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  personId: string | null;
  active: number;
};

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const db = database();

    const user = await db
      .prepare(
        `SELECT
           id,
           name,
           email,
           password_hash AS passwordHash,
           role,
           person_id AS personId,
           active
         FROM users
         WHERE lower(email) = ?
         LIMIT 1`,
      )
      .bind(email)
      .first<LoginUser>();

    if (!user || user.active !== 1) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const { token, expires } = await createSession(user.id);

    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          personId: user.personId,
        },
      },
      {
        headers: {
          "Set-Cookie": sessionCookie(request, token, expires),
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 400 },
      );
    }

    console.error("Login failed", error);

    return Response.json(
      { error: "Unable to sign in." },
      { status: 500 },
    );
  }
}
