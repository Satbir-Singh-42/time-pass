import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Crown, 
  Medal,
  Star,
  Users,
  DollarSign,
  Target,
  Download,
  Eye,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Team, Player } from "@shared/schema";

interface TeamStats {
  id: string;
  name: string;
  totalPoints: number;
  totalPlayers: number;
  budgetUsed: number;
  totalBudget: number;
  averagePoints: number;
  highestPaidPlayer?: {
    name: string;
    price: number;
  };
  rank: number;
  players: Player[];
}

export default function LeaderboardClean() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  // Fetch real data from API
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `₹${(price / 100).toFixed(1)}Cr`;
    } else if (price >= 100) {
      return `₹${price}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  // Calculate team statistics
  const calculateTeamStats = (): TeamStats[] => {
    return teams.map((team) => {
      const teamPlayers = players.filter(p => p.assignedTeam === team.id && p.status === "Sold");
      const totalPoints = teamPlayers.reduce((sum, p) => sum + (p.evaluationPoints || 0), 0);
      const budgetUsed = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      
      const highestPaidPlayer = teamPlayers.reduce((highest, player) => {
        return (player.soldPrice || 0) > (highest?.soldPrice || 0) ? player : highest;
      }, teamPlayers[0]);

      return {
        id: team.id,
        name: team.name,
        totalPoints,
        totalPlayers: teamPlayers.length,
        budgetUsed,
        totalBudget: team.budget,
        averagePoints: teamPlayers.length > 0 ? totalPoints / teamPlayers.length : 0,
        highestPaidPlayer: highestPaidPlayer ? {
          name: highestPaidPlayer.name,
          price: highestPaidPlayer.soldPrice || 0
        } : undefined,
        rank: 0, // Will be calculated after sorting
        players: teamPlayers
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((team, index) => ({ ...team, rank: index + 1 }));
  };

  const teamStats = calculateTeamStats();

  const exportLeaderboard = () => {
    const csvHeaders = ['Rank', 'Team Name', 'Total Points', 'Players', 'Budget Used (₹L)', 'Average Points', 'Highest Paid Player', 'Highest Price (₹L)'];
    const csvData = teamStats.map(team => [
      team.rank,
      team.name,
      team.totalPoints,
      team.totalPlayers,
      team.budgetUsed,
      team.averagePoints.toFixed(1),
      team.highestPaidPlayer?.name || 'None',
      team.highestPaidPlayer?.price || 0
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-leaderboard.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Leaderboard exported successfully!" });
  };

  if (teamsLoading || playersLoading) {
    return <div className="text-center text-white">Loading leaderboard data...</div>;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-cricket-teal/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Teams Created</h3>
        <p className="text-cricket-teal/70">Create teams in the Team Management section to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Leaderboard</h2>
          <p className="text-cricket-teal/70">Rankings based on total evaluation points</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "overview" ? "default" : "outline"}
            onClick={() => setViewMode("overview")}
            className="bg-cricket-teal hover:bg-cricket-teal/80"
          >
            Overview
          </Button>
          <Button
            variant={viewMode === "detailed" ? "default" : "outline"}
            onClick={() => setViewMode("detailed")}
            className="bg-cricket-teal hover:bg-cricket-teal/80"
          >
            Detailed
          </Button>
          <Button onClick={exportLeaderboard} variant="outline" className="bg-cricket-teal/10 border-cricket-teal/50 text-cricket-teal">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top 3 Teams */}
      {teamStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamStats.slice(0, 3).map((team, index) => {
            const icons = [Crown, Trophy, Medal];
            const colors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
            const bgColors = ["bg-yellow-500/20", "bg-gray-500/20", "bg-amber-500/20"];
            const borderColors = ["border-yellow-500/50", "border-gray-500/50", "border-amber-500/50"];
            
            const Icon = icons[index];
            
            return (
              <Card key={team.id} className={`bg-cricket-card border-2 ${borderColors[index]} relative overflow-hidden`}>
                <div className={`absolute top-4 right-4 p-2 rounded-full ${bgColors[index]}`}>
                  <Icon className={`h-6 w-6 ${colors[index]}`} />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${colors[index]}`}>#{team.rank}</span>
                    <CardTitle className="text-white">{team.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-cricket-teal">{team.totalPoints}</p>
                    <p className="text-sm text-cricket-teal/70">Total Points</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-white font-medium">{team.totalPlayers}</p>
                      <p className="text-cricket-teal/70">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">{formatPrice(team.budgetUsed)}</p>
                      <p className="text-cricket-teal/70">Spent</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-cricket-teal/70">Budget Used</span>
                      <span className="text-white">{((team.budgetUsed / team.totalBudget) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(team.budgetUsed / team.totalBudget) * 100} 
                      className="h-2 bg-cricket-navy-dark"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-cricket-gold" />
            Full Team Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-cricket-teal/70">No team data available for ranking.</p>
              <p className="text-sm text-cricket-teal/50 mt-2">Complete some auctions to generate leaderboard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamStats.map((team) => (
                <div key={team.id} className="p-4 bg-cricket-navy-dark rounded-lg border border-cricket-teal/30 hover:border-cricket-teal/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-cricket-teal">#{team.rank}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                        <div className="flex gap-4 text-sm text-cricket-teal/70">
                          <span>{team.totalPlayers} players</span>
                          <span>Avg: {team.averagePoints.toFixed(1)} pts</span>
                          {team.highestPaidPlayer && (
                            <span>Top buy: {team.highestPaidPlayer.name} ({formatPrice(team.highestPaidPlayer.price)})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cricket-teal">{team.totalPoints}</p>
                      <p className="text-sm text-cricket-teal/70">points</p>
                    </div>
                  </div>
                  
                  {viewMode === "detailed" && team.players.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-cricket-teal/20">
                      <h4 className="text-sm font-medium text-cricket-teal mb-2">Squad ({team.players.length} players):</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {team.players.map((player) => (
                          <div key={player.id} className="flex justify-between items-center py-1">
                            <span className="text-white">{player.name}</span>
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="text-xs text-cricket-teal border-cricket-teal/50">
                                {player.role}
                              </Badge>
                              <span className="text-cricket-gold text-xs">{formatPrice(player.soldPrice || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}