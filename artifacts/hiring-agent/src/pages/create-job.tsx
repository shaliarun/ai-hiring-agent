import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function CreateJob() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [education, setEducation] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const addTagsFromValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    const parts = value.split(",").map(s => s.trim()).filter(Boolean);
    const newList = [...list];
    for (const part of parts) {
      if (!newList.includes(part)) {
        newList.push(part);
      }
    }
    setter(newList);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    if ((e.key === "Enter" || e.key === ",") && e.currentTarget.value) {
      e.preventDefault();
      addTagsFromValue(e.currentTarget.value, setter, list);
      e.currentTarget.value = "";
    }
  };

  const handleBlurTag = (e: React.FocusEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    if (e.currentTarget.value.trim()) {
      addTagsFromValue(e.currentTarget.value, setter, list);
      e.currentTarget.value = "";
    }
  };

  const handleRemoveTag = (tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    setter(list.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !department || requiredSkills.length === 0) {
      toast({ title: "Validation Error", description: "Title, department, and at least one required skill are needed.", variant: "destructive" });
      return;
    }

    createJob.mutate({
      data: {
        title,
        department,
        description: description || null,
        requiredSkills,
        niceToHaveSkills,
        keywords,
        experienceMin: experienceMin ? parseInt(experienceMin) : null,
        experienceMax: experienceMax ? parseInt(experienceMax) : null,
        education: education || null,
        location: jobLocation || null,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
      }
    }, {
      onSuccess: (newJob) => {
        toast({ title: "Job created successfully!" });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setLocation(`/jobs/${newJob.id}`);
      },
      onError: () => {
        toast({ title: "Failed to create job", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/jobs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Job Posting</h1>
          <p className="text-muted-foreground mt-1">Define requirements for AI candidate screening.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and what a typical day looks like..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={jobLocation} onChange={e => setJobLocation(e.target.value)} placeholder="e.g. Remote, NY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education Requirement</Label>
                <Input id="education" value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g. BS in Computer Science" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements & Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Required Skills * (Type and press Enter or comma to add)</Label>
              <div className="border rounded-md p-2 flex flex-wrap gap-2 bg-background">
                {requiredSkills.map(skill => (
                  <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                    {skill}
                    <button type="button" onClick={() => handleRemoveTag(skill, setRequiredSkills, requiredSkills)} className="hover:bg-primary/20 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="flex-1 outline-none bg-transparent min-w-[120px] text-sm" 
                  placeholder="e.g. React, TypeScript..." 
                  onKeyDown={e => handleAddTag(e, setRequiredSkills, requiredSkills)}
                  onBlur={e => handleBlurTag(e, setRequiredSkills, requiredSkills)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nice to Have Skills (Type and press Enter or comma to add)</Label>
              <div className="border rounded-md p-2 flex flex-wrap gap-2 bg-background">
                {niceToHaveSkills.map(skill => (
                  <span key={skill} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                    {skill}
                    <button type="button" onClick={() => handleRemoveTag(skill, setNiceToHaveSkills, niceToHaveSkills)} className="hover:bg-secondary/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="flex-1 outline-none bg-transparent min-w-[120px] text-sm" 
                  placeholder="e.g. GraphQL, Docker..." 
                  onKeyDown={e => handleAddTag(e, setNiceToHaveSkills, niceToHaveSkills)}
                  onBlur={e => handleBlurTag(e, setNiceToHaveSkills, niceToHaveSkills)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Keywords for AI Screening (Type and press Enter or comma to add)</Label>
              <div className="border rounded-md p-2 flex flex-wrap gap-2 bg-background">
                {keywords.map(kw => (
                  <span key={kw} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                    {kw}
                    <button type="button" onClick={() => handleRemoveTag(kw, setKeywords, keywords)} className="hover:bg-muted/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="flex-1 outline-none bg-transparent min-w-[120px] text-sm" 
                  placeholder="e.g. leadership, agile..." 
                  onKeyDown={e => handleAddTag(e, setKeywords, keywords)}
                  onBlur={e => handleBlurTag(e, setKeywords, keywords)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Range Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Experience Range (Years)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={experienceMin} onChange={e => setExperienceMin(e.target.value)} placeholder="Min" />
                  <span className="text-muted-foreground">to</span>
                  <Input type="number" min="0" value={experienceMax} onChange={e => setExperienceMax(e.target.value)} placeholder="Max" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Salary Range (USD)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" step="1000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min" />
                  <span className="text-muted-foreground">to</span>
                  <Input type="number" min="0" step="1000" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation("/jobs")}>Cancel</Button>
          <Button type="submit" disabled={createJob.isPending}>
            {createJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </div>
      </form>
    </div>
  );
}
