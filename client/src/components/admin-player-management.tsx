import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter, 
  Search,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  Trophy,
  Globe,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
  FileText,
  MoreHorizontal,
  Waves,
  Target,
  Calendar
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreData } from "@/hooks/useFirestore";
import cricketImage from "@assets/image_1753847253370.png";

// Enhanced player form schema matching CSV specifications
const playerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(16, "Age must be at least 16").max(45, "Age cannot exceed 45"),
  country: z.string().min(1, "Country is required"),
  t20Matches: z.number().min(0, "T20 matches cannot be negative"),
  runs: z.number().min(0, "Runs cannot be negative"),
  wickets: z.number().min(0, "Wickets cannot be negative"),
  catches: z.number().min(0, "Catches cannot be negative"),
  evaluationPoints: z.number().min(0, "Evaluation points cannot be negative").max(100, "Points cannot exceed 100"),
  basePrice: z.number().min(500000, "Base price must be at least ₹5L").max(200000000, "Base price cannot exceed ₹20Cr"),
  role: z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"], {
    required_error: "Role is required",
  }),
  pool: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;

// Enhanced Player interface matching specifications
interface Player {
  id: string;
  srNo?: number;
  name: string;
  age: number;
  country: string;
  t20Matches: number;
  runs: number;
  wickets: number;
  catches: number;
  evaluationPoints: number;
  basePrice: number;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  pool?: string;
  status: "Available" | "Sold" | "Unsold";
  assignedTeam?: string;
  soldPrice?: number;
  createdAt?: Date;
}

