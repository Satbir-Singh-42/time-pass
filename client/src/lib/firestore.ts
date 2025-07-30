import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  type Player, 
  type InsertPlayer, 
  type Team, 
  type InsertTeam, 
  type Auction, 
  type InsertAuction 
} from "@shared/schema";

// Firestore service for real-time data persistence
export class FirestoreService {
  // Player operations
  async getAllPlayers(): Promise<Player[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    const playersRef = collection(db, "players");
    const snapshot = await getDocs(query(playersRef, orderBy("createdAt", "desc")));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Player[];
  }

  async getPlayer(id: string): Promise<Player | null> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "players", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
      } as Player;
    }
    
    return null;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    if (!db) throw new Error("Firestore not initialized");
    
    const playersRef = collection(db, "players");
    const docRef = await addDoc(playersRef, {
      ...player,
      currentPrice: 0,
      isSold: false,
      soldTo: null,
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate() || new Date()
    } as Player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "players", id);
    await updateDoc(docRef, updates);
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate() || new Date()
    } as Player;
  }

  async deletePlayer(id: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "players", id);
    await deleteDoc(docRef);
    return true;
  }

  // Team operations
  async getAllTeams(): Promise<Team[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    const teamsRef = collection(db, "teams");
    const snapshot = await getDocs(query(teamsRef, orderBy("createdAt", "desc")));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Team[];
  }

  async getTeam(id: string): Promise<Team | null> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "teams", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
      } as Team;
    }
    
    return null;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    if (!db) throw new Error("Firestore not initialized");
    
    const teamsRef = collection(db, "teams");
    const docRef = await addDoc(teamsRef, {
      ...team,
      remainingBudget: team.budget || 1500000,
      logoUrl: team.logoUrl || null,
      playersCount: 0,
      captainId: null,
      totalPoints: 0,
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate() || new Date()
    } as Team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "teams", id);
    await updateDoc(docRef, updates);
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate() || new Date()
    } as Team;
  }

  async deleteTeam(id: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "teams", id);
    await deleteDoc(docRef);
    return true;
  }

  // Auction operations
  async getAllAuctions(): Promise<Auction[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    const auctionsRef = collection(db, "auctions");
    const snapshot = await getDocs(query(auctionsRef, orderBy("startedAt", "desc")));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      endedAt: doc.data().endedAt?.toDate() || null
    })) as Auction[];
  }

  async getActiveAuctions(): Promise<Auction[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    const auctionsRef = collection(db, "auctions");
    const snapshot = await getDocs(query(auctionsRef, where("isActive", "==", true)));
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      endedAt: doc.data().endedAt?.toDate() || null
    })) as Auction[];
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    if (!db) throw new Error("Firestore not initialized");
    
    const auctionsRef = collection(db, "auctions");
    const docRef = await addDoc(auctionsRef, {
      ...auction,
      isActive: false,
      startedAt: serverTimestamp(),
      endedAt: null
    });
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      startedAt: docSnap.data()?.startedAt?.toDate() || new Date(),
      endedAt: null
    } as Auction;
  }

  async updateAuction(id: string, updates: Partial<Auction>): Promise<Auction> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "auctions", id);
    await updateDoc(docRef, updates);
    
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
      startedAt: docSnap.data()?.startedAt?.toDate() || new Date(),
      endedAt: docSnap.data()?.endedAt?.toDate() || null
    } as Auction;
  }

  async deleteAuction(id: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    
    const docRef = doc(db, "auctions", id);
    await deleteDoc(docRef);
    return true;
  }
}

export const firestoreService = new FirestoreService();