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
  Star,
  Gavel,
  Timer
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000
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

  const getBudgetPercentage = () => {
    if (!stats?.totalBudget || !stats?.totalSpent) return 0;
    return (stats.totalSpent / stats.totalBudget) * 100;
  };

  const getRemainingBudget = () => {
    if (!stats?.totalBudget || !stats?.totalSpent) return stats?.totalBudget || 0;
    return stats.totalBudget - stats.totalSpent;
  };

  const getAuctionProgress = () => {
    if (!stats?.totalPlayers || stats.totalPlayers === 0) return 0;
    return ((stats.playersSold || 0) / stats.totalPlayers) * 100;
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
    <Card className="bg-cricket-card border-cricket-teal/30  transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-cricket-teal uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-white mb-1">
              {loading ? (
                <div className="w-16 h-8 bg-cricket-teal/20 rounded animate-pulse"></div>
              ) : (
                value
              )}
            </p>
            {subtitle && (
              <p className="text-xs text-cricket-teal/70">{subtitle}</p>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white">
          Cricket Auction Dashboard
        </h1>
        <p className="text-cricket-teal/80 text-lg">
          Comprehensive auction management with real-time insights
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Players"
          value={stats?.totalPlayers || 0}
          icon={Users}
          color="bg-cricket-teal/20 border border-cricket-teal/50"
          subtitle="Players in database"
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Teams"
          value={stats?.totalTeams || 0}
          icon={Shield}
          color="bg-cricket-gold/20 border border-cricket-gold/50"
          subtitle="Participating teams"
          loading={statsLoading}
        />
        
        <StatCard
          title="Players Sold"
          value={stats?.playersSold || 0}
          icon={Trophy}
          color="bg-green-500/20 border border-green-500/50"
          subtitle="Auction completed"
          loading={statsLoading}
        />
        
        <StatCard
          title="Available"
          value={stats?.availablePlayers || 0}
          icon={Target}
          color="bg-orange-500/20 border border-orange-500/50"
          subtitle="Ready for auction"
          loading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cricket-teal" />
              Auction Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Players Sold</span>
                <span className="text-white font-medium">{stats?.playersSold || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Available</span>
                <span className="text-white font-medium">{stats?.availablePlayers || 0}</span>
              </div>
              <Progress 
                value={getAuctionProgress()} 
                className="h-2 bg-cricket-navy-dark"
              />
            </div>
            <div className="pt-2">
              <Badge className="bg-cricket-teal/20 text-cricket-teal border-cricket-teal/50">
                {getAuctionProgress().toFixed(1)}% Complete
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cricket-gold" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Total Budget</span>
                <span className="text-white font-medium">{formatPrice(stats?.totalBudget || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Spent</span>
                <span className="text-white font-medium">{formatPrice(stats?.totalSpent || 0)}</span>
              </div>
              <Progress 
                value={getBudgetPercentage()} 
                className="h-2 bg-cricket-navy-dark"
              />
            </div>
            <div className="pt-2">
              <Badge className="bg-cricket-gold/20 text-cricket-gold border-cricket-gold/50">
                {getBudgetPercentage().toFixed(1)}% Utilized
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Gavel className="h-5 w-5 text-red-400" />
              Auction Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Status</span>
                <span className="text-white font-medium">{stats?.auctionStatus || "Not Started"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cricket-teal/70">Active Auctions</span>
                <span className="text-white font-medium">{stats?.activeAuctions || 0}</span>
              </div>
            </div>
            <div className="pt-2">
              {(stats?.activeAuctions || 0) > 0 ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  Live Auction
                </Badge>
              ) : (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                  <Timer className="w-3 h-3 mr-2" />
                  Ready to Start
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-cricket-gold" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-cricket-teal/10 rounded-lg border border-cricket-teal/30">
              <h3 className="font-medium text-white mb-2">Player Management</h3>
              <p className="text-sm text-cricket-teal/70 mb-3">Upload and manage player data</p>
              <Badge className="bg-cricket-teal/20 text-cricket-teal border-cricket-teal/50">
                {stats?.totalPlayers || 0} players
              </Badge>
            </div>
            
            <div className="p-4 bg-cricket-gold/10 rounded-lg border border-cricket-gold/30">
              <h3 className="font-medium text-white mb-2">Team Setup</h3>
              <p className="text-sm text-cricket-teal/70 mb-3">Configure teams and budgets</p>
              <Badge className="bg-cricket-gold/20 text-cricket-gold border-cricket-gold/50">
                {stats?.totalTeams || 0} teams
              </Badge>
            </div>
            
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <h3 className="font-medium text-white mb-2">Live Auction</h3>
              <p className="text-sm text-cricket-teal/70 mb-3">Control auction process</p>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                {stats?.auctionStatus || "Ready"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}