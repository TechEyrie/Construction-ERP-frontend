import { ListPageSkeleton } from "@/components/ui/Skeleton";

/** Instant route fallback — shell stays mounted; only main pane waits. */
export default function ProjectSegmentLoading() {
  return (
    <div className="opc-route-loading" aria-busy="true" aria-label="Loading page">
      <ListPageSkeleton titleWidth="12rem" rows={5} showKpis={false} />
    </div>
  );
}
