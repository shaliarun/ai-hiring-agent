import { 
  useGetCandidate, 
  getGetCandidateQueryKey, 
  useUpdateCandidate, 
  useAddCandidateNote,
  useGetJob,
  getGetJobQueryKey
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { ScoreProgress } from "@/components/score-progress";
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, Clock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

export default function CandidateDetail() {
  const { id } = useParams();
  const candidateId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidate, isLoading: loadingCandidate } = useGetCandidate(candidateId, {
    query: { enabled: !!candidateId, queryKey: getGetCandidateQueryKey(candidateId) }
  });

  const { data: job } = useGetJob(candidate?.jobId || 0, {
    query: { enabled: !!candidate?.jobId, queryKey: getGetJobQueryKey(candidate?.jobId || 0) }
  });

  const updateCandidate = useUpdateCandidate();
  const addNote = useAddCandidateNote();

  const [notes, setNotes] = useState("");
  
  useEffect(() => {
    if (candidate?.notes) {
      setNotes(candidate.notes);
    }
  }, [candidate?.notes]);

  const handleStatusChange = (newStatus: string) => {
    updateCandidate.mutate({
      id: candidateId,
      data: { status: newStatus as any }
    }, {
      onSuccess: (data) => {
        toast({ title: "Status updated", description: `Candidate moved to ${newStatus}` });
        queryClient.setQueryData(getGetCandidateQueryKey(candidateId), data);
      }
    });
  };

  const handleSaveNotes = () => {
    addNote.mutate({
      id: candidateId,
      data: { notes }
    }, {
      onSuccess: (data) => {
        toast({ title: "Notes saved" });
        queryClient.setQueryData(getGetCandidateQueryKey(candidateId), data);
      }
    });
  };

  if (loadingCandidate) return <div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[400px] w-full" /></div>;
  if (!candidate) return <div>Candidate not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/candidates"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {candidate.email}</div>
              {candidate.phone && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {candidate.phone}</div>}
              {candidate.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {candidate.location}</div>}
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Select value={candidate.status} onValueChange={handleStatusChange} disabled={updateCandidate.isPending}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle>AI Screening Report</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {candidate.matchScore !== null ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Overall Match Score</span>
                      <span className="font-bold">{candidate.matchScore}%</span>
                    </div>
                    <ScoreProgress score={candidate.matchScore} />
                  </div>
                  
                  {candidate.shortlisted && (
                    <div className="bg-primary/10 text-primary p-3 rounded-md text-sm font-medium">
                      ✓ AI Recommended Shortlist
                    </div>
                  )}

                  {candidate.rejectionReason && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20">
                      <h4 className="font-bold mb-1">AI Flag</h4>
                      <p>{candidate.rejectionReason}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-semibold">Matched Skills against Job Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.matchedSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.filter(s => !candidate.matchedSkills.includes(s)).map(skill => (
                        <Badge key={skill} variant="outline" className="text-muted-foreground">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-md">
                  AI Screening has not been run for this candidate yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-md text-sm font-mono whitespace-pre-wrap h-[300px] overflow-y-auto border">
                {candidate.resumeText || "No resume text available."}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Applied For</p>
                <Link href={`/jobs/${candidate.jobId}`} className="text-primary hover:underline font-medium">
                  {job?.title || `Job #${candidate.jobId}`}
                </Link>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Experience</p>
                  <p className="flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /> {candidate.experienceYears ?? "N/A"} years</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Education</p>
                  <p className="flex items-center gap-1.5 text-sm"><GraduationCap className="h-4 w-4 text-muted-foreground" /> {candidate.education || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm">{format(new Date(candidate.createdAt), "MMMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Interview Notes</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={addNote.isPending || notes === candidate.notes}>
                {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Add notes from interviews or evaluations..." 
                className="min-h-[200px] resize-y"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
