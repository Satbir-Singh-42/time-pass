import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  Search, 
  Filter,
  FileText,
  Clock,
  Users,
  DollarSign,
  Trophy,
  SortAsc,
  SortDesc,
  Eye,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuctionLog, Player, Team } from "@shared/schema";

export default function AuctionLogClean() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [sortField, setSortField] = useState<"timestamp" | "soldPrice" | "playerId">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch real data from API
  const { data: auctionLogs = [], isLoading: logsLoading } = useQuery<AuctionLog[]>({
    queryKey: ["/api/auction-logs"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || "Unknown Player";
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || "Unknown Team";
  };

  const getPlayerRole = (playerId: string) => {
    return players.find(p => p.id === playerId)?.role || "Unknown";
  };

  // Filter and sort logs
  const filteredLogs = auctionLogs
    .filter(log => {
      const playerName = getPlayerName(log.playerId).toLowerCase();
      const teamName = getTeamName(log.teamId).toLowerCase();
      const matchesSearch = playerName.includes(searchTerm.toLowerCase()) || 
                           teamName.includes(searchTerm.toLowerCase());
      const matchesTeam = selectedTeam === "all" || log.teamId === selectedTeam;
      return matchesSearch && matchesTeam;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "soldPrice":
          aValue = a.soldPrice;
          bValue = b.soldPrice;
          break;
        case "playerId":
          aValue = getPlayerName(a.playerId);
          bValue = getPlayerName(b.playerId);
          break;
        default:
          aValue = new Date(a.timestamp || 0).getTime();
          bValue = new Date(b.timestamp || 0).getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const exportData = () => {
    const csvHeaders = ['Player Name', 'Team', 'Role', 'Final Price (₹L)', 'Timestamp'];
    const csvData = filteredLogs.map(log => [
      getPlayerName(log.playerId),
      getTeamName(log.teamId),
      getPlayerRole(log.playerId),
      log.soldPrice,
      formatTimestamp(log.timestamp || new Date())
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auction-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Auction log exported successfully!" });
  };

  if (logsLoading) {
    return <div className="text-center text-white">Loading auction logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-cricket-teal mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{auctionLogs.length}</p>
            <p className="text-sm text-cricket-teal/70">Total Transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-cricket-card border-cricket-gold/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-cricket-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {formatPrice(auctionLogs.reduce((sum, log) => sum + log.soldPrice, 0))}
            </p>
            <p className="text-sm text-cricket-teal/70">Total Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-cricket-card border-green-500/30">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {new Set(auctionLogs.map(log => log.playerId)).size}
            </p>
            <p className="text-sm text-cricket-teal/70">Players Sold</p>
          </CardContent>
        </Card>

        <Card className="bg-cricket-card border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {new Set(auctionLogs.map(log => log.teamId)).size}
            </p>
            <p className="text-sm text-cricket-teal/70">Teams Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-cricket-teal/50" />
            <Input
              placeholder="Search players or teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-cricket-navy-dark border-cricket-teal/50 text-white"
            />
          </div>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40 bg-cricket-navy-dark border-cricket-teal/50 text-white">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportData} variant="outline" className="bg-cricket-teal/10 border-cricket-teal/50 text-cricket-teal">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Auction Log Table */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white">Auction Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-cricket-teal/70">No auction transactions found.</p>
              <p className="text-sm text-cricket-teal/50 mt-2">
                {auctionLogs.length === 0 
                  ? "Complete some auctions to see transaction history."
                  : "Try adjusting your search filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-cricket-teal/30">
                    <TableHead 
                      className="text-cricket-teal cursor-pointer hover:text-white"
                      onClick={() => {
                        setSortField("playerId");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      Player {sortField === "playerId" && (sortOrder === "asc" ? <SortAsc className="inline h-4 w-4" /> : <SortDesc className="inline h-4 w-4" />)}
                    </TableHead>
                    <TableHead className="text-cricket-teal">Role</TableHead>
                    <TableHead className="text-cricket-teal">Team</TableHead>
                    <TableHead 
                      className="text-cricket-teal cursor-pointer hover:text-white"
                      onClick={() => {
                        setSortField("soldPrice");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      Final Price {sortField === "soldPrice" && (sortOrder === "asc" ? <SortAsc className="inline h-4 w-4" /> : <SortDesc className="inline h-4 w-4" />)}
                    </TableHead>
                    <TableHead 
                      className="text-cricket-teal cursor-pointer hover:text-white"
                      onClick={() => {
                        setSortField("timestamp");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      Timestamp {sortField === "timestamp" && (sortOrder === "asc" ? <SortAsc className="inline h-4 w-4" /> : <SortDesc className="inline h-4 w-4" />)}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => (
                    <TableRow key={log.id} className="border-cricket-teal/20 hover:bg-cricket-navy-dark">
                      <TableCell className="font-medium text-white">{getPlayerName(log.playerId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-cricket-teal border-cricket-teal/50">
                          {getPlayerRole(log.playerId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-cricket-gold font-medium">{getTeamName(log.teamId)}</TableCell>
                      <TableCell className="text-green-400 font-bold">{formatPrice(log.soldPrice)}</TableCell>
                      <TableCell className="text-cricket-teal/70 text-sm">
                        {formatTimestamp(log.timestamp || new Date())}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}