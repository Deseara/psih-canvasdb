import { Handle, Position } from 'reactflow'
import { Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface FilterNodeData {
  condition: string
  label: string
}

export default function FilterNode({ data }: { data: FilterNodeData }) {
  return (
    <Card className="min-w-[200px] shadow-lg">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Filter className="mr-2 h-4 w-4 text-green-500" />
          Filter
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Condition:</div>
          <div className="font-mono text-sm bg-muted/50 p-2 rounded">
            {data.condition || 'No condition'}
          </div>
          {data.label && (
            <div className="text-xs text-muted-foreground">{data.label}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
