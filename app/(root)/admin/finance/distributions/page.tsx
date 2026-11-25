import {
  listDistributions,
  previewDistribution,
} from "@/actions/admin-distributions";
import DistributionsClient from "./distributions-client";

export const dynamic = "force-dynamic";

export default async function DistributionsPage() {
  const [runs, preview] = await Promise.all([
    listDistributions(),
    previewDistribution(),
  ]);

  if (!runs.ok) {
    return <div className="p-8 text-red-400">{runs.error}</div>;
  }

  return (
    <DistributionsClient
      runs={JSON.parse(JSON.stringify(runs.runs))}
      preview={JSON.parse(JSON.stringify(preview))}
    />
  );
}
