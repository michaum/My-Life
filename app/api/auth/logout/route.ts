import { clearSessionCookie, readCookie } from "@/lib/auth";
import { deleteSession } from "@/lib/auth-db";

export async function POST(request: Request) {
  const token = readCookie(request, "my_life_session");

  if (token) {
    await deleteSession(token);
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}
