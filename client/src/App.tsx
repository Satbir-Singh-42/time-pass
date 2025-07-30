import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import AuctionDashboard from "@/pages/auction-dashboard";
import ViewerDashboard from "@/pages/viewer-dashboard";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-cricket-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cricket-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cricket-teal font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => {
          // Admin dashboard requires authentication
          if (!user) return <Login />;
          return <AuctionDashboard />;
        }}
      </Route>
      <Route path="/admin">
        {() => user && isAdmin ? <AuctionDashboard /> : <Login />}
      </Route>
      <Route path="/viewer" component={ViewerDashboard} />
      <Route path="/live" component={ViewerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
