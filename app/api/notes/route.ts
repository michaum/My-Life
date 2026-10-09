import { database } from "@/db/raw";
import { requireUser } from "@/lib/auth-db";
import { z } from "zod";

const idSchema = z.string().uuid();

const noteSchema = z.object({
  id: idSchema,
  folderId: idSchema.nullable(),
  title: z.string().max(250),
  content: z.string().max(500000),
});

const folderSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(150),
  sortOrder: z.number().int().min(0).max(1000000).default(0),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("saveNote"), note: noteSchema }),
  z.object({ action: z.literal("deleteNote"), id: idSchema }),
  z.object({ action: z.literal("saveFolder"), folder: folderSchema }),
  z.object({ action: z.literal("deleteFolder"), id: idSchema }),
]);

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;

    const db = database();

    const [folders, notes] = await db.batch([
      db.prepare(
        `SELECT id, name, sort_order AS sortOrder,
                created_at AS createdAt, updated_at AS updatedAt
         FROM note_folders
         WHERE deleted_at IS NULL
         ORDER BY sort_order, name COLLATE NOCASE`
      ),
      db.prepare(
        `SELECT id, folder_id AS folderId, title, content,
                content_format AS contentFormat,
                created_at AS createdAt, updated_at AS updatedAt
         FROM notes
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`
      ),
    ]);

    return Response.json({
      folders: folders.results,
      notes: notes.results,
    });
  } catch (error) {
    console.error("Notes GET error:", error);
    return errorResponse("Could not load notes.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;

    if (request.headers.get("sec-fetch-site") === "cross-site") {
      return errorResponse("Invalid origin.", 403);
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return errorResponse("JSON required.", 415);
    }

    const parsed = actionSchema.parse(await request.json());
    const db = database();
    const now = new Date().toISOString();

    if (parsed.action === "saveNote") {
      const note = parsed.note;

      if (note.folderId) {
        const folder = await db.prepare(
          "SELECT id FROM note_folders WHERE id=? AND deleted_at IS NULL"
        ).bind(note.folderId).first();

        if (!folder) {
          return errorResponse("Folder does not exist.", 400);
        }
      }

      const existing = await db.prepare(
        "SELECT deleted_at FROM notes WHERE id=?"
      ).bind(note.id).first<{ deleted_at: string | null }>();

      if (existing?.deleted_at) {
        return errorResponse("Deleted notes cannot be edited.", 409);
      }

      if (existing) {
        await db.prepare(
          `UPDATE notes
           SET folder_id=?, title=?, content=?, updated_at=?
           WHERE id=? AND deleted_at IS NULL`
        ).bind(
          note.folderId, note.title, note.content, now, note.id
        ).run();
      } else {
        await db.prepare(
          `INSERT INTO notes
           (id, folder_id, title, content, content_format,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, 'html', ?, ?)`
        ).bind(
          note.id, note.folderId, note.title,
          note.content, now, now
        ).run();
      }

      return Response.json({ ok: true, updatedAt: now });
    }

    if (parsed.action === "deleteNote") {
      await db.prepare(
        `UPDATE notes SET deleted_at=?, updated_at=?
         WHERE id=? AND deleted_at IS NULL`
      ).bind(now, now, parsed.id).run();

      return Response.json({ ok: true });
    }

    if (parsed.action === "saveFolder") {
      const folder = parsed.folder;

      const existing = await db.prepare(
        "SELECT deleted_at FROM note_folders WHERE id=?"
      ).bind(folder.id).first<{ deleted_at: string | null }>();

      if (existing?.deleted_at) {
        return errorResponse("Deleted folders cannot be edited.", 409);
      }

      if (existing) {
        await db.prepare(
          `UPDATE note_folders
           SET name=?, sort_order=?, updated_at=?
           WHERE id=? AND deleted_at IS NULL`
        ).bind(
          folder.name, folder.sortOrder, now, folder.id
        ).run();
      } else {
        await db.prepare(
          `INSERT INTO note_folders
           (id, name, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          folder.id, folder.name, folder.sortOrder, now, now
        ).run();
      }

      return Response.json({ ok: true, updatedAt: now });
    }

    if (parsed.action === "deleteFolder") {
      const folder = await db.prepare(
        "SELECT id FROM note_folders WHERE id=? AND deleted_at IS NULL"
      ).bind(parsed.id).first();

      if (!folder) {
        return errorResponse("Folder does not exist.", 404);
      }

      await db.batch([
        db.prepare(
          `UPDATE notes
           SET folder_id=NULL, updated_at=?
           WHERE folder_id=? AND deleted_at IS NULL`
        ).bind(now, parsed.id),
        db.prepare(
          `UPDATE note_folders
           SET deleted_at=?, updated_at=?
           WHERE id=? AND deleted_at IS NULL`
        ).bind(now, now, parsed.id),
      ]);

      return Response.json({ ok: true });
    }

    return errorResponse("Unknown Notes action.", 400);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        error.issues[0]?.message || "Invalid Notes data.",
        400
      );
    }

    console.error("Notes POST error:", error);
    return errorResponse("Could not save Notes changes.", 500);
  }
}
