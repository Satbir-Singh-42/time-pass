import { useState } from "react";
import { signInWithEmailAndPassword, auth, hasFirebaseCredentials } from "@/lib/firebase";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ email: "", password: "" });
    
    // Check if Firebase is available
    if (!hasFirebaseCredentials || !auth) {
      setErrors(prev => ({ ...prev, password: "Firebase credentials not configured. Please add your Firebase API keys." }));
      toast({
        title: "Configuration Error",
        description: "Firebase authentication is not properly configured.",
        variant: "destructive",
      });
      return;
    }
    
    // Validation
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
      });
      onClose();
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Admin account not found.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
      }
      
      setErrors(prev => ({ ...prev, password: errorMessage }));
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setErrors({ email: "", password: "" });
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 auth-modal flex items-center justify-center p-6 z-50">
      <div className="bg-gradient-to-br from-deep-teal to-dark-navy rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300">
        {/* Header */}
        <div className="text-center p-8 pb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cricket-orange to-cricket-green rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Admin Access</h2>
          <p className="text-gray-400">Cricket Auction Platform</p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="space-y-6">
            {/* Secure Login Indicator */}
            <div className="bg-blue-600 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-300">
                <Lock className="text-sm" />
                <span className="text-sm font-medium">Secure Login</span>
              </div>
              <p className="text-xs text-blue-200 mt-1">Single admin account only</p>
            </div>
            
            {/* Email Field */}
            <div>
              <label className="flex items-center space-x-2 text-gray-300 text-sm font-medium mb-3">
                <Mail className="text-cricket-orange w-4 h-4" />
                <span>Admin Email</span>
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com" 
                className="w-full bg-slate-800 bg-opacity-50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cricket-orange focus:ring-2 focus:ring-cricket-orange focus:ring-opacity-20 transition-all"
                required
              />
              {errors.email && (
                <div className="text-red-400 text-sm mt-2">{errors.email}</div>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label className="flex items-center space-x-2 text-gray-300 text-sm font-medium mb-3">
                <Lock className="text-cricket-green w-4 h-4" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="w-full bg-slate-800 bg-opacity-50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cricket-green focus:ring-2 focus:ring-cricket-green focus:ring-opacity-20 transition-all"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <div className="text-red-400 text-sm mt-2">{errors.password}</div>
              )}
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cricket-green to-emerald-600 hover:from-cricket-green hover:to-cricket-green text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              <span>{isLoading ? "Authenticating..." : "Access Dashboard"}</span>
            </button>
            
            {/* Cancel Button */}
            <button 
              type="button"
              onClick={handleClose}
              className="w-full glass-effect hover:bg-white hover:bg-opacity-10 text-gray-300 font-medium py-3 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-600 border-opacity-30 text-center">
            <div className="flex items-center justify-center space-x-2 text-yellow-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>Secured with Firebase Authentication</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
