import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Waves, 
  Plus, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  ArrowUpDown,
  Users,
  Target,
  Crown,
  RefreshCw,
  Move,
  ChevronDown,
  GripVertical,
  Shuffle,
  Merge,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Globe,
  Star,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Info,
  ArrowLeft,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreData } from "@/hooks/useFirestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PoolService, type Pool } from "@/lib/poolService";
import { useEffect } from "react";

// Enhanced Pool data structure is now imported from shared service

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
  pool: string | null;
  stats: string;
}

interface PoolManagementProps {
  players: Player[];
  isLoading: boolean;
  onNavigateToPlayers?: () => void;
}

const STATUS_COLORS = {
  Available: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  Pooled: "bg-blue-500/10 text-blue-600 border-blue-200",
  Sold: "bg-green-500/10 text-green-600 border-green-200", 
  Unsold: "bg-red-500/10 text-red-600 border-red-200"
};

const POOL_STATUS_COLORS = {
  Ready: "bg-green-500/20 text-green-400 border-green-400",
  Hidden: "bg-gray-500/20 text-gray-400 border-gray-400",
  Active: "bg-blue-500/20 text-blue-400 border-blue-400",
  Locked: "bg-yellow-500/20 text-yellow-400 border-yellow-400",
  Completed: "bg-purple-500/20 text-purple-400 border-purple-400"
};

// Form schemas for pool management
const poolFormSchema = z.object({
  name: z.string().min(2, "Pool name must be at least 2 characters"),
  status: z.enum(["Ready", "Hidden", "Active", "Locked", "Completed"]),
  visibility: z.enum(["Public", "Private"]),
});

const movePlayerSchema = z.object({
  targetPool: z.string().min(1, "Please select a target pool"),
});

