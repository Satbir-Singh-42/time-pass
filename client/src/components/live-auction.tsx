import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, Pause, Hammer, Info, DollarSign, User, Globe } from "lucide-react";
import type { Player, Team, Auction, InsertAuction, InsertAuctionLog } from "@shared/schema";

export default function LiveAuction() {
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [bidIncrement, setBidIncrement] = useState<number>(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: activeAuctions = [] } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/active"],
    refetchInterval: 2000, // Refresh every 2 seconds for live updates
  });

  // Auction mutations
  const startAuctionMutation = useMutation({
    mutationFn: (auction: InsertAuction) => apiRequest("POST", "/api/auctions", auction),
    onSuccess: async (response) => {
      const auction = await response.json();
      setCurrentAuction(auction);
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({ title: "Auction started!" });
    },
  });

  const updateAuctionMutation = useMutation({
    mutationFn: ({ auctionId, updates }: { auctionId: string; updates: Partial<Auction> }) =>
      apiRequest("PUT", `/api/auctions/${auctionId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, updates }: { playerId: string; updates: Partial<Player> }) =>
      apiRequest("PUT", `/api/players/${playerId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
  });

  const createAuctionLogMutation = useMutation({
    mutationFn: (log: InsertAuctionLog) => apiRequest("POST", "/api/auction-logs", log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction-logs"] });
    },
  });

  // Get available players for auction
  const availablePlayers = players.filter(p => p.status === "Available");
  
  // Get current auction player
  const currentPlayer = currentAuction ? players.find(p => p.id === currentAuction.playerId) : null;

  // Auto-budget checker
  const checkBudget = (teamId: string, bidAmount: number): boolean => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    return team.remainingBudget >= bidAmount;
  };

  // Start auction for a player
  const startPlayerAuction = (player: Player) => {
    const auction: InsertAuction = {
      playerId: player.id,
      currentBid: player.basePrice,
      winningTeam: null,
    };

    setCurrentBid(player.basePrice);
    startAuctionMutation.mutate(auction);
  };

  // Place bid
  const placeBid = () => {
    if (!currentAuction || !selectedTeam) return;

    const newBidAmount = currentBid + bidIncrement;
    
    // Check budget
    if (!checkBudget(selectedTeam, newBidAmount)) {
      toast({ 
        title: "Budget exceeded!", 
        description: "This team doesn't have enough budget for this bid.",
        variant: "destructive" 
      });
      return;
    }

    setCurrentBid(newBidAmount);
    updateAuctionMutation.mutate({
      auctionId: currentAuction.id,
      updates: {
        currentBid: newBidAmount,
        winningTeam: selectedTeam,
      }
    });

    toast({ title: `Bid placed: ₹${newBidAmount}L` });
  };

  // Finalize auction (sold)
  const finalizeAuction = () => {
    if (!currentAuction || !currentPlayer || !selectedTeam) return;

    // Update auction as completed
    updateAuctionMutation.mutate({
      auctionId: currentAuction.id,
      updates: {
        isActive: false,
        isCompleted: true,
        finalPrice: currentBid,
        completedAt: new Date(),
      }
    });

    // Update player as sold
    updatePlayerMutation.mutate({
      playerId: currentPlayer.id,
      updates: {
        status: "Sold",
        soldPrice: currentBid,
        assignedTeam: selectedTeam,
      }
    });

    // Create auction log
    createAuctionLogMutation.mutate({
      playerId: currentPlayer.id,
      teamId: selectedTeam,
      soldPrice: currentBid,
    });

    // Reset state
    setCurrentAuction(null);
    setCurrentBid(0);
    setSelectedTeam("");

    toast({ title: `${currentPlayer.name} sold to team for ₹${currentBid}L!` });
  };

  // Mark player as unsold
  const markUnsold = () => {
    if (!currentAuction || !currentPlayer) return;

    // Update auction as completed
    updateAuctionMutation.mutate({
      auctionId: currentAuction.id,
      updates: {
        isActive: false,
        isCompleted: true,
        completedAt: new Date(),
      }
    });

    // Update player as unsold
    updatePlayerMutation.mutate({
      playerId: currentPlayer.id,
      updates: {
        status: "Unsold",
      }
    });

    // Reset state
    setCurrentAuction(null);
    setCurrentBid(0);
    setSelectedTeam("");

    toast({ title: `${currentPlayer.name} marked as unsold` });
  };

  // Show player details
  const showPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Current Auction Status */}
      {currentAuction && currentPlayer ? (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                LIVE AUCTION
              </span>
              <Badge variant="destructive">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Player Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{currentPlayer.name}</h3>
                <div className="flex gap-2">
                  <Badge>{currentPlayer.role}</Badge>
                  <Badge variant="outline">{currentPlayer.country}</Badge>
                </div>
                <p className="text-sm text-gray-600">Base Price: ₹{currentPlayer.basePrice}L</p>
                <Button variant="outline" size="sm" onClick={() => showPlayerDetails(currentPlayer)}>
                  <Info className="h-4 w-4 mr-2" />
                  Player Details
                </Button>
              </div>

              {/* Current Bid */}
              <div className="text-center space-y-4">
                <div>
                  <div className="text-3xl font-bold text-green-600">₹{currentBid}L</div>
                  <div className="text-sm text-gray-600">Current Bid</div>
                </div>
                
                {selectedTeam && (
                  <div>
                    <div className="text-lg font-medium">
                      {teams.find(t => t.id === selectedTeam)?.name}
                    </div>
                    <div className="text-sm text-gray-600">Leading Bidder</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bidding Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="team">Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} (₹{team.remainingBudget}L left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="increment">Bid Increment (₹L)</Label>
                <Select value={bidIncrement.toString()} onValueChange={(value) => setBidIncrement(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">₹5L</SelectItem>
                    <SelectItem value="10">₹10L</SelectItem>
                    <SelectItem value="25">₹25L</SelectItem>
                    <SelectItem value="50">₹50L</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={placeBid} disabled={!selectedTeam} className="flex-1">
                  <Hammer className="h-4 w-4 mr-2" />
                  Bid ₹{currentBid + bidIncrement}L
                </Button>
              </div>
            </div>

            {/* Auction Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={finalizeAuction} disabled={!selectedTeam} variant="default">
                Sold!
              </Button>
              <Button onClick={markUnsold} variant="destructive">
                Unsold
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Auction</CardTitle>
            <CardDescription>
              Select a player from the available list to start an auction.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Players */}
      <Card>
        <CardHeader>
          <CardTitle>Available Players ({availablePlayers.length})</CardTitle>
          <CardDescription>
            Players ready for auction. Click "Start Auction" to begin bidding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlayers.slice(0, 12).map((player) => (
              <Card key={player.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{player.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{player.role}</Badge>
                      <Badge variant="secondary">{player.country}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Base Price: ₹{player.basePrice}L
                    </div>
                    {player.pool && (
                      <div className="text-sm text-blue-600">
                        Pool: {player.pool}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => startPlayerAuction(player)}
                        disabled={!!currentAuction}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Auction
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showPlayerDetails(player)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Detail Modal */}
      <Dialog open={showPlayerModal} onOpenChange={setShowPlayerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Player Profile</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedPlayer.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedPlayer.role}</Badge>
                    <Badge variant="outline">{selectedPlayer.country}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">₹{selectedPlayer.basePrice}L</div>
                  <div className="text-sm text-gray-600">Base Price</div>
                </div>
              </div>

              {selectedPlayer.bio && (
                <div>
                  <h4 className="font-semibold mb-2">Biography</h4>
                  <p className="text-gray-700">{selectedPlayer.bio}</p>
                </div>
              )}

              {selectedPlayer.performanceStats && (
                <div>
                  <h4 className="font-semibold mb-2">Performance Statistics</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-sm">{JSON.stringify(JSON.parse(selectedPlayer.performanceStats), null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600">Pool Assignment</div>
                  <div className="font-medium">{selectedPlayer.pool || "Unassigned"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <Badge className={
                    selectedPlayer.status === "Available" ? "bg-green-100 text-green-800" :
                    selectedPlayer.status === "Sold" ? "bg-blue-100 text-blue-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {selectedPlayer.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}