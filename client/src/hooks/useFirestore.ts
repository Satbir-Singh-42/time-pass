import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firestoreService } from "@/lib/firestore";
import { hasFirebaseCredentials } from "@/lib/firebase";
import { 
  type Player, 
  type InsertPlayer, 
  type Team, 
  type InsertTeam, 
  type Auction, 
  type InsertAuction 
} from "@shared/schema";

// Custom hook to handle Firebase/API data fetching
export function useFirestoreData() {
  const queryClient = useQueryClient();
  
  // Players
  const usePlayersQuery = () => useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      if (hasFirebaseCredentials) {
        return await firestoreService.getAllPlayers();
      } else {
        // Fallback to API
        const response = await fetch("/api/players");
        if (!response.ok) throw new Error("Failed to fetch players");
        return response.json();
      }
    }
  });

  const useCreatePlayerMutation = () => useMutation({
    mutationFn: async (player: InsertPlayer) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.createPlayer(player);
      } else {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(player)
        });
        if (!response.ok) throw new Error("Failed to create player");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pools"] });
    }
  });

  const useUpdatePlayerMutation = () => useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Player> }) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.updatePlayer(id, updates);
      } else {
        const response = await fetch(`/api/players/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update player");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pools"] });
    }
  });

  const useDeletePlayerMutation = () => useMutation({
    mutationFn: async (id: string) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.deletePlayer(id);
      } else {
        const response = await fetch(`/api/players/${id}`, {
          method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete player");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  // Teams
  const useTeamsQuery = () => useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      if (hasFirebaseCredentials) {
        return await firestoreService.getAllTeams();
      } else {
        const response = await fetch("/api/teams");
        if (!response.ok) throw new Error("Failed to fetch teams");
        return response.json();
      }
    }
  });

  const useCreateTeamMutation = () => useMutation({
    mutationFn: async (team: InsertTeam) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.createTeam(team);
      } else {
        const response = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(team)
        });
        if (!response.ok) throw new Error("Failed to create team");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  const useUpdateTeamMutation = () => useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Team> }) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.updateTeam(id, updates);
      } else {
        const response = await fetch(`/api/teams/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update team");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    }
  });

  const useDeleteTeamMutation = () => useMutation({
    mutationFn: async (id: string) => {
      if (hasFirebaseCredentials) {
        return await firestoreService.deleteTeam(id);
      } else {
        const response = await fetch(`/api/teams/${id}`, {
          method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete team");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    }
  });

  // Auctions
  const useAuctionsQuery = () => useQuery({
    queryKey: ["auctions"],
    queryFn: async () => {
      if (hasFirebaseCredentials) {
        return await firestoreService.getAllAuctions();
      } else {
        const response = await fetch("/api/auctions");
        if (!response.ok) throw new Error("Failed to fetch auctions");
        return response.json();
      }
    }
  });

  const useActiveAuctionsQuery = () => useQuery({
    queryKey: ["auctions", "active"],
    queryFn: async () => {
      if (hasFirebaseCredentials) {
        return await firestoreService.getActiveAuctions();
      } else {
        const response = await fetch("/api/auctions/active");
        if (!response.ok) throw new Error("Failed to fetch active auctions");
        return response.json();
      }
    }
  });

  // Dashboard Stats
  const useDashboardStatsQuery = () => useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (hasFirebaseCredentials) {
        // Calculate stats from Firestore data
        const [players, teams, auctions] = await Promise.all([
          firestoreService.getAllPlayers(),
          firestoreService.getAllTeams(),
          firestoreService.getAllAuctions()
        ]);

        const soldPlayers = players.filter(p => p.status === "Sold");
        const availablePlayers = players.filter(p => p.status === "Available");
        const unsoldPlayers = players.filter(p => p.status === "Unsold");
        const activeAuctions = auctions.filter(a => a.isActive);

        // Calculate total revenue from sold players
        const totalRevenue = soldPlayers.reduce((sum, player) => {
          // Parse basePrice string format (₹15Cr, ₹80L) to number
          const priceStr = player.basePrice.replace(/[₹,]/g, '');
          let price = 0;
          if (priceStr.includes('Cr')) {
            price = parseFloat(priceStr.replace('Cr', '')) * 10000000;
          } else if (priceStr.includes('L')) {
            price = parseFloat(priceStr.replace('L', '')) * 100000;
          } else {
            price = parseFloat(priceStr) || 0;
          }
          return sum + price;
        }, 0);

        return {
          totalPlayers: players.length,
          totalTeams: teams.length,
          soldPlayers: soldPlayers.length,
          availablePlayers: availablePlayers.length,
          unsoldPlayers: unsoldPlayers.length,
          activeAuctions: activeAuctions.length,
          totalRevenue
        };
      } else {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) throw new Error("Failed to fetch dashboard stats");
        return response.json();
      }
    }
  });

  return {
    // Players
    usePlayersQuery,
    useCreatePlayerMutation,
    useUpdatePlayerMutation,
    useDeletePlayerMutation,
    
    // Teams
    useTeamsQuery,
    useCreateTeamMutation,
    useUpdateTeamMutation,
    useDeleteTeamMutation,
    
    // Auctions
    useAuctionsQuery,
    useActiveAuctionsQuery,
    
    // Dashboard
    useDashboardStatsQuery,
    
    // Query client for cache invalidation
    queryClient
  };
}