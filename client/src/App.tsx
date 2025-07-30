import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth, hasFirebaseCredentials } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import AuctionDashboard from "@/pages/auction-dashboard";
import NotFound from "@/pages/not-found";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseCredentials || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard">
            {() => user ? <AuctionDashboard /> : <Login />}
          </Route>
          <Route path="/admin/dashboard">
            {() => user ? <AuctionDashboard /> : <Login />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
