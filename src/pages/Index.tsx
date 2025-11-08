import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, Leaf, Award, Users, Globe, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaggeredGrid } from "@/components/StaggeredGrid";

const Index = () => {
  const { user } = useAuth();

  const featureCards = [
    {
      icon: Briefcase,
      title: "Discover Micro-Jobs",
      description: "Browse climate-resilience opportunities across Europe—from tree planting to solar maintenance, tailored to your location and skill level."
    },
    {
      icon: Award,
      title: "Learn & Earn",
      description: "Complete micro-learning modules with interactive quizzes. Pass the quiz to unlock job completion and earn credits."
    },
    {
      icon: TrendingUp,
      title: "Track Your Impact",
      description: "Monitor your earned credits and estimated CO₂ offset on your personal impact dashboard. See your contribution grow."
    }
  ];

  const stats = [
    { icon: Users, value: "10+", label: "Micro-Jobs Available" },
    { icon: Globe, value: "10", label: "European Locations" },
    { icon: Leaf, value: "450+", label: "kg CO₂ Impact Potential" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="absolute inset-0 gradient-hero opacity-50 -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium shadow-soft hover:shadow-medium transition-smooth animate-fade-in">
            <Leaf className="h-4 w-4" />
            Climate Action Meets Economic Opportunity
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-br from-foreground via-primary to-earth bg-clip-text text-transparent animate-fade-in">
            GreenWorks CodeX
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Climate-resilience micro-jobs and learning for vulnerable communities in Europe.
          </p>

          {!user && (
            <Alert className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
              <UserPlus className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                <strong>Welcome!</strong> Sign up or log in to start earning credits and making a climate impact.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
            <Button asChild size="lg" variant="premium" className="text-base">
              <Link to="/regions">
                <Globe className="mr-2 h-5 w-5" />
                Explore European Regions
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/jobs">
                <Briefcase className="mr-2 h-5 w-5" />
                Browse Micro-Jobs
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-base">
              <Link to="/impact">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Impact
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            How GreenWorks CodeX Works
          </h2>
          
          <StaggeredGrid 
            className="grid md:grid-cols-3 gap-8"
            staggerDelay={150}
          >
            {featureCards.map((feature) => (
              <Card key={feature.title} className="gradient-card border-2 hover:border-primary transition-smooth hover:shadow-large group">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover:shadow-glow transition-smooth group-hover:scale-110">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <StaggeredGrid 
            className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center"
            staggerDelay={120}
          >
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className={`group ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <div className="h-16 w-16 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover:shadow-glow transition-smooth group-hover:scale-110">
                  <stat.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-earth bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 my-16">
        <div className="gradient-hero rounded-3xl p-12 shadow-large border border-primary/20 backdrop-blur-glass">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-earth bg-clip-text text-transparent">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg text-muted-foreground">
              {user 
                ? "Continue your journey towards a more sustainable future while earning economic rewards."
                : "Join GreenWorks CodeX today and start your journey towards a more sustainable future while earning economic rewards."
              }
            </p>
            {user ? (
              <Button asChild size="lg" variant="premium">
                <Link to="/jobs">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Browse Available Jobs
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="premium">
                  <Link to="/auth">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sign Up Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/regions">
                    <Globe className="mr-2 h-5 w-5" />
                    Explore Regions
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
