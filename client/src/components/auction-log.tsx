import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Clock, DollarSign, User } from "lucide-react";
import type { AuctionLog, Player, Team } from "@shared/schema";

export default function AuctionLogComponent() {
  // Fetch auction logs
  const { data: logs = [], isLoading } = useQuery<AuctionLog[]>({
    queryKey: ["/api/auction-logs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch players and teams for display
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Helper functions
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  const getPlayerRole = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.role || "Unknown";
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.colorTheme || "#3B82F6";
  };

  // Export auction log
  const exportLog = () => {
    const csvContent = [
      'Timestamp,Player Name,Role,Team,Sold Price (₹L)',
      ...logs.map(log => {
        const player = players.find(p => p.id === log.playerId);
        const team = teams.find(t => t.id === log.teamId);
        const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
        return `${timestamp},${player?.name || 'Unknown'},${player?.role || 'Unknown'},${team?.name || 'Unknown'},${log.soldPrice}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auction-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const totalPlayers = logs.length;
  const totalRevenue = logs.reduce((sum, log) => sum + log.soldPrice, 0);
  const averagePrice = totalPlayers > 0 ? Math.round(totalRevenue / totalPlayers) : 0;
  const highestSale = logs.length > 0 ? Math.max(...logs.map(log => log.soldPrice)) : 0;

  if (isLoading) {
    return <div className="animate-pulse">Loading auction log...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{totalPlayers}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue}L</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-2xl font-bold">₹{averagePrice}L</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Sale</p>
                <p className="text-2xl font-bold">₹{highestSale}L</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auction Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Auction History ({logs.length} sales)</CardTitle>
              <CardDescription>
                Complete log of all player sales with timestamps and prices.
              </CardDescription>
            </div>
            <Button onClick={exportLog} variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-3">
              {/* Recent sales first */}
              {logs
                .sort((a, b) => {
                  const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                  const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                  return timeB - timeA;
                })
                .map((log, index) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {/* Sale number */}
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                        {logs.length - index}
                      </div>

                      {/* Player info */}
                      <div>
                        <div className="font-semibold">{getPlayerName(log.playerId)}</div>
                        <div className="text-sm text-gray-600">
                          <Badge variant="outline" className="mr-2">
                            {getPlayerRole(log.playerId)}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Team info */}
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getTeamColor(log.teamId) }}
                        />
                        <span className="font-medium">{getTeamName(log.teamId)}</span>
                      </div>
                      
                      {/* Price */}
                      <div className="text-lg font-bold text-green-600">
                        ₹{log.soldPrice}L
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales yet</h3>
              <p className="text-gray-600">Player sales will appear here as the auction progresses.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity (Last 5 sales) */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest 5 player sales in chronological order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs
                .sort((a, b) => {
                  const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                  const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                  return timeB - timeA;
                })
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getPlayerName(log.playerId)}</span>
                      <span className="text-sm text-gray-600">sold to</span>
                      <span className="font-medium" style={{ color: getTeamColor(log.teamId) }}>
                        {getTeamName(log.teamId)}
                      </span>
                    </div>
                    <div className="font-bold text-green-600">₹{log.soldPrice}L</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}