import { useState } from "react";
import { useUploadResumes, useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ResumeInput } from "@workspace/api-client-react";

export default function HRPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadResumes = useUploadResumes();

  const { data: jobs, isLoading: loadingJobs } = useListJobs({
    query: { queryKey: getListJobsQueryKey() }
  });

  const [jobId, setJobId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeInput[]>([
    { name: "", email: "", phone: "", resumeText: "", fileName: "resume.pdf" }
  ]);

  const addResumeForm = () => {
    setResumes([...resumes, { name: "", email: "", phone: "", resumeText: "", fileName: `resume_${resumes.length + 1}.pdf` }]);
  };

  const removeResumeForm = (index: number) => {
    setResumes(resumes.filter((_, i) => i !== index));
  };

  const updateResume = (index: number, field: keyof ResumeInput, value: string) => {
    const updated = [...resumes];
    updated[index] = { ...updated[index], [field]: value };
    setResumes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      toast({ title: "Validation Error", description: "Please select a job.", variant: "destructive" });
      return;
    }

    const validResumes = resumes.filter(r => r.name && r.email && r.resumeText);
    if (validResumes.length === 0) {
      toast({ title: "Validation Error", description: "Please provide complete details for at least one resume.", variant: "destructive" });
      return;
    }

    uploadResumes.mutate({
      data: {
        jobId: parseInt(jobId),
        resumes: validResumes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Upload Successful", description: `${validResumes.length} resumes uploaded to the job pipeline.` });
        setResumes([{ name: "", email: "", phone: "", resumeText: "", fileName: "resume.pdf" }]);
        setJobId("");
      },
      onError: () => {
        toast({ title: "Upload Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Portal</h1>
        <p className="text-muted-foreground mt-1">Bulk upload resumes for active job postings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload Resumes
          </CardTitle>
          <CardDescription>
            Simulate uploading resumes by pasting candidate details and resume text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label>Target Job Posting</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder={loadingJobs ? "Loading jobs..." : "Select a job..."} />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.filter(j => j.status === 'open').map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              {resumes.map((resume, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card/50 relative group transition-colors hover:border-primary/30">
                  {resumes.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      onClick={() => removeResumeForm(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4 pr-8">
                    <div className="space-y-2">
                      <Label>Candidate Name *</Label>
                      <Input 
                        value={resume.name} 
                        onChange={(e) => updateResume(index, "name", e.target.value)} 
                        placeholder="Jane Doe" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input 
                        type="email" 
                        value={resume.email} 
                        onChange={(e) => updateResume(index, "email", e.target.value)} 
                        placeholder="jane@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        value={resume.phone || ""} 
                        onChange={(e) => updateResume(index, "phone", e.target.value)} 
                        placeholder="(555) 123-4567" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Filename (simulated)</Label>
                      <Input 
                        value={resume.fileName} 
                        onChange={(e) => updateResume(index, "fileName", e.target.value)} 
                        placeholder="resume.pdf" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Resume Text *</Label>
                    <Textarea 
                      value={resume.resumeText} 
                      onChange={(e) => updateResume(index, "resumeText", e.target.value)} 
                      placeholder="Paste the full text content of the candidate's resume here for AI analysis..."
                      className="min-h-[150px] font-mono text-xs"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={addResumeForm} className="w-full sm:w-auto border-dashed border-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Candidate
              </Button>
              
              <Button type="submit" className="w-full sm:w-auto" disabled={uploadResumes.isPending}>
                {uploadResumes.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Submit {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
