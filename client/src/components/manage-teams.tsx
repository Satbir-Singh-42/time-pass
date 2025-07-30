import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  Shield,
  Trophy,
  DollarSign,
  Crown,
  MoreHorizontal,
  Upload,
  RotateCcw,
  Image,
  Star,
  Target
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Team form schema
const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  budget: z.number().min(10000000, "Budget must be at least ₹1 Cr").max(500000000, "Budget cannot exceed ₹50 Cr"),
  logo: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

// Team interface
interface Team {
  id: string;
  name: string;
  budget: number;
  remainingBudget: number;
  logo?: string;
  players: Player[];
  totalPoints: number;
  createdAt: Date;
}

interface Player {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  country: string;
  evaluationPoints: number;
  soldPrice: number;
}

export default function ManageTeams() {
  const { toast } = useToast();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Sample teams data - in real app this would come from Firebase
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "team-1",
      name: "Mumbai Warriors",
      budget: 250000000,
      remainingBudget: 180000000,
      logo: "🏏",
      players: [
        {
          id: "p1",
          name: "Virat Kohli",
          role: "Batsman",
          country: "India",
          evaluationPoints: 95,
          soldPrice: 70000000
        }
      ],
      totalPoints: 95,
      createdAt: new Date(),
    },
    {
      id: "team-2",
      name: "Chennai Kings",
      budget: 250000000,
      remainingBudget: 200000000,
      players: [
        {
          id: "p2",
          name: "Jos Buttler",
          role: "Wicket-keeper",
          country: "England", 
          evaluationPoints: 89,
          soldPrice: 50000000
        }
      ],
      totalPoints: 89,
      createdAt: new Date(),
    },
    {
      id: "team-3",
      name: "Delhi Capitals",
      budget: 250000000,
      remainingBudget: 250000000,
      players: [],
      totalPoints: 0,
      createdAt: new Date(),
    }
  ]);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      budget: 250000000,
      logo: "",
    },
  });

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getBudgetStatus = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 60) {
      return { color: "text-green-300", bg: "bg-green-500", status: "Healthy" };
    } else if (percentage > 30) {
      return { color: "text-yellow-300", bg: "bg-yellow-500", status: "Moderate" };
    } else {
      return { color: "text-red-300", bg: "bg-red-500", status: "Low" };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Batsman": return "🏏";
      case "Bowler": return "⚡";
      case "All-rounder": return "🌟"; 
      case "Wicket-keeper": return "🥅";
      default: return "👤";
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

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      budget: data.budget,
      remainingBudget: data.budget,
      logo: data.logo || "🏏",
      players: [],
      totalPoints: 0,
      createdAt: new Date(),
    };

    setTeams([...teams, newTeam]);
    setIsCreateTeamOpen(false);
    form.reset();

    toast({
      title: "Team Created",
      description: `${data.name} has been created successfully`,
    });
  };

  const handleEditTeam = (data: TeamFormData) => {
    if (!teamToEdit) return;

    setTeams(teams.map(team => 
      team.id === teamToEdit.id 
        ? { ...team, name: data.name, budget: data.budget, logo: data.logo }
        : team
    ));

    setIsEditTeamOpen(false);
    setTeamToEdit(null);
    form.reset();

    toast({
      title: "Team Updated",
      description: `${data.name} has been updated successfully`,
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setTeams(teams.filter(t => t.id !== teamId));

    toast({
      title: "Team Deleted",
      description: `${team.name} has been deleted`,
    });
  };

  const handleResetTeam = (teamId: string) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { ...team, players: [], remainingBudget: team.budget, totalPoints: 0 }
        : team
    ));

    toast({
      title: "Team Reset",
      description: "All players have been removed from the team",
    });
  };

  const totalBudget = teams.reduce((sum, team) => sum + team.budget, 0);
  const totalSpent = teams.reduce((sum, team) => sum + (team.budget - team.remainingBudget), 0);
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">Manage Teams</h1>
        <p className="text-slate-400 text-lg">
          Create and manage cricket teams with budget tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Teams</p>
                <p className="text-2xl font-bold text-slate-100">{teams.length}</p>
                <p className="text-xs text-slate-500">Max: 15</p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Budget</p>
                <p className="text-2xl font-bold text-green-300">{formatPrice(totalBudget)}</p>
                <p className="text-xs text-slate-500">Combined budget</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-purple-300">{formatPrice(totalSpent)}</p>
                <p className="text-xs text-slate-500">Auction spending</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Players</p>
                <p className="text-2xl font-bold text-amber-300">{totalPlayers}</p>
                <p className="text-xs text-slate-500">Assigned players</p>
              </div>
              <Users className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          onClick={() => setIsCreateTeamOpen(true)}
          disabled={teams.length >= 15}
          className="cricket-button-primary disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team ({teams.length}/15)
        </Button>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="cricket-button-secondary"
          >
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="cricket-button-secondary"
          >
            Table
          </Button>
        </div>
      </div>

      {/* Teams Display */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const budgetStatus = getBudgetStatus(team.remainingBudget, team.budget);
            const budgetPercentage = ((team.budget - team.remainingBudget) / team.budget) * 100;
            
            return (
              <Card key={team.id} className="cricket-card cricket-card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        {team.logo || "🏏"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">{team.name}</h3>
                        <p className="text-sm text-slate-400">{team.players.length} players</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => {
                            setTeamToEdit(team);
                            form.reset({
                              name: team.name,
                              budget: team.budget,
                              logo: team.logo,
                            });
                            setIsEditTeamOpen(true);
                          }}
                          className="text-slate-200 hover:bg-slate-700"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleResetTeam(team.id)}
                          className="text-orange-300 hover:bg-orange-900/20"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Players
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTeam(team.id)}
                          className="text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Budget Tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Budget Status</span>
                      <Badge className={`${budgetStatus.color} bg-slate-700/50`}>
                        {budgetStatus.status}
                      </Badge>
                    </div>
                    <Progress 
                      value={budgetPercentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Spent: {formatPrice(team.budget - team.remainingBudget)}</span>
                      <span>Left: {formatPrice(team.remainingBudget)}</span>
                    </div>
                  </div>
                  
                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <Users className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-100">{team.players.length}</p>
                      <p className="text-xs text-slate-400">Players</p>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <Star className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-100">{team.totalPoints}</p>
                      <p className="text-xs text-slate-400">Points</p>
                    </div>
                  </div>
                  
                  {/* Recent Players */}
                  {team.players.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300">Recent Players:</p>
                      <div className="space-y-1">
                        {team.players.slice(0, 3).map((player) => (
                          <div key={player.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getRoleIcon(player.role)}</span>
                              <span className="text-slate-200">{player.name}</span>
                            </div>
                            <span className="text-slate-400">{formatPrice(player.soldPrice)}</span>
                          </div>
                        ))}
                        {team.players.length > 3 && (
                          <p className="text-xs text-slate-500">+{team.players.length - 3} more players</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="cricket-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left p-4 text-slate-300 font-medium">Team</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Budget</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Remaining</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Players</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Points</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-sm">
                            {team.logo || "🏏"}
                          </div>
                          <span className="text-slate-100 font-medium">{team.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-200">{formatPrice(team.budget)}</td>
                      <td className="p-4 text-slate-200">{formatPrice(team.remainingBudget)}</td>
                      <td className="p-4 text-slate-200">{team.players.length}</td>
                      <td className="p-4 text-slate-200">{team.totalPoints}</td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-600">
                            <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-300 hover:bg-red-900/20">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="cricket-card text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateTeam)} className="space-y-4">
            <div>
              <Label className="text-slate-200">Team Name</Label>
              <Input
                {...form.register("name")}
                placeholder="Enter team name"
                className="cricket-input mt-2"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-400 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label className="text-slate-200">Budget (₹)</Label>
              <Input
                {...form.register("budget", { valueAsNumber: true })}
                type="number"
                placeholder="250000000"
                className="cricket-input mt-2"
              />
              {form.formState.errors.budget && (
                <p className="text-sm text-red-400 mt-1">{form.formState.errors.budget.message}</p>
              )}
            </div>
            
            <div>
              <Label className="text-slate-200">Logo (Emoji)</Label>
              <Input
                {...form.register("logo")}
                placeholder="🏏"
                className="cricket-input mt-2"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTeamOpen(false)}
                className="cricket-button-secondary"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="cricket-button-primary"
              >
                Create Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent className="cricket-card text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditTeam)} className="space-y-4">
            <div>
              <Label className="text-slate-200">Team Name</Label>
              <Input
                {...form.register("name")}
                placeholder="Enter team name"
                className="cricket-input mt-2"
              />
            </div>
            
            <div>
              <Label className="text-slate-200">Budget (₹)</Label>
              <Input
                {...form.register("budget", { valueAsNumber: true })}
                type="number"
                placeholder="250000000"
                className="cricket-input mt-2"
              />
            </div>
            
            <div>
              <Label className="text-slate-200">Logo (Emoji)</Label>
              <Input
                {...form.register("logo")}
                placeholder="🏏"
                className="cricket-input mt-2"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditTeamOpen(false)}
                className="cricket-button-secondary"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="cricket-button-primary"
              >
                Update Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}