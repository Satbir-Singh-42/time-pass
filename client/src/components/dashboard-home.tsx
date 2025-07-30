import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Shield, 
  DollarSign, 
  Trophy, 
  Crown,
  TrendingUp,
  Activity,
  Target,
  Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalPlayers: number;
  totalTeams: number;
  totalSpent: number;
  remainingBudget: number;
  leaderTeam?: {
    name: string;
    points: number;
    logo?: string;
  };
  activeAuctions: number;
  soldPlayers: number;
  availablePlayers: number;
}

export default function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000
  });

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getBudgetPercentage = () => {
    if (!stats?.totalSpent || !stats?.remainingBudget) return 0;
    const total = stats.totalSpent + stats.remainingBudget;
    return (stats.totalSpent / total) * 100;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle, 
    loading = false 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    loading?: boolean;
  }) => (
    <Card className="cricket-card cricket-card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-100 mb-1">
              {loading ? (
                <div className="w-16 h-8 bg-slate-600 rounded animate-pulse"></div>
              ) : (
                value
              )}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">
          Cricket Auction Dashboard
        </h1>
        <p className="text-slate-400 text-lg">
          Manage your cricket auction with comprehensive tools and real-time insights
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Players"
          value={stats?.totalPlayers || 0}
          icon={Users}
          color="bg-emerald-600"
          subtitle="Players in database"
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Teams"
          value={stats?.totalTeams || 0}
          icon={Shield}
          color="bg-blue-600"
          subtitle="Participating teams"
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Spent"
          value={formatPrice(stats?.totalSpent || 0)}
          icon={DollarSign}
          color="bg-purple-600"
          subtitle="Auction spending"
          loading={statsLoading}
        />
        
        <StatCard
          title="Remaining Budget"
          value={formatPrice(stats?.remainingBudget || 0)}
          icon={Target}
          color="bg-orange-600"
          subtitle="Available funds"
          loading={statsLoading}
        />
        
        <StatCard
          title="Leader"
          value={stats?.leaderTeam?.name || "No teams yet"}
          icon={Crown}
          color="bg-amber-600"
          subtitle={stats?.leaderTeam?.points ? `${stats.leaderTeam.points} points` : "Create teams"}
          loading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cricket-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              Auction Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Players Sold</span>
                <span className="text-slate-200">{stats?.soldPlayers || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Available</span>
                <span className="text-slate-200">{stats?.availablePlayers || 0}</span>
              </div>
              <Progress 
                value={stats?.totalPlayers ? ((stats.soldPlayers || 0) / stats.totalPlayers) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="pt-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {stats?.activeAuctions || 0} Active Auctions
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cricket-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Spent</span>
                <span className="text-slate-200">{formatPrice(stats?.totalSpent || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Remaining</span>
                <span className="text-slate-200">{formatPrice(stats?.remainingBudget || 0)}</span>
              </div>
              <Progress 
                value={getBudgetPercentage()} 
                className="h-2"
              />
            </div>
            <div className="pt-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {getBudgetPercentage().toFixed(1)}% Utilized
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cricket-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              Top Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.leaderTeam ? (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{stats.leaderTeam.name}</p>
                  <p className="text-sm text-slate-400">{stats.leaderTeam.points} points</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Trophy className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No teams created yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="cricket-card">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="cricket-button-primary flex flex-col items-center gap-2 py-4">
              <Users className="h-6 w-6" />
              <span>Upload Players</span>
            </button>
            <button className="cricket-button-secondary flex flex-col items-center gap-2 py-4">
              <Target className="h-6 w-6" />
              <span>Manage Pools</span>
            </button>
            <button className="cricket-button-secondary flex flex-col items-center gap-2 py-4">
              <Shield className="h-6 w-6" />
              <span>Create Teams</span>
            </button>
            <button className="cricket-button-secondary flex flex-col items-center gap-2 py-4">
              <Activity className="h-6 w-6" />
              <span>Start Auction</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Live Status Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 border border-slate-600 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300 font-medium">
            Live Dashboard
          </span>
        </div>
      </div>
    </div>
  );
}