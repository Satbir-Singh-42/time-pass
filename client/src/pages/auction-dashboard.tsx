import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, Trophy, Activity, FileDown, LogOut } from "lucide-react";
import { Link } from "wouter";

// Import components for each section
import PlayerManagement from "@/components/player-management";
import PoolManagement from "@/components/pool-management";
import TeamManagement from "@/components/team-management-new";
import LiveAuction from "@/components/live-auction";
import AuctionLog from "@/components/auction-log";
import Leaderboard from "@/components/leaderboard";

export default function AuctionDashboard() {
  const [activeTab, setActiveTab] = useState("players");

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const handleSignOut = () => {
    // Add sign out logic here
    window.location.href = "/";
  };

  const handleExportResults = () => {
    // Export final auction results
    const link = document.createElement('a');
    link.href = '/api/export/results';
    link.download = 'ipl-auction-results.csv';
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">IPL Auction Visualizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleExportResults} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPlayers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.availablePlayers || 0} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTeams || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total budget: ₹{stats?.totalBudget || 0}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players Sold</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.playersSold || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total value: ₹{stats?.totalSpent || 0}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auction Status</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.auctionStatus || "Not Started"}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeAuctions || 0} active bids
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="pools">Pools</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="auction">Live Auction</TabsTrigger>
            <TabsTrigger value="log">Auction Log</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Management</CardTitle>
                <CardDescription>
                  Upload CSV player list, manage player details, and organize players by role and country.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pool Management</CardTitle>
                <CardDescription>
                  Create custom player pools for strategic bidding during the auction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PoolManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  View team rosters, budgets, and performance statistics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Auction</CardTitle>
                <CardDescription>
                  Control the live auction process with bidding, auto budget checker, and player detail modal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LiveAuction />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auction Log</CardTitle>
                <CardDescription>
                  Complete history of all player sales including price, team, and timestamp.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuctionLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Leaderboard</CardTitle>
                <CardDescription>
                  Live rankings based on team points, budget utilization, and player composition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Leaderboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}