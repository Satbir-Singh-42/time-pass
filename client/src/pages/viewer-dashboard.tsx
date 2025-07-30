import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Activity, Search, Eye, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Import read-only components
import AuctionLog from "@/components/auction-log";
import Leaderboard from "@/components/leaderboard";
import type { Player, Team, Auction } from "@shared/schema";

export default function ViewerDashboard() {
  const [activeTab, setActiveTab] = useState("live");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  // Fetch all players for viewing
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch teams for viewing
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 10000,
  });

  // Fetch active auctions
  const { data: activeAuctions = [] } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/active"],
    refetchInterval: 2000, // Refresh every 2 seconds for live auction updates
  });

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filter players for search/display
  const filteredPlayers = players.filter((player: Player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesStatus = statusFilter === "all" || player.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

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
              <Eye className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IPL Auction Live</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.displayName || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Viewer
              </Badge>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats - Read Only */}
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
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.auctionStatus || "Not Started"}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeAuctions || 0} active bids
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Viewer Only */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="live">Live Auction</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="log">Auction Log</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Live Auction View - Read Only */}
          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Auction Status</CardTitle>
                <CardDescription>
                  Real-time view of the ongoing auction. Updates automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeAuctions.length > 0 ? (
                  <div className="space-y-4">
                    {activeAuctions.map((auction: Auction) => {
                      const player = players.find((p: Player) => p.id === auction.playerId);
                      const winningTeam = teams.find((t: Team) => t.id === auction.winningTeam);
                      
                      return (
                        <div key={auction.id} className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold">{player?.name || "Unknown Player"}</h3>
                              <div className="flex gap-2 mt-1">
                                <Badge>{player?.role}</Badge>
                                <Badge variant="outline">{player?.country}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Base Price: ₹{player?.basePrice}L
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                ₹{auction.currentBid}L
                              </div>
                              <div className="text-sm text-gray-600">Current Bid</div>
                              {winningTeam && (
                                <div className="mt-2">
                                  <Badge 
                                    style={{ backgroundColor: winningTeam.colorTheme }}
                                    className="text-white"
                                  >
                                    {winningTeam.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Auction</h3>
                    <p className="text-gray-600">Waiting for the auction to begin...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players View - Read Only */}
          <TabsContent value="players" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Database ({filteredPlayers.length})</CardTitle>
                <CardDescription>
                  Browse all players in the auction. Use search and filters to find specific players.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex gap-4 items-center mb-6">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                      <SelectItem value="Unsold">Unsold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Players Grid - Mobile Friendly */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player: Player) => {
                    const assignedTeam = teams.find((t: Team) => t.id === player.assignedTeam);
                    
                    return (
                      <div key={player.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-lg">{player.name}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">{player.role}</Badge>
                            <Badge variant="secondary">{player.country}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Base Price: ₹{player.basePrice}L
                          </div>
                          {player.soldPrice && (
                            <div className="text-sm font-medium text-green-600">
                              Sold Price: ₹{player.soldPrice}L
                            </div>
                          )}
                          {player.pool && (
                            <div className="text-sm text-blue-600">
                              Pool: {player.pool}
                            </div>
                          )}
                          <div>
                            <Badge className={
                              player.status === "Available" ? "bg-green-100 text-green-800" :
                              player.status === "Sold" ? "bg-blue-100 text-blue-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {player.status}
                            </Badge>
                          </div>
                          {assignedTeam && (
                            <div className="mt-2">
                              <Badge 
                                style={{ backgroundColor: assignedTeam.colorTheme }}
                                className="text-white"
                              >
                                {assignedTeam.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredPlayers.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auction Log - Read Only */}
          <TabsContent value="log" className="space-y-4">
            <AuctionLog />
          </TabsContent>

          {/* Leaderboard - Read Only */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}