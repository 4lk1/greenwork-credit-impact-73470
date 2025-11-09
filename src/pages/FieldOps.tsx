import { useState } from 'react';
import { useRealtimeCheckins } from '@/hooks/useRealtimeCheckins';
import { MapView } from '@/components/MapView';
import { WorkerList } from '@/components/WorkerList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, List, Activity } from 'lucide-react';

const FieldOps = () => {
  const { checkins, loading } = useRealtimeCheckins();
  const [activeTab, setActiveTab] = useState('map');

  // Calculate stats
  const activeWorkers = new Set(
    checkins.filter(c => c.status === 'active').map(c => c.worker_id)
  ).size;
  const totalJobs = new Set(checkins.map(c => c.job_id)).size;
  const recentCheckins = checkins.filter(
    c => new Date().getTime() - new Date(c.timestamp).getTime() < 3600000
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Field Operations Center</h1>
          <p className="text-muted-foreground">
            Real-time tracking and coordination of field workers and micro-jobs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Workers</CardDescription>
              <CardTitle className="text-3xl">{activeWorkers}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="gap-1">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl">{totalJobs}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">In Progress</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recent Check-ins</CardDescription>
              <CardTitle className="text-3xl">{recentCheckins}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Last Hour</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardContent className="p-0 h-full">
                    {checkins.length > 0 ? (
                      <MapView checkins={checkins} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>No active workers to display</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-1">
                <WorkerList checkins={checkins} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <WorkerList checkins={checkins} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FieldOps;