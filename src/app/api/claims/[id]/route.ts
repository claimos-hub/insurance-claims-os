import { getClaimByIdFromDb, getClaimDocumentsFromDb, getSessionMessages } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claim = await getClaimByIdFromDb(id);

  if (!claim) {
    return Response.json({ claim: null });
  }

  const documents = await getClaimDocumentsFromDb(id);
  const messages = claim.intake_session
    ? await getSessionMessages(claim.intake_session.id)
    : [];

  return Response.json({ claim, documents, messages });
}
