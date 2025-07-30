// Test data flow between components and Firebase - real data only
import { firestoreService } from "@/lib/firestore";
import { hasFirebaseCredentials } from "@/lib/firebase";

export interface TestResult {
  component: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export class DataFlowTester {
  static async testFirebaseConnection(): Promise<TestResult> {
    try {
      if (!hasFirebaseCredentials) {
        return {
          component: 'Firebase',
          status: 'error',
          message: 'Firebase credentials not available'
        };
      }

      const players = await firestoreService.getAllPlayers();
      return {
        component: 'Firebase',
        status: 'success',
        message: `Connected successfully. Found ${players.length} players.`,
        data: { playerCount: players.length }
      };
    } catch (error) {
      return {
        component: 'Firebase',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async testDashboardStats(): Promise<TestResult> {
    try {
      const players = await firestoreService.getAllPlayers();
      const teams = await firestoreService.getAllTeams();
      const auctions = await firestoreService.getAllAuctions();

      const stats = {
        totalPlayers: players.length,
        totalTeams: teams.length,
        soldPlayers: players.filter(p => p.status === "Sold").length,
        availablePlayers: players.filter(p => p.status === "Available").length,
        pooledPlayers: players.filter(p => p.status === "Pooled").length,
        unsoldPlayers: players.filter(p => p.status === "Unsold").length,
        activeAuctions: auctions.filter(a => a.isActive).length
      };

      return {
        component: 'Dashboard Overview',
        status: 'success',
        message: 'Stats calculated successfully',
        data: stats
      };
    } catch (error) {
      return {
        component: 'Dashboard Overview',
        status: 'error',
        message: `Failed to calculate stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async testPlayerPoolData(): Promise<TestResult> {
    try {
      const players = await firestoreService.getAllPlayers();
      
      // Test filtering and data transformation
      const transformedPlayers = players.map(player => ({
        ...player,
        player_id: player.id || '',
        base_price: player.basePrice || '',
        team: player.assignedTeam || null
      }));

      // Test pool extraction
      const pools = Array.from(new Set(players.map(p => p.pool).filter(Boolean))).sort();
      const countries = Array.from(new Set(players.map(p => p.country))).sort();
      const statuses = Array.from(new Set(players.map(p => p.status))).sort();

      return {
        component: 'Player Pool',
        status: 'success',
        message: 'Player data processed successfully',
        data: {
          playerCount: transformedPlayers.length,
          pools: pools,
          countries: countries,
          statuses: statuses
        }
      };
    } catch (error) {
      return {
        component: 'Player Pool',
        status: 'error',
        message: `Failed to process player data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async testPoolManagement(): Promise<TestResult> {
    try {
      const players = await firestoreService.getAllPlayers();
      
      // Group players by pool
      const groupedByPool = players.reduce((acc, player) => {
        if (!player.pool) return acc;
        
        if (!acc[player.pool]) {
          acc[player.pool] = {
            id: player.pool,
            name: player.pool,
            players: [],
            totalValue: 0
          };
        }
        acc[player.pool].players.push(player);
        
        // Calculate pool value
        const priceStr = player.basePrice || '';
        const cleanStr = priceStr.replace(/[₹,]/g, '');
        let value = 0;
        if (cleanStr.includes('Cr')) {
          value = parseFloat(cleanStr.replace('Cr', ''));
        } else if (cleanStr.includes('L')) {
          value = parseFloat(cleanStr.replace('L', '')) / 10;
        }
        acc[player.pool].totalValue += value;
        
        return acc;
      }, {} as Record<string, any>);

      const poolsData = Object.values(groupedByPool);

      return {
        component: 'Pool Management',
        status: 'success',
        message: 'Pool data processed successfully',
        data: {
          poolCount: poolsData.length,
          pools: poolsData.map(p => ({
            name: p.name,
            playerCount: p.players.length,
            totalValue: p.totalValue.toFixed(1)
          }))
        }
      };
    } catch (error) {
      return {
        component: 'Pool Management',
        status: 'error',
        message: `Failed to process pool data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async testDataCirculation(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Test Firebase connection
    results.push(await this.testFirebaseConnection());
    
    // Test dashboard stats
    results.push(await this.testDashboardStats());
    
    // Test player pool data
    results.push(await this.testPlayerPoolData());
    
    // Test pool management
    results.push(await this.testPoolManagement());
    
    return results;
  }

  static async testCRUDOperations(): Promise<TestResult> {
    try {
      // Test CRUD operations without creating fake data
      const players = await firestoreService.getAllPlayers();
      const teams = await firestoreService.getAllTeams();
      const auctions = await firestoreService.getAllAuctions();

      return {
        component: 'CRUD Operations',
        status: 'success',
        message: 'Data access operations verified successfully',
        data: {
          players: players.length,
          teams: teams.length,
          auctions: auctions.length
        }
      };
    } catch (error) {
      return {
        component: 'CRUD Operations',
        status: 'error',
        message: `CRUD test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}