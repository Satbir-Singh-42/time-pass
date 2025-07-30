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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  Waves,
  Star,
  Globe,
  Trophy,
  MoreHorizontal,
  ArrowRight,
  Shuffle,
  Target,
  Calendar,
  ChevronDown,
  GripVertical,
  Move3D
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import cricketImage from "@assets/image_1753847253370.png";

// Player interface
interface Player {
  id: string;
  name: string;
  age: number;
  country: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  evaluationPoints: number;
  basePrice: number;
  pool?: string;
  status: "Available" | "Sold" | "Unsold";
}

// Pool interface
interface Pool {
  id: string;
  name: string;
  description?: string;
  players: Player[];
  maxPlayers?: number;
  createdAt: Date;
}

export default function AdminPoolManagement() {
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<string>("unpooled");
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isRenamePoolOpen, setIsRenamePoolOpen] = useState(false);
  const [poolToRename, setPoolToRename] = useState<string>("");
  const [newPoolName, setNewPoolName] = useState("");

  // Sample pools data - in real app this would come from Firebase
  const [pools, setPools] = useState<Pool[]>([
    {
      id: "pool-a",
      name: "Pool A - Premium",
      description: "Top tier players",
      players: [],
      maxPlayers: 50,
      createdAt: new Date(),
    },
    {
      id: "pool-b", 
      name: "Pool B - Standard",
      description: "Mid tier players",
      players: [],
      maxPlayers: 50,
      createdAt: new Date(),
    },
    {
      id: "pool-c",
      name: "Pool C - Emerging",
      description: "Young talent",
      players: [],
      maxPlayers: 50,
      createdAt: new Date(),
    }
  ]);

  // Sample unpooled players
  const [unpooledPlayers, setUnpooledPlayers] = useState<Player[]>([]);

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
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

  const handleCreatePool = () => {
    if (!newPoolName.trim()) return;
    
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name: newPoolName,
      players: [],
      createdAt: new Date(),
    };
    
    setPools([...pools, newPool]);
    setNewPoolName("");
    setIsCreatePoolOpen(false);
    
    toast({
      title: "Pool Created",
      description: `${newPoolName} has been created successfully`,
    });
  };

  const handleRenamePool = () => {
    if (!newPoolName.trim() || !poolToRename) return;
    
    setPools(pools.map(pool => 
      pool.id === poolToRename 
        ? { ...pool, name: newPoolName }
        : pool
    ));
    
    setNewPoolName("");
    setPoolToRename("");
    setIsRenamePoolOpen(false);
    
    toast({
      title: "Pool Renamed",
      description: "Pool has been renamed successfully",
    });
  };

  const handleDeletePool = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;
    
    // Move players back to unpooled
    setUnpooledPlayers([...unpooledPlayers, ...pool.players]);
    
    // Remove pool
    setPools(pools.filter(p => p.id !== poolId));
    
    toast({
      title: "Pool Deleted",
      description: `${pool.players.length} players moved back to unpooled`,
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle drag between pools
    if (source.droppableId !== destination.droppableId) {
      // Move player between pools/unpooled
      toast({
        title: "Player Moved",
        description: "Player has been moved to new pool",
      });
    }
  };

  const movePlayerToPool = (playerId: string, targetPoolId: string) => {
    // Implementation for moving player to specific pool
    toast({
      title: "Player Moved",
      description: "Player has been assigned to pool",
    });
  };

  const shufflePool = (poolId: string) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;
    
    const shuffledPlayers = [...pool.players].sort(() => Math.random() - 0.5);
    setPools(pools.map(p => 
      p.id === poolId 
        ? { ...p, players: shuffledPlayers }
        : p
    ));
    
    toast({
      title: "Pool Shuffled",
      description: "Player order has been randomized",
    });
  };

  const getCurrentData = () => {
    if (selectedPool === "unpooled") {
      return { name: "Unpooled Players", players: unpooledPlayers };
    }
    
    const pool = pools.find(p => p.id === selectedPool);
    return { name: pool?.name || "Unknown Pool", players: pool?.players || [] };
  };

  const currentData = getCurrentData();

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
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Pool Management</h1>
            <p className="text-slate-300">Organize players into pools and manage auction sequences</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setIsCreatePoolOpen(true)}
              className="bg-emerald-600/80 hover:bg-emerald-500/90 text-white backdrop-blur-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pool
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-slate-700/60 hover:bg-slate-600/70 text-slate-100 border-slate-600/40 backdrop-blur-sm">
                  <Move3D className="h-4 w-4 mr-2" />
                  Pool Actions
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm">
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700/50">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Reorder Pools
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700/50">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Merge Pools
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Pool Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Pools</p>
                  <p className="text-2xl font-bold text-slate-100">{pools.length}</p>
                </div>
                <Waves className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pooled Players</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {pools.reduce((sum, pool) => sum + pool.players.length, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Unpooled Players</p>
                  <p className="text-2xl font-bold text-yellow-300">{unpooledPlayers.length}</p>
                </div>
                <Target className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg Pool Size</p>
                  <p className="text-2xl font-bold text-purple-300">
                    {pools.length > 0 ? Math.round(pools.reduce((sum, pool) => sum + pool.players.length, 0) / pools.length) : 0}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pool Tabs and Management */}
        <Card className="bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-slate-100">Pool Organization</CardTitle>
              
              {/* Pool Selector */}
              <Select value={selectedPool} onValueChange={setSelectedPool}>
                <SelectTrigger className="w-64 bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="unpooled">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-yellow-400" />
                      Unpooled Players ({unpooledPlayers.length})
                    </div>
                  </SelectItem>
                  {pools.map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-400" />
                        {pool.name} ({pool.players.length})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Current Pool Header */}
            <div className="flex items-center justify-between mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/40">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{currentData.name}</h3>
                <p className="text-slate-400">{currentData.players.length} players</p>
              </div>
              
              {selectedPool !== "unpooled" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => shufflePool(selectedPool)}
                    className="bg-slate-600/50 hover:bg-slate-500/50 text-slate-200"
                  >
                    <Shuffle className="h-4 w-4 mr-1" />
                    Shuffle
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPoolToRename(selectedPool);
                      setNewPoolName(pools.find(p => p.id === selectedPool)?.name || "");
                      setIsRenamePoolOpen(true);
                    }}
                    className="bg-slate-600/50 hover:bg-slate-500/50 text-slate-200"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Rename
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-600/50 hover:bg-red-500/50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-800 border-slate-600">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-100">Delete Pool</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-300">
                          This will delete the pool and move all players back to unpooled. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-600 text-slate-200 border-slate-500">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePool(selectedPool)}
                          className="bg-red-600 hover:bg-red-500"
                        >
                          Delete Pool
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Players List */}
            {currentData.players.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">
                  {selectedPool === "unpooled" ? "No unpooled players" : "Pool is empty"}
                </p>
                <p className="text-slate-500">
                  {selectedPool === "unpooled" 
                    ? "All players have been assigned to pools" 
                    : "Drag players here or use the move action"
                  }
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={selectedPool}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {currentData.players.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 bg-slate-700/40 border border-slate-600/40 rounded-lg transition-all ${
                                snapshot.isDragging ? 'shadow-lg bg-slate-600/60' : 'hover:bg-slate-700/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-200">
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <h4 className="font-medium text-slate-100">{player.name}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Globe className="h-3 w-3 text-slate-400" />
                                        <span className="text-sm text-slate-400">{player.country}</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-sm text-slate-400">{player.age}y</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {getRoleBadge(player.role)}
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400" />
                                    <span className="text-slate-100 text-sm">{player.evaluationPoints}</span>
                                  </div>
                                  <span className="text-slate-100 font-medium">{formatPrice(player.basePrice)}</span>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-800 border-slate-600">
                                      <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                                        <Move3D className="h-4 w-4 mr-2" />
                                        Move to Pool
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Player
                                      </DropdownMenuItem>
                                      {selectedPool !== "unpooled" && (
                                        <DropdownMenuItem 
                                          className="text-orange-300 hover:bg-orange-900/20"
                                          onClick={() => movePlayerToPool(player.id, "unpooled")}
                                        >
                                          <Target className="h-4 w-4 mr-2" />
                                          Remove from Pool
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Pool Dialog */}
      <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Create New Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Pool Name</Label>
              <Input
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="Enter pool name"
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreatePoolOpen(false)}
                className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePool}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Create Pool
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Pool Dialog */}
      <Dialog open={isRenamePoolOpen} onOpenChange={setIsRenamePoolOpen}>
        <DialogContent className="bg-slate-800/95 border-slate-600/40 backdrop-blur-sm text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Rename Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">New Pool Name</Label>
              <Input
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="Enter new pool name"
                className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRenamePoolOpen(false)}
                className="bg-slate-600/50 border-slate-500 text-slate-200 hover:bg-slate-500/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenamePool}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Rename Pool
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}