import { AreaSearchLoading } from "@/components/dev/AreaSearchLoading";

/**
 * Shown instantly while an area search sweeps OpenStreetMap, so submitting a
 * search gives an on-theme radar animation instead of a frozen page.
 */
export default function Loading() {
  return <AreaSearchLoading />;
}
