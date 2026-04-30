import { getAllClaims } from "@/lib/db";

export async function GET() {
  const claims = await getAllClaims();
  return Response.json({ claims });
}
