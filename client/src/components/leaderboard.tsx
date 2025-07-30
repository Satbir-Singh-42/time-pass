import { useState } from "react";
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

// Team interface
interface TeamLeaderboard {
  id: string;
  name: string;
  logo: string;
  totalPoints: number;
  totalPlayers: number;
  budgetUsed: number;
  totalBudget: number;
  averagePoints: number;
  highestPaidPlayer: {
    name: string;
    price: number;
  };
  rank: number;
  players: Player[];
}

interface Player {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  evaluationPoints: number;
  soldPrice: number;
  country: string;
}

export default function Leaderboard() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  // Sample leaderboard data - in real app this would come from Firebase
  const [teams] = useState<TeamLeaderboard[]>([
    {
      id: "team-1",
      name: "Mumbai Warriors",
      logo: "🏏",
      totalPoints: 285,
      totalPlayers: 5,
      budgetUsed: 420000000,
      totalBudget: 500000000,
      averagePoints: 57,
      highestPaidPlayer: {
        name: "Virat Kohli",
        price: 170000000
      },
      rank: 1,
      players: [
        { id: "p1", name: "Virat Kohli", role: "Batsman", evaluationPoints: 95, soldPrice: 170000000, country: "India" },
        { id: "p2", name: "Rashid Khan", role: "Bowler", evaluationPoints: 88, soldPrice: 98000000, country: "Afghanistan" },
        { id: "p3", name: "David Warner", role: "Batsman", evaluationPoints: 82, soldPrice: 85000000, country: "Australia" },
        { id: "p4", name: "Andre Russell", role: "All-rounder", evaluationPoints: 78, soldPrice: 67000000, country: "West Indies" },
      ]
    },
    {
      id: "team-2",
      name: "Chennai Kings",
      logo: "👑",
      totalPoints: 267,
      totalPlayers: 4,
      budgetUsed: 335000000,
      totalBudget: 500000000,
      averagePoints: 66.75,
      highestPaidPlayer: {
        name: "Jasprit Bumrah",
        price: 125000000
      },
      rank: 2,
      players: [
        { id: "p5", name: "Jasprit Bumrah", role: "Bowler", evaluationPoints: 92, soldPrice: 125000000, country: "India" },
        { id: "p6", name: "Ben Stokes", role: "All-rounder", evaluationPoints: 90, soldPrice: 85000000, country: "England" },
        { id: "p7", name: "KL Rahul", role: "Wicket-keeper", evaluationPoints: 85, soldPrice: 125000000, country: "India" },
      ]
    },
    {
      id: "team-3",
      name: "Delhi Capitals",
      logo: "⚡",
      totalPoints: 194,
      totalPlayers: 3,
      budgetUsed: 260000000,
      totalBudget: 500000000,
      averagePoints: 64.67,
      highestPaidPlayer: {
        name: "Jos Buttler",
        price: 105000000
      },
      rank: 3,
      players: [
        { id: "p8", name: "Jos Buttler", role: "Wicket-keeper", evaluationPoints: 89, soldPrice: 105000000, country: "England" },
        { id: "p9", name: "Kagiso Rabada", role: "Bowler", evaluationPoints: 87, soldPrice: 90000000, country: "South Africa" },
        { id: "p10", name: "Shubman Gill", role: "Batsman", evaluationPoints: 78, soldPrice: 65000000, country: "India" },
      ]
    }
  ]);

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-amber-400" />;
      case 2:
        return <Medal className="h-8 w-8 text-slate-300" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <Trophy className="h-8 w-8 text-slate-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    const colors = {
      1: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
      2: "bg-gradient-to-r from-slate-400 to-slate-500 text-white",
      3: "bg-gradient-to-r from-amber-600 to-orange-600 text-white"
    };
    return colors[rank as keyof typeof colors] || "bg-slate-600 text-slate-200";
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      "Batsman": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Bowler": "bg-purple-500/20 text-purple-300 border-purple-500/30", 
      "All-rounder": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "Wicket-keeper": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    };
    return <Badge className={colors[role as keyof typeof colors] || "bg-gray-500/20 text-gray-300"}>{role}</Badge>;
  };

  const exportLeaderboard = () => {
    const headers = [
      'Rank', 'Team Name', 'Total Points', 'Players', 'Budget Used', 
      'Budget Remaining', 'Average Points', 'Highest Paid Player', 'Player Price'
    ];
    
    const csvData = teams.map(team => [
      team.rank,
      team.name,
      team.totalPoints,
      team.totalPlayers,
      team.budgetUsed,
      team.totalBudget - team.budgetUsed,
      team.averagePoints.toFixed(2),
      team.highestPaidPlayer.name,
      team.highestPaidPlayer.price
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Leaderboard has been exported to CSV",
    });
  };

  const totalPoints = teams.reduce((sum, team) => sum + team.totalPoints, 0);
  const totalSpent = teams.reduce((sum, team) => sum + team.budgetUsed, 0);
  const totalPlayers = teams.reduce((sum, team) => sum + team.totalPlayers, 0);

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-amber-400" />
          <Crown className="h-6 w-6 text-amber-300" />
          <Trophy className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-100">Team Leaderboard</h1>
        <p className="text-slate-400 text-lg">
          Rankings based on evaluation points with top 3 highlights
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Points</p>
                <p className="text-2xl font-bold text-amber-300">{totalPoints}</p>
              </div>
              <Star className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-green-300">{formatPrice(totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Players</p>
                <p className="text-2xl font-bold text-blue-300">{totalPlayers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Leading Team</p>
                <p className="text-2xl font-bold text-slate-100">{teams[0]?.name || "TBD"}</p>
              </div>
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "overview" ? "default" : "outline"}
            onClick={() => setViewMode("overview")}
            className="cricket-button-secondary"
          >
            Overview
          </Button>
          <Button
            variant={viewMode === "detailed" ? "default" : "outline"}
            onClick={() => setViewMode("detailed")}
            className="cricket-button-secondary"
          >
            Detailed
          </Button>
        </div>
        
        <Button
          onClick={exportLeaderboard}
          className="cricket-button-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Top 3 Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teams.slice(0, 3).map((team, index) => (
          <Card 
            key={team.id} 
            className={`cricket-card relative overflow-hidden ${
              index === 0 ? 'ring-2 ring-amber-400 shadow-amber-400/20' : 
              index === 1 ? 'ring-2 ring-slate-400 shadow-slate-400/20' : 
              'ring-2 ring-amber-600 shadow-amber-600/20'
            }`}
          >
            <div className={`absolute top-0 right-0 p-2 rounded-bl-lg ${getRankBadge(team.rank)}`}>
              <span className="font-bold text-sm">#{team.rank}</span>
            </div>
            <CardHeader className="text-center pb-3">
              <div className="flex flex-col items-center gap-3">
                {getRankIcon(team.rank)}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                    {team.logo}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-100 text-lg">{team.name}</h3>
                    <p className="text-slate-400 text-sm">{team.totalPlayers} players</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <p className="text-3xl font-bold text-amber-300">{team.totalPoints}</p>
                <p className="text-sm text-slate-400">Total Points</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                  <p className="text-lg font-bold text-slate-100">{team.averagePoints}</p>
                  <p className="text-xs text-slate-400">Avg Points</p>
                </div>
                <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                  <p className="text-lg font-bold text-green-300">{formatPrice(team.budgetUsed)}</p>
                  <p className="text-xs text-slate-400">Spent</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Budget Used:</span>
                  <span className="text-slate-200">{((team.budgetUsed / team.totalBudget) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(team.budgetUsed / team.totalBudget) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="text-center p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400">Highest Paid</p>
                <p className="font-medium text-slate-100">{team.highestPaidPlayer.name}</p>
                <p className="text-xs text-amber-300">{formatPrice(team.highestPaidPlayer.price)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {viewMode === "detailed" && (
        <Card className="cricket-card">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Complete Team Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {teams.map((team) => (
                <Card key={team.id} className="bg-slate-700/30 border-slate-600">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(team.rank)}`}>
                          #{team.rank}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-lg">
                            {team.logo}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-100 text-lg">{team.name}</h3>
                            <p className="text-slate-400 text-sm">{team.totalPoints} total points</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-300">{team.totalPoints}</p>
                        <p className="text-sm text-slate-400">Points</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-200">Team Statistics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-lg font-bold text-slate-100">{team.totalPlayers}</p>
                            <p className="text-xs text-slate-400">Players</p>
                          </div>
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-lg font-bold text-slate-100">{team.averagePoints}</p>
                            <p className="text-xs text-slate-400">Avg Points</p>
                          </div>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-400">Budget Used:</span>
                            <span className="text-green-300">{formatPrice(team.budgetUsed)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-400">Remaining:</span>
                            <span className="text-green-300">{formatPrice(team.totalBudget - team.budgetUsed)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-200">Squad Overview</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-slate-800/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                {getRoleBadge(player.role)}
                                <span className="text-slate-200 text-sm">{player.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-100">{player.evaluationPoints}pts</p>
                                <p className="text-xs text-slate-400">{formatPrice(player.soldPrice)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}