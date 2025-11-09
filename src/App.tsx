import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { IntroProvider } from "@/contexts/IntroContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PageLoadingSkeleton } from "@/components/LoadingSkeleton";
import { IntroScreen } from "@/components/IntroScreen";
import { lazy, Suspense, memo, useState, useEffect } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Impact = lazy(() => import("./pages/Impact"));
const Regions = lazy(() => import("./pages/Regions"));
const RegionDetail = lazy(() => import("./pages/RegionDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const QuizChat = lazy(() => import("./pages/QuizChat"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const FieldOps = lazy(() => import("./pages/FieldOps"));
const TaskGraph = lazy(() => import("./pages/TaskGraph"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AdminMicroJobs = lazy(() => import("./pages/admin/MicroJobs"));
const AdminMicroJobForm = lazy(() => import("./pages/admin/MicroJobForm"));
const AdminCompletions = lazy(() => import("./pages/admin/Completions"));
const AdminLeaderboards = lazy(() => import("./pages/admin/Leaderboards"));
const AdminData = lazy(() => import("./pages/admin/Data"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = memo(() => {
  const [showIntro, setShowIntro] = useState(true);
  const [hasShownIntro, setHasShownIntro] = useState(false);

  useEffect(() => {
    const introShown = sessionStorage.getItem('introShown');
    if (introShown) {
      setShowIntro(false);
      setHasShownIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('introShown', 'true');
    setShowIntro(false);
    setHasShownIntro(true);
  };

  const handleShowIntro = () => {
    setShowIntro(true);
    setHasShownIntro(false);
  };

  if (showIntro && !hasShownIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <IntroProvider onShowIntro={handleShowIntro}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AdminAuthProvider>
                  <AuthProvider>
                    <Suspense fallback={<PageLoadingSkeleton />}>
                      <Routes>
                        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                        <Route path="/jobs" element={<PageTransition><Jobs /></PageTransition>} />
                        <Route path="/jobs/:id" element={<PageTransition><JobDetail /></PageTransition>} />
                        <Route path="/impact" element={<ProtectedRoute><PageTransition><Impact /></PageTransition></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                        <Route path="/regions" element={<PageTransition><Regions /></PageTransition>} />
                        <Route path="/regions/:id" element={<PageTransition><RegionDetail /></PageTransition>} />
                        <Route path="/quiz" element={<ProtectedRoute><PageTransition><QuizChat /></PageTransition></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><PageTransition><Leaderboard /></PageTransition></ProtectedRoute>} />
                        <Route path="/field-ops" element={<ProtectedRoute><PageTransition><FieldOps /></PageTransition></ProtectedRoute>} />
                        <Route path="/task-graph/:jobId" element={<ProtectedRoute><PageTransition><TaskGraph /></PageTransition></ProtectedRoute>} />
                        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
                        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                          <Route index element={<Suspense fallback={<div>Loading...</div>}><AdminOverview /></Suspense>} />
                          <Route path="users" element={<Suspense fallback={<div>Loading...</div>}><AdminUsers /></Suspense>} />
                          <Route path="users/:id" element={<Suspense fallback={<div>Loading...</div>}><AdminUserDetail /></Suspense>} />
                          <Route path="microjobs" element={<Suspense fallback={<div>Loading...</div>}><AdminMicroJobs /></Suspense>} />
                          <Route path="microjobs/:id/edit" element={<Suspense fallback={<div>Loading...</div>}><AdminMicroJobForm /></Suspense>} />
                          <Route path="completions" element={<Suspense fallback={<div>Loading...</div>}><AdminCompletions /></Suspense>} />
                          <Route path="leaderboards" element={<Suspense fallback={<div>Loading...</div>}><AdminLeaderboards /></Suspense>} />
                          <Route path="data" element={<Suspense fallback={<div>Loading...</div>}><AdminData /></Suspense>} />
                        </Route>
                        
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                      </Routes>
                    </Suspense>
                  </AuthProvider>
                </AdminAuthProvider>
              </BrowserRouter>
          </TooltipProvider>
          </IntroProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
});

App.displayName = 'App';

export default App;
