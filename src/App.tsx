import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PageLoadingSkeleton } from "@/components/LoadingSkeleton";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Impact = lazy(() => import("./pages/Impact"));
const Regions = lazy(() => import("./pages/Regions"));
const RegionDetail = lazy(() => import("./pages/RegionDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Suspense fallback={<PageLoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                <Route path="/jobs" element={<PageTransition><Jobs /></PageTransition>} />
                <Route path="/jobs/:id" element={<PageTransition><JobDetail /></PageTransition>} />
                <Route path="/impact" element={<PageTransition><Impact /></PageTransition>} />
                <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                <Route path="/regions" element={<PageTransition><Regions /></PageTransition>} />
                <Route path="/regions/:id" element={<PageTransition><RegionDetail /></PageTransition>} />
                <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
