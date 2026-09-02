import { getCurrentUser } from "@/lib/auth-db";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return Response.json(
      { error: "Not signed in." },
      { status: 401 },
    );
  }

  return Response.json({ user });
}
