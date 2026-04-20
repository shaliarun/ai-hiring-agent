import { useGetJob, getGetJobQueryKey, getListJobsQueryKey, useListJobCandidates, getListJobCandidatesQueryKey, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ScoreProgress } from "@/components/score-progress";
import { ArrowLeft, Loader2, Search, Filter, XCircle, Trash2, RefreshCcw, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function JobDetail() {
  const { id } = useParams();
  const jobId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading: loadingJob } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) }
  });

  const { data: candidates, isLoading: loadingCandidates } = useListJobCandidates(jobId, {}, {
    query: { enabled: !!jobId, queryKey: getListJobCandidatesQueryKey(jobId) }
  });

  const [, setLocation] = useLocation();

  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const handleClosePosition = () => {
    if (!jobId) return;
    if (!confirm("Are you sure you want to close this position?")) return;
    updateJob.mutate({ id: jobId, data: { status: "closed" } }, {
      onSuccess: () => {
        toast({ title: "Position Closed", description: "This job posting has been closed." });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to close position", variant: "destructive" });
      }
    });
  };

  const handleReopenPosition = () => {
    if (!jobId) return;
    updateJob.mutate({ id: jobId, data: { status: "open" } }, {
      onSuccess: () => {
        toast({ title: "Position Reopened", description: "This job posting is now open again." });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to reopen position", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!jobId) return;
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    deleteJob.mutate({ id: jobId }, {
      onSuccess: () => {
        toast({ title: "Job Deleted", description: "The job posting has been removed." });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setLocation("/jobs");
      },
      onError: () => {
        toast({ title: "Failed to delete job", variant: "destructive" });
      }
    });
  };


  if (loadingJob) return <div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[200px] w-full" /></div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border">Job ID: {String(job.id).padStart(2, '0')}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={job.status} />
                <span className="text-muted-foreground">{job.department}</span>
                {job.location && <span className="text-muted-foreground">• {job.location}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation(`/jobs/${jobId}/edit`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {job.status === "closed" ? (
                <Button
                  variant="outline"
                  onClick={handleReopenPosition}
                  disabled={updateJob.isPending}
                  className="gap-2"
                >
                  {updateJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Reopen Position
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleClosePosition}
                  disabled={updateJob.isPending}
                  className="gap-2"
                >
                  {updateJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Close Position
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteJob.isPending}
                className="gap-2"
              >
                {deleteJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          {job.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description provided.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(s => <Badge key={s} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{s}</Badge>)}
              </div>
            </div>
            {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Nice to Have Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.niceToHaveSkills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>
            )}
            {job.keywords && job.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Keywords for AI Screening</h4>
                <div className="flex flex-wrap gap-2">
                  {job.keywords.map(k => <Badge key={k} variant="outline" className="bg-muted text-muted-foreground">{k}</Badge>)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Experience</h4>
                <p className="mt-1 font-medium">{job.experienceMin ?? 0} - {job.experienceMax ?? "Any"} years</p>
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Education</h4>
                <p className="mt-1 font-medium">{job.education || "Any"}</p>
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</h4>
                <p className="mt-1 font-medium">{job.location || "Any"}</p>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Salary</h4>
                  <p className="mt-1 font-medium">
                    {job.salaryMin && job.salaryMax
                      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                      : job.salaryMin
                        ? `From $${job.salaryMin.toLocaleString()}`
                        : `Up to $${job.salaryMax!.toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total Candidates</span>
              <span className="font-bold text-lg">{job.candidateCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Shortlisted</span>
              <span className="font-bold text-lg text-primary">{job.shortlistedCount}</span>
            </div>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Last updated {format(new Date(job.updatedAt), "MMM d, h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>All applicants for this role.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCandidates ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : candidates && candidates.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map(candidate => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = `/candidates/${candidate.id}`}>
                      <TableCell>
                        <div className="font-medium text-foreground">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        {candidate.matchScore !== null ? (
                          <ScoreProgress score={candidate.matchScore} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending Screening</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={candidate.status} />
                        {candidate.shortlisted && <Badge variant="outline" className="ml-2 border-primary/50 text-primary">Shortlisted</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(candidate.createdAt), "MMM d")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/candidates/${candidate.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
              No candidates found. Upload resumes to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
