import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, DollarSign, Target, Medal, Award } from "lucide-react";
import type { Team, Player } from "@shared/schema";

export default function Leaderboard() {
  // Fetch teams and players
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Calculate team statistics
  const getTeamStats = (team: Team) => {
    const teamPlayers = players.filter(player => player.assignedTeam === team.id);
    const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.soldPrice || 0), 0);
    const remainingBudget = team.budget - totalSpent;
    
    // Calculate performance points
    const totalPoints = teamPlayers.reduce((sum, player) => {
      try {
        const stats = player.performanceStats ? JSON.parse(player.performanceStats) : {};
        return sum + (stats.runs || 0) + (stats.wickets || 0) * 20;
      } catch {
        return sum;
      }
    }, 0);

    // Calculate efficiency score (points per lakh spent)
    const efficiency = totalSpent > 0 ? Math.round((totalPoints / totalSpent) * 100) / 100 : 0;
    
    // Calculate budget utilization percentage
    const budgetUtilization = Math.round((totalSpent / team.budget) * 100);

    return {
      playersCount: teamPlayers.length,
      totalSpent,
      remainingBudget,
      totalPoints,
      efficiency,
      budgetUtilization,
      roleDistribution: {
        batsmen: teamPlayers.filter(p => p.role === "Batsman").length,
        bowlers: teamPlayers.filter(p => p.role === "Bowler").length,
        allRounders: teamPlayers.filter(p => p.role === "All-rounder").length,
        wicketKeepers: teamPlayers.filter(p => p.role === "Wicket-keeper").length,
      }
    };
  };

  // Sort teams by different criteria
  const sortedByPoints = [...teams]
    .map(team => ({ team, stats: getTeamStats(team) }))
    .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);

  const sortedByEfficiency = [...teams]
    .map(team => ({ team, stats: getTeamStats(team) }))
    .sort((a, b) => b.stats.efficiency - a.stats.efficiency);

  const sortedByPlayers = [...teams]
    .map(team => ({ team, stats: getTeamStats(team) }))
    .sort((a, b) => b.stats.playersCount - a.stats.playersCount);

  const sortedByBudgetUsage = [...teams]
    .map(team => ({ team, stats: getTeamStats(team) }))
    .sort((a, b) => b.stats.budgetUtilization - a.stats.budgetUtilization);

  if (teamsLoading || playersLoading) {
    return <div className="animate-pulse">Loading leaderboard...</div>;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
  };

  const LeaderboardCard = ({ title, data, icon, description, valueKey, valueLabel, valueFormatter }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map(({ team, stats }: any, index: number) => (
            <div key={team.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getRankIcon(index + 1)}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: team.colorTheme }}
                  />
                  <span className="font-medium">{team.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {valueFormatter ? valueFormatter(stats[valueKey]) : stats[valueKey]}
                </div>
                <div className="text-sm text-gray-600">{valueLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold">{teams.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Players Sold</p>
                <p className="text-2xl font-bold">{players.filter(p => p.status === "Sold").length}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">
                  ₹{players.filter(p => p.status === "Sold").reduce((sum, p) => sum + (p.soldPrice || 0), 0)}L
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Team Size</p>
                <p className="text-2xl font-bold">
                  {teams.length > 0 ? Math.round(players.filter(p => p.status === "Sold").length / teams.length) : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardCard
          title="Points Leaderboard"
          data={sortedByPoints}
          icon={<Trophy className="h-5 w-5 text-yellow-500" />}
          description="Teams ranked by total performance points"
          valueKey="totalPoints"
          valueLabel="points"
        />

        <LeaderboardCard
          title="Value for Money"
          data={sortedByEfficiency}
          icon={<Target className="h-5 w-5 text-green-500" />}
          description="Teams with best points per lakh spent"
          valueKey="efficiency"
          valueLabel="pts/₹L"
          valueFormatter={(value: number) => value.toFixed(2)}
        />

        <LeaderboardCard
          title="Squad Size"
          data={sortedByPlayers}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          description="Teams with most players acquired"
          valueKey="playersCount"
          valueLabel="players"
        />

        <LeaderboardCard
          title="Budget Utilization"
          data={sortedByBudgetUsage}
          icon={<DollarSign className="h-5 w-5 text-purple-500" />}
          description="Teams by percentage of budget spent"
          valueKey="budgetUtilization"
          valueLabel="% used"
          valueFormatter={(value: number) => `${value}%`}
        />
      </div>

      {/* Detailed Team Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Team Analysis</CardTitle>
          <CardDescription>
            Comprehensive breakdown of each team's performance and composition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Team</th>
                  <th className="text-center p-3">Players</th>
                  <th className="text-center p-3">Points</th>
                  <th className="text-center p-3">Spent</th>
                  <th className="text-center p-3">Remaining</th>
                  <th className="text-center p-3">Efficiency</th>
                  <th className="text-center p-3">Squad Balance</th>
                </tr>
              </thead>
              <tbody>
                {sortedByPoints.map(({ team, stats }, index) => (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: team.colorTheme }}
                        />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="outline">{stats.playersCount}</Badge>
                    </td>
                    <td className="text-center p-3 font-bold text-blue-600">
                      {stats.totalPoints}
                    </td>
                    <td className="text-center p-3">₹{stats.totalSpent}L</td>
                    <td className="text-center p-3 text-green-600">₹{stats.remainingBudget}L</td>
                    <td className="text-center p-3">{stats.efficiency.toFixed(2)}</td>
                    <td className="text-center p-3">
                      <div className="flex gap-1 justify-center">
                        {stats.roleDistribution.batsmen > 0 && (
                          <Badge variant="secondary" className="text-xs">B:{stats.roleDistribution.batsmen}</Badge>
                        )}
                        {stats.roleDistribution.bowlers > 0 && (
                          <Badge variant="secondary" className="text-xs">Bl:{stats.roleDistribution.bowlers}</Badge>
                        )}
                        {stats.roleDistribution.allRounders > 0 && (
                          <Badge variant="secondary" className="text-xs">AR:{stats.roleDistribution.allRounders}</Badge>
                        )}
                        {stats.roleDistribution.wicketKeepers > 0 && (
                          <Badge variant="secondary" className="text-xs">WK:{stats.roleDistribution.wicketKeepers}</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}