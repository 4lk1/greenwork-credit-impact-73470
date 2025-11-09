import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WorkerCheckin } from '@/hooks/useRealtimeCheckins';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User } from 'lucide-react';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on worker status
const getMarkerIcon = (status: string) => {
  const colors: Record<string, string> = {
    active: '#22c55e',
    idle: '#eab308',
    paused: '#f97316',
    finished: '#6366f1',
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${colors[status] || '#6366f1'};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to update map view when checkins change
const MapUpdater = ({ checkins }: { checkins: WorkerCheckin[] }) => {
  const map = useMap();

  useEffect(() => {
    if (checkins.length > 0) {
      const bounds = L.latLngBounds(
        checkins.map(c => [c.latitude, c.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [checkins, map]);

  return null;
};

interface MapViewProps {
  checkins: WorkerCheckin[];
  centerCoords?: [number, number];
  defaultZoom?: number;
}

export const MapView = ({ checkins, centerCoords = [51.505, -0.09], defaultZoom = 13 }: MapViewProps) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'idle':
        return 'secondary' as const;
      case 'paused':
        return 'outline' as const;
      case 'finished':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        // @ts-ignore - react-leaflet type mismatch
        center={centerCoords}
        zoom={defaultZoom}
        className="w-full h-full rounded-lg"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          // @ts-ignore - react-leaflet type mismatch
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater checkins={checkins} />
        
        {checkins.map((checkin) => {
          const markerIcon = getMarkerIcon(checkin.status);
          return (
            <Marker
              key={checkin.id}
              // @ts-ignore - react-leaflet type mismatch
              position={[checkin.latitude, checkin.longitude]}
              // @ts-ignore - leaflet icon type mismatch
              icon={markerIcon}
            >
            <Popup>
              <Card className="border-0 shadow-none">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Worker {checkin.worker_id.slice(0, 8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {checkin.latitude.toFixed(6)}, {checkin.longitude.toFixed(6)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(checkin.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(checkin.status)}>
                      {checkin.status}
                    </Badge>
                  </div>

                  {checkin.comment && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
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
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};