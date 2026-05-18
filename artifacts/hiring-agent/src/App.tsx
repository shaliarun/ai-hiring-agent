import { Component, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import JobsList from "@/pages/jobs";
import CreateJob from "@/pages/create-job";
import JobDetail from "@/pages/job-detail";
import EditJob from "@/pages/edit-job";
import CandidatesList from "@/pages/candidates";
import CandidateDetail from "@/pages/candidate-detail";
import HRPortal from "@/pages/hr-portal";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm">
            Please refresh the page. If this keeps happening, check the latest deployment logs.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return <Login />;
  }

  return (
    <Layout>
      <AppErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/jobs" component={JobsList} />
          <Route path="/jobs/new" component={CreateJob} />
          <Route path="/jobs/:id/edit" component={EditJob} />
          <Route path="/jobs/:id" component={JobDetail} />
          <Route path="/candidates" component={CandidatesList} />
          <Route path="/candidates/:id" component={CandidateDetail} />
          <Route path="/hr" component={HRPortal} />
          <Route component={NotFound} />
        </Switch>
      </AppErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