export default function EnhancedPoolManagement({ players = [], isLoading, onNavigateToPlayers }: PoolManagementProps) {
  const { useUpdatePlayerMutation } = useFirestoreData();
  const updatePlayerMutation = useUpdatePlayerMutation();
  const { toast } = useToast();

  // Use shared pool service for consistent data handling - sync with fresh player data
  const [pools, setPools] = useState<Pool[]>([]);
  
  const [activePool, setActivePool] = useState<string>('');
  
  // Sync pools whenever player data changes
  useEffect(() => {
    const freshPools = PoolService.getPoolsFromPlayers(players);
    setPools(freshPools);
    if (freshPools.length > 0 && !activePool) {
      setActivePool(freshPools[0].id);
    }
  }, [players]);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isEditPoolOpen, setIsEditPoolOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [movePlayerDialog, setMovePlayerDialog] = useState<{ player: Player; isOpen: boolean }>({ player: null as any, isOpen: false });
  const [mergePoolsDialog, setMergePoolsDialog] = useState<{ isOpen: boolean; fromPool: string; toPool: string }>({ isOpen: false, fromPool: '', toPool: '' });
  const [moveAllPlayersDialog, setMoveAllPlayersDialog] = useState<{ isOpen: boolean; fromPool: string; toPool: string }>({ isOpen: false, fromPool: '', toPool: '' });

  // Forms
  const poolForm = useForm({
    resolver: zodResolver(poolFormSchema),
    defaultValues: {
      name: "",
      status: "Ready" as const,
      visibility: "Public" as const,
    },
  });

  const movePlayerForm = useForm({
    resolver: zodResolver(movePlayerSchema),
    defaultValues: {
      targetPool: "",
    },
  });

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

  const getCurrentPool = () => {
    const found = pools.find(p => p.id === activePool);
    if (found) return found;
    
    // Return a default pool structure if none found
    return {
      id: activePool,
      name: activePool,
      players: [],
      status: 'Ready' as const,
      visibility: 'Public' as const,
      isLocked: false,
      order: 0,
      createdAt: new Date().toISOString()
    };
  };

  // Pool management handlers - Enhanced to support 8+ pools
  const handleCreatePool = async (data: z.infer<typeof poolFormSchema>) => {
    // Generate pool ID that can handle more than 26 pools (A-Z, then AA-AZ, etc.)
    const generatePoolId = (index: number): string => {
      if (index < 26) {
        return `Pool ${String.fromCharCode(65 + index)}`;
      } else {
        const firstChar = String.fromCharCode(65 + Math.floor((index - 26) / 26));
        const secondChar = String.fromCharCode(65 + ((index - 26) % 26));
        return `Pool ${firstChar}${secondChar}`;
      }
    };

    const newPool: Pool = {
      id: generatePoolId(pools.length),
      name: data.name,
      order: pools.length + 1,
      players: [],
      status: data.status,
      visibility: data.visibility,
      isLocked: false,
      createdAt: new Date().toISOString(),
      auctionStarted: false
    };

    setPools([...pools, newPool]);
    setIsCreatePoolOpen(false);
    poolForm.reset();
    toast({
      title: "Pool Created",
      description: `${newPool.name} has been created successfully.`,
    });
  };

  const handleUpdatePool = async (data: z.infer<typeof poolFormSchema>) => {
    if (!editingPool) return;

    const updatedPools = pools.map(pool => 
      pool.id === editingPool.id 
        ? { ...pool, name: data.name, status: data.status, visibility: data.visibility }
        : pool
    );

    setPools(updatedPools);
    setIsEditPoolOpen(false);
    setEditingPool(null);
    poolForm.reset();
    toast({
      title: "Pool Updated",
      description: `Pool has been updated successfully.`,
    });
  };

  const handleDeletePool = async (poolId: string) => {
    console.log("Attempting to delete pool:", poolId);
    
    const poolToDelete = pools.find(p => p.id === poolId);
    if (!poolToDelete) {
      console.log("Pool not found:", poolId);
      toast({
        title: "Error",
        description: "Pool not found.",
        variant: "destructive",
      });
      return;
    }

    console.log("Pool to delete:", poolToDelete, "Players count:", poolToDelete.players.length);

    if (poolToDelete.players.length > 0) {
      toast({
        title: "Cannot Delete Pool",
        description: "Pool contains players. Please move players to another pool first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const filteredPools = pools.filter(p => p.id !== poolId);
      setPools(filteredPools);
      
      // Update active pool if we deleted the currently active one
      if (activePool === poolId && filteredPools.length > 0) {
        setActivePool(filteredPools[0].id);
      } else if (filteredPools.length === 0) {
        setActivePool('');
      }
      
      console.log("Pool deleted successfully");
      toast({
        title: "Pool Deleted",
        description: `${poolToDelete.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting pool:", error);
      toast({
        title: "Error",
        description: "Failed to delete pool. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReorderPools = (fromIndex: number, toIndex: number) => {
    const reorderedPools = [...pools];
    const [removed] = reorderedPools.splice(fromIndex, 1);
    reorderedPools.splice(toIndex, 0, removed);
    
    // Update order numbers
    const updatedPools = reorderedPools.map((pool, index) => ({
      ...pool,
      order: index + 1
    }));

    setPools(updatedPools);
    toast({
      title: "Pools Reordered",
      description: "Pool order has been updated for auction sequence.",
    });
  };

  const handleShufflePool = (poolId: string) => {
    const updatedPools = pools.map(pool => {
      if (pool.id === poolId) {
        const shuffledPlayers = [...pool.players].sort(() => Math.random() - 0.5);
        return { ...pool, players: shuffledPlayers };
      }
      return pool;
    });

    setPools(updatedPools);
    toast({
      title: "Pool Shuffled",
      description: "Player order within pool has been randomized.",
    });
  };

  const handleMergePools = async () => {
    const { fromPool, toPool } = mergePoolsDialog;
    if (!fromPool || !toPool || fromPool === toPool) return;

    const sourcePool = pools.find(p => p.id === fromPool);
    const targetPool = pools.find(p => p.id === toPool);
    
    if (!sourcePool || !targetPool) return;

    // Move all players from source to target pool
    for (const player of sourcePool.players) {
      try {
        await updatePlayerMutation.mutateAsync({
          id: player.player_id || player.id || '',
          updates: { pool: toPool }
        });
      } catch (error) {
        console.error(`Failed to move player ${player.name}:`, error);
      }
    }

    // Remove the source pool
    const filteredPools = pools.filter(p => p.id !== fromPool);
    setPools(filteredPools);
    
    if (activePool === fromPool) {
      setActivePool(toPool);
    }

    setMergePoolsDialog({ isOpen: false, fromPool: '', toPool: '' });
    toast({
      title: "Pools Merged",
      description: `${sourcePool.name} has been merged into ${targetPool.name}.`,
    });
  };

  const handleMoveAllPlayers = async () => {
    const { fromPool, toPool } = moveAllPlayersDialog;
    if (!fromPool || !toPool || fromPool === toPool) return;

    const sourcePool = pools.find(p => p.id === fromPool);
    const targetPool = pools.find(p => p.id === toPool);
    
    if (!sourcePool || !targetPool) return;

    // Move all players from source to target pool
    for (const player of sourcePool.players) {
      try {
        await updatePlayerMutation.mutateAsync({
          id: player.player_id || player.id || '',
          updates: { pool: toPool }
        });
      } catch (error) {
        console.error(`Failed to move player ${player.name}:`, error);
      }
    }

    setMoveAllPlayersDialog({ isOpen: false, fromPool: '', toPool: '' });
    toast({
      title: "Players Moved",
      description: `${sourcePool.players.length} players moved from ${sourcePool.name} to ${targetPool.name}.`,
    });
  };

  const handleMovePlayer = async (data: z.infer<typeof movePlayerSchema>) => {
    const { player } = movePlayerDialog;
    const { targetPool } = data;

    try {
      await updatePlayerMutation.mutateAsync({
        id: player.player_id || player.id || '',
        updates: { pool: targetPool, status: 'Pooled' }
      });
      
      setMovePlayerDialog({ player: null as any, isOpen: false });
      movePlayerForm.reset();
      toast({
        title: "Player Moved",
        description: `${player.name} has been moved to ${targetPool}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move player.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePoolStatus = (poolId: string, newStatus: Pool['status']) => {
    const updatedPools = pools.map(pool => 
      pool.id === poolId 
        ? { ...pool, status: newStatus }
        : pool
    );

    setPools(updatedPools);
    toast({
      title: "Pool Status Updated",
      description: `Pool status changed to ${newStatus}.`,
    });
  };

  const handleToggleVisibility = (poolId: string) => {
    const updatedPools = pools.map(pool => 
      pool.id === poolId 
        ? { ...pool, visibility: pool.visibility === 'Public' ? 'Private' as const : 'Public' as const }
        : pool
    );

    setPools(updatedPools);
  };

  const handleLockPool = (poolId: string) => {
    const updatedPools = pools.map(pool => 
      pool.id === poolId 
        ? { ...pool, isLocked: !pool.isLocked, status: pool.isLocked ? 'Ready' as const : 'Locked' as const }
        : pool
    );

    setPools(updatedPools);
  };

  if (isLoading) {
    return (
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cricket-teal mx-auto mb-2"></div>
              <p className="text-white/70">Loading pools...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPool = getCurrentPool();

  return (
    <div className="space-y-6">
      {/* Pool Management Header */}
      <Card className="bg-cricket-card border-cricket-teal/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cricket-teal/20 rounded-lg">
                <Waves className="h-5 w-5 text-cricket-teal" />
              </div>
              <div>
                <CardTitle className="text-white font-poppins font-bold uppercase tracking-wide">Pool Management</CardTitle>
                <p className="text-sm text-white">Organize auction pools and manage player assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Pool
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-cricket-navy border-cricket-teal/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Pool</DialogTitle>
                  </DialogHeader>
                  <Form {...poolForm}>
                    <form onSubmit={poolForm.handleSubmit(handleCreatePool)} className="space-y-4">
                      <FormField
                        control={poolForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Pool Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Star Players Pool, International Bowlers" 
                                className="bg-cricket-navy-dark border-cricket-teal/30 text-white"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={poolForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Initial Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                                <SelectItem value="Ready">Ready</SelectItem>
                                <SelectItem value="Hidden">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={poolForm.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-cricket-teal">Visibility</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                                <SelectItem value="Public">Public</SelectItem>
                                <SelectItem value="Private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreatePoolOpen(false)}
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                        >
                          Create Pool
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Horizontal Pool Tabs */}
      {pools.length === 0 ? (
        <Card className="bg-cricket-card border-cricket-teal/30">
          <CardContent className="p-8">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-medium text-white mb-2">No Pools Created Yet</h3>
              <p className="text-white/70 mb-6">Create your first pool to start organizing players for the auction.</p>
              <Button 
                onClick={() => setIsCreatePoolOpen(true)}
                className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Pool
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activePool} onValueChange={setActivePool} className="w-full">
          {/* Responsive Pool Navigation */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            
            {/* Desktop: Horizontal Scrollable Tabs */}
            <div className="hidden lg:block w-full lg:w-auto overflow-x-auto">
              <TabsList className="bg-cricket-navy-dark border border-cricket-teal/30 w-max">
                {pools.slice(0, 6).map((pool) => (
                  <TabsTrigger
                    key={pool.id}
                    value={pool.id}
                    className="data-[state=active]:bg-cricket-teal data-[state=active]:text-white text-white/80 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{pool.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${POOL_STATUS_COLORS[pool.status]}`}
                        style={{ 
                          color: pool.status === 'Ready' ? '#4ade80' : undefined,
                          borderColor: pool.status === 'Ready' ? '#4ade80' : undefined,
                          backgroundColor: pool.status === 'Ready' ? 'rgba(74, 222, 128, 0.2)' : undefined 
                        }}
                      >
                        {pool.status}
                      </Badge>
                      {pool.visibility === 'Private' && <Lock className="h-3 w-3" />}
                      {pool.isLocked && <Lock className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </TabsTrigger>
                ))}
                {pools.length > 6 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/80"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="ml-1 text-xs">+{pools.length - 6} more</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-cricket-navy border-cricket-teal/30 max-h-64 overflow-y-auto">
                      {pools.slice(6).map((pool) => (
                        <DropdownMenuItem 
                          key={pool.id}
                          onClick={() => setActivePool(pool.id)}
                          className="text-white"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span>{pool.name}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${POOL_STATUS_COLORS[pool.status]} border-current ml-auto`}
                            >
                              {pool.status}
                            </Badge>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TabsList>
            </div>

            {/* Mobile: Dropdown Pool Selector */}
            <div className="lg:hidden w-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-cricket-teal" />
                <span className="text-sm font-medium text-white">Select Pool:</span>
              </div>
              <Select value={activePool} onValueChange={setActivePool}>
                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white w-full">
                  <SelectValue placeholder="Choose a pool" />
                </SelectTrigger>
                <SelectContent className="bg-cricket-navy border-cricket-teal/30 max-h-64">
                  {pools.map((pool) => (
                    <SelectItem 
                      key={pool.id} 
                      value={pool.id}
                      className={`data-[state=checked]:bg-white data-[state=checked]:text-black`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span>{pool.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${POOL_STATUS_COLORS[pool.status]} border-current ml-2`}
                        >
                          {pool.status}
                        </Badge>
                        {pool.visibility === 'Private' && <Lock className="h-3 w-3 ml-1" />}
                        {pool.isLocked && <Lock className="h-3 w-3 text-yellow-500 ml-1" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pool Controls - Responsive */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {/* Quick Stats on Mobile */}
              <div className="lg:hidden flex items-center gap-2 flex-1">
                <div className="bg-cricket-navy-dark border border-cricket-teal/30 rounded-lg px-3 py-1 flex items-center gap-2">
                  <Users className="h-3 w-3 text-cricket-teal" />
                  <span className="text-xs text-white">{getCurrentPool().players.length} players</span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-cricket-teal/30 text-cricket-teal bg-transparent hover:bg-transparent hover:text-cricket-teal whitespace-nowrap transition-none"
                  >
                    <Settings className="h-4 w-4 lg:mr-1" />
                    <span className="hidden lg:inline">Pool Actions</span>
                    <ChevronDown className="h-4 w-4 lg:ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-cricket-navy border-cricket-teal/30">
                <DropdownMenuItem 
                  onClick={() => {
                    setEditingPool(currentPool);
                    poolForm.setValue('name', currentPool.name);
                    poolForm.setValue('status', currentPool.status as any);
                    poolForm.setValue('visibility', currentPool.visibility as any);
                    setIsEditPoolOpen(true);
                  }}
                  className="text-cricket-teal"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Pool
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleShufflePool(activePool)}
                  className="text-cricket-teal"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Shuffle Players
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLockPool(activePool)}
                  className="text-cricket-teal"
                >
                  {currentPool.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  {currentPool.isLocked ? 'Unlock Pool' : 'Lock Pool'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleToggleVisibility(activePool)}
                  className="text-cricket-teal"
                >
                  {currentPool.visibility === 'Public' ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  Make {currentPool.visibility === 'Public' ? 'Private' : 'Public'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setMergePoolsDialog({ isOpen: true, fromPool: activePool, toPool: '' })}
                  className="text-cricket-teal"
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Pool
                </DropdownMenuItem>
                {currentPool.players.length > 0 ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setMoveAllPlayersDialog({ isOpen: true, fromPool: activePool, toPool: '' })}
                      className="text-cricket-teal"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Move All Players ({currentPool.players.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-400/50 cursor-not-allowed"
                      disabled={true}
                      title={`Cannot delete pool with ${currentPool.players.length} player(s). Move players first.`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Pool (has players)
                    </DropdownMenuItem>
                  </>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Pool
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  <AlertDialogContent className="bg-cricket-navy border-cricket-teal/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Pool</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/80">
                        Are you sure you want to delete "{currentPool.name}"? This action cannot be undone.
                        {currentPool.players.length > 0 && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                            ⚠️ This pool contains {currentPool.players.length} player(s). Move them to another pool first.
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeletePool(activePool)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={currentPool.players.length > 0}
                      >
                        {currentPool.players.length > 0 ? "Cannot Delete" : "Delete Pool"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
              </DropdownMenu>


            </div>
          </div>

          {/* Pool Content - Enhanced Layout */}
          {pools.map((pool) => (
            <TabsContent key={pool.id} value={pool.id} className="space-y-6">
              {/* Pool Stats Header - Mobile First Responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Card className="bg-cricket-card border-cricket-teal/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cricket-teal" />
                    <div>
                      <p className="text-xs text-white">Total Players</p>
                      <p className="text-lg font-bold text-white">{pool.players.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-cricket-card border-cricket-gold/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-cricket-gold" />
                    <div>
                      <p className="text-xs text-white">Pool Status</p>
                      <p className="text-lg font-bold text-white">{pool.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cricket-card border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-xs text-white">Total Value</p>
                      <p className="text-lg font-bold text-white">
                        ₹{PoolService.getPoolStats(pool).totalValue.toFixed(1)}Cr
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cricket-card border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-xs text-white">Visibility</p>
                      <p className="text-lg font-bold text-white">{pool.visibility}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Players Table/Cards */}
            <Card className="bg-cricket-card border-cricket-teal/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Players in {pool.name}
                  {pool.players.length === 0 && (
                    <Badge variant="outline" className="text-white/70 border-white/30">
                      Empty
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pool.players.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-white/40" />
                    <h3 className="text-lg font-medium text-white mb-2">No Players Assigned</h3>
                    <p className="text-white/70 mb-4">This pool is empty. Players will appear here when assigned.</p>
                    <Button 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => onNavigateToPlayers?.()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Players
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View - Enhanced for Large Pool Management */}
                    <div className="hidden lg:block">
                      <div className="overflow-x-auto bg-cricket-card border border-cricket-teal/30 rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-cricket-teal/30">
                              <TableHead className="text-white font-semibold">#</TableHead>
                              <TableHead className="text-white font-semibold">Player</TableHead>
                              <TableHead className="text-white font-semibold">Role</TableHead>
                              <TableHead className="text-white font-semibold">Country</TableHead>
                              <TableHead className="text-white font-semibold">Base Price</TableHead>
                              <TableHead className="text-white font-semibold">Status</TableHead>
                              <TableHead className="text-white font-semibold w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {pool.players.map((player, index) => (
                            <TableRow key={player.player_id || player.id} className="border-cricket-teal/20">
                              <TableCell className="text-white font-mono">
                                #{index + 1}
                              </TableCell>
                              <TableCell className="font-medium text-white">
                                {player.name}
                              </TableCell>
                              <TableCell className="text-white">
                                {player.role}
                              </TableCell>
                              <TableCell className="text-white">
                                {player.country}
                              </TableCell>
                              <TableCell className="text-white">
                                {player.base_price || player.basePrice || 'Not set'}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`${STATUS_COLORS[player.status]} border-current`}
                                >
                                  {player.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-cricket-teal">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-cricket-navy border-cricket-teal/30">
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setMovePlayerDialog({ player, isOpen: true });
                                        movePlayerForm.setValue('targetPool', '');
                                      }}
                                      className="text-white"
                                    >
                                      <Move className="h-4 w-4 mr-2" />
                                      Move to Another Pool
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Tablet View - Compact Table */}
                    <div className="hidden md:block lg:hidden">
                      <div className="overflow-x-auto bg-cricket-card border border-cricket-teal/30 rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-cricket-teal/30">
                              <TableHead className="text-white font-semibold text-sm">Player</TableHead>
                              <TableHead className="text-white font-semibold text-sm">Role</TableHead>
                              <TableHead className="text-white font-semibold text-sm">Price</TableHead>
                              <TableHead className="text-white font-semibold text-sm">Status</TableHead>
                              <TableHead className="text-white font-semibold text-sm w-16">Move</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pool.players.map((player, index) => (
                              <TableRow key={player.player_id || player.id} className="border-cricket-teal/20">
                                <TableCell className="font-medium text-white text-sm">
                                  <div>
                                    <div className="font-semibold">{player.name}</div>
                                    <div className="text-xs text-white/70">{player.country}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white text-sm">
                                  {player.role}
                                </TableCell>
                                <TableCell className="text-white text-sm">
                                  {player.base_price || player.basePrice || 'Not set'}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${STATUS_COLORS[player.status]} border-current`}
                                  >
                                    {player.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setMovePlayerDialog({ player, isOpen: true });
                                      movePlayerForm.setValue('targetPool', '');
                                    }}
                                    className="text-white hover:text-cricket-teal hover:bg-cricket-teal/10 p-1"
                                  >
                                    <Move className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Card View - Enhanced */}
                    <div className="md:hidden space-y-3">
                      {pool.players.map((player, index) => (
                        <div key={player.player_id || player.id} className="bg-cricket-navy/40 border border-cricket-teal/20 rounded-lg p-4 shadow-sm">
                          {/* Mobile Card Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-xs font-mono text-cricket-teal bg-cricket-teal/10 px-2 py-1 rounded-md min-w-[2.5rem] text-center">
                                #{index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white text-sm truncate">{player.name}</h4>
                                <p className="text-xs text-white/70">{player.country}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMovePlayerDialog({ player, isOpen: true });
                                movePlayerForm.setValue('targetPool', '');
                              }}
                              className="text-xs border-cricket-teal/30 text-white hover:bg-cricket-teal/10 flex-shrink-0"
                            >
                              <Move className="h-3 w-3 mr-1" />
                              Move
                            </Button>
                          </div>

                          {/* Mobile Card Details */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-white font-medium">Role:</span>
                                <span className="text-white font-medium">{player.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white font-medium">Price:</span>
                                <span className="text-white font-medium">{player.base_price || player.basePrice || 'Not set'}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${STATUS_COLORS[player.status]} border-current`}
                              >
                                {player.status}
                              </Badge>
                              {player.team && (
                                <div className="text-xs text-white/70 mt-1">
                                  Team: <span className="text-white">{player.team}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        </Tabs>
      )}

      {/* Edit Pool Dialog */}
      <Dialog open={isEditPoolOpen} onOpenChange={setIsEditPoolOpen}>
        <DialogContent className="bg-cricket-navy border-cricket-teal/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Pool</DialogTitle>
          </DialogHeader>
          <Form {...poolForm}>
            <form onSubmit={poolForm.handleSubmit(handleUpdatePool)} className="space-y-4">
              <FormField
                control={poolForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cricket-teal">Pool Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Star Players Pool, International Bowlers" 
                        className="bg-cricket-navy-dark border-cricket-teal/30 text-white"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={poolForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cricket-teal">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                        <SelectItem value="Ready">Ready</SelectItem>
                        <SelectItem value="Hidden">Hidden</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Locked">Locked</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={poolForm.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cricket-teal">Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditPoolOpen(false)}
                  className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                >
                  Update Pool
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Move Player Dialog */}
      <Dialog open={movePlayerDialog.isOpen} onOpenChange={(open) => setMovePlayerDialog({ ...movePlayerDialog, isOpen: open })}>
        <DialogContent className="bg-cricket-navy border-cricket-teal/30">
          <DialogHeader>
            <DialogTitle className="text-white">Move Player</DialogTitle>
            <p className="text-cricket-teal/80">
              Move {movePlayerDialog.player?.name} to another pool
            </p>
          </DialogHeader>
          <Form {...movePlayerForm}>
            <form onSubmit={movePlayerForm.handleSubmit(handleMovePlayer)} className="space-y-4">
              <FormField
                control={movePlayerForm.control}
                name="targetPool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cricket-teal">Target Pool</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                          <SelectValue placeholder="Select target pool" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                        {pools
                          .filter(p => p.id !== movePlayerDialog.player?.pool)
                          .map(pool => (
                            <SelectItem key={pool.id} value={pool.id}>
                              {pool.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMovePlayerDialog({ player: null as any, isOpen: false })}
                  className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                >
                  Move Player
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Merge Pools Dialog */}
      <Dialog open={mergePoolsDialog.isOpen} onOpenChange={(open) => setMergePoolsDialog({ ...mergePoolsDialog, isOpen: open })}>
        <DialogContent className="bg-cricket-navy border-cricket-teal/30">
          <DialogHeader>
            <DialogTitle className="text-white">Merge Pools</DialogTitle>
            <p className="text-cricket-teal/80">
              Merge all players from one pool into another
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-cricket-teal text-sm">From Pool</label>
              <Select 
                value={mergePoolsDialog.fromPool} 
                onValueChange={(value) => setMergePoolsDialog({ ...mergePoolsDialog, fromPool: value })}
              >
                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                  <SelectValue placeholder="Select source pool" />
                </SelectTrigger>
                <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                  {pools.map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name} ({pool.players.length} players)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-cricket-teal text-sm">To Pool</label>
              <Select 
                value={mergePoolsDialog.toPool} 
                onValueChange={(value) => setMergePoolsDialog({ ...mergePoolsDialog, toPool: value })}
              >
                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                  <SelectValue placeholder="Select target pool" />
                </SelectTrigger>
                <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                  {pools
                    .filter(p => p.id !== mergePoolsDialog.fromPool)
                    .map(pool => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name} ({pool.players.length} players)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setMergePoolsDialog({ isOpen: false, fromPool: '', toPool: '' })}
                className="border-cricket-teal/30 text-cricket-teal hover:bg-cricket-teal/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMergePools}
                className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                disabled={!mergePoolsDialog.fromPool || !mergePoolsDialog.toPool}
              >
                Merge Pools
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move All Players Dialog */}
      <Dialog open={moveAllPlayersDialog.isOpen} onOpenChange={(open) => setMoveAllPlayersDialog({ ...moveAllPlayersDialog, isOpen: open })}>
        <DialogContent className="bg-cricket-navy border-cricket-teal/30">
          <DialogHeader>
            <DialogTitle className="text-white">Move All Players</DialogTitle>
            <p className="text-white/80 text-sm">
              Move all players from one pool to another without merging the pools.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm">From Pool</label>
              <Select 
                value={moveAllPlayersDialog.fromPool} 
                onValueChange={(value) => setMoveAllPlayersDialog({ ...moveAllPlayersDialog, fromPool: value })}
              >
                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                  <SelectValue placeholder="Select source pool" />
                </SelectTrigger>
                <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                  {pools.filter(p => p.players.length > 0).map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name} ({pool.players.length} players)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white text-sm">To Pool</label>
              <Select 
                value={moveAllPlayersDialog.toPool} 
                onValueChange={(value) => setMoveAllPlayersDialog({ ...moveAllPlayersDialog, toPool: value })}
              >
                <SelectTrigger className="bg-cricket-navy-dark border-cricket-teal/30 text-white">
                  <SelectValue placeholder="Select target pool" />
                </SelectTrigger>
                <SelectContent className="bg-cricket-navy border-cricket-teal/30">
                  {pools
                    .filter(p => p.id !== moveAllPlayersDialog.fromPool)
                    .map(pool => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name} ({pool.players.length} players)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setMoveAllPlayersDialog({ isOpen: false, fromPool: '', toPool: '' })}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMoveAllPlayers}
                className="bg-cricket-teal hover:bg-cricket-teal/90 text-white"
                disabled={!moveAllPlayersDialog.fromPool || !moveAllPlayersDialog.toPool}
              >
                Move Players
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}