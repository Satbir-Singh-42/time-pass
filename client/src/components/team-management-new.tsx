import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  Shield,
  Trophy,
  Star,
  DollarSign,
  Target,
  Download,
  Crown,
  Award,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Team, Player, InsertTeam } from "@shared/schema";

// Team form schema
const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  budget: z.number().min(10000000, "Budget must be at least ₹1 Cr").max(500000000, "Budget cannot exceed ₹50 Cr"),
  logo: z.string().optional(),
  captain: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

export default function TeamManagementReal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Fetch real data from API
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (team: InsertTeam) => apiRequest("POST", "/api/teams", team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsCreateTeamOpen(false);
      form.reset();
      toast({ title: "Team created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Team> }) =>
      apiRequest("PUT", `/api/teams/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsEditTeamOpen(false);
      setTeamToEdit(null);
      form.reset();
      toast({ title: "Team updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating team", description: error.message, variant: "destructive" });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Team deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting team", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      budget: 250000000,
      logo: "",
      captain: "",
    },
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

  const getBudgetPercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage > 80) {
      return { color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", status: "Critical" };
    } else if (percentage > 60) {
      return { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", status: "Moderate" };
    } else {
      return { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", status: "Healthy" };
    }
  };

  const handleCreateTeam = (data: TeamFormData) => {
    if (teams.length >= 15) {
      toast({
        title: "Team Limit Reached",
        description: "Maximum 15 teams allowed per auction",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate(data);
  };

  const handleEditTeam = (data: TeamFormData) => {
    if (!teamToEdit) return;
    updateTeamMutation.mutate({
      id: teamToEdit.id,
      updates: data
    });
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.assignedTeam === teamId && p.status === "Sold");
  };

  const getTeamStats = (teamId: string) => {
    const teamPlayers = getTeamPlayers(teamId);
    const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const totalPoints = teamPlayers.reduce((sum, p) => sum + (p.evaluationPoints || 0), 0);
    return { totalSpent, totalPoints, playerCount: teamPlayers.length };
  };

  const exportTeamsData = () => {
    if (teams.length === 0) {
      toast({ title: "No teams to export", variant: "destructive" });
      return;
    }

    const csvHeaders = ['Team Name', 'Budget (₹L)', 'Spent (₹L)', 'Remaining (₹L)', 'Players', 'Total Points', 'Captain'];
    const csvData = teams.map(team => {
      const stats = getTeamStats(team.id);
      return [
        team.name,
        team.budget,
        stats.totalSpent,
        team.budget - stats.totalSpent,
        stats.playerCount,
        stats.totalPoints,
        team.captain || 'Not Set'
      ];
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Teams data exported successfully!" });
  };

  if (teamsLoading) {
    return <div className="text-center text-white">Loading teams...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-cricket-teal/70">Create and manage auction teams</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cricket-teal hover:bg-cricket-teal/80">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cricket-card border-cricket-teal/30">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateTeam)} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-cricket-teal">Team Name</Label>
                  <Input
                    {...form.register("name")}
                    className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
                    placeholder="Enter team name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="budget" className="text-cricket-teal">Budget (₹ Lakhs)</Label>
                  <Input
                    {...form.register("budget", { valueAsNumber: true })}
                    type="number"
                    className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
                    placeholder="25000"
                  />
                  {form.formState.errors.budget && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.budget.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="captain" className="text-cricket-teal">Captain (Optional)</Label>
                  <Input
                    {...form.register("captain")}
                    className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
                    placeholder="Team captain name"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending}
                    className="bg-cricket-teal hover:bg-cricket-teal/80"
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateTeamOpen(false)}
                    className="border-cricket-teal/50 text-cricket-teal"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={exportTeamsData} 
            variant="outline" 
            className="bg-cricket-teal/10 border-cricket-teal/50 text-cricket-teal"
            disabled={teams.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-cricket-teal/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Teams Created</h3>
            <p className="text-cricket-teal/70 mb-4">Create your first team to start organizing the auction.</p>
            <Button 
              onClick={() => setIsCreateTeamOpen(true)}
              className="bg-cricket-teal hover:bg-cricket-teal/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const stats = getTeamStats(team.id);
            const budgetPercentage = getBudgetPercentage(stats.totalSpent, team.budget);
            const budgetStatus = getBudgetStatus(budgetPercentage);
            const remainingBudget = team.budget - stats.totalSpent;

            return (
              <Card key={team.id} className="bg-cricket-card border-cricket-teal/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-cricket-teal" />
                      {team.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTeamToEdit(team);
                          form.reset({
                            name: team.name,
                            budget: team.budget,
                            captain: team.captain || "",
                            logo: team.logo || "",
                          });
                          setIsEditTeamOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-cricket-teal"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-cricket-card border-cricket-teal/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
                            <AlertDialogDescription className="text-cricket-teal/70">
                              Are you sure you want to delete "{team.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-cricket-teal/50 text-cricket-teal">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTeamMutation.mutate(team.id)}
                              className="bg-red-600 "
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cricket-teal/70">Budget</span>
                      <span className="text-white font-medium">{formatPrice(team.budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cricket-teal/70">Spent</span>
                      <span className="text-white font-medium">{formatPrice(stats.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cricket-teal/70">Remaining</span>
                      <span className={budgetStatus.color + " font-medium"}>{formatPrice(remainingBudget)}</span>
                    </div>
                    <Progress 
                      value={budgetPercentage} 
                      className="h-2 bg-cricket-navy-dark"
                    />
                    <div className="flex justify-between items-center">
                      <Badge className={`${budgetStatus.bg} ${budgetStatus.color} ${budgetStatus.border}`}>
                        {budgetStatus.status}
                      </Badge>
                      <span className="text-xs text-cricket-teal/70">
                        {budgetPercentage.toFixed(1)}% used
                      </span>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cricket-teal/20">
                    <div className="text-center">
                      <p className="text-lg font-bold text-cricket-teal">{stats.playerCount}</p>
                      <p className="text-xs text-cricket-teal/70">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-cricket-gold">{stats.totalPoints}</p>
                      <p className="text-xs text-cricket-teal/70">Points</p>
                    </div>
                  </div>

                  {/* Captain Info */}
                  {team.captain && (
                    <div className="text-center pt-2 border-t border-cricket-teal/20">
                      <p className="text-sm text-cricket-teal/70">Captain</p>
                      <p className="text-white font-medium">{team.captain}</p>
                    </div>
                  )}

                  {/* Squad Preview */}
                  {stats.playerCount > 0 && (
                    <div className="pt-2 border-t border-cricket-teal/20">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-cricket-teal/50 text-cricket-teal"
                        onClick={() => setSelectedTeamId(selectedTeamId === team.id ? "" : team.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {selectedTeamId === team.id ? "Hide Squad" : "View Squad"}
                      </Button>
                      
                      {selectedTeamId === team.id && (
                        <div className="mt-3 space-y-2">
                          {getTeamPlayers(team.id).map((player) => (
                            <div key={player.id} className="flex justify-between items-center text-sm">
                              <span className="text-white">{player.name}</span>
                              <div className="flex gap-2 items-center">
                                <Badge variant="outline" className="text-xs text-cricket-teal border-cricket-teal/50">
                                  {player.role}
                                </Badge>
                                <span className="text-cricket-gold text-xs">
                                  {formatPrice(player.soldPrice || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent className="bg-cricket-card border-cricket-teal/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditTeam)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-cricket-teal">Team Name</Label>
              <Input
                {...form.register("name")}
                className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="budget" className="text-cricket-teal">Budget (₹ Lakhs)</Label>
              <Input
                {...form.register("budget", { valueAsNumber: true })}
                type="number"
                className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
              />
              {form.formState.errors.budget && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.budget.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="captain" className="text-cricket-teal">Captain</Label>
              <Input
                {...form.register("captain")}
                className="bg-cricket-navy-dark border-cricket-teal/50 text-white"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={updateTeamMutation.isPending}
                className="bg-cricket-teal hover:bg-cricket-teal/80"
              >
                {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditTeamOpen(false)}
                className="border-cricket-teal/50 text-cricket-teal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}