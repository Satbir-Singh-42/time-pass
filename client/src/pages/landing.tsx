import { Eye, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import cricketImage from "@assets/image_1753847253370.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleViewAuction = () => {
    setLocation("/live");
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden fixed inset-0">
      {/* Cricket Background with Real Image */}
      <div className="absolute inset-0">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url(${cricketImage})`,
            filter: 'brightness(0.3)'
          }}
        ></div>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-gray-900/60 to-neutral-900/70"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto w-full">
          {/* Main Heading - Responsive Typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-50 mb-4 sm:mb-6 lg:mb-8 leading-tight">
            🏏 Welcome to the Ultimate
            <br className="hidden sm:block" />
            <span className="block sm:inline bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Cricket Auction Arena
            </span>
          </h1>
          
          {/* Subheading - Responsive */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 mb-8 sm:mb-12 lg:mb-16 max-w-4xl mx-auto font-medium px-4">
            Step into the world of team strategy, intense bidding, and player power.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-center max-w-2xl mx-auto">
            {/* View Live Auction Button */}
            <Button 
              onClick={handleViewAuction}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-bold rounded-lg sm:rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 lg:h-16 touch-manipulation"
            >
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2" />
              View Live Auction
            </Button>
            
            {/* Admin Login Button */}
            <Link href="/login" className="w-full sm:w-auto">
              <div className="group relative overflow-hidden w-full sm:w-auto min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 lg:h-16 rounded-lg sm:rounded-xl">
                {/* Background with gradient and glow effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/70 via-slate-700/60 to-slate-800/70 border-2 border-slate-300/30 rounded-lg sm:rounded-xl backdrop-blur-sm transition-all duration-500 group-hover:from-slate-700/80 group-hover:via-slate-600/70 group-hover:to-slate-700/80 group-hover:border-emerald-400/70"></div>
                
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] transform skew-x-12"></div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 blur-sm"></div>
                
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="relative z-10 w-full h-full bg-transparent text-slate-100 hover:bg-transparent hover:text-white px-6 sm:px-8 lg:px-10 text-base sm:text-lg lg:text-xl font-bold border-none shadow-none transition-all duration-300 transform group-hover:scale-105"
                >
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 group-hover:text-emerald-300 transition-all duration-300 group-hover:drop-shadow-sm" />
                  <span className="group-hover:drop-shadow-sm transition-all duration-300">Admin Login</span>
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
