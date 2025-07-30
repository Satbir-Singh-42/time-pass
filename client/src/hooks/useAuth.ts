import { useState, useEffect, createContext, useContext } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: "admin" | "viewer" | null;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "viewer" | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Only authenticated users are admins (single admin account)
        // All Firebase authenticated users have admin privileges
        setUserRole("admin");
      } else {
        // Non-authenticated users are viewers by default
        setUserRole("viewer");
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = userRole === "admin";

  return {
    user,
    loading,
    userRole,
    isAdmin,
  };
};