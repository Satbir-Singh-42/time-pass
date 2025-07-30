import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  Crown, 
  Eye,
  Upload,
  Palette,
  Info,
  Target,
  Download
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema, type InsertTeam, type Team, type Player } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreData } from "@/hooks/useFirestore";

interface TeamManagementProps {
  teams?: Team[];
  players?: Player[];
  isLoading?: boolean;
}

export default function TeamManagement({ teams = [], players = [], isLoading = false }: TeamManagementProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewSquadDialogOpen, setIsViewSquadDialogOpen] = useState(false);
  const { toast } = useToast();

  const { useCreateTeamMutation, useUpdateTeamMutation, useDeleteTeamMutation } = useFirestoreData();
  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();
  const deleteTeamMutation = useDeleteTeamMutation();

  // Create team form
  const createForm = useForm<InsertTeam>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      colorTheme: "#10B981", // Default cricket teal
      budget: 1500000, // 15 lakhs
      logoUrl: "",
    },
  });

  // Edit team form
  const editForm = useForm<Partial<InsertTeam>>({
    resolver: zodResolver(insertTeamSchema.partial()),
  });

  const handleCreateTeam = async (data: InsertTeam) => {
    try {
      await createTeamMutation.mutateAsync(data);
      toast({
        title: "Team Created",
        description: `${data.name} has been successfully created with budget ₹${(data.budget / 100000).toFixed(1)}L`,
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTeam = async (data: Partial<InsertTeam>) => {
    if (!selectedTeam) return;
    
    try {
      await updateTeamMutation.mutateAsync({ 
        id: selectedTeam.id, 
        updates: data 
      });
      toast({
        title: "Team Updated",
        description: `${selectedTeam.name} has been successfully updated`,
      });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      editForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    try {
      await deleteTeamMutation.mutateAsync(team.id);
      toast({
        title: "Team Deleted",
        description: `${team.name} has been successfully deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    editForm.reset({
      name: team.name,
      colorTheme: team.colorTheme,
      budget: team.budget,
      logoUrl: team.logoUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewSquadDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsViewSquadDialogOpen(true);
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter(player => player.assignedTeam === teamId);
  };

  const formatBudget = (budget: number) => {
    if (budget >= 10000000) {
      return `₹${(budget / 10000000).toFixed(1)}Cr`;
    }
    return `₹${(budget / 100000).toFixed(1)}L`;
  };

  const getTeamStats = (team: Team) => {
    const teamPlayers = getTeamPlayers(team.id);
    const totalSpent = team.budget - team.remainingBudget;
    const averageAge = teamPlayers.length > 0 
      ? Math.round(teamPlayers.reduce((sum, p) => sum + p.age, 0) / teamPlayers.length)
      : 0;
    
    const averagePrice = teamPlayers.length > 0 
      ? Math.round(totalSpent / teamPlayers.length)
      : 0;
    
    return {
      playerCount: teamPlayers.length,
      totalSpent,
      remainingBudget: team.remainingBudget,
      averageAge,
      averagePrice,
      totalPoints: teamPlayers.reduce((sum, p) => sum + p.points, 0)
    };
  };

  const exportTeamsData = () => {
    const exportData = teams.map(team => {
      const stats = getTeamStats(team);
      const teamPlayers = getTeamPlayers(team.id);
      
      return {
        teamName: team.name,
        colorTheme: team.colorTheme,
        budget: team.budget,
        remainingBudget: stats.remainingBudget,
        totalSpent: stats.totalSpent,
        playerCount: stats.playerCount,
        totalPoints: stats.totalPoints,
        averageAge: stats.averageAge,
        averagePrice: stats.averagePrice,
        players: teamPlayers.map(player => ({
          name: player.name,
          role: player.role,
          country: player.country,
          basePrice: player.basePrice,
          points: player.points,
          age: player.age
        }))
      };
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cricket_teams_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export Successful",
      description: `Teams data exported as ${exportFileDefaultName}`,
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-cricket-card border-cricket-gold/30">
        <CardHeader>
          <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide text-xl">
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-cricket-teal/10 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-cricket-card border-cricket-gold/30 auction-card-hover">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cricket-gold/20 rounded-lg">
                <Trophy className="h-5 w-5 text-cricket-gold" />
              </div>
              <div>
                <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide text-xl">
                  Team Management
                </CardTitle>
                <p className="text-cricket-gold/80 font-inter text-sm mt-1">
                  Create and manage teams with budgets, logos, and player rosters
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Info className="w-4 h-4" />
                      <span>{teams.length} Teams</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total teams in the auction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                onClick={exportTeamsData}
                variant="outline"
                className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-cricket-gold text-cricket-navy hover:bg-cricket-gold/80"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-cricket-card border-cricket-gold/20 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white font-poppins">Create New Team</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Team Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Mumbai Warriors"
                                className="bg-cricket-navy/50 border-cricket-teal/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="colorTheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Color Theme</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <Input 
                                  {...field} 
                                  type="color"
                                  className="w-16 h-10 bg-cricket-navy/50 border-cricket-teal/30 cursor-pointer"
                                />
                                <Input 
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="#10B981"
                                  className="flex-1 bg-cricket-navy/50 border-cricket-teal/30 text-white"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Budget (₹)</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input 
                                  type="number"
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  placeholder="1500000"
                                  className="bg-cricket-navy/50 border-cricket-teal/30 text-white"
                                />
                                <p className="text-xs text-cricket-teal/70">
                                  {field.value ? formatBudget(field.value) : "Enter amount in rupees"}
                                </p>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Logo URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="url"
                                placeholder="https://example.com/logo.png"
                                className="bg-cricket-navy/50 border-cricket-teal/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="flex-1 border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTeamMutation.isPending}
                          className="flex-1 bg-cricket-gold text-cricket-navy hover:bg-cricket-gold/80"
                        >
                          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-cricket-gold/50 mx-auto mb-4" />
              <h3 className="text-xl font-poppins font-bold text-white mb-2">No Teams Created</h3>
              <p className="text-white font-inter mb-6">
                Create your first team to start building your auction roster
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-cricket-gold text-cricket-navy hover:bg-cricket-gold/80">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Team
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-none">
              {teams.map((team) => {
                const stats = getTeamStats(team);
                return (
                  <Card key={team.id} className="bg-cricket-card border-cricket-gold/30 hover:border-cricket-gold/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 auction-card-hover">
                    <CardContent className="p-6">
                      {/* Team Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: team.colorTheme }}
                        >
                          {team.logoUrl ? (
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={team.logoUrl} alt={team.name} />
                              <AvatarFallback style={{ backgroundColor: team.colorTheme }}>
                                {team.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            team.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-poppins font-bold text-white truncate">{team.name}</h3>
                          <div className="flex items-center gap-2 text-xs">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.colorTheme }}
                            />
                            <span className="text-white">Theme: {team.colorTheme}</span>
                          </div>
                        </div>
                      </div>

                      {/* Team Stats */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-cricket-gold text-sm">Budget:</span>
                          <span className="text-white font-medium">{formatBudget(team.budget)} / {formatBudget(stats.remainingBudget)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-cricket-gold text-sm">Squad Size:</span>
                          <span className="text-white font-medium">{stats.playerCount} / 11</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-cricket-gold text-sm">Total Points:</span>
                          <span className="text-white font-medium">{stats.totalPoints}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openViewSquadDialog(team)}
                                className="flex-1 border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Squad
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View team roster and details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditDialog(team)}
                                className="h-9 w-9 p-0 text-cricket-gold hover:bg-cricket-gold/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Team</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-9 w-9 p-0 text-red-400 hover:bg-red-400/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>Delete Team</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent className="bg-cricket-card border-cricket-gold/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
                              <AlertDialogDescription className="text-white">
                                Are you sure you want to delete "{team.name}"? This action cannot be undone and will remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTeam(team)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete Team
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-cricket-card border-cricket-gold/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins">Edit Team</DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditTeam)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-cricket-teal">Team Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-cricket-navy/50 border-cricket-teal/30 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="colorTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-cricket-teal">Color Theme</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input 
                            {...field} 
                            type="color"
                            className="w-16 h-10 bg-cricket-navy/50 border-cricket-teal/30 cursor-pointer"
                          />
                          <Input 
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1 bg-cricket-navy/50 border-cricket-teal/30 text-white"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-cricket-teal">Logo URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="url"
                          className="bg-cricket-navy/50 border-cricket-teal/30 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-cricket-teal/10 p-3 rounded border border-cricket-teal/30">
                  <p className="text-cricket-teal text-sm font-medium">Note:</p>
                  <p className="text-white text-xs">
                    Budget and captain cannot be edited to maintain auction integrity.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1 border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateTeamMutation.isPending}
                    className="flex-1 bg-cricket-gold text-cricket-navy hover:bg-cricket-gold/80"
                  >
                    {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Squad Dialog */}
      <Dialog open={isViewSquadDialogOpen} onOpenChange={setIsViewSquadDialogOpen}>
        <DialogContent className="bg-cricket-card border-cricket-gold/20 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins flex items-center gap-3">
              {selectedTeam && (
                <>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: selectedTeam.colorTheme }}
                  >
                    {selectedTeam.name.charAt(0)}
                  </div>
                  {selectedTeam.name} Squad
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-cricket-teal/10 p-3 rounded border border-cricket-teal/30">
                  <p className="text-cricket-teal text-xs">Budget Remaining</p>
                  <p className="text-white font-bold text-lg">{formatBudget(selectedTeam.remainingBudget)}</p>
                </div>
                <div className="bg-cricket-gold/10 p-3 rounded border border-cricket-gold/30">
                  <p className="text-cricket-gold text-xs">Total Points</p>
                  <p className="text-white font-bold text-lg">{getTeamStats(selectedTeam).totalPoints}</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded border border-purple-500/30">
                  <p className="text-purple-400 text-xs">Total Spent</p>
                  <p className="text-white font-bold text-lg">{formatBudget(getTeamStats(selectedTeam).totalSpent)}</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/30">
                  <p className="text-orange-400 text-xs">Avg Price/Player</p>
                  <p className="text-white font-bold text-lg">{getTeamStats(selectedTeam).averagePrice > 0 ? formatBudget(getTeamStats(selectedTeam).averagePrice) : "N/A"}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-cricket-teal font-poppins font-medium mb-3">Team Roster</h4>
                {getTeamPlayers(selectedTeam.id).length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-cricket-gold/50 mx-auto mb-3" />
                    <p className="text-white">No players assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getTeamPlayers(selectedTeam.id).map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-cricket-navy/30 rounded border border-cricket-teal/20">
                        <div className="flex items-center gap-3">
                          <div className="text-white">
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-white">{player.role} • {player.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">{player.basePrice}</p>
                          <p className="text-white text-xs">{player.points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}