import { getAllIntakeSessions } from "@/lib/db";

export async function GET() {
  const sessions = await getAllIntakeSessions();
  return Response.json({ sessions });
}
