import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Upload, 
  Download, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Users,
  Eye,
  Save
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Player form schema
const playerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(16, "Age must be at least 16").max(45, "Age cannot exceed 45"),
  country: z.string().min(1, "Country is required"),
  matches: z.number().min(0, "Matches cannot be negative"),
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

// Player interface
interface Player {
  srNo: number;
  name: string;
  age: number;
  country: string;
  matches: number;
  runs: number;
  wickets: number;
  catches: number;
  evaluationPoints: number;
  basePrice: number;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
  pool?: string;
  status?: "valid" | "error" | "warning";
  errorMessage?: string;
}

export default function UploadPlayers() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<Player[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<"upload" | "preview" | "confirm">("upload");
  const [validationResults, setValidationResults] = useState({ valid: 0, errors: 0, warnings: 0 });

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      age: 25,
      country: "",
      matches: 0,
      runs: 0,
      wickets: 0,
      catches: 0,
      evaluationPoints: 0,
      basePrice: 1000000,
      role: "Batsman",
      pool: "",
    },
  });

  const downloadCSVTemplate = () => {
    const headers = [
      'Sr No', 'Player Name', 'Age', 'Country', 'Matches', 
      'Runs', 'Wickets', 'Catches', 'Eval Points', 
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
    a.download = 'players_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
        'Sr No', 'Player Name', 'Age', 'Country', 'Matches', 
        'Runs', 'Wickets', 'Catches', 'Eval Points', 
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
      const players: Player[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Line ${i + 1}: Invalid number of columns`);
          continue;
        }
        
        try {
          const player: Player = {
            srNo: parseInt(values[0]) || i,
            name: values[1],
            age: parseInt(values[2]) || 25,
            country: values[3],
            matches: parseInt(values[4]) || 0,
            runs: parseInt(values[5]) || 0,
            wickets: parseInt(values[6]) || 0,
            catches: parseInt(values[7]) || 0,
            evaluationPoints: parseInt(values[8]) || 0,
            basePrice: parseInt(values[9]) || 1000000,
            role: values[10] as any || "Batsman",
            pool: values[11] || undefined,
          };
          
          // Validate player data
          if (!player.name || player.name.length < 2) {
            player.status = "error";
            player.errorMessage = "Invalid name";
          } else if (player.age < 16 || player.age > 45) {
            player.status = "warning";
            player.errorMessage = "Age outside typical range";
          } else if (player.basePrice < 500000) {
            player.status = "error";
            player.errorMessage = "Base price too low";
          } else {
            player.status = "valid";
          }
          
          players.push(player);
        } catch (error) {
          errors.push(`Line ${i + 1}: Error parsing data`);
        }
      }
      
      // Calculate validation results
      const valid = players.filter(p => p.status === "valid").length;
      const errorCount = players.filter(p => p.status === "error").length;
      const warnings = players.filter(p => p.status === "warning").length;
      
      setValidationResults({ valid, errors: errorCount, warnings });
      setCsvData(players);
      setUploadStep("preview");
      setIsPreviewOpen(true);
      
      toast({
        title: "CSV Processed",
        description: `${players.length} players parsed. ${valid} valid, ${errorCount} errors, ${warnings} warnings`,
      });
    };
    
    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    const validPlayers = csvData.filter(p => p.status === "valid");
    
    try {
      // Here you would typically send to Firebase
      console.log("Uploading players:", validPlayers);
      
      toast({
        title: "Players Uploaded Successfully",
        description: `${validPlayers.length} players added to database`,
      });
      
      // Reset state
      setCsvData([]);
      setUploadStep("upload");
      setIsPreviewOpen(false);
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the players",
        variant: "destructive",
      });
    }
  };

  const handleManualAdd = (data: PlayerFormData) => {
    console.log("Adding manual player:", data);
    setIsManualEntryOpen(false);
    form.reset();
    
    toast({
      title: "Player Added",
      description: `${data.name} has been added successfully`,
    });
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

  const getStatusBadge = (status?: string, errorMessage?: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"><AlertCircle className="h-3 w-3 mr-1" />Warning</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen cricket-gradient p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-100">Upload Players</h1>
        <p className="text-slate-400 text-lg">
          Import player data via CSV or add players manually
        </p>
      </div>

      {/* Upload Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card className="cricket-card">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-400" />
              CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                Upload Player CSV
              </h3>
              <p className="text-slate-400 mb-4">
                Select a CSV file with player data
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="cricket-button-primary"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-slate-200">Required CSV Format:</h4>
              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
                <p className="font-mono">
                  Sr No, Player Name, Age, Country, Matches, Runs, Wickets, 
                  Catches, Eval Points, Base Price, Role, Pool
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSVTemplate}
                className="w-full cricket-button-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="cricket-card">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                Add Individual Player
              </h3>
              <p className="text-slate-400 mb-4">
                Enter player details manually
              </p>
              <Button
                onClick={() => setIsManualEntryOpen(true)}
                className="cricket-button-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-slate-200">Quick Add Options:</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="cricket-button-secondary text-xs"
                >
                  Batsman
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cricket-button-secondary text-xs"
                >
                  Bowler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cricket-button-secondary text-xs"
                >
                  All-rounder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cricket-button-secondary text-xs"
                >
                  Wicket-keeper
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl cricket-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-400" />
              Preview CSV Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-2xl font-bold text-green-300">{validationResults.valid}</p>
                <p className="text-sm text-green-400">Valid</p>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-2xl font-bold text-yellow-300">{validationResults.warnings}</p>
                <p className="text-sm text-yellow-400">Warnings</p>
              </div>
              <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-2xl font-bold text-red-300">{validationResults.errors}</p>
                <p className="text-sm text-red-400">Errors</p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Sr No</TableHead>
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Age</TableHead>
                    <TableHead className="text-slate-300">Country</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    <TableHead className="text-slate-300">Base Price</TableHead>
                    <TableHead className="text-slate-300">Pool</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((player, index) => (
                    <TableRow key={index} className="border-slate-600">
                      <TableCell>
                        {getStatusBadge(player.status, player.errorMessage)}
                      </TableCell>
                      <TableCell className="text-slate-300">{player.srNo}</TableCell>
                      <TableCell className="text-slate-100 font-medium">{player.name}</TableCell>
                      <TableCell className="text-slate-300">{player.age}</TableCell>
                      <TableCell className="text-slate-300">{player.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-slate-300">
                          {player.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-200">{formatPrice(player.basePrice)}</TableCell>
                      <TableCell className="text-slate-300">{player.pool || "Unpooled"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="cricket-button-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpload}
                disabled={validationResults.valid === 0}
                className="cricket-button-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirm Upload ({validationResults.valid} players)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="cricket-card text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add Player Manually</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleManualAdd)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Player Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="cricket-input" />
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
                          className="cricket-input"
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
                        <Input {...field} className="cricket-input" />
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
                          <SelectTrigger className="cricket-input">
                            <SelectValue />
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
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsManualEntryOpen(false)}
                  className="cricket-button-secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" className="cricket-button-primary">
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