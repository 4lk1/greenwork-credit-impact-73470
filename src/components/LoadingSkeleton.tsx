import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const PageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>

        {/* Content skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="gradient-card">
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="gradient-card shadow-soft">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-7 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const DetailPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-5 w-64" />
        
        {/* Title section */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Content cards */}
        <div className="space-y-6">
          <Card className="gradient-card shadow-medium">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-medium">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Skeleton className="h-12 w-40 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile header */}
        <Card className="gradient-card shadow-medium">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="gradient-card shadow-soft">
              <CardContent className="pt-6 text-center space-y-2">
                <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
                <Skeleton className="h-8 w-24 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form sections */}
        <Card className="gradient-card shadow-medium">
          <CardContent className="pt-6 space-y-6">
            <Skeleton className="h-7 w-48" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
