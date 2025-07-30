import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, DollarSign, Trophy, Eye } from "lucide-react";
import type { Team, Player, InsertTeam } from "@shared/schema";

export default function TeamManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams and players
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Add new team mutation
  const addTeamMutation = useMutation({
    mutationFn: (team: InsertTeam) => apiRequest("POST", "/api/teams", team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setShowAddForm(false);
      toast({ title: "Team created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    },
  });

  // Get team players
  const getTeamPlayers = (teamId: string) => {
    return players.filter(player => player.assignedTeam === teamId);
  };

  // Calculate team stats
  const getTeamStats = (team: Team) => {
    const teamPlayers = getTeamPlayers(team.id);
    const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.soldPrice || 0), 0);
    const remainingBudget = team.budget - totalSpent;
    
    return {
      playersCount: teamPlayers.length,
      totalSpent,
      remainingBudget,
      totalPoints: teamPlayers.reduce((sum, player) => {
        // Calculate points based on performance stats if available
        try {
          const stats = player.performanceStats ? JSON.parse(player.performanceStats) : {};
          return sum + (stats.runs || 0) + (stats.wickets || 0) * 20;
        } catch {
          return sum;
        }
      }, 0)
    };
  };

  const handleAddTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const team: InsertTeam = {
      name: formData.get("name") as string,
      colorTheme: formData.get("colorTheme") as string,
      budget: parseInt(formData.get("budget") as string),
      logoUrl: formData.get("logoUrl") as string || undefined,
    };

    addTeamMutation.mutate(team);
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading teams...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-gray-600">Manage team rosters, budgets, and performance</p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" name="name" required />
              </div>
              
              <div>
                <Label htmlFor="colorTheme">Team Color</Label>
                <Input id="colorTheme" name="colorTheme" type="color" defaultValue="#3B82F6" required />
              </div>

              <div>
                <Label htmlFor="budget">Budget (₹ Lakhs)</Label>
                <Input id="budget" name="budget" type="number" min="5000" max="15000" defaultValue="8000" required />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input id="logoUrl" name="logoUrl" type="url" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addTeamMutation.isPending}>
                  {addTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const stats = getTeamStats(team);
          const teamPlayers = getTeamPlayers(team.id);
          
          return (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: team.colorTheme }}
                    />
                    {team.name}
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: team.colorTheme }}
                          />
                          {team.name} Squad
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Team Stats Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.playersCount}</div>
                            <div className="text-sm text-gray-600">Players</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">₹{stats.totalSpent}L</div>
                            <div className="text-sm text-gray-600">Spent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">₹{stats.remainingBudget}L</div>
                            <div className="text-sm text-gray-600">Remaining</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.totalPoints}</div>
                            <div className="text-sm text-gray-600">Points</div>
                          </div>
                        </div>

                        {/* Player Roster */}
                        <div>
                          <h4 className="font-semibold mb-2">Team Roster</h4>
                          {teamPlayers.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {teamPlayers.map((player) => (
                                <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                                  <div>
                                    <div className="font-medium">{player.name}</div>
                                    <div className="text-sm text-gray-600">{player.role} • {player.country}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">₹{player.soldPrice || player.basePrice}L</div>
                                    <div className="text-sm text-gray-600">
                                      {player.soldPrice ? "Sold" : "Base"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No players acquired yet</p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Budget Information */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget:</span>
                    <span className="font-medium">₹{team.budget}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent:</span>
                    <span className="text-red-600">₹{stats.totalSpent}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="text-green-600">₹{stats.remainingBudget}L</span>
                  </div>
                  
                  {/* Budget Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.totalSpent / team.budget) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-sm font-medium">{stats.playersCount}</span>
                    </div>
                    <div className="text-xs text-gray-600">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span className="text-sm font-medium">{stats.totalPoints}</span>
                    </div>
                    <div className="text-xs text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-sm font-medium">{Math.round((stats.totalSpent / team.budget) * 100)}%</span>
                    </div>
                    <div className="text-xs text-gray-600">Used</div>
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600 mb-1">Squad Composition</div>
                  <div className="flex gap-1 flex-wrap">
                    {["Batsman", "Bowler", "All-rounder", "Wicket-keeper"].map((role) => {
                      const count = teamPlayers.filter(p => p.role === role).length;
                      if (count === 0) return null;
                      return (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role.charAt(0)}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-4">Create your first team to start the auction process.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}