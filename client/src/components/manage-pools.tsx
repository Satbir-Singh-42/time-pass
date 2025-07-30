import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  Target,
  MoreHorizontal,
  GripVertical,
  Move,
  ArrowRight,
  Shuffle,
  Eye
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

// Player interface
interface Player {
  id: string;
  name: string;
  age: number;
  country: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  evaluationPoints: number;
  basePrice: number;
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

export default function ManagePools() {
  const { toast } = useToast();
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isRenamePoolOpen, setIsRenamePoolOpen] = useState(false);
  const [poolToRename, setPoolToRename] = useState<Pool | null>(null);
  const [newPoolName, setNewPoolName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Sample data - in real app this would come from Firebase
  const [pools, setPools] = useState<Pool[]>([
    {
      id: "pool-a",
      name: "Pool A - Premium",
      description: "Top tier players",
      players: [
        {
          id: "p1",
          name: "Virat Kohli",
          age: 35,
          country: "India",
          role: "Batsman",
          evaluationPoints: 95,
          basePrice: 160000000,
          status: "Available"
        },
        {
          id: "p2", 
          name: "Jasprit Bumrah",
          age: 30,
          country: "India",
          role: "Bowler",
          evaluationPoints: 92,
          basePrice: 120000000,
          status: "Available"
        }
      ],
      maxPlayers: 50,
      createdAt: new Date(),
    },
    {
      id: "pool-b",
      name: "Pool B - Standard", 
      description: "Mid tier players",
      players: [
        {
          id: "p3",
          name: "Jos Buttler",
          age: 34,
          country: "England",
          role: "Wicket-keeper",
          evaluationPoints: 89,
          basePrice: 100000000,
          status: "Available"
        }
      ],
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

  const [unpooledPlayers, setUnpooledPlayers] = useState<Player[]>([
    {
      id: "p4",
      name: "Rashid Khan",
      age: 26,
      country: "Afghanistan", 
      role: "Bowler",
      evaluationPoints: 88,
      basePrice: 95000000,
      status: "Available"
    },
    {
      id: "p5",
      name: "David Warner",
      age: 38,
      country: "Australia",
      role: "Batsman", 
      evaluationPoints: 85,
      basePrice: 80000000,
      status: "Available"
    }
  ]);

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
      pool.id === poolToRename.id 
        ? { ...pool, name: newPoolName }
        : pool
    ));
    
    setNewPoolName("");
    setPoolToRename(null);
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

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within same pool/unpooled
      return;
    }

    // Find the player being moved
    let player: Player | undefined;
    let sourceList: Player[];
    let setSourceList: (players: Player[]) => void;

    if (source.droppableId === "unpooled") {
      player = unpooledPlayers.find(p => p.id === draggableId);
      sourceList = unpooledPlayers;
      setSourceList = setUnpooledPlayers;
    } else {
      const sourcePool = pools.find(p => p.id === source.droppableId);
      player = sourcePool?.players.find(p => p.id === draggableId);
      sourceList = sourcePool?.players || [];
      setSourceList = (players) => {
        setPools(pools.map(p => 
          p.id === source.droppableId 
            ? { ...p, players }
            : p
        ));
      };
    }

    if (!player) return;

    // Remove from source
    const newSourceList = sourceList.filter(p => p.id !== draggableId);
    setSourceList(newSourceList);

    // Add to destination
    if (destination.droppableId === "unpooled") {
      setUnpooledPlayers([...unpooledPlayers.filter(p => p.id !== draggableId), player]);
    } else {
      setPools(pools.map(pool => 
        pool.id === destination.droppableId
          ? { ...pool, players: [...pool.players, player] }
          : pool
      ));
    }

    toast({
      title: "Player Moved",
      description: `${player.name} moved successfully`,
    });
  };

  const moveSelectedToPool = (targetPoolId: string) => {
    if (selectedPlayerIds.length === 0) return;

    // Implementation for bulk move
    setSelectedPlayerIds([]);
    toast({
      title: "Players Moved",
      description: `${selectedPlayerIds.length} players moved to pool`,
    });
  };

