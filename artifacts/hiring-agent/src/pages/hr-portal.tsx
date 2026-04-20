import { useState, useCallback } from "react";
import { useUploadResumes, useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Trash2, Loader2, FileUp, FileText, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { GmailImportDialog } from "@/components/gmail-import-dialog";

interface ResumeEntry {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  fileName: string;
  fileData?: string;
  fileMime?: string;
  parsing: boolean;
  parsed: boolean;
}

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export default function HRPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadResumes = useUploadResumes();

  const { data: jobs, isLoading: loadingJobs } = useListJobs({
    query: { queryKey: getListJobsQueryKey() }
  });

  const [jobId, setJobId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gmailDialogOpen, setGmailDialogOpen] = useState(false);

  const selectedJob = jobs?.find(j => j.id.toString() === jobId);

  const handleGmailImport = useCallback((imported: Array<{
    name: string;
    email: string;
    phone: string;
    resumeText: string;
    fileName: string;
    fileData: string;
    fileMime: string;
    emailSubject: string;
    emailFrom: string;
  }>) => {
    const entries: ResumeEntry[] = imported.map(r => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      resumeText: r.resumeText,
      fileName: r.fileName,
      fileData: r.fileData,
      fileMime: r.fileMime,
      parsing: false,
      parsed: true,
    }));
    setResumes(prev => [...prev, ...entries]);
  }, []);

  const parseFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const placeholders: ResumeEntry[] = fileArray.map(f => ({
      name: "",
      email: "",
      phone: "",
      resumeText: "",
      fileName: f.name,
      parsing: true,
      parsed: false,
    }));

    setResumes(prev => [...prev, ...placeholders]);
    const startIndex = resumes.length;

    const formData = new FormData();
    fileArray.forEach(f => formData.append("files", f));

    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const resp = await fetch(`${baseUrl}api/resumes/parse`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error("Parse failed");

      const results: Array<{
        text: string;
        name: string;
        email: string;
        phone: string;
        fileName: string;
        fileData?: string;
        fileMime?: string;
        error?: string;
      }> = await resp.json();

      setResumes(prev => {
        const updated = [...prev];
        results.forEach((result, i) => {
          const idx = startIndex + i;
          if (idx < updated.length) {
            updated[idx] = {
              name: result.name || "",
              email: result.email || "",
              phone: result.phone || "",
              resumeText: result.text || "",
              fileName: result.fileName,
              fileData: result.fileData,
              fileMime: result.fileMime,
              parsing: false,
              parsed: true,
            };
          }
        });
        return updated;
      });

      toast({
        title: "Files Parsed",
        description: `${results.length} resume(s) parsed successfully. Review the details below.`,
      });
    } catch {
      setResumes(prev => {
        const updated = [...prev];
        for (let i = startIndex; i < updated.length; i++) {
          updated[i] = { ...updated[i], parsing: false, parsed: false };
        }
        return updated;
      });
      toast({
        title: "Parse Error",
        description: "Failed to parse uploaded files. Please try again.",
        variant: "destructive",
      });
    }
  }, [resumes.length, toast]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    parseFiles(e.dataTransfer.files);
  }, [parseFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      parseFiles(e.target.files);
      e.target.value = "";
    }
  }, [parseFiles]);

  const updateResume = (index: number, field: keyof ResumeEntry, value: string) => {
    setResumes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeResume = (index: number) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      toast({ title: "Validation Error", description: "Please select a job.", variant: "destructive" });
      return;
    }

    const validResumes = resumes.filter(r => r.name && r.email && r.resumeText && !r.parsing);
    if (validResumes.length === 0) {
      toast({ title: "Validation Error", description: "No complete resumes to submit. Ensure name, email, and resume content are filled.", variant: "destructive" });
      return;
    }

    setUploading(true);
    uploadResumes.mutate({
      data: {
        jobId: parseInt(jobId),
        resumes: validResumes.map(r => ({
          name: r.name,
          email: r.email,
          phone: r.phone || null,
          resumeText: r.resumeText,
          fileName: r.fileName,
          fileData: r.fileData || null,
          fileMime: r.fileMime || null,
        }))
      }
    }, {
      onSuccess: () => {
        toast({ title: "Upload Successful", description: `${validResumes.length} resume(s) uploaded and screened.` });
        setResumes([]);
        setJobId("");
        setUploading(false);
      },
      onError: () => {
        toast({ title: "Upload Failed", variant: "destructive" });
        setUploading(false);
      }
    });
  };

  const anyParsing = resumes.some(r => r.parsing);
  const validCount = resumes.filter(r => r.name && r.email && r.resumeText && !r.parsing).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Portal</h1>
          <p className="text-muted-foreground mt-1">Upload resumes to parse and submit candidates for open jobs.</p>
        </div>
        {resumes.length > 0 && (
          <Button
            onClick={handleSubmitAll}
            disabled={uploading || anyParsing || validCount === 0 || !jobId}
            className="gap-2"
            size="lg"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Submit All {validCount} Resume{validCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload Resumes
          </CardTitle>
          <CardDescription>
            Upload resume files (PDF, Word, Excel, PowerPoint). The AI will extract candidate details automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Target Job Posting *</Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder={loadingJobs ? "Loading jobs..." : "Select a job..."} />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.filter(j => j.status === 'open').map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      <span className="text-muted-foreground font-mono text-xs mr-1.5">#{job.id}</span>{job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="gap-2 whitespace-nowrap"
                disabled={!jobId}
                onClick={() => setGmailDialogOpen(true)}
                title={!jobId ? "Select a job first" : "Import resumes from Gmail"}
              >
                <Mail className="h-4 w-4" />
                Import from Gmail
              </Button>
            </div>
            {!jobId && (
              <p className="text-xs text-muted-foreground">Select a job posting to enable Gmail import</p>
            )}
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById("resume-file-input")?.click()}
          >
            <input
              id="resume-file-input"
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              Drag & drop resume files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
            </p>
          </div>
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <form onSubmit={handleSubmitAll}>
          <div className="space-y-4">
            {resumes.map((resume, index) => (
              <Card key={index} className={`relative transition-all ${resume.parsing ? "opacity-70" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {resume.parsing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : resume.parsed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{resume.fileName}</span>
                      {resume.parsing && <span className="text-xs text-muted-foreground">Parsing...</span>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeResume(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        value={resume.name}
                        onChange={(e) => updateResume(index, "name", e.target.value)}
                        placeholder="Candidate name"
                        disabled={resume.parsing}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email *</Label>
                      <Input
                        type="email"
                        value={resume.email}
                        onChange={(e) => updateResume(index, "email", e.target.value)}
                        placeholder="email@example.com"
                        disabled={resume.parsing}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={resume.phone}
                        onChange={(e) => updateResume(index, "phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={resume.parsing}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            updateResume(index, "parsing" as any, true as any);
                            const formData = new FormData();
                            formData.append("files", file);
                            try {
                              const baseUrl = import.meta.env.BASE_URL || "/";
                              const resp = await fetch(`${baseUrl}api/resumes/parse`, {
                                method: "POST",
                                body: formData,
                              });
                              if (resp.ok) {
                                const [result] = await resp.json();
                                setResumes(prev => {
                                  const updated = [...prev];
                                  updated[index] = {
                                    name: result.name || updated[index].name,
                                    email: result.email || updated[index].email,
                                    phone: result.phone || updated[index].phone,
                                    resumeText: result.text || "",
                                    fileName: result.fileName,
                                    fileData: result.fileData,
                                    fileMime: result.fileMime,
                                    parsing: false,
                                    parsed: true,
                                  };
                                  return updated;
                                });
                              }
                            } catch {
                              updateResume(index, "parsing" as any, false as any);
                            }
                            e.target.value = "";
                          }
                        }}
                      />
                      <span className="text-xs text-primary hover:underline flex items-center gap-1">
                        <FileUp className="h-3 w-3" />
                        Re-upload file
                      </span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {validCount} of {resumes.length} resume{resumes.length !== 1 ? "s" : ""} ready to submit
            </p>
            <Button
              type="submit"
              disabled={uploading || anyParsing || validCount === 0 || !jobId}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Submit All Resumes
            </Button>
          </div>
        </form>
      )}

      <GmailImportDialog
        open={gmailDialogOpen}
        onOpenChange={setGmailDialogOpen}
        jobId={jobId}
        jobTitle={selectedJob?.title || ""}
        onImport={handleGmailImport}
      />
    </div>
  );
}
