import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Plus, Search, Filter, Download, FileDown, AlertTriangle, Lock } from "lucide-react";
import type { Player, InsertPlayer } from "@shared/schema";

export default function PlayerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Fetch all players
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Add new player mutation
  const addPlayerMutation = useMutation({
    mutationFn: (player: InsertPlayer) => apiRequest("POST", "/api/players", player),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowAddForm(false);
      toast({ title: "Player added successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error adding player", description: error.message, variant: "destructive" });
    },
  });

  // CSV upload handler
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      // Parse CSV data (skipping header)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 4) {
          const player: InsertPlayer = {
            name: values[0]?.trim() || '',
            role: values[1]?.trim() as "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper",
            country: values[2]?.trim() || '',
            basePrice: parseInt(values[3]?.trim()) || 50,
            bio: values[4]?.trim(),
            performanceStats: values[5]?.trim(),
          };
          
          if (player.name && player.role) {
            addPlayerMutation.mutate(player);
          }
        }
      }
    };
    reader.readAsText(file);
  };

  // Filter players
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesStatus = statusFilter === "all" || player.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const player: InsertPlayer = {
      name: formData.get("name") as string,
      role: formData.get("role") as "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper",
      country: formData.get("country") as string,
      basePrice: parseInt(formData.get("basePrice") as string),
      bio: formData.get("bio") as string,
      performanceStats: formData.get("performanceStats") as string,
    };

    addPlayerMutation.mutate(player);
  };

  // Download CSV template function
  const handleDownloadTemplate = () => {
    const csvContent = `name,role,country,basePrice,bio,performanceStats
Virat Kohli,Batsman,India,150,"Star Indian batsman and former captain","{""runs"": 12000, ""average"": 59.07, ""centuries"": 43}"
Jasprit Bumrah,Bowler,India,120,"India's premier fast bowler","{""wickets"": 121, ""economy"": 4.17, ""bestFigures"": ""6/27""}"
Ben Stokes,All-rounder,England,140,"England's star all-rounder","{""runs"": 4956, ""wickets"": 174, ""average"": 35.89}"
MS Dhoni,Wicket-keeper,India,125,"Former Indian captain and wicket-keeper","{""runs"": 10773, ""dismissals"": 444, ""strikeRate"": 87.56}"
Kagiso Rabada,Bowler,South Africa,110,"South African fast bowler","{""wickets"": 243, ""economy"": 4.73, ""bestFigures"": ""7/112""}"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipl-auction-player-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "CSV template downloaded successfully!" });
  };

  // Check admin access
  if (!isAdmin) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Player management is restricted to administrators only. Contact your admin for access.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading players...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
          
          <div className="relative">
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </span>
              </Button>
            </Label>
          </div>
          
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Batsman">Batsman</SelectItem>
              <SelectItem value="Bowler">Bowler</SelectItem>
              <SelectItem value="All-rounder">All-rounder</SelectItem>
              <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Unsold">Unsold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardHeader>
            <CardTitle className="text-white">Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-cricket-teal">Player Name</Label>
                <Input id="name" name="name" required className="bg-cricket-navy-dark border-cricket-teal/50 text-white" />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-cricket-teal">Role</Label>
                <Select name="role" required>
                  <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/50 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                    <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="country" className="text-cricket-teal">Country</Label>
                <Input id="country" name="country" required className="bg-cricket-navy-dark border-cricket-teal/50 text-white" />
              </div>

              <div>
                <Label htmlFor="basePrice" className="text-cricket-teal">Base Price (₹ Lakhs)</Label>
                <Input id="basePrice" name="basePrice" type="number" min="5" max="2000" required className="bg-cricket-navy-dark border-cricket-teal/50 text-white" />
              </div>

              <div className="col-span-2">
                <Label htmlFor="bio" className="text-cricket-teal">Biography</Label>
                <Textarea id="bio" name="bio" rows={3} className="bg-cricket-navy-dark border-cricket-teal/50 text-white" />
              </div>

              <div className="col-span-2">
                <Label htmlFor="performanceStats" className="text-cricket-teal">Performance Stats (JSON)</Label>
                <Textarea id="performanceStats" name="performanceStats" rows={2} placeholder='{"runs": 5000, "wickets": 200, "average": 45.5}' className="bg-cricket-navy-dark border-cricket-teal/50 text-white" />
              </div>

              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={addPlayerMutation.isPending} className="bg-cricket-teal hover:bg-cricket-teal/80">
                  {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-cricket-teal/50 text-cricket-teal">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Players Table */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader>
          <CardTitle className="text-white">Players ({filteredPlayers.length})</CardTitle>
          <CardDescription className="text-cricket-teal/70">
            Manage your player database and organize them into pools for auction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-cricket-teal/70">No players found.</p>
              <p className="text-sm text-cricket-teal/50 mt-2">
                {players.length === 0 
                  ? "Add your first player to get started."
                  : "Try adjusting your search filters."
                }
              </p>
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
                    <th className="text-left p-2 text-cricket-teal">Pool</th>
                    <th className="text-left p-2 text-cricket-teal">Status</th>
                    <th className="text-left p-2 text-cricket-teal">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-cricket-teal/20">
                      <td className="p-2 font-medium text-white">{player.name}</td>
                      <td className="p-2 text-cricket-teal/70">{player.role}</td>
                      <td className="p-2 text-cricket-teal/70">{player.country}</td>
                      <td className="p-2 text-cricket-gold">₹{player.basePrice}L</td>
                      <td className="p-2 text-cricket-teal/70">{player.pool || "Unassigned"}</td>
                      <td className="p-2">
                        <Badge className={
                          player.status === "Available" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                          player.status === "Sold" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                          "bg-red-500/20 text-red-400 border-red-500/50"
                        }>
                          {player.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-cricket-gold">{player.assignedTeam || "-"}</td>
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