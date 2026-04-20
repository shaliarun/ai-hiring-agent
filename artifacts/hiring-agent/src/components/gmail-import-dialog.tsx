import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FolderOpen,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  fileName: string;
  fileData: string;
  fileMime: string;
  emailSubject: string;
  emailFrom: string;
}

interface GmailImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  onImport: (resumes: ParsedResume[]) => void;
}

type Step = "checking" | "not-configured" | "not-connected" | "importing" | "results" | "error";

export function GmailImportDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onImport,
}: GmailImportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("checking");
  const [authUrl, setAuthUrl] = useState<string>("");
  const [results, setResults] = useState<ParsedResume[]>([]);
  const [resultMessage, setResultMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  const runImport = useCallback(async () => {
    setStep("importing");
    try {
      const res = await fetch(`${baseUrl}/api/gmail/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const urlRes = await fetch(`${baseUrl}/api/gmail/auth-url`);
          const urlData = await urlRes.json();
          setAuthUrl(urlData.url || "");
          setStep("not-connected");
          return;
        }
        setErrorMessage(data.error || "Import failed");
        setStep("error");
        return;
      }
      setResults(data.resumes || []);
      setResultMessage(data.message || "");
      setSelected(new Set((data.resumes || []).map((_: any, i: number) => i)));
      setStep("results");
    } catch {
      setErrorMessage("Failed to import resumes from Gmail.");
      setStep("error");
    }
  }, [baseUrl, jobId]);

  const checkStatus = useCallback(async () => {
    setStep("checking");
    try {
      const res = await fetch(`${baseUrl}/api/gmail/auth-status`);
      const data = await res.json();
      if (!data.configured) {
        setStep("not-configured");
      } else if (!data.connected) {
        const urlRes = await fetch(`${baseUrl}/api/gmail/auth-url`);
        const urlData = await urlRes.json();
        setAuthUrl(urlData.url || "");
        setStep("not-connected");
      } else {
        runImport();
      }
    } catch {
      setErrorMessage("Failed to check Gmail connection status.");
      setStep("error");
    }
  }, [baseUrl, runImport]);

  useEffect(() => {
    if (open) {
      setResults([]);
      setSelected(new Set());
      setErrorMessage("");
      checkStatus();
    }
  }, [open, checkStatus]);

  const handleConnect = () => {
    if (authUrl) {
      const popup = window.open(authUrl, "gmailAuth", "width=500,height=600");
      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          setTimeout(() => checkStatus(), 500);
        }
      }, 500);
    }
  };

  const handleDisconnect = async () => {
    await fetch(`${baseUrl}/api/gmail/disconnect`, { method: "POST" });
    toast({ title: "Gmail disconnected" });
    const urlRes = await fetch(`${baseUrl}/api/gmail/auth-url`);
    const urlData = await urlRes.json();
    setAuthUrl(urlData.url || "");
    setStep("not-connected");
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleImportSelected = () => {
    const toImport = results.filter((_, i) => selected.has(i));
    onImport(toImport);
    onOpenChange(false);
    toast({
      title: `${toImport.length} resume${toImport.length !== 1 ? "s" : ""} imported`,
      description: "Resumes have been added to the upload queue for review.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Import Resumes from Gmail
          </DialogTitle>
          <DialogDescription>
            Searching for resume attachments in emails related to <strong>{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {step === "checking" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking Gmail connection...</p>
          </div>
        )}

        {step === "not-configured" && (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Google OAuth credentials are not configured. Please set{" "}
                <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code> and{" "}
                <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code> in your environment secrets.
              </AlertDescription>
            </Alert>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p className="font-medium text-foreground">Setup instructions:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Gmail API and Google Drive API</li>
                <li>Create OAuth 2.0 credentials (Web application type)</li>
                <li>Add your app URL as an authorized redirect URI</li>
                <li>Copy the Client ID and Client Secret to Replit Secrets</li>
              </ol>
            </div>
          </div>
        )}

        {step === "not-connected" && (
          <div className="space-y-4 py-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Connect your Google account to allow the platform to search your Gmail for resume emails.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>The platform will request access to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Read emails in your Gmail inbox (read-only)</li>
                <li>Create folders and upload files in your Google Drive</li>
              </ul>
            </div>
            <Button onClick={handleConnect} className="w-full gap-2" size="lg">
              <Mail className="h-4 w-4" />
              Connect Gmail Account
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              A popup window will open for Google sign-in. After connecting, this dialog will automatically continue.
            </p>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Mail className="h-12 w-12 text-primary/20" />
              <Loader2 className="h-6 w-6 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="font-medium">Searching Gmail...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Looking for emails matching "<strong>{jobTitle}</strong>" with resume attachments
              </p>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{resultMessage}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={runImport} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="gap-1.5 text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No resumes found</p>
                <p className="text-sm mt-1">
                  No emails with resume attachments were found for this job. Make sure applicants are emailing resumes to <strong>arunbaba0987@gmail.com</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{selected.size} of {results.length} selected</span>
                  <div className="flex gap-2">
                    <button className="hover:text-foreground" onClick={() => setSelected(new Set(results.map((_, i) => i)))}>Select all</button>
                    <span>·</span>
                    <button className="hover:text-foreground" onClick={() => setSelected(new Set())}>Clear</button>
                  </div>
                </div>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.has(i) ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                    onClick={() => toggleSelect(i)}
                  >
                    <div className={`mt-0.5 rounded-full w-4 h-4 border-2 flex-shrink-0 transition-colors ${selected.has(i) ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                      {selected.has(i) && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.name || "Unknown"}</span>
                        {r.email && <span className="text-xs text-muted-foreground">{r.email}</span>}
                        {r.phone && <Badge variant="outline" className="text-xs">{r.phone}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.emailSubject}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <FolderOpen className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{r.fileName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={checkStatus} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "results" && results.length > 0 && (
            <Button
              onClick={handleImportSelected}
              disabled={selected.size === 0}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Import {selected.size} Resume{selected.size !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
