import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetPipelineStats,
  getGetPipelineStatsQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Users, UserCheck, Activity, BarChart3, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  
  const { data: pipeline, isLoading: loadingPipeline } = useGetPipelineStats({
    query: { queryKey: getGetPipelineStatsQueryKey() }
  });

  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your hiring pipeline and recent activities.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Open Jobs" 
          value={summary?.openJobs} 
          total={summary?.totalJobs}
          icon={Briefcase} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Total Candidates" 
          value={summary?.totalCandidates} 
          icon={Users} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Shortlisted" 
          value={summary?.shortlisted} 
          icon={UserCheck} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Avg Match Score" 
          value={summary?.avgMatchScore != null ? `${Number(summary.avgMatchScore).toFixed(2)}%` : "N/A"} 
          icon={Activity} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        {/* Pipeline Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loadingPipeline ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pipeline && pipeline.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeline} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No pipeline data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-2 w-2 mt-2 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-24px] before:w-px before:bg-border last:before:hidden">
                    <div className="absolute left-[3px] top-[6px] h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-medium">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {item.candidateName && <span>{item.candidateName}</span>}
                      {item.candidateName && item.jobTitle && <span>•</span>}
                      {item.jobTitle && <span className="font-mono bg-muted px-1 rounded">{item.jobTitle}</span>}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, total, icon: Icon, loading }: { title: string, value?: number | string | null, total?: number | null, icon: any, loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium tracking-tight text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-3xl font-bold">{value ?? 0}</div>
              {total !== undefined && (
                <div className="text-sm text-muted-foreground font-medium">/ {total}</div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
