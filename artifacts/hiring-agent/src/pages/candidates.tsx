import { useListCandidates, getListCandidatesQueryKey, useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ScoreProgress } from "@/components/score-progress";
import { Search, Download, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

export default function CandidatesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");

  const { data: candidates, isLoading } = useListCandidates(
    { status: statusFilter !== "all" ? statusFilter : undefined, jobId: jobFilter !== "all" ? parseInt(jobFilter) : undefined },
    { query: { queryKey: getListCandidatesQueryKey({ status: statusFilter !== "all" ? statusFilter : undefined, jobId: jobFilter !== "all" ? parseInt(jobFilter) : undefined }) } }
  );

  const { data: jobs } = useListJobs({ query: { queryKey: getListJobsQueryKey() } });

  const filteredCandidates = candidates?.filter(c => {
    return c.name.toLowerCase().includes(search.toLowerCase()) || 
           c.email.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const exportXlsx = async () => {
    if (!filteredCandidates) return;
    const XLSX = await import("xlsx");
    const rows = filteredCandidates.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone || "",
      "Job ID": c.jobId,
      Status: c.status,
      "Match Score": c.matchScore || "",
      Shortlisted: c.shortlisted ? "Yes" : "No",
      Applied: format(new Date(c.createdAt), "yyyy-MM-dd"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, `candidates_export_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-1">Review and manage the global candidate pool.</p>
        </div>
        <Button onClick={exportXlsx} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export XLSX
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search candidates by name or email..." 
            className="pl-9 border-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48 border-l pl-4">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="border-0 shadow-none focus:ring-0">
              <SelectValue placeholder="Filter Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs?.map(job => (
                <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48 border-l pl-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-0 shadow-none focus:ring-0">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="round1">1st Round</SelectItem>
              <SelectItem value="round2">2nd Round</SelectItem>
              <SelectItem value="final">Final Round</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading candidates...</div>
          ) : filteredCandidates && filteredCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="w-[200px]">Match Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(candidate => {
                    const job = jobs?.find(j => j.id === candidate.jobId);
                    return (
                      <TableRow 
                        key={candidate.id} 
                        className="hover:bg-muted/50 cursor-pointer transition-colors group" 
                        onClick={() => window.location.href = `/candidates/${candidate.id}`}
                      >
                        <TableCell>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">{candidate.name}</div>
                          <div className="text-xs text-muted-foreground">{candidate.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{job?.title || `Job #${candidate.jobId}`}</div>
                        </TableCell>
                        <TableCell>
                          {candidate.matchScore !== null ? (
                            <ScoreProgress score={candidate.matchScore} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={candidate.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(candidate.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No candidates found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
