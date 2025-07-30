import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { signInWithEmailAndPassword, auth, hasFirebaseCredentials } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import cricketImage from "@assets/image_1753847253370.png";
import isteLogoImage from "@assets/image_1753846973849.png";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginForm) => {
    if (!hasFirebaseCredentials || !auth) {
      toast({
        title: "Configuration Error",
        description: "Firebase authentication is not properly configured.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
      });
      setLocation("/dashboard");
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
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Cricket Background - Fixed */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url(${cricketImage})`,
            filter: 'brightness(0.2)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-gray-900/70 to-neutral-900/80"></div>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 min-h-screen w-full overflow-y-auto">
        {/* Back Button - Fixed to top left corner */}
        <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 w-fit">
          <button
            onClick={() => setLocation("/")}
            className="group relative overflow-hidden flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/40 hover:from-slate-700/70 hover:to-slate-600/60 border border-slate-500/30 hover:border-emerald-400/40 rounded-xl sm:rounded-2xl backdrop-blur-lg transition-all duration-300 ease-out shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:scale-105 touch-manipulation"
          >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/5 group-hover:to-teal-400/5 rounded-2xl transition-all duration-300"></div>
            {/* Icon with enhanced styling */}
            <div className="relative z-10 p-1 bg-slate-700/30 group-hover:bg-emerald-400/20 rounded-lg transition-all duration-300">
              <ArrowLeft className="h-4 w-4 text-slate-300 group-hover:text-emerald-300 transition-all duration-300 group-hover:translate-x-[-2px]" />
            </div>
            
            {/* Text with premium styling */}
            <span className="relative z-10 text-xs sm:text-sm font-semibold text-slate-300 group-hover:text-white transition-all duration-300 tracking-wide">
              Back to Home
            </span>
            
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] transform skew-x-12"></div>
          </button>
        </div>

        {/* Login Content - Scrollable */}
        <div className="flex flex-col min-h-screen px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Main Content Area - Centered with reduced top padding on desktop */}
          <div className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-5">
            <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 shadow-xl rounded-full overflow-hidden bg-white">
                  <img 
                    src={isteLogoImage} 
                    alt="ISTE Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-50 mb-2">Admin Access</h1>
                <p className="text-slate-300 text-sm sm:text-base">Cricket Auction Platform</p>
              </div>

              {/* Login Card */}
              <Card className="shadow-2xl bg-slate-800/60 border-slate-600/40 backdrop-blur-sm">
                <CardHeader className="text-center pb-4 px-4 sm:px-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Secure Login</h2>
                </CardHeader>
                
                <CardContent className="px-4 sm:px-6 pb-6">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                  
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-emerald-400" />
                      Admin Email
                    </Label>
                    <Input
                      type="email"
                      {...form.register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
                      placeholder="admin@example.com"
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200 flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-emerald-400" />
                      Password
                    </Label>
                    <Input
                      type="password"
                      {...form.register("password", { 
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters"
                        }
                      })}
                      className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold h-11 sm:h-12 rounded-lg shadow-lg transition-all duration-200 mt-6 touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Access Dashboard
                      </>
                    )}
                  </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer - Always visible at bottom */}
          <div className="flex-shrink-0 pb-6 sm:pb-8 mt-8">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                🔒 Secured with Firebase Authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}