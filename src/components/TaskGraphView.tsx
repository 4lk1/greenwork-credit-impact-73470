import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { JobTask } from '@/hooks/useTaskGraph';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, Circle, PlayCircle } from 'lucide-react';

interface TaskGraphViewProps {
  tasks: JobTask[];
}

const TaskNode = ({ data }: { data: any }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 border-green-500';
      case 'in_progress':
        return 'bg-blue-50 border-blue-500';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  return (
    <Card className={`w-64 shadow-md ${getStatusColor(data.status)} border-2`}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {getStatusIcon(data.status)}
            <CardTitle className="text-sm font-semibold line-clamp-2">
              {data.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1">
          <Badge variant={data.status === 'done' ? 'default' : 'secondary'} className="text-xs">
            {data.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Order: {data.order_index}
          </Badge>
        </div>

        {data.started_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Started: {new Date(data.started_at).toLocaleString()}</span>
          </div>
        )}

        {data.completed_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>Done: {new Date(data.completed_at).toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  taskNode: TaskNode,
};

export const TaskGraphView = ({ tasks }: TaskGraphViewProps) => {
  // Convert tasks to ReactFlow nodes
  const createNodes = useCallback((): Node[] => {
    return tasks.map((task, index) => ({
      id: task.id,
      type: 'taskNode',
      position: { x: 300 * (index % 3), y: 200 * Math.floor(index / 3) },
      data: task,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
  }, [tasks]);

  // Convert task dependencies to ReactFlow edges
  const createEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];
    
    tasks.forEach((task) => {
      if (task.depends_on && task.depends_on.length > 0) {
        task.depends_on.forEach((depId) => {
          const sourceTask = tasks.find((t) => t.id === depId);
          if (sourceTask) {
            edges.push({
              id: `${depId}-${task.id}`,
              source: depId,
              target: task.id,
              type: 'smoothstep',
              animated: sourceTask.status !== 'done',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: sourceTask.status === 'done' ? '#22c55e' : '#94a3b8',
              },
              style: {
                stroke: sourceTask.status === 'done' ? '#22c55e' : '#94a3b8',
                strokeWidth: 2,
              },
            });
          }
        });
      }
    });

    return edges;
  }, [tasks]);

  const [nodes, , onNodesChange] = useNodesState(createNodes());
  const [edges, , onEdgesChange] = useEdgesState(createEdges());

  // Update nodes and edges when tasks change
  useCallback(() => {
    onNodesChange([
      { type: 'reset', item: createNodes() } as any,
    ]);
    onEdgesChange([
      { type: 'reset', item: createEdges() } as any,
    ]);
  }, [tasks, createNodes, createEdges, onNodesChange, onEdgesChange]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={createNodes()}
        edges={createEdges()}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};