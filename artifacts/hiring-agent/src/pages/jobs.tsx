import { useListJobs, getListJobsQueryKey, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Search, MapPin, Building, Users, XCircle, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function JobsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useListJobs({
    query: { queryKey: getListJobsQueryKey() }
  });
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleClosePosition = (e: React.MouseEvent, jobId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to close this position?")) return;
    updateJob.mutate({ id: jobId, data: { status: "closed" } }, {
      onSuccess: () => {
        toast({ title: "Position Closed" });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to close position", variant: "destructive" });
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, jobId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) return;
    deleteJob.mutate({ id: jobId }, {
      onSuccess: () => {
        toast({ title: "Job Deleted" });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to delete job", variant: "destructive" });
      }
    });
  };

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage job postings and view active pipelines.</p>
        </div>
        <Link href="/jobs/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-2 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search roles or departments..." 
            className="pl-9 border-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48 border-l pl-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-0 shadow-none focus:ring-0">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      ) : filteredJobs?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed">
          <h3 className="text-lg font-medium">No jobs found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new job.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs?.map(job => (
            <Card key={job.id} className="hover:border-primary/30 transition-colors group">
              <CardContent className="p-0">
                <Link href={`/jobs/${job.id}`} className="block p-6 pb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{job.title}</h3>
                        <StatusBadge status={job.status} />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4" />
                          {job.department}
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          Added {format(new Date(job.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:border-l md:pl-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{job.candidateCount}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Candidates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{job.shortlistedCount}</div>
                        <div className="text-xs text-primary/80 uppercase tracking-wider font-semibold">Shortlisted</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-end gap-2 px-6 py-3 border-t mt-4">
                  {job.status !== "closed" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={(e) => handleClosePosition(e, job.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Close Position
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={(e) => handleDelete(e, job.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
