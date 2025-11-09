import { useState } from 'react';
import { WorkerCheckin } from '@/hooks/useRealtimeCheckins';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MapPin, Clock, User } from 'lucide-react';

interface WorkerListProps {
  checkins: WorkerCheckin[];
  onWorkerClick?: (checkin: WorkerCheckin) => void;
}

export const WorkerList = ({ checkins, onWorkerClick }: WorkerListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group checkins by worker_id and get the latest for each worker
  const latestCheckins = Object.values(
    checkins.reduce((acc, checkin) => {
      if (!acc[checkin.worker_id] || 
          new Date(checkin.timestamp) > new Date(acc[checkin.worker_id].timestamp)) {
        acc[checkin.worker_id] = checkin;
      }
      return acc;
    }, {} as Record<string, WorkerCheckin>)
  );

  const filteredCheckins = latestCheckins.filter(
    (checkin) =>
      checkin.worker_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkin.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkin.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'paused':
        return 'outline';
      case 'finished':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Active Workers ({filteredCheckins.length})
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workers, jobs, or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {filteredCheckins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No workers found</p>
              </div>
            ) : (
              filteredCheckins.map((checkin) => (
                <Card
                  key={checkin.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onWorkerClick?.(checkin)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">
                          Worker {checkin.worker_id.slice(0, 8)}
                        </span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(checkin.status)} className="text-xs">
                        {checkin.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {checkin.latitude.toFixed(4)}, {checkin.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>
                        {new Date(checkin.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {checkin.comment && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        "{checkin.comment}"
                      </p>
                    )}

                    {checkin.accuracy && (
                      <p className="text-xs text-muted-foreground">
                        Accuracy: ±{checkin.accuracy.toFixed(0)}m
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};