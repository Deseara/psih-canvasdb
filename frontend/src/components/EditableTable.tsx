import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Table, Record as TableRecord, Field } from '../types'
import { Button } from './ui/Button'
import axios from 'axios'

interface EditableTableProps {
  table: Table
  records: TableRecord[]
  onUpdate: () => void
}

export function EditableTable({ table, records, onUpdate }: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: number; fieldName: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [addingField, setAddingField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')

  const handleCellClick = (record: TableRecord, field: Field) => {
    setEditingCell({ recordId: record.id, fieldName: field.name })
    setEditValue(record.data[field.name] || '')
  }

  const handleCellSave = async (recordId: number, fieldName: string) => {
    try {
      const record = records.find(r => r.id === recordId)
      if (!record) return

      const updatedData = { ...record.data, [fieldName]: editValue }
      
      await axios.patch(`http://localhost:8000/api/t/${table.name}/records/${recordId}`, {
        data: updatedData
      })
      
      setEditingCell(null)
      onUpdate()
    } catch (err) {
      console.error('Error updating cell:', err)
    }
  }

  const handleAddField = async () => {
    if (!newFieldName.trim()) return

    try {
      // Add field to table
      await axios.post(`http://localhost:8000/api/tables/${table.id}/fields`, {
        name: newFieldName.toLowerCase().replace(/\s+/g, '_'),
        display_name: newFieldName,
        field_type: 'text',
        required: false
      })

      setAddingField(false)
      setNewFieldName('')
      onUpdate()
    } catch (err) {
      console.error('Error adding field:', err)
    }
  }

  const handleAddRecord = async () => {
    try {
      const emptyData: Record<string, any> = {}
      table.fields.forEach(field => {
        emptyData[field.name] = ''
      })

      await axios.post(`http://localhost:8000/api/t/${table.name}`, {
        data: emptyData
      })

      onUpdate()
    } catch (err) {
      console.error('Error adding record:', err)
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Delete this record?')) return

    try {
      await axios.delete(`http://localhost:8000/api/t/${table.name}/records/${recordId}`)
      onUpdate()
    } catch (err) {
      console.error('Error deleting record:', err)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border border-blue-400 px-3 py-2 text-left text-sm font-medium w-12">#</th>
              {table.fields.map((field) => (
                <th key={field.id} className="border border-blue-400 px-3 py-2 text-left text-sm font-medium min-w-[150px]">
                  {field.display_name}
                </th>
              ))}
              {addingField ? (
                <th className="border border-blue-400 px-3 py-2 min-w-[150px]">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddField()
                      if (e.key === 'Escape') setAddingField(false)
                    }}
                    onBlur={handleAddField}
                    placeholder="Field name..."
                    className="w-full px-2 py-1 text-sm bg-white text-gray-900 rounded"
                    autoFocus
                  />
                </th>
              ) : (
                <th className="border border-blue-400 px-3 py-2 w-12">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingField(true)}
                    className="text-white hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
              )}
              <th className="border border-blue-400 px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={record.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                  {idx + 1}
                </td>
                {table.fields.map((field) => {
                  const isEditing = editingCell?.recordId === record.id && editingCell?.fieldName === field.name
                  
                  return (
                    <td
                      key={field.id}
                      className="border border-gray-300 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                      onClick={() => !isEditing && handleCellClick(record, field)}
                    >
                      {isEditing ? (
                        <input
                          type={field.field_type === 'number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave(record.id, field.name)
                            if (e.key === 'Escape') setEditingCell(null)
                          }}
                          onBlur={() => handleCellSave(record.id, field.name)}
                          className="w-full px-1 py-0.5 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="block truncate">
                          {record.data[field.name] || ''}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="border border-gray-300 px-3 py-2"></td>
                <td className="border border-gray-300 px-2 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRecord(record.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td colSpan={table.fields.length + 3} className="border border-gray-300 px-3 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddRecord}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
