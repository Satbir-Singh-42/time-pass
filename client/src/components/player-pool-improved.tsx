import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Trash,
  MoreHorizontal,
  ChevronRight,
  Settings,
  Waves
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFirestoreData } from "@/hooks/useFirestore";
import { PoolService } from "@/lib/poolService";

// Enhanced player form schema with individual stats fields
const playerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"], {
    required_error: "Role is required",
  }),
  country: z.string().min(1, "Country is required"),
  basePrice: z.number().min(1000000, "Base price must be at least ₹10L").max(200000000, "Base price cannot exceed ₹20Cr"),
  points: z.number().min(0, "Points cannot be negative").max(100, "Points cannot exceed 100"),
  age: z.number().min(16, "Age must be at least 16").max(45, "Age cannot exceed 45"),
  pool: z.string().optional(),
  runs: z.number().min(0, "Runs cannot be negative").max(50000, "Runs cannot exceed 50,000"),
  wickets: z.number().min(0, "Wickets cannot be negative").max(1000, "Wickets cannot exceed 1,000"),
  catches: z.number().min(0, "Catches cannot be negative").max(500, "Catches cannot exceed 500"),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;

// Player data structure matching your specifications
interface Player {
  player_id?: string;
  id?: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  country: string;
  base_price?: string;
  basePrice?: string;
  age: number;
  points: number;
  status: "Available" | "Sold" | "Pooled" | "Unsold";
  team?: string | null;
  assignedTeam?: string | null;
  pool: string | null;
  isDuplicate?: boolean;
  stats: string;
  createdAt?: string;
}



const ROLES = [
  { value: "Batsman", label: "Batsman" },
  { value: "Bowler", label: "Bowler" },
  { value: "All-rounder", label: "All-rounder" },
  { value: "Wicket-keeper", label: "Wicket-keeper" }
];

const COUNTRIES = [
  "India", "Australia", "England", "South Africa", "New Zealand", 
  "Pakistan", "Sri Lanka", "Bangladesh", "West Indies", "Afghanistan"
];

// Get available pools from actual player data only
const getAvailablePools = (players: Player[]): string[] => {
  const poolsFromPlayers = Array.from(new Set(players.map(p => p.pool).filter((pool): pool is string => Boolean(pool))));
  
  // Only return pools from real data
  return poolsFromPlayers.sort();
};

const STATUS_COLORS = {
  Available: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  Pooled: "bg-blue-500/10 text-blue-600 border-blue-200",
  Sold: "bg-green-500/10 text-green-600 border-green-200", 
  Unsold: "bg-red-500/10 text-red-600 border-red-200"
};

const POOL_STATUS_COLORS = {
  Active: "bg-green-500/10 text-green-600 border-green-200",
  Completed: "bg-gray-500/10 text-gray-600 border-gray-200",
  Pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200"
};

interface PlayerPoolProps {
  players: Player[];
  isLoading: boolean;
}

