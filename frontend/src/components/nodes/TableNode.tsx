import { Handle, Position } from 'reactflow'
import { Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface TableNodeData {
  tableName: string
  label: string
}

export default function TableNode({ data }: { data: TableNodeData }) {
  return (
    <Card className="min-w-[200px] shadow-lg">
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Database className="mr-2 h-4 w-4 text-blue-500" />
          Table Source
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Table:</div>
          <div className="font-medium text-sm">{data.tableName || 'Select table'}</div>
          {data.label && (
            <div className="text-xs text-muted-foreground">{data.label}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
