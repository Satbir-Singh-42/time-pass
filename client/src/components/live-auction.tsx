import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import type { Player, Team, Auction, InsertAuction } from "@shared/schema";

export default function LiveAuction() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [auctionTimer, setAuctionTimer] = useState(30);

  // Fetch real data from API
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: activeAuctions = [], isLoading: auctionsLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/active"],
    refetchInterval: 2000,
  });

  // Create auction mutation
  const createAuctionMutation = useMutation({
    mutationFn: (auction: InsertAuction) => apiRequest("POST", "/api/auctions", auction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/active"] });
      toast({ title: "Auction started successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error starting auction", description: error.message, variant: "destructive" });
    },
  });

  // Update auction mutation
  const updateAuctionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Auction> }) =>
      apiRequest("PUT", `/api/auctions/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Auction updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating auction", description: error.message, variant: "destructive" });
    },
  });

  const availablePlayers = players.filter(p => p.status === "Available");
  const currentAuction = activeAuctions[0];

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `₹${(price / 100).toFixed(1)}Cr`;
    } else if (price >= 100) {
      return `₹${price}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const startAuction = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    createAuctionMutation.mutate({
      playerId,
      currentBid: player.basePrice,
    });
    setIsAuctionActive(true);
  };

  const finalizeAuction = () => {
    if (!currentAuction || !selectedTeam || !finalPrice) return;

    updateAuctionMutation.mutate({
      id: currentAuction.id,
      updates: {
        winningTeam: selectedTeam,
        finalPrice,
        isActive: false,
        isCompleted: true,
        completedAt: new Date(),
      }
    });

    // Update player status
    apiRequest("PUT", `/api/players/${currentAuction.playerId}`, {
      status: "Sold",
      soldPrice: finalPrice,
      assignedTeam: selectedTeam,
    });

    setIsAuctionActive(false);
    setFinalPrice(0);
    setSelectedTeam("");
  };

  if (playersLoading || teamsLoading) {
    return <div className="text-center text-white">Loading auction data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Auction Status */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gavel className="h-5 w-5 text-cricket-teal" />
            Live Auction Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-cricket-navy-dark rounded-lg border border-cricket-teal/30">
              <h3 className="text-cricket-teal font-medium mb-2">Available Players</h3>
              <p className="text-2xl font-bold text-white">{availablePlayers.length}</p>
            </div>
            <div className="text-center p-4 bg-cricket-navy-dark rounded-lg border border-cricket-gold/30">
              <h3 className="text-cricket-gold font-medium mb-2">Active Teams</h3>
              <p className="text-2xl font-bold text-white">{teams.length}</p>
            </div>
            <div className="text-center p-4 bg-cricket-navy-dark rounded-lg border border-red-500/30">
              <h3 className="text-red-400 font-medium mb-2">Auction Status</h3>
              <Badge className={currentAuction ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}>
                {currentAuction ? "LIVE" : "Ready"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Auction */}
      {currentAuction && (
        <Card className="bg-cricket-card border-green-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400 animate-pulse" />
              Current Auction - LIVE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {players.find(p => p.id === currentAuction.playerId)?.name || "Unknown Player"}
                </h3>
                <p className="text-cricket-teal">
                  {players.find(p => p.id === currentAuction.playerId)?.role} • 
                  {players.find(p => p.id === currentAuction.playerId)?.country}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-cricket-teal">Final Price (₹ Lakhs)</Label>
                  <Input
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseInt(e.target.value))}
                    className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
                    placeholder="Enter final price"
                  />
                </div>
                <div>
                  <Label className="text-cricket-teal">Winning Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/50 text-white">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={finalizeAuction}
                  disabled={!selectedTeam || !finalPrice}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Sale
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateAuctionMutation.mutate({
                      id: currentAuction.id,
                      updates: { isActive: false, isCompleted: true }
                    });
                    setIsAuctionActive(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Unsold
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Players */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white">Available Players for Auction</CardTitle>
        </CardHeader>
        <CardContent>
          {availablePlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-cricket-teal/70">No players available for auction.</p>
              <p className="text-sm text-cricket-teal/50 mt-2">Add players in the Player Pool section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlayers.map((player) => (
                <div key={player.id} className="p-4 bg-cricket-navy-dark rounded-lg border border-cricket-teal/30">
                  <h4 className="font-medium text-white">{player.name}</h4>
                  <p className="text-sm text-cricket-teal/70">{player.role} • {player.country}</p>
                  <p className="text-sm text-cricket-gold mt-1">Base: {formatPrice(player.basePrice)}</p>
                  <Button
                    onClick={() => startAuction(player.id)}
                    disabled={!!currentAuction}
                    size="sm"
                    className="mt-2 w-full bg-cricket-teal hover:bg-cricket-teal/80"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start Auction
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}