export default function AdminPlayerManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedPool, setSelectedPool] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Sample player data - in real app this would come from Firebase
  const [players] = useState<Player[]>([]);
  
  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      age: 25,
      country: "",
      t20Matches: 0,
      runs: 0,
      wickets: 0,
      catches: 0,
      evaluationPoints: 0,
      basePrice: 1000000,
      role: "Batsman",
      pool: "",
    },
  });

  // Filter players based on search and filters
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || player.role === selectedRole;
    const matchesCountry = selectedCountry === "all" || player.country === selectedCountry;
    const matchesPool = selectedPool === "all" || player.pool === selectedPool;
    const matchesStatus = selectedStatus === "all" || player.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesCountry && matchesPool && matchesStatus;
  });

  // Get unique values for filters
  const uniqueCountries = Array.from(new Set(players.map(p => p.country))).sort();
  const uniquePools = Array.from(new Set(players.map(p => p.pool).filter(Boolean))).sort();

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate CSV headers
      const expectedHeaders = [
        'Sr No', 'Player Name', 'Age', 'Country', 'T20 Matches', 
        'Runs', 'Wickets', 'Catches', 'Evaluation Points', 
        'Base Price', 'Role', 'Pool'
      ];
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing headers: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Parse CSV data
      const newPlayers: Player[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        try {
          const player: Player = {
            id: `player_${Date.now()}_${i}`,
            srNo: parseInt(values[0]) || i,
            name: values[1],
            age: parseInt(values[2]) || 25,
            country: values[3],
            t20Matches: parseInt(values[4]) || 0,
            runs: parseInt(values[5]) || 0,
            wickets: parseInt(values[6]) || 0,
            catches: parseInt(values[7]) || 0,
            evaluationPoints: parseInt(values[8]) || 0,
            basePrice: parseInt(values[9]) || 1000000,
            role: values[10] as any || "Batsman",
            pool: values[11] || undefined,
            status: "Available",
            createdAt: new Date(),
          };
          
          newPlayers.push(player);
        } catch (error) {
          console.error(`Error parsing line ${i}:`, error);
        }
      }
      
      toast({
        title: "CSV Upload Successful",
        description: `${newPlayers.length} players imported successfully`,
      });
      
      setIsCSVUploadOpen(false);
    };
    
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'Sr No', 'Player Name', 'Age', 'Country', 'T20 Matches', 
      'Runs', 'Wickets', 'Catches', 'Evaluation Points', 
      'Base Price', 'Role', 'Pool'
    ];
    
    const sampleData = [
      '1,Virat Kohli,35,India,115,4008,4,95,95,160000000,Batsman,Pool A',
      '2,Jasprit Bumrah,30,India,70,0,165,25,92,120000000,Bowler,Pool A',
      '3,Jos Buttler,34,England,103,2988,0,85,89,100000000,Wicket-keeper,Pool B'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Available</Badge>;
      case "Sold":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Sold</Badge>;
      case "Unsold":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Unsold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      "Batsman": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Bowler": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "All-rounder": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "Wicket-keeper": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    };
    return <Badge className={colors[role as keyof typeof colors] || "bg-gray-500/20 text-gray-300"}>{role}</Badge>;
  };

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
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Player Management</h1>
            <p className="text-slate-300">Manage cricket players, CSV uploads, and pool assignments</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-slate-700/60 hover:bg-slate-600/70 text-slate-100 border-slate-600/40 backdrop-blur-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import/Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm">
                <DropdownMenuItem 
                  onClick={downloadCSVTemplate}
                  className="text-slate-200 hover:bg-slate-700/50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsCSVUploadOpen(true)}
                  className="text-slate-200 hover:bg-slate-700/50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Player CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={() => setIsAddPlayerOpen(true)}
              className="bg-emerald-600/80 hover:bg-emerald-500/90 text-white backdrop-blur-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Players</p>
                  <p className="text-2xl font-bold text-slate-100">{players.length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Available</p>
                  <p className="text-2xl font-bold text-yellow-300">
                    {players.filter(p => p.status === "Available").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Sold Players</p>
                  <p className="text-2xl font-bold text-green-300">
                    {players.filter(p => p.status === "Sold").length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Pools</p>
                  <p className="text-2xl font-bold text-blue-300">{uniquePools.length}</p>
                </div>
                <Waves className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search players by name or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                    <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Unsold">Unsold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Table */}
        <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <span>Player Database ({filteredPlayers.length})</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="text-slate-200"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="text-slate-200"
                >
                  Cards
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">No players found</p>
                <p className="text-slate-500">Upload a CSV file or add players manually to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Sr No</TableHead>
                      <TableHead className="text-slate-300">Player Name</TableHead>
                      <TableHead className="text-slate-300">Age</TableHead>
                      <TableHead className="text-slate-300">Country</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">T20 Matches</TableHead>
                      <TableHead className="text-slate-300">Runs/Wickets</TableHead>
                      <TableHead className="text-slate-300">Evaluation Points</TableHead>
                      <TableHead className="text-slate-300">Base Price</TableHead>
                      <TableHead className="text-slate-300">Pool</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="border-slate-600 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300">{player.srNo}</TableCell>
                        <TableCell className="text-slate-100 font-medium">{player.name}</TableCell>
                        <TableCell className="text-slate-300">{player.age}</TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {player.country}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(player.role)}</TableCell>
                        <TableCell className="text-slate-300">{player.t20Matches}</TableCell>
                        <TableCell className="text-slate-300">
                          {player.role === "Bowler" ? `${player.wickets} wickets` : `${player.runs} runs`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-slate-100">{player.evaluationPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-100 font-medium">
                          {formatPrice(player.basePrice)}
                        </TableCell>
                        <TableCell>
                          {player.pool ? (
                            <Badge variant="outline" className="text-slate-300 border-slate-500">
                              {player.pool}
                            </Badge>
                          ) : (
                            <span className="text-slate-500">Unpooled</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(player.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-slate-600">
                              <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Player
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                                <Waves className="h-4 w-4 mr-2" />
                                Move to Pool
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-300 hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Player
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CSV Upload Dialog */}
      <Dialog open={isCSVUploadOpen} onOpenChange={setIsCSVUploadOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Upload Player CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/40">
              <h4 className="font-medium text-slate-200 mb-2">CSV Format Required:</h4>
              <p className="text-sm text-slate-400 mb-2">
                Sr No, Player Name, Age, Country, T20 Matches, Runs, Wickets, Catches, 
                Evaluation Points, Base Price, Role, Pool
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSVTemplate}
                className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <div>
              <Label className="text-slate-200">Select CSV File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add New Player</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Player Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-700/50 border-slate-600 text-slate-100" 
                          placeholder="Enter player name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Age</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          className="bg-slate-700/50 border-slate-600 text-slate-100" 
                          placeholder="25"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Country</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-700/50 border-slate-600 text-slate-100" 
                          placeholder="India"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="Batsman">Batsman</SelectItem>
                          <SelectItem value="Bowler">Bowler</SelectItem>
                          <SelectItem value="All-rounder">All-rounder</SelectItem>
                          <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPlayerOpen(false)}
                  className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Add Player
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}