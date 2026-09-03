import { z } from "zod";
import { database } from "@/db/raw";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireUser } from "@/lib/auth-db";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = schema.parse(await request.json());
    const db = database();

    const row = await db
      .prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1")
      .bind(auth.user.id)
      .first<{ password_hash: string }>();

    if (!row) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const valid = await verifyPassword(
      body.currentPassword,
      row.password_hash,
    );

    if (!valid) {
      return Response.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(body.newPassword);

    await db
      .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(passwordHash, auth.user.id)
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid password information." },
        { status: 400 },
      );
    }

    console.error("Unable to change password", error);

    return Response.json(
      { error: "Unable to change password." },
      { status: 500 },
    );
  }
}