  const totalPlayers = pools.reduce((sum, pool) => sum + pool.players.length, 0) + unpooledPlayers.length;

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">Manage Pools</h1>
        <p className="text-slate-400 text-lg">
          Organize players into auction pools with drag-and-drop
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Pools</p>
                <p className="text-2xl font-bold text-slate-100">{pools.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
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
        
        <Card className="cricket-card">
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
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Players</p>
                <p className="text-2xl font-bold text-purple-300">{totalPlayers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          onClick={() => setIsCreatePoolOpen(true)}
          className="cricket-button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pool
        </Button>

        <div className="flex gap-2">
          {selectedPlayerIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="cricket-button-secondary">
                  <Move className="h-4 w-4 mr-2" />
                  Move Selected ({selectedPlayerIds.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-600">
                {pools.map(pool => (
                  <DropdownMenuItem 
                    key={pool.id}
                    onClick={() => moveSelectedToPool(pool.id)}
                    className="text-slate-200 hover:bg-slate-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {pool.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem 
                  onClick={() => moveSelectedToPool("unpooled")}
                  className="text-slate-200 hover:bg-slate-700"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Unpooled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Pools Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unpooled Players */}
          <Card className="cricket-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-400" />
                  Unpooled Players
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  {unpooledPlayers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="unpooled">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-40 space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggedOver
                        ? 'border-yellow-400 bg-yellow-400/5'
                        : 'border-slate-600'
                    }`}
                  >
                    {unpooledPlayers.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No unpooled players</p>
                      </div>
                    ) : (
                      unpooledPlayers.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 bg-slate-700/50 border border-slate-600 rounded-lg transition-all ${
                                snapshot.isDragging ? 'shadow-lg bg-slate-600/60 rotate-2' : 'hover:bg-slate-700/70'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-200 cursor-grab">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-100 text-sm">{player.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getRoleBadge(player.role)}
                                      <span className="text-xs text-slate-400">{formatPrice(player.basePrice)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* Pool Cards */}
          {pools.map((pool) => (
            <Card key={pool.id} className="cricket-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-400" />
                    {pool.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      {pool.players.length}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => {
                            setPoolToRename(pool);
                            setNewPoolName(pool.name);
                            setIsRenamePoolOpen(true);
                          }}
                          className="text-slate-200 hover:bg-slate-700"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename Pool
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                          <Shuffle className="h-4 w-4 mr-2" />
                          Shuffle Players
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePool(pool.id)}
                          className="text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Pool
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardTitle>
                {pool.description && (
                  <p className="text-xs text-slate-400">{pool.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <Droppable droppableId={pool.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-40 space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggedOver
                          ? 'border-emerald-400 bg-emerald-400/5'
                          : 'border-slate-600'
                      }`}
                    >
                      {pool.players.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">Drop players here</p>
                        </div>
                      ) : (
                        pool.players.map((player, index) => (
                          <Draggable key={player.id} draggableId={player.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 bg-slate-700/50 border border-slate-600 rounded-lg transition-all ${
                                  snapshot.isDragging ? 'shadow-lg bg-slate-600/60 rotate-2' : 'hover:bg-slate-700/70'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-200 cursor-grab">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-100 text-sm">{player.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getRoleBadge(player.role)}
                                        <span className="text-xs text-slate-400">{formatPrice(player.basePrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>

      {/* Create Pool Dialog */}
      <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
        <DialogContent className="cricket-card text-slate-100">
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
                className="cricket-input mt-2"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreatePoolOpen(false)}
                className="cricket-button-secondary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePool}
                className="cricket-button-primary"
              >
                Create Pool
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Pool Dialog */}
      <Dialog open={isRenamePoolOpen} onOpenChange={setIsRenamePoolOpen}>
        <DialogContent className="cricket-card text-slate-100">
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
                className="cricket-input mt-2"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRenamePoolOpen(false)}
                className="cricket-button-secondary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenamePool}
                className="cricket-button-primary"
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