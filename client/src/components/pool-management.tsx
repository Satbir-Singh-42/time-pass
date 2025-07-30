import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, Shuffle } from "lucide-react";
import type { Player } from "@shared/schema";

export default function PoolManagement() {
  const [newPoolName, setNewPoolName] = useState("");
  const [selectedPool, setSelectedPool] = useState<string>("Pool A");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all players and pools
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: pools = [] } = useQuery<string[]>({
    queryKey: ["/api/pools"],
  });

  // Get players by pool
  const getPlayersByPool = (poolName: string) => {
    return players.filter(player => player.pool === poolName);
  };

  // Update player pool mutation
  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, updates }: { playerId: string; updates: Partial<Player> }) =>
      apiRequest("PUT", `/api/players/${playerId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({ title: "Player updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating player", description: error.message, variant: "destructive" });
    },
  });

  // Move player to pool
  const movePlayerToPool = (playerId: string, poolName: string) => {
    updatePlayerMutation.mutate({
      playerId,
      updates: { pool: poolName }
    });
  };

  // Create new pool
  const createPool = () => {
    if (!newPoolName.trim()) return;
    
    // For simplicity, we'll create a pool by adding a player to it
    // In a real app, you might want a dedicated pool creation endpoint
    setNewPoolName("");
    toast({ title: `Pool "${newPoolName}" will be created when first player is added` });
  };

  // Auto-distribute players to pools
  const autoDistributePlayers = () => {
    const unassignedPlayers = players.filter(p => !p.pool && p.status === "Available");
    const poolNames = ["Pool A", "Pool B", "Pool C"];
    
    unassignedPlayers.forEach((player, index) => {
      const poolIndex = index % poolNames.length;
      movePlayerToPool(player.id, poolNames[poolIndex]);
    });
    
    toast({ title: `Distributed ${unassignedPlayers.length} players across pools` });
  };

  // Remove player from pool
  const removeFromPool = (playerId: string) => {
    updatePlayerMutation.mutate({
      playerId,
      updates: { pool: null }
    });
  };

  const availablePools = pools.length > 0 ? pools : ["Pool A", "Pool B", "Pool C"];
  const unassignedPlayers = players.filter(p => !p.pool && p.status === "Available");

  return (
    <div className="space-y-6">
      {/* Pool Creation and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="New pool name..."
            value={newPoolName}
            onChange={(e) => setNewPoolName(e.target.value)}
            className="w-48"
          />
          <Button onClick={createPool} size="sm" disabled={!newPoolName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Pool
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={autoDistributePlayers} variant="outline" size="sm">
            <Shuffle className="h-4 w-4 mr-2" />
            Auto Distribute
          </Button>
        </div>
      </div>

      {/* Pool Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availablePools.map((poolName) => {
          const poolPlayers = getPlayersByPool(poolName);
          return (
            <Card key={poolName} className="bg-cricket-card border-cricket-teal/30 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPool(poolName)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-white">
                  {poolName}
                  <Badge variant="secondary" className="bg-cricket-teal/20 text-cricket-teal border-cricket-teal/50">
                    <Users className="h-3 w-3 mr-1" />
                    {poolPlayers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-cricket-teal/70">
                    Batsmen: {poolPlayers.filter(p => p.role === "Batsman").length}
                  </div>
                  <div className="text-sm text-cricket-teal/70">
                    Bowlers: {poolPlayers.filter(p => p.role === "Bowler").length}
                  </div>
                  <div className="text-sm text-cricket-teal/70">
                    All-rounders: {poolPlayers.filter(p => p.role === "All-rounder").length}
                  </div>
                  <div className="text-sm text-cricket-teal/70">
                    Wicket-keepers: {poolPlayers.filter(p => p.role === "Wicket-keeper").length}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardHeader>
            <CardTitle className="text-white">Unassigned Players ({unassignedPlayers.length})</CardTitle>
            <CardDescription className="text-cricket-teal/70">
              Players not yet assigned to any pool. Use auto-distribute or assign manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedPlayers.map((player) => (
                <div key={player.id} className="border border-cricket-teal/30 rounded-lg p-3 bg-cricket-navy-dark">
                  <div className="font-medium text-white">{player.name}</div>
                  <div className="text-sm text-cricket-teal/70">{player.role} • {player.country}</div>
                  <div className="text-sm text-cricket-gold">₹{player.basePrice}L</div>
                  <div className="mt-2">
                    <Select onValueChange={(poolName) => movePlayerToPool(player.id, poolName)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Assign to pool" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePools.map((poolName) => (
                          <SelectItem key={poolName} value={poolName}>
                            {poolName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Pool Details */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            {selectedPool} Players
            <Badge variant="outline" className="text-cricket-teal border-cricket-teal/50">
              {getPlayersByPool(selectedPool).length} players
            </Badge>
          </CardTitle>
          <CardDescription className="text-cricket-teal/70">
            Manage players in {selectedPool}. You can move them to other pools or remove them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getPlayersByPool(selectedPool).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-cricket-teal/70">No players in this pool.</p>
              <p className="text-sm text-cricket-teal/50 mt-2">Assign players from the unassigned section above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-cricket-teal/30">
                    <th className="text-left p-2 text-cricket-teal">Name</th>
                    <th className="text-left p-2 text-cricket-teal">Role</th>
                    <th className="text-left p-2 text-cricket-teal">Country</th>
                    <th className="text-left p-2 text-cricket-teal">Base Price</th>
                    <th className="text-left p-2 text-cricket-teal">Status</th>
                    <th className="text-left p-2 text-cricket-teal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPlayersByPool(selectedPool).map((player) => (
                    <tr key={player.id} className="border-b border-cricket-teal/20">
                      <td className="p-2 font-medium text-white">{player.name}</td>
                      <td className="p-2 text-cricket-teal/70">{player.role}</td>
                      <td className="p-2 text-cricket-teal/70">{player.country}</td>
                      <td className="p-2 text-cricket-gold">₹{player.basePrice}L</td>
                      <td className="p-2">
                        <Badge className={
                          player.status === "Available" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                          player.status === "Sold" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                          "bg-red-500/20 text-red-400 border-red-500/50"
                        }>
                          {player.status}
                        </Badge>
                      </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Select onValueChange={(poolName) => movePlayerToPool(player.id, poolName)}>
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Move" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePools.filter(p => p !== selectedPool).map((poolName) => (
                              <SelectItem key={poolName} value={poolName}>
                                {poolName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromPool(player.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}