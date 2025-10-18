import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Table } from '../types'

interface FieldConfigModalProps {
  tables: Table[]
  onSave: (config: {
    name: string
    display_name: string
    field_type: 'text' | 'number' | 'relation'
    relation_table?: string
  }) => void
  onClose: () => void
}

export function FieldConfigModal({ tables, onSave, onClose }: FieldConfigModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'relation'>('text')
  const [relationTable, setRelationTable] = useState('')

  const handleSave = () => {
    if (!displayName.trim()) {
      alert('Please enter field name')
      return
    }

    if (fieldType === 'relation' && !relationTable) {
      alert('Please select related table')
      return
    }

    onSave({
      name: displayName.toLowerCase().replace(/\s+/g, '_'),
      display_name: displayName,
      field_type: fieldType,
      relation_table: fieldType === 'relation' ? relationTable : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Column</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Column Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Customer, Product"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Field Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="relation">Relation (Link to another table)</option>
            </select>
          </div>

          {fieldType === 'relation' && (
            <div>
              <label className="block text-sm font-medium mb-1">Related Table</label>
              <select
                value={relationTable}
                onChange={(e) => setRelationTable(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select table...</option>
                {tables.map(table => (
                  <option key={table.id} value={table.name}>
                    {table.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Add Column
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
