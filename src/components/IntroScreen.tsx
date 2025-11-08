import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation after 3.5 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3500);

    // Complete intro after exit animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo Animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative h-32 w-32 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow animate-scale-in">
            <Leaf className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-foreground via-primary to-earth bg-clip-text text-transparent">
            GreenWorks
          </h1>
          <p className="text-lg text-muted-foreground">
            Building a sustainable future together
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center gap-2">
          <div 
            className="h-2 w-2 rounded-full bg-primary animate-pulse" 
            style={{ animationDelay: "0ms" }}
          />
          <div 
            className="h-2 w-2 rounded-full bg-primary animate-pulse" 
            style={{ animationDelay: "200ms" }}
          />
          <div 
            className="h-2 w-2 rounded-full bg-primary animate-pulse" 
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    </div>
  );
};
