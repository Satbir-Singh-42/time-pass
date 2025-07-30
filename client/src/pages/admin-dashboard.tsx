import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  Target, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Crown,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  Menu,
  X,
  Gavel,
  Timer,
  PlusCircle,
  Upload,
  Download,
  Star,
  Zap,
  Eye,
  PlayCircle,
  PauseCircle,
  StopCircle,
  UserPlus,
  Shield,
  Waves
} from "lucide-react";
import { useLocation } from "wouter";
import { signOut, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreData } from "@/hooks/useFirestore";
import { useIsMobile } from "@/hooks/use-mobile";
import PlayerPoolImproved from "@/components/player-pool-improved";
import EnhancedPoolManagement from "@/components/enhanced-pool-management";
import TeamManagement from "@/components/team-management";
import SystemIntegrationTest from "@/components/system-integration-test";
import DataFlowTester from "@/components/data-flow-tester";



const navigationItems = [
  { id: "overview", label: "Dashboard", icon: BarChart3, description: "Overview & stats" },
  { id: "players", label: "Player Pool", icon: Users, description: "Manage players" },
  { id: "pools", label: "Pool Management", icon: Waves, description: "Organize auction pools" },
  { id: "teams", label: "Teams", icon: Trophy, description: "Team management" },
  { id: "auction", label: "Auction Control", icon: Gavel, description: "Live auction" },
  { id: "stats", label: "Leaderboard", icon: TrendingUp, description: "Statistics" },
  { id: "reports", label: "Reports", icon: FileText, description: "Analytics" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Firebase data hooks
  const { 
    useDashboardStatsQuery, 
    usePlayersQuery, 
    useTeamsQuery,
    useActiveAuctionsQuery 
  } = useFirestoreData();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: players, isLoading: playersLoading } = usePlayersQuery();
  const { data: teams, isLoading: teamsLoading } = useTeamsQuery();
  const { data: activeAuctions, isLoading: auctionsLoading } = useActiveAuctionsQuery();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "Successfully logged out from admin dashboard",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const NavItem = ({ item, isActive, onClick }: { item: typeof navigationItems[0], isActive: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-2 text-left transition-all duration-300 group ${
        isActive 
          ? "bg-cricket-teal/20 border-r-2 border-cricket-teal" 
          : "hover:bg-cricket-teal/10"
      }`}
    >
      <item.icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${
        isActive ? "text-cricket-teal" : "text-cricket-teal/70 group-hover:text-cricket-teal"
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`font-inter font-medium text-sm truncate transition-colors ${
          isActive ? "text-white" : "text-cricket-teal group-hover:text-white"
        }`}>
          {item.label}
        </p>
        <p className={`text-xs truncate font-inter transition-colors ${
          isActive ? "text-cricket-teal font-medium" : "text-cricket-teal/80 group-hover:text-cricket-teal"
        }`}>
          {item.description}
        </p>
      </div>
      {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0 text-cricket-teal" />}
    </button>
  );

  return (
    <div className="h-screen bg-cricket-navy overflow-hidden flex max-w-full">
      {/* Desktop Sidebar Only */}
      <div className={`hidden lg:flex lg:w-80 xl:w-72 2xl:w-80 sidebar-gradient border-r border-cricket-teal/20 flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-cricket-teal/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cricket-teal to-cricket-gold rounded-xl flex items-center justify-center shadow-cricket-teal">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-poppins font-bold text-white uppercase tracking-wide">Cricket Auction</h1>
              <p className="text-xs text-cricket-teal font-inter">Admin Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="space-y-1">
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
        <div className="p-4 border-t border-cricket-teal/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-cricket-teal/20 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 text-cricket-teal" />
            </div>
            <div>
              <p className="text-sm text-white font-inter font-medium">Admin User</p>
              <p className="text-xs text-cricket-teal font-medium">online</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-white bg-cricket-gold/20 border-cricket-gold hover:bg-cricket-gold hover:text-cricket-navy transition-all duration-300 font-inter font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      {/* Mobile & Tablet Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 sidebar-gradient border-r border-cricket-teal/20 flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="p-6 border-b border-cricket-teal/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cricket-teal to-cricket-gold rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-poppins font-bold text-white uppercase tracking-wide">Admin Panel</h1>
                </div>
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
              <div className="space-y-1">
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="bg-cricket-navy-dark border-b border-cricket-teal/20 px-4 lg:px-8 py-4 flex-shrink-0">
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
                <h2 className="text-xl font-poppins font-bold text-white capitalize">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-[#9ca1a1]">
                  {navigationItems.find(item => item.id === activeTab)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {auctionsLoading ? (
                <Badge variant="outline" className="text-cricket-teal/60 border-cricket-teal/30 bg-cricket-teal/5 flex items-center">
                  <div className="w-2 h-2 bg-cricket-teal/60 rounded-full mr-2" />
                  Loading...
                </Badge>
              ) : (activeAuctions && activeAuctions.length > 0) ? (
                <>
                  <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-400/10 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Live Auction
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 hidden sm:flex"
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    End Auction
                  </Button>
                </>
              ) : (
                <Badge variant="outline" className="text-orange-400 border-orange-400/50 bg-orange-400/10 flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                  No Active Auction
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-cricket-navy">
          <div className="max-w-full mx-auto p-4 lg:p-8 2xl:max-w-7xl 3xl:max-w-8xl 2xl:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Overview Tab - Dashboard Overview */}
              <TabsContent value="overview" className="space-y-8">
                {/* Main Dashboard Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 max-w-full">
                  
                  {/* Total Players Uploaded */}
                  <Card className="bg-cricket-card border-cricket-teal/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserPlus className="w-5 h-5 text-cricket-teal" />
                            <p className="text-sm text-cricket-teal font-inter uppercase tracking-wide font-medium">Total Players Uploaded</p>
                          </div>
                          <p className="text-3xl font-poppins font-bold text-white mb-1">
                            {statsLoading ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              stats?.totalPlayers || 0
                            )}
                          </p>
                          <p className="text-xs text-cricket-teal/70 font-inter">
                            Players in database
                          </p>
                        </div>
                        <div className="p-4 bg-cricket-teal/20 rounded-xl border border-cricket-teal/30">
                          <Users className="w-8 h-8 text-cricket-teal" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Teams Registered */}
                  <Card className="bg-cricket-card border-cricket-gold/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-5 h-5 text-cricket-gold" />
                            <p className="text-sm text-cricket-gold font-inter uppercase tracking-wide font-medium">Teams Registered</p>
                          </div>
                          <p className="text-3xl font-poppins font-bold text-white mb-1">
                            {statsLoading ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              stats?.totalTeams || 0
                            )}
                          </p>
                          <p className="text-xs text-cricket-gold/70 font-inter">
                            Participating teams
                          </p>
                        </div>
                        <div className="p-4 bg-cricket-gold/20 rounded-xl border border-cricket-gold/30">
                          <Trophy className="w-8 h-8 text-cricket-gold" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auction Status */}
                  <Card className="bg-cricket-card border-red-500/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Gavel className="w-5 h-5 text-red-400" />
                            <p className="text-sm text-red-400 font-inter uppercase tracking-wide font-medium">Auction Status</p>
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            {auctionsLoading ? (
                              <span className="animate-pulse text-white">...</span>
                            ) : (
                              <>
                                {(activeAuctions && activeAuctions.length > 0) ? (
                                  <>
                                    <PlayCircle className="w-5 h-5 text-green-400" />
                                    <p className="text-2xl font-poppins font-bold text-green-400">LIVE</p>
                                  </>
                                ) : (
                                  <>
                                    <StopCircle className="w-5 h-5 text-red-400" />
                                    <p className="text-2xl font-poppins font-bold text-red-400">NOT STARTED</p>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          <p className="text-xs text-red-400/70 font-inter">
                            {(activeAuctions && activeAuctions.length > 0) ? 'Auction in progress' : 'Ready to begin auction'}
                          </p>
                        </div>
                        <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                          {(activeAuctions && activeAuctions.length > 0) ? (
                            <Activity className="w-8 h-8 text-red-400 animate-pulse" />
                          ) : (
                            <Timer className="w-8 h-8 text-red-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Players Remaining in Pool */}
                  <Card className="bg-cricket-card border-orange-500/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-5 h-5 text-orange-400" />
                            <p className="text-sm text-orange-400 font-inter uppercase tracking-wide font-medium">Players Remaining</p>
                          </div>
                          <p className="text-3xl font-poppins font-bold text-white mb-1">
                            {statsLoading ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              stats?.unsoldPlayers || 0
                            )}
                          </p>
                          <p className="text-xs text-orange-400/70 font-inter">
                            Available for auction
                          </p>
                        </div>
                        <div className="p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
                          <Users className="w-8 h-8 text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auctioned Players */}
                  <Card className="bg-cricket-card border-emerald-500/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-5 h-5 text-emerald-400" />
                            <p className="text-sm text-emerald-400 font-inter uppercase tracking-wide font-medium">Auctioned Players</p>
                          </div>
                          <p className="text-3xl font-poppins font-bold text-white mb-1">
                            {statsLoading ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              stats?.soldPlayers || 0
                            )}
                          </p>
                          <p className="text-xs text-emerald-400/70 font-inter">
                            Successfully sold
                          </p>
                        </div>
                        <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                          <Target className="w-8 h-8 text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Stats Card */}
                  <Card className="bg-cricket-card border-cricket-teal/30 auction-card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-cricket-teal" />
                            <p className="text-sm text-cricket-teal font-inter uppercase tracking-wide font-medium">Total Revenue</p>
                          </div>
                          <p className="text-3xl font-poppins font-bold text-white mb-1">
                            {statsLoading ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              `₹${((stats?.totalRevenue || 0) / 10000000).toFixed(1)} Cr`
                            )}
                          </p>
                          <p className="text-xs text-cricket-teal/70 font-inter">
                            Total auction value
                          </p>
                        </div>
                        <div className="p-4 bg-cricket-teal/20 rounded-xl border border-cricket-teal/30">
                          <DollarSign className="w-8 h-8 text-cricket-teal" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Auto-refresh indicator */}
                <div className="flex justify-center">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-cricket-navy/50 border border-cricket-teal/30 rounded-full">
                    <div className="w-2 h-2 bg-cricket-teal rounded-full animate-pulse"></div>
                    <p className="text-xs text-cricket-teal font-inter font-medium">
                      Dashboard updates automatically from live Firebase data
                    </p>
                  </div>
                </div>


              </TabsContent>

              {/* Players Tab */}
              <TabsContent value="players" className="space-y-6">
                <PlayerPoolImproved 
                  players={players || []} 
                  isLoading={playersLoading} 
                />
              </TabsContent>

              {/* Pool Management Tab */}
              <TabsContent value="pools" className="space-y-6">
                <EnhancedPoolManagement 
                  players={players || []} 
                  isLoading={playersLoading} 
                  onNavigateToPlayers={() => setActiveTab('players')}
                />
              </TabsContent>

              {/* Teams Tab */}
              <TabsContent value="teams" className="space-y-6">
                <TeamManagement 
                  teams={teams || []} 
                  players={players || []}
                  isLoading={teamsLoading} 
                />
              </TabsContent>

              {/* Auction Tab */}
              <TabsContent value="auction" className="space-y-6">
                <Card className="bg-cricket-card border-cricket-teal/20">
                  <CardHeader>
                    <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide text-xl flex items-center">
                      <Gavel className="w-6 h-6 mr-3 text-cricket-teal" />
                      Live Auction Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Gavel className="w-16 h-16 text-cricket-teal/50 mx-auto mb-4" />
                      <h3 className="text-xl font-poppins font-bold text-white mb-2">Auction Command Center</h3>
                      <p className="text-cricket-teal/70 font-inter mb-6">Control the live auction, manage bids, and oversee the entire process.</p>
                      <Button className="bg-cricket-teal hover:bg-cricket-teal/80 shadow-cricket-teal">
                        <Activity className="w-4 h-4 mr-2" />
                        Enter Auction Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6">
                <Card className="bg-cricket-card border-cricket-gold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide text-xl">Leaderboard & Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-cricket-gold/50 mx-auto mb-4" />
                      <h3 className="text-xl font-poppins font-bold text-white mb-2">Performance Analytics</h3>
                      <p className="text-cricket-gold/70 font-inter mb-6">View detailed statistics, leaderboards, and auction insights.</p>
                      <Button className="bg-cricket-gold text-cricket-navy hover:bg-cricket-gold/80">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                {/* Comprehensive Feature Testing */}
                <DataFlowTester />
                
                {/* System Integration Test */}
                <SystemIntegrationTest />
                
                <Card className="bg-cricket-card border-cricket-teal/20">
                  <CardHeader>
                    <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide text-xl">Reports & Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-cricket-teal/50 mx-auto mb-4" />
                      <h3 className="text-xl font-poppins font-bold text-white mb-2">Comprehensive Reports</h3>
                      <p className="text-cricket-teal/70 font-inter mb-6">Generate detailed reports for analysis and record-keeping.</p>
                      <Button className="bg-cricket-teal hover:bg-cricket-teal/80">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Reports
                      </Button>
                    </div>
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