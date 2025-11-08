import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, Leaf, Award, Users, Globe, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            <Leaf className="h-4 w-4" />
            Climate Action Meets Economic Opportunity
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            GreenWorks CodeX
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-base">
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
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How GreenWorks CodeX Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Discover Micro-Jobs</h3>
                <p className="text-muted-foreground">
                  Browse climate-resilience opportunities across Europe—from tree planting 
                  to solar maintenance, tailored to your location and skill level.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Learn & Earn</h3>
                <p className="text-muted-foreground">
                  Complete micro-learning modules with interactive quizzes. 
                  Pass the quiz to unlock job completion and earn credits.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Track Your Impact</h3>
                <p className="text-muted-foreground">
                  Monitor your earned credits and estimated CO₂ offset on your 
                  personal impact dashboard. See your contribution grow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">10+</div>
              <div className="text-sm text-muted-foreground">Micro-Jobs Available</div>
            </div>
            <div>
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">10</div>
              <div className="text-sm text-muted-foreground">European Locations</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <Leaf className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">450+</div>
              <div className="text-sm text-muted-foreground">kg CO₂ Impact Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 bg-primary/5 rounded-2xl my-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Make an Impact?</h2>
          <p className="text-lg text-muted-foreground">
            {user 
              ? "Continue your journey towards a more sustainable future while earning economic rewards."
              : "Join GreenWorks CodeX today and start your journey towards a more sustainable future while earning economic rewards."
            }
          </p>
          {user ? (
            <Button asChild size="lg">
              <Link to="/jobs">
                <Briefcase className="mr-2 h-5 w-5" />
                Browse Available Jobs
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
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
      </section>
    </div>
  );
};

export default Index;
