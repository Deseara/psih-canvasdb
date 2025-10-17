import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Play, Plus, Save, Database, Filter, GitMerge, Webhook } from 'lucide-react'

import { canvasApi, tablesApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import TableNode from '../components/nodes/TableNode'
import FilterNode from '../components/nodes/FilterNode'
import JoinNode from '../components/nodes/JoinNode'
import WebhookNode from '../components/nodes/WebhookNode'

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
  filterNode: FilterNode,
  joinNode: JoinNode,
  webhookNode: WebhookNode,
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export default function CanvasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedCanvas, setSelectedCanvas] = useState<number | null>(null)
  const [showNodePanel, setShowNodePanel] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const queryClient = useQueryClient()

  // Fetch canvases
  const { data: canvases = [] } = useQuery({
    queryKey: ['canvases'],
    queryFn: () => canvasApi.getAll().then(res => res.data),
  })

  // Fetch tables for node configuration
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesApi.getAll().then(res => res.data),
  })

  // Load canvas
  const { data: currentCanvas } = useQuery({
    queryKey: ['canvas', selectedCanvas],
    queryFn: () => selectedCanvas ? canvasApi.getById(selectedCanvas).then(res => res.data) : null,
    enabled: !!selectedCanvas,
  })

  // Update nodes and edges when canvas loads
  React.useEffect(() => {
    if (currentCanvas) {
      setNodes(currentCanvas.nodes || [])
      setEdges(currentCanvas.edges || [])
    }
  }, [currentCanvas, setNodes, setEdges])

  // Save canvas mutation
  const saveCanvasMutation = useMutation({
    mutationFn: (data: { id?: number; name: string; nodes: Node[]; edges: Edge[] }) => {
      if (data.id) {
        return canvasApi.update(data.id, { nodes: data.nodes, edges: data.edges })
      } else {
        return canvasApi.create({ name: data.name, nodes: data.nodes, edges: data.edges })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvases'] })
    },
  })

  // Execute canvas mutation
  const executeCanvasMutation = useMutation({
    mutationFn: ({ canvasId, viewName }: { canvasId: number; viewName?: string }) =>
      canvasApi.execute(canvasId, viewName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] })
      setShowExecuteModal(false)
      alert('Canvas executed successfully! Check the Views page to see results.')
    },
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: getDefaultNodeData(type),
    }
    setNodes((nds) => [...nds, newNode])
    setShowNodePanel(false)
  }

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'tableNode':
        return { tableName: '', label: 'Table Source' }
      case 'filterNode':
        return { condition: '', label: 'Filter Data' }
      case 'joinNode':
        return { joinTable: '', joinField: '', targetField: '', label: 'Join Tables' }
      case 'webhookNode':
        return { webhookUrl: '', label: 'Send to Webhook' }
      default:
        return {}
    }
  }

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    )
  }

  const saveCanvas = () => {
    const name = currentCanvas?.name || `Canvas_${Date.now()}`
    saveCanvasMutation.mutate({
      id: selectedCanvas || undefined,
      name,
      nodes,
      edges,
    })
  }

  const executeCanvas = () => {
    if (!selectedCanvas) {
      // Save first if not saved
      const name = `Canvas_${Date.now()}`
      saveCanvasMutation.mutate(
        { name, nodes, edges },
        {
          onSuccess: (response) => {
            executeCanvasMutation.mutate({ canvasId: response.data.id })
          },
        }
      )
    } else {
      setShowExecuteModal(true)
    }
  }

  const loadDemoCanvas = () => {
    // Load the demo canvas (ID 1)
    setSelectedCanvas(1)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Canvas</h1>
            <select
              value={selectedCanvas || ''}
              onChange={(e) => setSelectedCanvas(e.target.value ? Number(e.target.value) : null)}
              className="border rounded px-3 py-1"
            >
              <option value="">New Canvas</option>
              {canvases.map((canvas) => (
                <option key={canvas.id} value={canvas.id}>
                  {canvas.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={loadDemoCanvas}>
              Load Demo
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNodePanel(!showNodePanel)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Node
            </Button>
            <Button size="sm" variant="outline" onClick={saveCanvas}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button size="sm" onClick={executeCanvas}>
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Panel */}
        {showNodePanel && (
          <div className="w-64 border-r bg-card p-4">
            <h3 className="font-medium mb-4">Add Nodes</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('tableNode')}
              >
                <Database className="mr-2 h-4 w-4" />
                Table Source
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('filterNode')}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('joinNode')}
              >
                <GitMerge className="mr-2 h-4 w-4" />
                Join
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('webhookNode')}
              >
                <Webhook className="mr-2 h-4 w-4" />
                Webhook
              </Button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Node Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-card p-4">
            <NodePropertiesPanel
              node={selectedNode}
              tables={tables}
              onUpdate={(data) => updateNodeData(selectedNode.id, data)}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* Execute Modal */}
      {showExecuteModal && selectedCanvas && (
        <ExecuteModal
          canvasId={selectedCanvas}
          onExecute={(viewName) => executeCanvasMutation.mutate({ canvasId: selectedCanvas, viewName })}
          onClose={() => setShowExecuteModal(false)}
          isLoading={executeCanvasMutation.isPending}
        />
      )}
    </div>
  )
}

// Node Properties Panel Component
function NodePropertiesPanel({
  node,
  tables,
  onUpdate,
  onClose,
}: {
  node: Node
  tables: any[]
  onUpdate: (data: any) => void
  onClose: () => void
}) {
  const [data, setData] = useState(node.data)

  const handleUpdate = (field: string, value: any) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onUpdate(newData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Node Properties</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {node.type === 'tableNode' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Table</label>
              <select
                value={data.tableName || ''}
                onChange={(e) => handleUpdate('tableName', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.name}>
                    {table.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <Input
                value={data.label || ''}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Node label"
              />
            </div>
          </>
        )}

        {node.type === 'filterNode' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <Input
                value={data.condition || ''}
                onChange={(e) => handleUpdate('condition', e.target.value)}
                placeholder="e.g., available > 0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <Input
                value={data.label || ''}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Node label"
              />
            </div>
          </>
        )}

        {node.type === 'joinNode' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Join Table</label>
              <select
                value={data.joinTable || ''}
                onChange={(e) => handleUpdate('joinTable', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.name}>
                    {table.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Join Field</label>
              <Input
                value={data.joinField || ''}
                onChange={(e) => handleUpdate('joinField', e.target.value)}
                placeholder="e.g., id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Field</label>
              <Input
                value={data.targetField || ''}
                onChange={(e) => handleUpdate('targetField', e.target.value)}
                placeholder="e.g., variant_id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <Input
                value={data.label || ''}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Node label"
              />
            </div>
          </>
        )}

        {node.type === 'webhookNode' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Webhook URL</label>
              <Input
                value={data.webhookUrl || ''}
                onChange={(e) => handleUpdate('webhookUrl', e.target.value)}
                placeholder="https://webhook.site/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <Input
                value={data.label || ''}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Node label"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Execute Modal Component
function ExecuteModal({
  canvasId,
  onExecute,
  onClose,
  isLoading,
}: {
  canvasId: number
  onExecute: (viewName?: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [viewName, setViewName] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Execute Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">View Name (optional)</label>
              <Input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => onExecute(viewName || undefined)} disabled={isLoading}>
                {isLoading ? 'Executing...' : 'Execute'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
