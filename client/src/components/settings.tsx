import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon,
  Trash2,
  DollarSign,
  Calculator,
  Lock,
  Unlock,
  Database,
  RefreshCw,
  Shield,
  Users,
  FileText,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Settings form schema
const settingsFormSchema = z.object({
  baseBudget: z.number().min(50000000, "Budget must be at least ₹5 Cr").max(1000000000, "Budget cannot exceed ₹100 Cr"),
  maxTeams: z.number().min(4, "Minimum 4 teams required").max(20, "Maximum 20 teams allowed"),
  evaluationWeight: z.number().min(0.1, "Weight must be at least 0.1").max(1, "Weight cannot exceed 1"),
  auctionDuration: z.number().min(15, "Minimum 15 seconds").max(300, "Maximum 5 minutes"),
  lockTeams: z.boolean(),
  allowUnsold: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

// System stats interface
interface SystemStats {
  totalPlayers: number;
  totalTeams: number;
  totalAuctions: number;
  dataSize: string;
  lastBackup: Date;
}

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Sample system stats - in real app this would come from Firebase
  const [systemStats] = useState<SystemStats>({
    totalPlayers: 247,
    totalTeams: 8,
    totalAuctions: 45,
    dataSize: "2.4 MB",
    lastBackup: new Date("2025-01-30T14:30:00")
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      baseBudget: 250000000,
      maxTeams: 15,
      evaluationWeight: 0.7,
      auctionDuration: 30,
      lockTeams: false,
      allowUnsold: true,
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

  const handleSaveSettings = (data: SettingsFormData) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Auction settings have been updated successfully",
      });
    }, 1000);
  };

  const handleResetAllData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate data reset
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Data Reset Complete",
          description: "All auction data has been cleared successfully",
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Reset Failed",
        description: "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    const data = {
      players: systemStats.totalPlayers,
      teams: systemStats.totalTeams,
      auctions: systemStats.totalAuctions,
      settings: form.getValues(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Auction data has been exported successfully",
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log("Importing data:", data);
        
        toast({
          title: "Import Complete",
          description: "Auction data has been imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please select a valid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">System Settings</h1>
        <p className="text-slate-400 text-lg">
          Configure auction parameters and manage system data
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Players</p>
                <p className="text-2xl font-bold text-slate-100">{systemStats.totalPlayers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Teams</p>
                <p className="text-2xl font-bold text-emerald-300">{systemStats.totalTeams}</p>
              </div>
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auctions</p>
                <p className="text-2xl font-bold text-purple-300">{systemStats.totalAuctions}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cricket-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Data Size</p>
                <p className="text-2xl font-bold text-amber-300">{systemStats.dataSize}</p>
              </div>
              <Database className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="auction" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
          <TabsTrigger value="auction" className="text-slate-300 data-[state=active]:text-slate-100">
            Auction Settings
          </TabsTrigger>
          <TabsTrigger value="data" className="text-slate-300 data-[state=active]:text-slate-100">
            Data Management
          </TabsTrigger>
          <TabsTrigger value="system" className="text-slate-300 data-[state=active]:text-slate-100">
            System Control
          </TabsTrigger>
        </TabsList>

        {/* Auction Settings Tab */}
        <TabsContent value="auction">
          <Card className="cricket-card">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-emerald-400" />
                Auction Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Base Budget (₹)</Label>
                    <Input
                      {...form.register("baseBudget", { valueAsNumber: true })}
                      type="number"
                      className="cricket-input"
                    />
                    <p className="text-xs text-slate-400">
                      Current: {formatPrice(form.watch("baseBudget"))}
                    </p>
                    {form.formState.errors.baseBudget && (
                      <p className="text-sm text-red-400">{form.formState.errors.baseBudget.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">Maximum Teams</Label>
                    <Input
                      {...form.register("maxTeams", { valueAsNumber: true })}
                      type="number"
                      className="cricket-input"
                    />
                    {form.formState.errors.maxTeams && (
                      <p className="text-sm text-red-400">{form.formState.errors.maxTeams.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">Evaluation Weight</Label>
                    <Input
                      {...form.register("evaluationWeight", { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      className="cricket-input"
                    />
                    <p className="text-xs text-slate-400">
                      Points calculation weight factor
                    </p>
                    {form.formState.errors.evaluationWeight && (
                      <p className="text-sm text-red-400">{form.formState.errors.evaluationWeight.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">Auction Duration (seconds)</Label>
                    <Input
                      {...form.register("auctionDuration", { valueAsNumber: true })}
                      type="number"
                      className="cricket-input"
                    />
                    <p className="text-xs text-slate-400">
                      Timer for each player auction
                    </p>
                    {form.formState.errors.auctionDuration && (
                      <p className="text-sm text-red-400">{form.formState.errors.auctionDuration.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <Label className="text-slate-200">Lock Teams</Label>
                      <p className="text-sm text-slate-400">Prevent team modifications during auction</p>
                    </div>
                    <Switch
                      {...form.register("lockTeams")}
                      checked={form.watch("lockTeams")}
                      onCheckedChange={(checked) => form.setValue("lockTeams", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <Label className="text-slate-200">Allow Unsold Players</Label>
                      <p className="text-sm text-slate-400">Players can remain unsold in auction</p>
                    </div>
                    <Switch
                      {...form.register("allowUnsold")}
                      checked={form.watch("allowUnsold")}
                      onCheckedChange={(checked) => form.setValue("allowUnsold", checked)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="cricket-button-primary"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cricket-card">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Backup & Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 mb-2">Last Backup</p>
                  <p className="text-slate-200">{formatDate(systemStats.lastBackup)}</p>
                </div>
                
                <Button
                  onClick={handleExportData}
                  className="w-full cricket-button-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                
                <div className="space-y-2">
                  <Label className="text-slate-200">Import Data</Label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  <p className="text-xs text-slate-400">
                    Select a valid backup JSON file
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cricket-card">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-400" />
                  Data Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-lg font-bold text-slate-100">{systemStats.totalPlayers}</p>
                    <p className="text-xs text-slate-400">Players</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-lg font-bold text-emerald-300">{systemStats.totalTeams}</p>
                    <p className="text-xs text-slate-400">Teams</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-lg font-bold text-purple-300">{systemStats.totalAuctions}</p>
                    <p className="text-xs text-slate-400">Auctions</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-lg font-bold text-amber-300">{systemStats.dataSize}</p>
                    <p className="text-xs text-slate-400">Size</p>
                  </div>
                </div>
                
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-sm text-green-400">System Status</p>
                  </div>
                  <p className="text-slate-200 text-sm">All systems operational</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Control Tab */}
        <TabsContent value="system">
          <Card className="cricket-card">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-400">Reset All Data</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      This will permanently delete all players, teams, auctions, and settings. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="cricket-card border-red-500/30">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Confirm Data Reset
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      This action will permanently delete:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>{systemStats.totalPlayers} players</li>
                        <li>{systemStats.totalTeams} teams</li>
                        <li>{systemStats.totalAuctions} auction records</li>
                        <li>All auction logs and statistics</li>
                        <li>System settings (will reset to defaults)</li>
                      </ul>
                      <br />
                      <strong>This action cannot be undone.</strong> Make sure you have exported your data if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cricket-button-secondary">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAllData}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Reset All Data
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="font-medium text-slate-200 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cricket-button-secondary"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh System
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cricket-button-secondary"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="font-medium text-slate-200 mb-2">System Info</h4>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>Version: v1.0.0</p>
                    <p>Build: 2025.01.30</p>
                    <p>Environment: Production</p>
                    <p>Database: Firebase</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}