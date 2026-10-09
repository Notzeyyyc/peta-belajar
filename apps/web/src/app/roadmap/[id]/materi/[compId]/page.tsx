import { MateriView } from "./client";

export default async function MateriPage({
  params,
}: {
  params: Promise<{ id: string; compId: string }>;
}) {
  const { id, compId } = await params;
  return <MateriView id={id} compId={compId} />;
}
