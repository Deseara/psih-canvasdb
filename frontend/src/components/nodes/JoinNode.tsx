import { Handle, Position } from 'reactflow'
import { GitMerge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface JoinNodeData {
  joinTable: string
  joinField: string
  targetField: string
  label: string
}

export default function JoinNode({ data }: { data: JoinNodeData }) {
  return (
    <Card className="min-w-[200px] shadow-lg">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <GitMerge className="mr-2 h-4 w-4 text-purple-500" />
          Join
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs">
            <div className="text-muted-foreground">Join Table:</div>
            <div className="font-medium">{data.joinTable || 'Select table'}</div>
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground">On:</div>
            <div className="font-mono text-xs bg-muted/50 p-1 rounded">
              {data.joinField} = {data.targetField}
            </div>
          </div>
          {data.label && (
            <div className="text-xs text-muted-foreground">{data.label}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
