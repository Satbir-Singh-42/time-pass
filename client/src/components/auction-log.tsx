import { useState } from "react";
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

// Auction log entry interface
interface AuctionLogEntry {
  id: string;
  srNo: number;
  playerName: string;
  assignedTeam: string;
  finalPrice: number;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  timestamp: Date;
  basePrice: number;
  evaluationPoints: number;
  bidDuration: number; // in seconds
  country: string;
}

export default function AuctionLog() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [sortField, setSortField] = useState<"timestamp" | "finalPrice" | "playerName">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sample auction log data - in real app this would come from Firebase
  const [auctionEntries] = useState<AuctionLogEntry[]>([
    {
      id: "1",
      srNo: 1,
      playerName: "Virat Kohli",
      assignedTeam: "Mumbai Warriors",
      finalPrice: 170000000,
      role: "Batsman",
      timestamp: new Date("2025-01-30T15:30:00"),
      basePrice: 160000000,
      evaluationPoints: 95,
      bidDuration: 45,
      country: "India"
    },
    {
      id: "2",
      srNo: 2,
      playerName: "Jasprit Bumrah",
      assignedTeam: "Chennai Kings",
      finalPrice: 125000000,
      role: "Bowler",
      timestamp: new Date("2025-01-30T15:35:00"),
      basePrice: 120000000,
      evaluationPoints: 92,
      bidDuration: 30,
      country: "India"
    },
    {
      id: "3",
      srNo: 3,
      playerName: "Jos Buttler",
      assignedTeam: "Delhi Capitals",
      finalPrice: 105000000,
      role: "Wicket-keeper",
      timestamp: new Date("2025-01-30T15:40:00"),
      basePrice: 100000000,
      evaluationPoints: 89,
      bidDuration: 35,
      country: "England"
    },
    {
      id: "4",
      srNo: 4,
      playerName: "Rashid Khan",
      assignedTeam: "Mumbai Warriors",
      finalPrice: 98000000,
      role: "Bowler",
      timestamp: new Date("2025-01-30T15:45:00"),
      basePrice: 95000000,
      evaluationPoints: 88,
      bidDuration: 40,
      country: "Afghanistan"
    },
    {
      id: "5",
      srNo: 5,
      playerName: "Ben Stokes",
      assignedTeam: "Chennai Kings",
      finalPrice: 85000000,
      role: "All-rounder",
      timestamp: new Date("2025-01-30T15:50:00"),
      basePrice: 80000000,
      evaluationPoints: 90,
      bidDuration: 28,
      country: "England"
    }
  ]);

  const teams = Array.from(new Set(auctionEntries.map(entry => entry.assignedTeam)));
  const roles = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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

  const getPriceChange = (finalPrice: number, basePrice: number) => {
    const change = finalPrice - basePrice;
    const percentage = ((change / basePrice) * 100).toFixed(1);
    if (change > 0) {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          +{formatPrice(change)} (+{percentage}%)
        </Badge>
      );
    } else if (change === 0) {
      return (
        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
          Base Price
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          {formatPrice(change)} ({percentage}%)
        </Badge>
      );
    }
  };

  const filteredAndSortedEntries = auctionEntries
    .filter(entry => {
      const matchesSearch = entry.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.assignedTeam.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = selectedTeam === "all" || entry.assignedTeam === selectedTeam;
      const matchesRole = selectedRole === "all" || entry.role === selectedRole;
      
      return matchesSearch && matchesTeam && matchesRole;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "finalPrice":
          aValue = a.finalPrice;
          bValue = b.finalPrice;
          break;
        case "playerName":
          aValue = a.playerName.toLowerCase();
          bValue = b.playerName.toLowerCase();
          break;
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: "timestamp" | "finalPrice" | "playerName") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Sr No', 'Player Name', 'Assigned Team', 'Final Price', 'Role', 
      'Base Price', 'Price Change', 'Evaluation Points', 'Country', 
      'Bid Duration', 'Date', 'Time'
    ];
    
    const csvData = filteredAndSortedEntries.map(entry => [
      entry.srNo,
      entry.playerName,
      entry.assignedTeam,
      entry.finalPrice,
      entry.role,
      entry.basePrice,
      entry.finalPrice - entry.basePrice,
      entry.evaluationPoints,
      entry.country,
      entry.bidDuration,
      formatDate(entry.timestamp),
      formatTime(entry.timestamp)
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Auction log has been exported to CSV",
    });
  };

  const totalSpent = auctionEntries.reduce((sum, entry) => sum + entry.finalPrice, 0);
  const totalPlayers = auctionEntries.length;
  const averagePrice = totalPlayers > 0 ? totalSpent / totalPlayers : 0;
  const highestBid = Math.max(...auctionEntries.map(entry => entry.finalPrice));

  const SortButton = ({ field, children }: { field: "timestamp" | "finalPrice" | "playerName"; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="text-slate-300 hover:text-slate-100 p-0 h-auto"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
        )}
      </div>
    </Button>
  );

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">Auction Log</h1>
        <p className="text-slate-400 text-lg">
          Complete record of all player auctions with search and export
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Players</p>
                <p className="text-2xl font-bold text-slate-100">{totalPlayers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
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
                <p className="text-sm text-slate-400">Average Price</p>
                <p className="text-2xl font-bold text-purple-300">{formatPrice(averagePrice)}</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Highest Bid</p>
                <p className="text-2xl font-bold text-amber-300">{formatPrice(highestBid)}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="cricket-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search players or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cricket-input pl-10 w-64"
                />
              </div>
              
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="cricket-input w-48">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="cricket-input w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                className="cricket-button-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auction Log Table */}
      <Card className="cricket-card">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Auction Entries ({filteredAndSortedEntries.length})
            </div>
            <Badge className="bg-slate-700/50 text-slate-300">
              Showing {filteredAndSortedEntries.length} of {totalPlayers}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-600">
                  <TableHead className="text-slate-300">Sr No</TableHead>
                  <TableHead className="text-slate-300">
                    <SortButton field="playerName">Player Name</SortButton>
                  </TableHead>
                  <TableHead className="text-slate-300">Team</TableHead>
                  <TableHead className="text-slate-300">
                    <SortButton field="finalPrice">Final Price</SortButton>
                  </TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Price Change</TableHead>
                  <TableHead className="text-slate-300">Country</TableHead>
                  <TableHead className="text-slate-300">Duration</TableHead>
                  <TableHead className="text-slate-300">
                    <SortButton field="timestamp">Timestamp</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-slate-600 hover:bg-slate-700/30">
                    <TableCell className="text-slate-300 font-mono">{entry.srNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-xs">
                          🏏
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{entry.playerName}</p>
                          <p className="text-xs text-slate-400">{entry.evaluationPoints} points</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-200">
                        {entry.assignedTeam}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-100">{formatPrice(entry.finalPrice)}</p>
                        <p className="text-xs text-slate-400">Base: {formatPrice(entry.basePrice)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(entry.role)}
                    </TableCell>
                    <TableCell>
                      {getPriceChange(entry.finalPrice, entry.basePrice)}
                    </TableCell>
                    <TableCell className="text-slate-300">{entry.country}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-300">
                        <Clock className="h-3 w-3" />
                        {entry.bidDuration}s
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-300">
                        <p className="text-sm">{formatDate(entry.timestamp)}</p>
                        <p className="text-xs text-slate-400">{formatTime(entry.timestamp)}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedEntries.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No auction entries found</p>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}