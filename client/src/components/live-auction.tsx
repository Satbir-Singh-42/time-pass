import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Gavel, 
  Timer,
  Users,
  DollarSign,
  Target,
  Activity,
  Crown,
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

// Player interface
interface Player {
  id: string;
  name: string;
  age: number;
  country: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  evaluationPoints: number;
  basePrice: number;
  matches: number;
  runs: number;
  wickets: number;
  catches: number;
  pool: string;
  photo?: string;
}

// Team interface
interface Team {
  id: string;
  name: string;
  remainingBudget: number;
  players: Player[];
  logo?: string;
}

export default function LiveAuction() {
  const { toast } = useToast();
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [auctionTimer, setAuctionTimer] = useState(30);

  // Sample data - in real app this would come from Firebase
  const [availablePlayers] = useState<Player[]>([
    {
      id: "p1",
      name: "Virat Kohli",
      age: 35,
      country: "India",
      role: "Batsman",
      evaluationPoints: 95,
      basePrice: 160000000,
      matches: 115,
      runs: 4008,
      wickets: 4,
      catches: 95,
      pool: "Pool A",
    },
    {
      id: "p2",
      name: "Jasprit Bumrah",
      age: 30,
      country: "India",
      role: "Bowler",
      evaluationPoints: 92,
      basePrice: 120000000,
      matches: 70,
      runs: 0,
      wickets: 165,
      catches: 25,
      pool: "Pool A",
    },
    {
      id: "p3",
      name: "Jos Buttler",
      age: 34,
      country: "England",
      role: "Wicket-keeper",
      evaluationPoints: 89,
      basePrice: 100000000,
      matches: 103,
      runs: 2988,
      wickets: 0,
      catches: 85,
      pool: "Pool B",
    }
  ]);

  const [teams] = useState<Team[]>([
    {
      id: "team-1",
      name: "Mumbai Warriors",
      remainingBudget: 180000000,
      players: [],
      logo: "🏏"
    },
    {
      id: "team-2",
      name: "Chennai Kings",
      remainingBudget: 200000000,
      players: [],
      logo: "👑"
    },
    {
      id: "team-3",
      name: "Delhi Capitals",
      remainingBudget: 250000000,
      players: [],
      logo: "⚡"
    }
  ]);

  const currentPlayer = availablePlayers[currentPlayerIndex];

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
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

  const handleStartAuction = () => {
    setIsAuctionActive(true);
    setFinalPrice(currentPlayer?.basePrice || 0);
    setAuctionTimer(30);
    
    toast({
      title: "Auction Started",
      description: `Auction for ${currentPlayer?.name} has begun`,
    });
  };

  const handlePauseAuction = () => {
    setIsAuctionActive(false);
    
    toast({
      title: "Auction Paused",
      description: "Auction has been paused",
    });
  };

  const handleAssignPlayer = () => {
    if (!selectedTeam || !currentPlayer) {
      toast({
        title: "Selection Required",
        description: "Please select a team and enter final price",
        variant: "destructive",
      });
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
    if (!team) return;

    if (finalPrice > team.remainingBudget) {
      toast({
        title: "Budget Exceeded",
        description: `${team.name} doesn't have enough budget`,
        variant: "destructive",
      });
      return;
    }

    // Assign player logic would go here
    setIsAuctionActive(false);
    setCurrentPlayerIndex(prev => prev + 1);
    setSelectedTeam("");
    setFinalPrice(0);
    
    toast({
      title: "Player Assigned",
      description: `${currentPlayer.name} assigned to ${team.name} for ${formatPrice(finalPrice)}`,
    });
  };

  const handleSkipPlayer = () => {
    setIsAuctionActive(false);
    setCurrentPlayerIndex(prev => prev + 1);
    setSelectedTeam("");
    setFinalPrice(0);
    
    toast({
      title: "Player Skipped",
      description: `${currentPlayer?.name} has been marked as unsold`,
    });
  };

  const canAfford = (teamId: string, price: number) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.remainingBudget >= price : false;
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen cricket-gradient p-6 flex items-center justify-center">
        <Card className="cricket-card text-center p-8">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Auction Complete!</h2>
          <p className="text-slate-400">All players have been processed</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          {isAuctionActive ? (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              LIVE AUCTION
            </Badge>
          ) : (
            <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
              AUCTION PAUSED
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-bold text-slate-100">Live Auction</h1>
        <p className="text-slate-400 text-lg">
          Real-time player auction with budget tracking
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Current Player Card */}
        <Card className="cricket-card">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                Current Player ({currentPlayerIndex + 1}/{availablePlayers.length})
              </div>
              {isAuctionActive && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-mono">{auctionTimer}s</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Player Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                    🏏
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100">{currentPlayer.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {getRoleBadge(currentPlayer.role)}
                      <Badge variant="outline" className="text-slate-300">
                        {currentPlayer.country}
                      </Badge>
                      <Badge variant="outline" className="text-slate-300">
                        {currentPlayer.pool}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Age</p>
                    <p className="text-xl font-bold text-slate-100">{currentPlayer.age}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Evaluation</p>
                    <p className="text-xl font-bold text-amber-300">{currentPlayer.evaluationPoints}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-emerald-400 mb-1">Base Price</p>
                  <p className="text-3xl font-bold text-emerald-300">{formatPrice(currentPlayer.basePrice)}</p>
                </div>
              </div>
              
              {/* Player Stats */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-200">Performance Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Matches</p>
                    <p className="text-lg font-bold text-slate-100">{currentPlayer.matches}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Runs</p>
                    <p className="text-lg font-bold text-blue-300">{currentPlayer.runs}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Wickets</p>
                    <p className="text-lg font-bold text-purple-300">{currentPlayer.wickets}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">Catches</p>
                    <p className="text-lg font-bold text-green-300">{currentPlayer.catches}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bid Assignment Form */}
        <Card className="cricket-card">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Gavel className="h-5 w-5 text-purple-400" />
              Bid Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Final Price (₹)</Label>
                <Input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(parseInt(e.target.value) || 0)}
                  placeholder="Enter final bid amount"
                  className="cricket-input"
                  min={currentPlayer.basePrice}
                />
                <p className="text-xs text-slate-400">
                  Minimum: {formatPrice(currentPlayer.basePrice)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-200">Assign to Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="cricket-input">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {teams.map(team => (
                      <SelectItem 
                        key={team.id} 
                        value={team.id}
                        disabled={!canAfford(team.id, finalPrice)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{team.logo}</span>
                          <span>{team.name}</span>
                          <span className="text-slate-400">
                            ({formatPrice(team.remainingBudget)})
                          </span>
                          {!canAfford(team.id, finalPrice) && (
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                              Insufficient Budget
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col justify-end gap-2">
                <Button
                  onClick={handleAssignPlayer}
                  disabled={!selectedTeam || finalPrice < currentPlayer.basePrice}
                  className="cricket-button-primary"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Player
                </Button>
                <Button
                  onClick={handleSkipPlayer}
                  variant="outline"
                  className="cricket-button-secondary"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Unsold
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auction Controls */}
        <div className="flex justify-center gap-4">
          {!isAuctionActive ? (
            <Button
              onClick={handleStartAuction}
              size="lg"
              className="cricket-button-primary text-lg px-8"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Auction
            </Button>
          ) : (
            <Button
              onClick={handlePauseAuction}
              size="lg"
              variant="outline"
              className="cricket-button-secondary text-lg px-8"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause Auction
            </Button>
          )}
          
          <Button
            onClick={handleSkipPlayer}
            size="lg"
            variant="outline"
            className="cricket-button-secondary text-lg px-6"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip Player
          </Button>
        </div>

        {/* Live Budget & Team Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className={`cricket-card ${selectedTeam === team.id ? 'ring-2 ring-emerald-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{team.logo}</span>
                    <span className="font-medium text-slate-100">{team.name}</span>
                  </div>
                  {selectedTeam === team.id && (
                    <Badge className="bg-emerald-500/20 text-emerald-300">
                      Selected
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Budget:</span>
                    <span className="text-slate-200">{formatPrice(team.remainingBudget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Players:</span>
                    <span className="text-slate-200">{team.players.length}</span>
                  </div>
                  {finalPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">After bid:</span>
                      <span className={`${canAfford(team.id, finalPrice) ? 'text-green-300' : 'text-red-300'}`}>
                        {formatPrice(team.remainingBudget - finalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}