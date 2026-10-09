import { RoadmapLoader } from "../client";

export default async function RoadmapByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoadmapLoader id={id} />;
}
