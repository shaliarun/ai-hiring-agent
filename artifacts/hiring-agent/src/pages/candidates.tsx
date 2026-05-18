import { useListCandidates, getListCandidatesQueryKey, useListJobs, getListJobsQueryKey, useDeleteCandidate } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { ScoreProgress } from "@/components/score-progress";
import { Search, Download, Trash2, Mail, FileDown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EmailComposeDialog } from "@/components/email-compose-dialog";

export default function CandidatesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<Array<{ id: number; name: string; email: string; jobTitle?: string; department?: string }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteCandidate = useDeleteCandidate();

  const { data: candidates, isLoading } = useListCandidates(
    { status: statusFilter !== "all" ? statusFilter : undefined, jobId: jobFilter !== "all" ? parseInt(jobFilter) : undefined },
    { query: { queryKey: getListCandidatesQueryKey({ status: statusFilter !== "all" ? statusFilter : undefined, jobId: jobFilter !== "all" ? parseInt(jobFilter) : undefined }) } }
  );

  const { data: jobs } = useListJobs({ query: { queryKey: getListJobsQueryKey() } });

  const candidatesData = Array.isArray(candidates) ? candidates : [];
  const jobsData = Array.isArray(jobs) ? jobs : [];

  const filteredCandidates = candidatesData.filter(c => {
    return c.name.toLowerCase().includes(search.toLowerCase()) || 
           c.email.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const allSelected = filteredCandidates && filteredCandidates.length > 0 && filteredCandidates.every(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (!filteredCandidates) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEmailForSelected = () => {
    if (!filteredCandidates) return;
    const selected = filteredCandidates.filter(c => selectedIds.has(c.id));
    const recipients = selected.map(c => {
      const job = jobsData.find(j => j.id === c.jobId);
      return { id: c.id, name: c.name, email: c.email, jobTitle: job?.title, department: job?.department };
    });
    setEmailRecipients(recipients);
    setEmailDialogOpen(true);
  };

  const openEmailForOne = (candidate: typeof filteredCandidates extends (infer T)[] | undefined ? T : never) => {
    const job = jobsData.find(j => j.id === candidate.jobId);
    setEmailRecipients([{ id: candidate.id, name: candidate.name, email: candidate.email, jobTitle: job?.title, department: job?.department }]);
    setEmailDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected candidate(s)? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    let completed = 0;
    for (const id of ids) {
      deleteCandidate.mutate({ id }, {
        onSuccess: () => {
          completed++;
          if (completed === ids.length) {
            toast({ title: `${ids.length} candidate(s) deleted` });
            queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey({}) });
            setSelectedIds(new Set());
          }
        },
      });
    }
  };

  const downloadResume = (candidateId: number, candidateName: string) => {
    window.open(`/api/candidates/${candidateId}/resume/download`, "_blank");
  };

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
      Applied: formatSafeDate(c.createdAt, "yyyy-MM-dd"),
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

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openEmailForSelected}>
              <Mail className="h-3.5 w-3.5" />
              Email Selected
            </Button>
            <Button size="icon" variant="destructive" className="h-8 w-8" title="Delete Selected" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

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
              {jobsData.map(job => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  <span className="text-muted-foreground font-mono text-xs mr-1.5">Job ID: {String(job.id).padStart(2, '0')}</span>{job.title}
                </SelectItem>
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
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[220px]">Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="w-[200px]">Match Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(candidate => {
                    const job = jobsData.find(j => j.id === candidate.jobId);
                    const isSelected = selectedIds.has(candidate.id);
                    return (
                      <TableRow 
                        key={candidate.id} 
                        className={`hover:bg-muted/50 cursor-pointer transition-colors group ${isSelected ? "bg-primary/5" : ""}`}
                        onClick={() => window.location.href = `/candidates/${candidate.id}`}
                      >
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(candidate.id)}
                          />
                        </TableCell>
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
                          {formatSafeDate(candidate.createdAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              title="Download Resume"
                              onClick={() => downloadResume(candidate.id, candidate.name)}
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              title="Send Email"
                              onClick={() => openEmailForOne(candidate)}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete"
                              onClick={(e) => {
                                if (!confirm(`Delete ${candidate.name}? This cannot be undone.`)) return;
                                deleteCandidate.mutate({ id: candidate.id }, {
                                  onSuccess: () => {
                                    toast({ title: "Candidate deleted" });
                                    queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey({}) });
                                  },
                                  onError: () => {
                                    toast({ title: "Failed to delete", variant: "destructive" });
                                  }
                                });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      <EmailComposeDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        recipients={emailRecipients}
      />
    </div>
  );
}

function formatSafeDate(value: string | Date | null | undefined, pattern: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, pattern);
}
