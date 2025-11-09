import { useParams, useNavigate } from 'react-router-dom';
import { useTaskGraph } from '@/hooks/useTaskGraph';
import { TaskGraphView } from '@/components/TaskGraphView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, GitBranch, CheckCircle2, Clock, Circle } from 'lucide-react';

const TaskGraph = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { tasks, loading } = useTaskGraph(jobId || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Job</CardTitle>
            <CardDescription>No job ID provided</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/field-ops')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Field Ops
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate task stats
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const totalTasks = tasks.length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/field-ops')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
                  <GitBranch className="h-8 w-8" />
                  Task Dependency Graph
                </h1>
                <p className="text-muted-foreground mt-1">
                  Job ID: {jobId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl">{completedTasks}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                In Progress
              </CardDescription>
              <CardTitle className="text-3xl">{inProgressTasks}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                Pending
              </CardDescription>
              <CardTitle className="text-3xl">{pendingTasks}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Progress</CardDescription>
              <CardTitle className="text-3xl">{completionPercent}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={completionPercent === 100 ? 'default' : 'secondary'}>
                {completedTasks} of {totalTasks}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Task Graph */}
        <Card className="h-[calc(100vh-400px)] min-h-[500px]">
          <CardContent className="p-0 h-full">
            {tasks.length > 0 ? (
              <TaskGraphView tasks={tasks} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No tasks found for this job</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/field-ops')}
                  >
                    Back to Field Ops
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskGraph;