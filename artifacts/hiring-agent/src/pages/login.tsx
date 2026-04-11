import { useAuth, Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, UploadCloud, Users } from "lucide-react";

export default function Login() {
  const { setRole } = useAuth();

  const roles = [
    {
      id: "HR" as Role,
      title: "HR Team",
      description: "Upload resumes and manage the initial hiring pipeline.",
      icon: UploadCloud,
    },
    {
      id: "Manager" as Role,
      title: "Department Manager",
      description: "Create jobs, define requirements, and view pipeline stats.",
      icon: Briefcase,
    },
    {
      id: "Hiring Manager" as Role,
      title: "Hiring Manager",
      description: "Review AI screened candidates, update status, and add notes.",
      icon: Users,
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Select Your Role</h1>
          <p className="text-muted-foreground text-lg">
            Choose your persona to access the AI Hiring Agent command center.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card 
              key={role.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md"
              onClick={() => setRole(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-primary">
                  <role.icon size={32} />
                </div>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Enter as {role.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
