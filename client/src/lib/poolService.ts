// Shared pool management service for consistent data handling

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
  stats: string;
}

export interface Pool {
  id: string;
  name: string;
  order: number;
  players: Player[];
  status: 'Ready' | 'Hidden' | 'Active' | 'Locked' | 'Completed';
  visibility: 'Public' | 'Private';
  isLocked: boolean;
  createdAt: string;
  auctionStarted?: boolean;
}

export class PoolService {
  // Get standardized pool list from player data
  static getPoolsFromPlayers(players: any[]): Pool[] {
    const groupedByPool = players.reduce((acc, player) => {
      if (!player.pool) return acc;
      
      if (!acc[player.pool]) {
        // Determine order based on pool creation sequence
        const order = Object.keys(acc).length + 1;
        
        acc[player.pool] = {
          id: player.pool,
          name: player.pool,
          order: order,
          players: [],
          status: 'Ready' as const,
          visibility: 'Public' as const,
          isLocked: false,
          createdAt: new Date().toISOString(),
          auctionStarted: false
        };
      }
      acc[player.pool].players.push(player);
      return acc;
    }, {} as Record<string, Pool>);

    const pools = Object.values(groupedByPool).sort((a, b) => (a as Pool).order - (b as Pool).order);
    
    // Return empty array if no pools exist - no fake/dummy data
    if (pools.length === 0) {
      return [];
    }
    
    return pools as Pool[];
  }

  // Get available pool names for dropdowns
  static getAvailablePoolNames(players: any[]): string[] {
    const poolsFromPlayers = Array.from(new Set(players.map(p => p.pool).filter((pool): pool is string => Boolean(pool))));
    
    // Only return pools from real data
    return poolsFromPlayers.sort();
  }

  // Validate duplicate players across all pools
  static checkDuplicatePlayer(playerName: string, players: any[], editingPlayerId?: string): boolean {
    if (!playerName || !playerName.trim()) return false;
    
    const trimmedName = playerName.trim().toLowerCase();
    
    return players.some((p: any) => {
      const existingName = (p.name || '').trim().toLowerCase();
      const playerId = p.player_id || p.id || '';
      const editId = editingPlayerId || '';
      
      return existingName === trimmedName && playerId !== editId;
    });
  }

  // Get pool statistics
  static getPoolStats(pool: Pool): {
    playerCount: number;
    totalValue: number;
    soldCount: number;
    availableCount: number;
  } {
    const playerCount = pool.players.length;
    const totalValue = pool.players.reduce((sum, player) => {
      const priceStr = player.base_price || player.basePrice || '';
      const cleanStr = priceStr.replace(/[₹,]/g, '');
      if (cleanStr.includes('Cr')) {
        return sum + parseFloat(cleanStr.replace('Cr', ''));
      } else if (cleanStr.includes('L')) {
        return sum + (parseFloat(cleanStr.replace('L', '')) / 10);
      }
      return sum;
    }, 0);
    
    const soldCount = pool.players.filter(p => p.status === 'Sold').length;
    const availableCount = pool.players.filter(p => p.status === 'Available').length;
    
    return {
      playerCount,
      totalValue,
      soldCount,
      availableCount
    };
  }

  // Format player data for CSV export
  static formatPlayersForCSV(players: any[]): string {
    const headers = [
      'Player Name',
      'Role', 
      'Country',
      'Base Price (Cr)',
      'Age',
      'Points',
      'Pool',
      'Status',
      'Team',
      'Runs',
      'Wickets', 
      'Catches'
    ];

    const csvRows = [headers.join(',')];
    
    players.forEach((player: any) => {
      const stats = this.parseStatsString(player.stats);
      const basePriceCr = this.convertPriceToCr(player.base_price || player.basePrice || '');
      
      const row = [
        `"${player.name}"`,
        player.role,
        player.country,
        basePriceCr.toString(),
        player.age.toString(),
        player.points.toString(),
        player.pool || '',
        player.status,
        player.team || player.assignedTeam || '',
        stats.runs.toString(),
        stats.wickets.toString(),
        stats.catches.toString()
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Parse stats string to individual values
  static parseStatsString(statsStr: string): { runs: number; wickets: number; catches: number } {
    try {
      const stats = JSON.parse(statsStr);
      return {
        runs: stats.runs || 0,
        wickets: stats.wickets || 0,
        catches: stats.wicketkeeping || stats.catches || 0
      };
    } catch {
      return { runs: 0, wickets: 0, catches: 0 };
    }
  }

  // Convert price string to number in Cr
  static convertPriceToCr(priceStr: string): number {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[₹,]/g, '');
    if (cleanStr.includes('Cr')) {
      return parseFloat(cleanStr.replace('Cr', ''));
    } else if (cleanStr.includes('L')) {
      return parseFloat(cleanStr.replace('L', '')) / 10;
    }
    return 0;
  }

  // Generate CSV template for download
  static generateCSVTemplate(): string {
    const headers = [
      'Player Name',
      'Role', 
      'Country',
      'Base Price (Cr)',
      'Age',
      'Points',
      'Pool',
      'Status',
      'Team',
      'Runs',
      'Wickets', 
      'Catches'
    ];

    const exampleRows = [
      [
        '"Example Player 1"',
        'Batsman',
        'India',
        '15.0',
        '28',
        '85',
        'Star Players Pool',
        'Available',
        '',
        '5000',
        '0',
        '50'
      ],
      [
        '"Example Player 2"',
        'Bowler',
        'Australia',
        '8.5',
        '26',
        '78',
        'International Pool',
        'Available',
        '',
        '1200',
        '120',
        '25'
      ]
    ];

    const csvRows = [headers.join(','), ...exampleRows.map(row => row.join(','))];
    return csvRows.join('\n');
  }
}