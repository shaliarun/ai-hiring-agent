import { Progress } from "@/components/ui/progress";

export function ScoreProgress({ score, className = "" }: { score: number; className?: string }) {
  let colorClass = "bg-green-500";
  if (score < 40) colorClass = "bg-red-500";
  else if (score < 70) colorClass = "bg-yellow-500";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Progress value={score} className="h-2 w-full" indicatorClassName={colorClass} />
      <span className="text-xs font-medium w-8 text-right">{score}%</span>
    </div>
  );
}
