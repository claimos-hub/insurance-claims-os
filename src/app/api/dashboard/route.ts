import { getDashboardStatsFromDb, getAllClaims } from "@/lib/db";

export async function GET() {
  const stats = await getDashboardStatsFromDb();
  const claims = await getAllClaims();

  return Response.json({ stats, claims });
}
