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
            <Card key={poolName} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPool(poolName)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {poolName}
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {poolPlayers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Batsmen: {poolPlayers.filter(p => p.role === "Batsman").length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Bowlers: {poolPlayers.filter(p => p.role === "Bowler").length}
                  </div>
                  <div className="text-sm text-gray-600">
                    All-rounders: {poolPlayers.filter(p => p.role === "All-rounder").length}
                  </div>
                  <div className="text-sm text-gray-600">
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
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Players ({unassignedPlayers.length})</CardTitle>
            <CardDescription>
              Players not yet assigned to any pool. Drag them to pools or use auto-distribute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedPlayers.map((player) => (
                <div key={player.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-600">{player.role} • {player.country}</div>
                  <div className="text-sm text-gray-600">₹{player.basePrice}L</div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {selectedPool} Players
            <Badge variant="outline">
              {getPlayersByPool(selectedPool).length} players
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage players in {selectedPool}. You can move them to other pools or remove them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Country</th>
                  <th className="text-left p-2">Base Price</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getPlayersByPool(selectedPool).map((player) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{player.name}</td>
                    <td className="p-2">{player.role}</td>
                    <td className="p-2">{player.country}</td>
                    <td className="p-2">₹{player.basePrice}L</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        player.status === "Available" ? "bg-green-100 text-green-800" :
                        player.status === "Sold" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {player.status}
                      </span>
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
        </CardContent>
      </Card>
    </div>
  );
}