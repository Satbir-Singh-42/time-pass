import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Trophy, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Crown,
  Settings,
  LogOut,
  Menu,
  X,
  Gavel,
  Timer,
  Upload,
  Download,
  PlayCircle,
  StopCircle,
  Shield,
  Waves,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { signOut, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

// Import components for each section
import DashboardHome from "@/components/dashboard-home";
import PlayerManagement from "@/components/player-management";
import PoolManagement from "@/components/pool-management";
import TeamManagement from "@/components/team-management-new";
import LiveAuction from "@/components/live-auction";
import AuctionLog from "@/components/auction-log";
import Leaderboard from "@/components/leaderboard";

const navigationItems = [
  { id: "overview", label: "Overview", icon: BarChart3, description: "Dashboard stats" },
  { id: "players", label: "Player Pool", icon: Users, description: "Manage players" },
  { id: "pools", label: "Pool Management", icon: Waves, description: "Organize pools" },
  { id: "teams", label: "Teams", icon: Trophy, description: "Team management" },
  { id: "auction", label: "Live Auction", icon: Gavel, description: "Auction control" },
  { id: "log", label: "Auction Log", icon: Activity, description: "Transaction history" },
  { id: "leaderboard", label: "Leaderboard", icon: TrendingUp, description: "Team rankings" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch dashboard stats and live data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const { data: activeAuctions, isLoading: auctionsLoading } = useQuery({
    queryKey: ["/api/auctions/active"],
    refetchInterval: 2000, // More frequent for auction status
  });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "Successfully logged out from admin dashboard",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `name,role,country,basePrice,performanceStats,bio
Example Player,Batsman,India,150,"{""runs"": 12000, ""average"": 59.07, ""centuries"": 43}","Star batsman and captain"
Example Bowler,Bowler,India,120,"{""wickets"": 121, ""economy"": 4.17, ""bestFigures"": ""6/27""}","Premier fast bowler"
Example All-rounder,All-rounder,England,140,"{""runs"": 4956, ""wickets"": 174, ""average"": 35.89}","Star all-rounder"
Example Keeper,Wicket-keeper,India,125,"{""runs"": 10773, ""dismissals"": 444, ""strikeRate"": 87.56}","Wicket-keeper batsman"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cricket-auction-player-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const NavItem = ({ item, isActive, onClick }: { 
    item: typeof navigationItems[0], 
    isActive: boolean, 
    onClick: () => void 
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 group ${
        isActive 
          ? "bg-cricket-teal/20 border-r-4 border-cricket-teal text-white" 
          : "hover:bg-cricket-teal/10 text-cricket-teal hover:text-white"
      }`}
    >
      <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
        isActive ? "text-cricket-teal" : "text-cricket-teal/70 group-hover:text-cricket-teal"
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${
          isActive ? "text-white" : "text-cricket-teal group-hover:text-white"
        }`}>
          {item.label}
        </p>
        <p className={`text-xs ${
          isActive ? "text-cricket-teal/90" : "text-cricket-teal/60 group-hover:text-cricket-teal/80"
        }`}>
          {item.description}
        </p>
      </div>
    </button>
  );

  return (
    <div className="h-screen bg-cricket-navy overflow-hidden flex">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:w-80 bg-cricket-navy-dark border-r border-cricket-teal/20 flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-cricket-teal/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cricket-teal to-cricket-gold rounded-xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-wide">Cricket Auction</h1>
              <p className="text-sm text-cricket-teal font-medium">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-2 px-3">
            {navigationItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-cricket-teal/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-cricket-teal/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-cricket-teal" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.displayName || 'Admin User'}</p>
              <Badge variant="outline" className="text-xs text-cricket-teal border-cricket-teal/50">
                Administrator
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full bg-cricket-gold/10 border-cricket-gold/50 text-cricket-gold hover:bg-cricket-gold hover:text-cricket-navy"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-cricket-navy-dark border-r border-cricket-teal/20 flex flex-col">
            {/* Mobile Header */}
            <div className="p-4 border-b border-cricket-teal/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cricket-teal to-cricket-gold rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-cricket-teal/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-4">
              <div className="space-y-2 px-3">
                {navigationItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                  />
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-cricket-navy-dark border-b border-cricket-teal/20 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white hover:bg-cricket-teal/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-cricket-teal/80">
                  {navigationItems.find(item => item.id === activeTab)?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Live Status */}
              {auctionsLoading ? (
                <Badge variant="outline" className="text-cricket-teal/60 border-cricket-teal/30">
                  <div className="w-2 h-2 bg-cricket-teal/60 rounded-full mr-2" />
                  Loading...
                </Badge>
              ) : (activeAuctions && activeAuctions.length > 0) ? (
                <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-400/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  Live Auction Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-400 border-orange-400/50 bg-orange-400/10">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                  No Active Auction
                </Badge>
              )}

              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="hidden sm:flex bg-cricket-teal/10 border-cricket-teal/50 text-cricket-teal hover:bg-cricket-teal hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-cricket-navy">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview">
                <DashboardHome />
              </TabsContent>

              <TabsContent value="players">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Player Management</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Upload CSV player data, manage player details, and organize by role and country.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PlayerManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pools">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Pool Management</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Create and organize player pools for strategic auction management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PoolManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teams">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Team Management</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Manage team rosters, budgets, and performance statistics.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auction">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Live Auction Control</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Control live bidding, manage player assignments, and monitor auction progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LiveAuction />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="log">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Auction Transaction Log</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Complete history of all player sales with prices, teams, and timestamps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AuctionLog />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card className="bg-cricket-card border-cricket-teal/30">
                  <CardHeader>
                    <CardTitle className="text-white">Team Leaderboard</CardTitle>
                    <CardDescription className="text-cricket-teal/70">
                      Live team rankings based on points, budget utilization, and player composition.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Leaderboard />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}