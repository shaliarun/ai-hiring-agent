import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  
  if (normalized === "open" || normalized === "hired") {
    return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">{status}</Badge>;
  }
  if (normalized === "closed" || normalized === "rejected") {
    return <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200">{status}</Badge>;
  }
  if (normalized === "paused" || normalized === "pending") {
    return <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200">{status}</Badge>;
  }
  
  return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200">{status}</Badge>;
}
