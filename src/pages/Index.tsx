import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, Leaf, Award, Users, Globe, UserPlus, Code2, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaggeredGrid } from "@/components/StaggeredGrid";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const featureCards = [
    {
      icon: Briefcase,
      title: t("home.feature1.title"),
      description: t("home.feature1.desc"),
    },
    {
      icon: Award,
      title: t("home.feature2.title"),
      description: t("home.feature2.desc"),
    },
    {
      icon: TrendingUp,
      title: t("home.feature3.title"),
      description: t("home.feature3.desc"),
    },
  ];

  const stats = [
    { icon: Users, value: "10+", label: t("home.stat1") },
    { icon: Globe, value: "10", label: t("home.stat2") },
    { icon: Leaf, value: "450+", label: t("home.stat3") },
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
            {t("home.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-br from-foreground via-primary to-earth bg-clip-text text-transparent animate-fade-in">
            {t("home.title")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            {t("home.subtitle")}
          </p>

          {!user && (
            <Alert className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
              <UserPlus className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{t("home.welcomeAlert")}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
            <Button asChild size="lg" variant="premium" className="text-base">
              <Link to="/regions">
                <Globe className="mr-2 h-5 w-5" />
                {t("home.exploreRegions")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/jobs">
                <Briefcase className="mr-2 h-5 w-5" />
                {t("home.browseMicroJobs")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-base">
              <Link to="/impact">
                <TrendingUp className="mr-2 h-5 w-5" />
                {t("home.viewImpact")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* App Introduction Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="gradient-card border-2 border-primary/20 shadow-large">
            <CardContent className="pt-8 pb-8 px-6 md:px-12">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
                    <Leaf className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    About GreenWorks
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    GreenWorks is an innovative platform that connects sustainability with action. We empower
                    individuals across Europe to contribute to environmental conservation through accessible micro-jobs,
                    while earning rewards and making a real impact on our planet&apos;s future. Every task completed is
                    a step toward a greener tomorrow.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our mission is to democratize environmental action by breaking down large sustainability goals into
                    manageable, rewarding tasks that anyone can complete. From tree planting initiatives to waste
                    reduction campaigns, each micro-job contributes to measurable CO₂ reduction and ecosystem
                    restoration.
                  </p>
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <Code2 className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      Crafted with <Heart className="h-4 w-4 text-destructive fill-destructive" /> by the{" "}
                      <span className="font-semibold text-foreground">Codex Developer Team</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {t("home.howItWorks")}
          </h2>

          <StaggeredGrid className="grid md:grid-cols-3 gap-8" staggerDelay={150}>
            {featureCards.map((feature) => (
              <Card
                key={feature.title}
                className="gradient-card border-2 hover:border-primary transition-smooth hover:shadow-large group"
              >
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover:shadow-glow transition-smooth group-hover:scale-110">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <StaggeredGrid className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center" staggerDelay={120}>
            {stats.map((stat, index) => (
              <div key={stat.label} className={`group ${index === 2 ? "col-span-2 md:col-span-1" : ""}`}>
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
              {t("home.ctaTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {user ? t("home.ctaDescLoggedIn") : t("home.ctaDescLoggedOut")}
            </p>
            {user ? (
              <Button asChild size="lg" variant="premium">
                <Link to="/jobs">
                  <Briefcase className="mr-2 h-5 w-5" />
                  {t("home.browseAvailableJobs")}
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="premium">
                  <Link to="/auth">
                    <UserPlus className="mr-2 h-5 w-5" />
                    {t("auth.signUpFree")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/regions">
                    <Globe className="mr-2 h-5 w-5" />
                    {t("home.exploreRegionsBtn")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Credits */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span>© 2025 GreenWorks. Building a sustainable future together.</span>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span>
              Developed by <span className="font-semibold text-foreground">Codex</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
