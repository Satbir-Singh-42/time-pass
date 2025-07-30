import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  Shield,
  Trophy,
  Star,
  Globe,
  DollarSign,
  Target,
  MoreHorizontal,
  Upload,
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
import cricketImage from "@assets/image_1753847253370.png";

// Team form schema
const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  budget: z.number().min(10000000, "Budget must be at least ₹1 Cr").max(500000000, "Budget cannot exceed ₹50 Cr"),
  logo: z.string().optional(),
  captain: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

// Team interface
interface Team {
  id: string;
  name: string;
  budget: number;
  remainingBudget: number;
  logo?: string;
  captain?: string;
  players: Player[];
  totalPoints: number;
  createdAt: Date;
  isLocked: boolean;
}

interface Player {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  country: string;
  evaluationPoints: number;
  soldPrice: number;
  teamId?: string;
}

export default function TeamManagementNew() {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Sample teams data - in real app this would come from Firebase
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "team-1",
      name: "Mumbai Warriors",
      budget: 250000000,
      remainingBudget: 180000000,
      players: [],
      totalPoints: 0,
      createdAt: new Date(),
      isLocked: false,
    },
    {
      id: "team-2",
      name: "Chennai Kings",
      budget: 250000000,
      remainingBudget: 200000000,
      players: [],
      totalPoints: 0,
      createdAt: new Date(),
      isLocked: false,
    }
  ]);

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
      return { color: "text-green-300", bg: "bg-green-500/20", border: "border-green-500/30", status: "Healthy" };
    } else if (percentage > 30) {
      return { color: "text-yellow-300", bg: "bg-yellow-500/20", border: "border-yellow-500/30", status: "Moderate" };
    } else {
      return { color: "text-red-300", bg: "bg-red-500/20", border: "border-red-500/30", status: "Low" };
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
      logo: data.logo,
      captain: data.captain,
      players: [],
      totalPoints: 0,
      createdAt: new Date(),
      isLocked: false,
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
        ? { ...team, name: data.name, budget: data.budget, logo: data.logo, captain: data.captain }
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

  const lockAllTeams = () => {
    setTeams(teams.map(team => ({ ...team, isLocked: true })));
    toast({
      title: "Teams Locked",
      description: "All teams have been finalized and locked",
    });
  };

  const exportTeamsData = () => {
    const csvHeaders = [
      'Team Name', 'Budget', 'Remaining Budget', 'Players Count', 
      'Total Points', 'Captain', 'Status'
    ];
    
    const csvData = teams.map(team => [
      team.name,
      team.budget,
      team.remainingBudget,
      team.players.length,
      team.totalPoints,
      team.captain || 'Not Set',
      team.isLocked ? 'Locked' : 'Active'
    ]);
    
    const csvContent = [csvHeaders.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredTeams = selectedTeam === "all" ? teams : teams.filter(t => t.id === selectedTeam);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cricket Background - Same as login page */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url(${cricketImage})`,
            filter: 'brightness(0.15)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-gray-900/85 to-neutral-900/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Team Management</h1>
            <p className="text-slate-300">Create and manage cricket teams, track budgets and assign players</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setIsCreateTeamOpen(true)}
              disabled={teams.length >= 15}
              className="bg-emerald-600/80 hover:bg-emerald-500/90 text-white backdrop-blur-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Team ({teams.length}/15)
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-slate-700/60 hover:bg-slate-600/70 text-slate-100 border-slate-600/40 backdrop-blur-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm">
                <DropdownMenuItem 
                  onClick={exportTeamsData}
                  className="text-slate-200 hover:bg-slate-700/50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Teams CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700/50">
                  <Trophy className="h-4 w-4 mr-2" />
                  Export Leaderboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {teams.some(t => !t.isLocked) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-amber-600/80 hover:bg-amber-500/90 text-white backdrop-blur-sm">
                    <Crown className="h-4 w-4 mr-2" />
                    Lock All Teams
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-600">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-100">Lock All Teams</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      This will finalize all teams and prevent further modifications. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-600 text-slate-200 border-slate-500">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={lockAllTeams}
                      className="bg-amber-600 hover:bg-amber-500"
                    >
                      Lock Teams
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Teams</p>
                  <p className="text-2xl font-bold text-slate-100">{teams.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Budget</p>
                  <p className="text-2xl font-bold text-green-300">
                    {formatPrice(teams.reduce((sum, team) => sum + team.budget, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Players</p>
                  <p className="text-2xl font-bold text-purple-300">
                    {teams.reduce((sum, team) => sum + team.players.length, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Locked Teams</p>
                  <p className="text-2xl font-bold text-amber-300">
                    {teams.filter(t => t.isLocked).length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Filter and View Mode */}
        <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-64 bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Teams ({teams.length})</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        {team.name} ({team.players.length} players)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="text-slate-200"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="text-slate-200"
                >
                  Table
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Display */}
        <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <span>Team Overview ({filteredTeams.length})</span>
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                {teams.filter(t => t.isLocked).length} / {teams.length} Locked
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">No teams found</p>
                <p className="text-slate-500">Create your first team to get started</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => {
                  const budgetStatus = getBudgetStatus(team.remainingBudget, team.budget);
                  return (
                    <Card key={team.id} className="bg-slate-700/40 border-slate-600/40 hover:bg-slate-700/60 transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-100">{team.name}</h3>
                              <p className="text-sm text-slate-400">{team.players.length} players</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {team.isLocked && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                <Crown className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            )}
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
                                      captain: team.captain,
                                    });
                                    setIsEditTeamOpen(true);
                                  }}
                                  className="text-slate-200 hover:bg-slate-700"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Team
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                                  <Users className="h-4 w-4 mr-2" />
                                  View Players
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
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Budget Status */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Budget Status</span>
                            <Badge className={`${budgetStatus.bg} ${budgetStatus.color} ${budgetStatus.border}`}>
                              {budgetStatus.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Remaining:</span>
                              <span className="text-slate-200 font-medium">{formatPrice(team.remainingBudget)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Total:</span>
                              <span className="text-slate-200">{formatPrice(team.budget)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Team Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xl font-bold text-slate-100">{team.players.length}</p>
                            <p className="text-xs text-slate-400">Players</p>
                          </div>
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <p className="text-xl font-bold text-slate-100">{team.totalPoints}</p>
                            <p className="text-xs text-slate-400">Points</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left p-3 text-slate-300 font-medium">Team</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Budget</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Remaining</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Players</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Points</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team) => (
                      <tr key={team.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-blue-400" />
                            <span className="text-slate-100 font-medium">{team.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-200">{formatPrice(team.budget)}</td>
                        <td className="p-3 text-slate-200">{formatPrice(team.remainingBudget)}</td>
                        <td className="p-3 text-slate-200">{team.players.length}</td>
                        <td className="p-3 text-slate-200">{team.totalPoints}</td>
                        <td className="p-3">
                          {team.isLocked ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Create New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateTeam)} className="space-y-4">
            <div>
              <Label className="text-slate-200">Team Name</Label>
              <Input
                {...form.register("name")}
                placeholder="Enter team name"
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
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
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
              {form.formState.errors.budget && (
                <p className="text-sm text-red-400 mt-1">{form.formState.errors.budget.message}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTeamOpen(false)}
                className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Create Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Edit Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditTeam)} className="space-y-4">
            <div>
              <Label className="text-slate-200">Team Name</Label>
              <Input
                {...form.register("name")}
                placeholder="Enter team name"
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <Label className="text-slate-200">Budget (₹)</Label>
              <Input
                {...form.register("budget", { valueAsNumber: true })}
                type="number"
                placeholder="250000000"
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditTeamOpen(false)}
                className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
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