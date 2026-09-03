import { z } from "zod";
import { database } from "@/db/raw";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-db";
import { isSameOrigin } from "@/lib/request-security";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  personId: string | null;
  active: number;
  createdAt: string;
};

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).default("user"),
  phone: z.string().trim().min(1, "Cell number is required."),
  personId: z.string().nullable().optional(),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  role: z.enum(["admin", "user"]).optional(),
  personId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const db = database();

    const result = await db
      .prepare(
        `SELECT
           users.id AS id,
           users.name AS name,
           users.email AS email,
           COALESCE((SELECT phone FROM people WHERE people.id = users.person_id), '') AS phone,
           users.role AS role,
           users.person_id AS personId,
           users.active AS active,
           users.created_at AS createdAt
         FROM users
         ORDER BY users.name COLLATE NOCASE, users.email COLLATE NOCASE`,
      )
      .all<AdminUserRow>();

    return Response.json({
      users: (result.results ?? []).map((user) => ({
        ...user,
        active: user.active === 1,
      })),
    });
  } catch (error) {
    console.error("Unable to load users", error);
    return Response.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = createUserSchema.parse(await request.json());
    const db = database();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const email = body.email.toLowerCase();

    const phoneDigits = body.phone.replace(/\D/g, "");
    let phone: string;

    if (phoneDigits.length === 10) {
      phone = `+1${phoneDigits}`;
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith("1")) {
      phone = `+${phoneDigits}`;
    } else {
      return Response.json(
        { error: "Enter a valid 10-digit cell number." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(body.password);

    const existing = await db
      .prepare("SELECT id FROM users WHERE lower(email) = ? LIMIT 1")
      .bind(email)
      .first<{ id: string }>();

    if (existing) {
      return Response.json(
        { error: "A user with that email already exists." },
        { status: 409 },
      );
    }

    let personId = body.personId ?? null;

    if (!personId) {
      const existingPerson = await db
        .prepare(
          `SELECT id
           FROM people
           WHERE lower(name) = lower(?)
           AND phone = ?
           LIMIT 1`,
        )
        .bind(body.name, phone)
        .first<{ id: string }>();

      if (existingPerson) {
        personId = existingPerson.id;

        await db
          .prepare(
            `UPDATE people
             SET name = ?, phone = ?, sms_enabled = 1
             WHERE id = ?`,
          )
          .bind(body.name, phone, personId)
          .run();
      } else {
        personId = crypto.randomUUID();

        await db
          .prepare(
            `INSERT INTO people
              (id, name, phone, sms_enabled, created_at)
             VALUES (?, ?, ?, 1, ?)`,
          )
          .bind(personId, body.name, phone, now)
          .run();
      }
    }

    await db
      .prepare(
        `INSERT INTO users
          (id, name, email, password_hash, role, person_id, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      )
      .bind(
        id,
        body.name,
        email,
        passwordHash,
        body.role,
        personId,
        now,
      )
      .run();

    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid user information." }, { status: 400 });
    }

    console.error("Unable to create user", error);
    return Response.json({ error: "Unable to create user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = updateUserSchema.parse(await request.json());
    const db = database();

    const existing = await db
      .prepare(
        `SELECT id, role, active, person_id AS personId
         FROM users
         WHERE id = ?
         LIMIT 1`,
      )
      .bind(body.id)
      .first<{
        id: string;
        role: string;
        active: number;
        personId: string | null;
      }>();

    if (!existing) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (body.id === auth.user.id && body.active === false) {
      return Response.json(
        { error: "You cannot disable your own account." },
        { status: 400 },
      );
    }

    const becomingInactive = body.active === false && existing.active === 1;
    const losingAdmin =
      body.role === "user" &&
      existing.role === "admin";

    if (existing.role === "admin" && (becomingInactive || losingAdmin)) {
      const count = await db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM users
           WHERE role = 'admin' AND active = 1`,
        )
        .first<{ count: number }>();

      if ((count?.count ?? 0) <= 1) {
        return Response.json(
          { error: "You must keep at least one active administrator." },
          { status: 400 },
        );
      }
    }

    if (body.email !== undefined) {
      const normalizedEmail = body.email.toLowerCase();

      const duplicate = await db
        .prepare(
          `SELECT id
           FROM users
           WHERE lower(email) = ? AND id <> ?
           LIMIT 1`,
        )
        .bind(normalizedEmail, body.id)
        .first<{ id: string }>();

      if (duplicate) {
        return Response.json(
          { error: "A user with that email already exists." },
          { status: 409 },
        );
      }
    }

    let normalizedPhone: string | undefined;

    if (body.phone !== undefined) {
      const phoneDigits = body.phone.replace(/\D/g, "");
      if (phoneDigits.length === 10) {
        normalizedPhone = `+1${phoneDigits}`;
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith("1")) {
        normalizedPhone = `+${phoneDigits}`;
      } else {
        return Response.json(
          { error: "Enter a valid 10-digit cell number." },
          { status: 400 },
        );
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }

    if (body.email !== undefined) {
      updates.push("email = ?");
      values.push(body.email.toLowerCase());
    }

    if (body.role !== undefined) {
      updates.push("role = ?");
      values.push(body.role);
    }

    if (body.personId !== undefined) {
      updates.push("person_id = ?");
      values.push(body.personId);
    }

    if (body.active !== undefined) {
      updates.push("active = ?");
      values.push(body.active ? 1 : 0);
    }

    if (body.password !== undefined) {
      updates.push("password_hash = ?");
      values.push(await hashPassword(body.password));
    }

    if (updates.length === 0) {
      return Response.json({ ok: true });
    }

    values.push(body.id);

    await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const linkedPersonId =
      body.personId !== undefined ? body.personId : existing.personId;

    if (linkedPersonId && (body.name !== undefined || normalizedPhone !== undefined)) {
      const personUpdates: string[] = [];
      const personValues: unknown[] = [];

      if (body.name !== undefined) {
        personUpdates.push("name = ?");
        personValues.push(body.name);
      }
      if (normalizedPhone !== undefined) {
        personUpdates.push("phone = ?");
        personValues.push(normalizedPhone);
      }

      personValues.push(linkedPersonId);
      await db
        .prepare(`UPDATE people SET ${personUpdates.join(", ")} WHERE id = ?`)
        .bind(...personValues)
        .run();
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid user information." }, { status: 400 });
    }

    console.error("Unable to update user", error);
    return Response.json({ error: "Unable to update user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = z.object({ id: z.string().min(1) }).parse(await request.json());
    const db = database();

    if (body.id === auth.user.id) {
      return Response.json(
        { error: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    const existing = await db
      .prepare(
        `SELECT id, role, active
         FROM users
         WHERE id = ?
         LIMIT 1`,
      )
      .bind(body.id)
      .first<{ id: string; role: string; active: number }>();

    if (!existing) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (existing.role === "admin" && existing.active === 1) {
      const count = await db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM users
           WHERE role = 'admin' AND active = 1`,
        )
        .first<{ count: number }>();

      if ((count?.count ?? 0) <= 1) {
        return Response.json(
          { error: "You must keep at least one active administrator." },
          { status: 400 },
        );
      }
    }

    await db
      .prepare("DELETE FROM users WHERE id = ?")
      .bind(body.id)
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid user information." }, { status: 400 });
    }

    console.error("Unable to delete user", error);
    return Response.json({ error: "Unable to delete user." }, { status: 500 });
  }
}
