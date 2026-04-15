import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_TEMPLATES, fillTemplate } from "@/lib/email-templates";
import { Send, X, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipient {
  id: number;
  name: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  companyName?: string;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  recipients,
  companyName = "Our Company",
}: EmailComposeDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSelectedTemplate("");
      setSubject("");
      setBody("");
      setCopied(false);
    }
  }, [open]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const firstRecipient = recipients[0];
    const variables: Record<string, string> = {
      candidateName: recipients.length === 1 ? firstRecipient?.name || "Candidate" : "[Candidate Name]",
      jobTitle: firstRecipient?.jobTitle || "[Job Title]",
      department: firstRecipient?.department || "[Department]",
      companyName,
    };

    setSubject(fillTemplate(template.subject, variables));
    setBody(fillTemplate(template.body, variables));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Please fill in subject and message", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const emails = recipients.map((r) => {
        const personalizedBody = recipients.length > 1
          ? body.replace(/\[Candidate Name\]/g, r.name)
          : body;
        return {
          to: r.email,
          name: r.name,
          subject,
          body: personalizedBody,
        };
      });

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!res.ok) throw new Error("Failed to send");

      toast({
        title: `Email${recipients.length > 1 ? "s" : ""} sent successfully`,
        description: `Sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`,
      });
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to send email", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCopyAll = () => {
    const text = `To: ${recipients.map((r) => r.email).join(", ")}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Email content copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    const to = recipients.map((r) => r.email).join(",");
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Compose Email
            {recipients.length > 1 && (
              <Badge variant="secondary" className="ml-2">
                {recipients.length} recipients
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">To</Label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md border min-h-[40px]">
              {recipients.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-xs gap-1">
                  {r.name} &lt;{r.email}&gt;
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {recipients.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Use [Candidate Name] in the message body — it will be replaced with each recipient's name when sending.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <div className="flex gap-2 mr-auto">
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleMailto} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Open in Mail App
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} className="gap-1.5">
            {sending ? "Sending..." : <><Send className="h-3.5 w-3.5" /> Send Email</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