export default function PlayerPoolImproved({ players = [], isLoading }: PlayerPoolProps) {
  // Transform API data to UI format
  const displayPlayers = players.map(player => ({
    ...player,
    player_id: player.player_id || player.id || '',
    base_price: player.base_price || player.basePrice || '',
    team: player.team || player.assignedTeam || null
  }));
  
  // Get available pools with better logic for pool creation
  const [availablePools, setAvailablePools] = useState<string[]>([]);
  
  // Update available pools whenever player data changes
  useEffect(() => {
    const poolNames = PoolService.getAvailablePoolNames(displayPlayers);
    // Also get custom pools from localStorage
    const customPools = JSON.parse(localStorage.getItem('customPools') || '[]');
    const allPoolsSet = new Set([...poolNames, ...customPools]);
    const allPools = Array.from(allPoolsSet).sort();
    setAvailablePools(allPools);
  }, [displayPlayers]);
  
  // API hooks for CRUD operations
  const { useCreatePlayerMutation, useUpdatePlayerMutation, useDeletePlayerMutation, queryClient } = useFirestoreData();
  const createPlayerMutation = useCreatePlayerMutation();
  const updatePlayerMutation = useUpdatePlayerMutation();
  const deletePlayerMutation = useDeletePlayerMutation();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [poolFilter, setPoolFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(10);

  

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      role: "Batsman",
      country: "India",
      basePrice: 20000000,
      points: 75,
      age: 25,
      pool: "none",
      runs: 0,
      wickets: 0,
      catches: 0
    }
  });

  // Dynamic data extraction
  const availableCountries = Array.from(new Set(displayPlayers.map(p => p.country))).sort();
  const availableStatuses = Array.from(new Set(displayPlayers.map(p => p.status))).sort();



  // Enhanced filtering and sorting
  const filteredAndSortedPlayers = displayPlayers
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !categoryFilter || categoryFilter === "all" || player.role === categoryFilter;
      const matchesCountry = !countryFilter || countryFilter === "all" || player.country === countryFilter;
      const matchesStatus = !statusFilter || statusFilter === "all" || player.status === statusFilter;
      const matchesPool = !poolFilter || poolFilter === "all" || player.pool === poolFilter;
      
      let matchesPriceRange = true;
      if (priceRangeFilter && priceRangeFilter !== "all") {
        const priceValue = parsePriceString(player.base_price);
        switch (priceRangeFilter) {
          case "low": matchesPriceRange = priceValue < 5; break;
          case "medium": matchesPriceRange = priceValue >= 5 && priceValue < 15; break;
          case "high": matchesPriceRange = priceValue >= 15; break;
        }
      }

      let matchesAgeRange = true;
      if (ageRangeFilter && ageRangeFilter !== "all") {
        const age = player.age;
        switch (ageRangeFilter) {
          case "young": matchesAgeRange = age < 25; break;
          case "prime": matchesAgeRange = age >= 25 && age <= 35; break;
          case "veteran": matchesAgeRange = age > 35; break;
        }
      }
      
      return matchesSearch && matchesRole && matchesCountry && matchesStatus && matchesPool && matchesPriceRange && matchesAgeRange;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let aValue: any = a[sortField as keyof Player];
      let bValue: any = b[sortField as keyof Player];
      
      if (sortField === "base_price") {
        aValue = parsePriceString(a.base_price);
        bValue = parsePriceString(b.base_price);
      } else if (sortField === "age" || sortField === "points") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const paginatedPlayers = filteredAndSortedPlayers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, countryFilter, statusFilter, poolFilter, priceRangeFilter, ageRangeFilter]);

  // Utility functions
  const parsePriceString = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[₹,]/g, '');
    if (cleanStr.includes('Cr')) {
      return parseFloat(cleanStr.replace('Cr', ''));
    } else if (cleanStr.includes('L')) {
      return parseFloat(cleanStr.replace('L', '')) / 10;
    }
    return 0;
  };

  const formatPriceForInput = (crores: number): string => {
    if (crores >= 1) return `₹${crores.toFixed(1)}Cr`;
    const lakhs = crores * 10;
    return `₹${lakhs.toFixed(0)}L`;
  };



  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setCountryFilter("all");
    setStatusFilter("all");
    setPoolFilter("all");
    setPriceRangeFilter("all");
    setAgeRangeFilter("all");
    setSortField("");
    setSortDirection("asc");
    setSelectedPlayers(new Set());
    setShowFilters(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers);
    if (checked) {
      newSelected.add(playerId);
    } else {
      newSelected.delete(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(new Set(paginatedPlayers.map(p => p.player_id)));
    } else {
      setSelectedPlayers(new Set());
    }
  };

  // Enhanced event handlers with pool management
  const handleAddPlayer = async (data: PlayerFormData) => {
    // Prevent multiple submissions if already processing
    if (createPlayerMutation.isPending || updatePlayerMutation.isPending) {
      return;
    }

    
    // Enhanced duplicate check with better validation
    if (!data.name || !data.name.trim()) {
      toast({
        title: "Invalid Name",
        description: "Player name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (!data.country || !data.country.trim()) {
      toast({
        title: "Country Required",
        description: "Please select a country.",
        variant: "destructive",
      });
      return;
    }
    
    const isDuplicateCheck = PoolService.checkDuplicatePlayer(
      data.name.trim(), 
      displayPlayers, 
      editingPlayer?.player_id || editingPlayer?.id
    );
      
    if (isDuplicateCheck) {
      toast({
        title: "Duplicate Player",
        description: `Player with name "${data.name.trim()}" already exists. Please use a different name.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const playerData = {
        name: data.name.trim(),
        role: data.role,
        country: data.country,
        basePrice: data.basePrice,
        points: data.points,
        age: data.age,
        pool: data.pool === "none" ? undefined : data.pool || undefined,
        stats: JSON.stringify({ runs: data.runs, wickets: data.wickets, wicketkeeping: data.catches }),
        status: data.pool && data.pool !== "none" ? "Available" as const : "Available" as const
      };


      if (editingPlayer) {
        // Update existing player with proper ID handling
        const playerId = editingPlayer.player_id || editingPlayer.id;
        if (!playerId) {
          throw new Error("Player ID not found");
        }
        
        await updatePlayerMutation.mutateAsync({
          id: playerId,
          updates: playerData
        });
        toast({
          title: "Player Updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Create new player
        await createPlayerMutation.mutateAsync(playerData);
        toast({
          title: "Player Added",
          description: `${data.name} has been added${data.pool && data.pool !== "none" ? ` to ${data.pool}` : ' to the player pool'}.`,
        });
      }
      
      setIsAddPlayerOpen(false);
      setEditingPlayer(null);
      form.reset({
        name: "",
        role: "Batsman",
        country: "India",
        basePrice: 20000000,
        points: 75,
        age: 25,
        pool: "none",
        runs: 0,
        wickets: 0,
        catches: 0
      });
    } catch (error) {
      console.error("Error adding/updating player:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingPlayer ? "update" : "add"} player: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateNewPool = async () => {
    if (!newPoolName.trim()) {
      toast({
        title: "Pool Name Required",
        description: "Please enter a pool name.",
        variant: "destructive",
      });
      return;
    }

    const newPoolNameTrimmed = newPoolName.trim();
    
    if (availablePools.includes(newPoolNameTrimmed)) {
      toast({
        title: "Pool Already Exists",
        description: `Pool "${newPoolNameTrimmed}" already exists.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Immediately add to available pools for instant UI update
      setAvailablePools(prev => [...prev, newPoolNameTrimmed].sort());
      
      // Set the form field to the new pool
      form.setValue("pool", newPoolNameTrimmed);
      
      // Store the pool in localStorage for persistence across page reloads
      const existingPools = JSON.parse(localStorage.getItem('customPools') || '[]');
      if (!existingPools.includes(newPoolNameTrimmed)) {
        existingPools.push(newPoolNameTrimmed);
        localStorage.setItem('customPools', JSON.stringify(existingPools));
      }
      
      toast({
        title: "Pool Created",
        description: `Pool "${newPoolNameTrimmed}" created successfully and is ready to use.`,
      });
      
      setNewPoolName("");
      setIsCreatePoolOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pool.",
        variant: "destructive",
      });
    }
  };

  const handleAssignToPool = async (poolName: string) => {
    if (selectedPlayers.size === 0) {
      toast({
        title: "No Players Selected",
        description: "Select players to assign to pool.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = Array.from(selectedPlayers).map(playerId => {
        const player = displayPlayers.find(p => p.player_id === playerId);
        if (player && (player.status === 'Available' || player.status === 'Unsold')) {
          return updatePlayerMutation.mutateAsync({
            id: playerId,
            updates: { pool: poolName, status: 'Available' }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      toast({
        title: "Players Assigned",
        description: `${selectedPlayers.size} players assigned to ${poolName}.`,
      });
      
      setSelectedPlayers(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign players to pool.",
        variant: "destructive",
      });
    }
  };

  const handleEditPlayer = (player: Player) => {
    
    // Prevent edit during any pending operations
    if (createPlayerMutation.isPending || updatePlayerMutation.isPending || deletePlayerMutation.isPending) {
      toast({
        title: "Processing",
        description: "Please wait for current operation to complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditingPlayer(player);
      
      // Set form values safely with proper error handling
      form.setValue("name", player.name || "");
      form.setValue("role", player.role || "Batsman");
      form.setValue("country", player.country || "India");
      form.setValue("basePrice", parsePriceString(player.base_price || player.basePrice || '') * 10000000 || 20000000);
      form.setValue("points", player.points || 75);
      form.setValue("age", player.age || 25);
      form.setValue("pool", player.pool || "none");
      
      // Parse stats JSON to individual fields with better error handling
      try {
        const stats = JSON.parse(player.stats || '{}');
        form.setValue("runs", stats.runs || 0);
        form.setValue("wickets", stats.wickets || 0);
        form.setValue("catches", stats.wicketkeeping || stats.catches || 0);
      } catch (error) {
        console.warn("Failed to parse player stats:", error);
        form.setValue("runs", 0);
        form.setValue("wickets", 0);
        form.setValue("catches", 0);
      }
      
      setIsAddPlayerOpen(true);
    } catch (error) {
      console.error("Error setting up edit form:", error);
      toast({
        title: "Error",
        description: "Failed to open edit form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayerMutation.mutateAsync(playerId);
      toast({
        title: "Player Deleted",
        description: "Player has been removed from the pool.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedPlayers).map(playerId => 
        deletePlayerMutation.mutateAsync(playerId)
      );
      await Promise.all(deletePromises);
      
      toast({
        title: "Players Deleted",
        description: `${selectedPlayers.size} players have been removed.`,
      });
      setSelectedPlayers(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some players.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = PoolService.generateCSVTemplate();
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain header and data rows.",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      let uploaded = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const playerName = values[headers.indexOf('name')] || '';
        
        if (!playerName || PoolService.checkDuplicatePlayer(playerName, displayPlayers)) {
          skipped++;
          continue;
        }
        
        try {
          const roleValue = values[headers.indexOf('role')] || 'Batsman';
          const validRole = ROLES.find(r => r.value === roleValue)?.value || 'Batsman';
          
          // Parse base price as numeric value
          const basePriceValue = values[headers.indexOf('base price')] || '20000000';
          const numericBasePrice = parseInt(basePriceValue.replace(/[^0-9]/g, '')) || 20000000;
          
          // Parse individual stats columns
          const runs = parseInt(values[headers.indexOf('runs')]) || 0;
          const wickets = parseInt(values[headers.indexOf('wickets')]) || 0;
          const catches = parseInt(values[headers.indexOf('catches')]) || 0;
          
          // Format base price for display
          const formattedBasePrice = numericBasePrice >= 10000000 
            ? `₹${(numericBasePrice / 10000000).toFixed(0)}Cr`
            : `₹${(numericBasePrice / 100000).toFixed(0)}L`;
          
          const playerData = {
            name: playerName,
            role: validRole as "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper",
            country: values[headers.indexOf('country')] || 'India',
            basePrice: numericBasePrice,
            age: parseInt(values[headers.indexOf('age')]) || 25,
            points: parseInt(values[headers.indexOf('points')]) || 0,
            pool: values[headers.indexOf('pool')] || undefined,
            stats: JSON.stringify({ runs, wickets, wicketkeeping: catches }),
            status: 'Available' as const
          };
          
          await createPlayerMutation.mutateAsync(playerData);
          uploaded++;
        } catch (error) {
          console.error(`Failed to process player ${playerName}:`, error);
          skipped++;
        }
      }

      toast({
        title: "Upload Complete",
        description: `${uploaded} players uploaded. ${skipped} players skipped.`,
      });
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cricket-teal mx-auto mb-2"></div>
              <p className="text-white/70">Loading player pool...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Player Pool Card */}
      <Card className="bg-cricket-card border-cricket-teal/30 auction-card-hover">
        <CardHeader className="flex-shrink-0 pb-2 sm:pb-3 px-2 sm:px-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white font-poppins font-bold uppercase tracking-wide">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cricket-teal" />
            Player Pool Management
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-cricket-teal/70" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage players and assign them to auction pools</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
          {/* Search and Filter Section - Single Row */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-7 sm:h-8 text-sm"
                />
              </div>
              
              {/* Filter Icon Only Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 relative"
              >
                <Filter className="h-3 w-3" />
                {(categoryFilter !== "all" || countryFilter !== "all" || statusFilter !== "all" || poolFilter !== "all") && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 p-0 text-xs flex items-center justify-center">
                    {[categoryFilter, countryFilter, statusFilter, poolFilter].filter(f => f !== "all").length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Collapsible Filters */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-7 sm:h-8 text-sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-7 sm:h-8 text-sm">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {availableCountries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-7 sm:h-8 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {availableStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={poolFilter} onValueChange={setPoolFilter}>
                    <SelectTrigger className="h-7 sm:h-8 text-sm">
                      <SelectValue placeholder="Pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pools</SelectItem>
                      {availablePools.map(pool => (
                        <SelectItem key={pool} value={pool}>{pool}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm">
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Reset Filters</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
            <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm">
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Add Player</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddPlayer)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter player name" {...field} />
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
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ROLES.map(role => (
                                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Pool (Optional)
                              <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-primary"
                                  >
                                    + Create New
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Create New Pool</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Pool Name</label>
                                      <Input
                                        placeholder="Enter pool name (e.g., Star Players, International Bowlers)"
                                        value={newPoolName}
                                        onChange={(e) => setNewPoolName(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setIsCreatePoolOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleCreateNewPool}>
                                        Create Pool
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pool" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Pool</SelectItem>
                                {availablePools.filter(pool => pool && pool.trim()).map(pool => (
                                  <SelectItem key={pool} value={pool}>{pool}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="50000000" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              Display: ₹{((field.value || 0) / 10000000).toFixed(1)} Cr
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="25" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="points"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="75" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="runs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Runs</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1500" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="wickets"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wickets</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="25" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="catches"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catches (Wicket-keepers)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddPlayerOpen(false)}
                        disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}
                      >
                        {createPlayerMutation.isPending || updatePlayerMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            {editingPlayer ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          editingPlayer ? "Update Player" : "Add Player"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm">
                  <Upload className="h-3 w-3" />
                  <span className="hidden sm:inline">Import/Export</span>
                  <span className="sm:hidden">Import</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadTemplate}>
                  <FileText className="h-3 w-3 mr-2" />
                  Download Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-2" />
                  Upload CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedPlayers.size > 0 && (
              <>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm">
                      <Settings className="h-3 w-3" />
                      <span className="hidden sm:inline">Assign to Pool ({selectedPlayers.size})</span>
                      <span className="sm:hidden">Assign ({selectedPlayers.size})</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {availablePools.map((pool: string) => (
                      <DropdownMenuItem key={pool} onClick={() => handleAssignToPool(pool)}>
                        {pool}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm">
                      <Trash className="h-3 w-3" />
                      <span className="hidden sm:inline">Delete Selected ({selectedPlayers.size})</span>
                      <span className="sm:hidden">Delete ({selectedPlayers.size})</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Players</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedPlayers.size} selected players? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          {/* Players Table - Shows 10 players per page */}
          <div className="border rounded-md bg-background">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-background border-b">
                  <TableRow className="border-b">
                    <TableHead className="w-8 sm:w-12 h-10 sm:h-12 p-2 font-medium">
                      <Checkbox
                        checked={selectedPlayers.size === paginatedPlayers.length && paginatedPlayers.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer  h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      {sortField === "name" && (
                        <ArrowUpDown className={`inline ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer  h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden sm:table-cell"
                      onClick={() => handleSort("role")}
                    >
                      Role
                      {sortField === "role" && (
                        <ArrowUpDown className={`inline ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </TableHead>
                    <TableHead className="h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden md:table-cell">Country</TableHead>
                    <TableHead 
                      className="cursor-pointer  h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium"
                      onClick={() => handleSort("base_price")}
                    >
                      Price
                      {sortField === "base_price" && (
                        <ArrowUpDown className={`inline ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer  h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden sm:table-cell"
                      onClick={() => handleSort("age")}
                    >
                      Age
                      {sortField === "age" && (
                        <ArrowUpDown className={`inline ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer  h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden lg:table-cell"
                      onClick={() => handleSort("points")}
                    >
                      Points
                      {sortField === "points" && (
                        <ArrowUpDown className={`inline ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </TableHead>
                    <TableHead className="h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden lg:table-cell">Pool</TableHead>
                    <TableHead className="h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium">Status</TableHead>
                    <TableHead className="h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium hidden md:table-cell">Team</TableHead>
                    <TableHead className="h-10 sm:h-12 text-xs sm:text-sm p-2 font-medium w-8 sm:w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-full">
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                          <p className="text-base sm:text-xl font-medium mb-1 sm:mb-2">No players found</p>
                          <p className="text-sm sm:text-base">Add players or adjust your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPlayers.map((player) => (
                      <TableRow key={player.player_id} className=" h-10 sm:h-12">
                        <TableCell className="p-1 sm:p-2">
                          <Checkbox
                            checked={selectedPlayers.has(player.player_id || '')}
                            onCheckedChange={(checked) => handleSelectPlayer(player.player_id || '', checked as boolean)}
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm p-1 sm:p-2">{player.name}</TableCell>
                        <TableCell className="p-1 sm:p-2 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{player.role}</Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm p-1 sm:p-2 hidden md:table-cell">{player.country}</TableCell>
                        <TableCell className="text-xs sm:text-sm p-1 sm:p-2">
                          <span className="font-medium">{player.base_price}</span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm p-1 sm:p-2 hidden sm:table-cell">{player.age}</TableCell>
                        <TableCell className="text-xs sm:text-sm p-1 sm:p-2 hidden lg:table-cell">{player.points}</TableCell>
                        <TableCell className="p-1 sm:p-2 hidden lg:table-cell">
                          {player.pool ? (
                            <Badge variant="outline" className="text-xs">{player.pool}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="p-1 sm:p-2">
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[player.status]}`}>
                            {player.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-1 sm:p-2 hidden md:table-cell">
                          {player.team ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                              {player.team}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="p-1 sm:p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPlayer(player)}>
                                <Edit3 className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeletePlayer(player.player_id || '')}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-3 px-4 bg-background border rounded-md mt-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedPlayers.length)} of {filteredAndSortedPlayers.length} players
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleBulkUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Statistics Section - Separate card below main content */}
      <Card className="bg-cricket-card border-cricket-teal/30 auction-card-hover">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-cricket-teal">{displayPlayers.length}</div>
              <div className="text-sm text-white/70">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-400">{displayPlayers.filter(p => p.status === 'Pooled').length}</div>
              <div className="text-sm text-white/70">Pooled</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-green-400">{displayPlayers.filter(p => p.status === 'Sold').length}</div>
              <div className="text-sm text-white/70">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-400">{displayPlayers.filter(p => p.status === 'Available').length}</div>
              <div className="text-sm text-white/70">Available</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}