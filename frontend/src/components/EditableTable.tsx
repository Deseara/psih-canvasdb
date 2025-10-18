import { useState } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
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
  const [editingField, setEditingField] = useState<number | null>(null)
  const [editFieldName, setEditFieldName] = useState('')

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

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('Delete this column? All data in this column will be lost.')) return

    try {
      await axios.delete(`http://localhost:8000/api/fields/${fieldId}`)
      onUpdate()
    } catch (err) {
      console.error('Error deleting field:', err)
      alert('Error deleting field: ' + (err as Error).message)
    }
  }

  const handleEditField = async (fieldId: number) => {
    if (!editFieldName.trim()) return

    try {
      await axios.patch(`http://localhost:8000/api/fields/${fieldId}`, {
        display_name: editFieldName
      })
      setEditingField(null)
      setEditFieldName('')
      onUpdate()
    } catch (err) {
      console.error('Error updating field:', err)
    }
  }

  const handleAddRecord = async () => {
    try {
      const emptyData: Record<string, any> = {}
      table.fields.forEach(field => {
        emptyData[field.name] = ''
      })

      const response = await axios.post(`http://localhost:8000/api/t/${table.name}`, {
        data: emptyData
      })

      console.log('Record added:', response.data)
      onUpdate()
    } catch (err) {
      console.error('Error adding record:', err)
      alert('Error adding record: ' + (err as Error).message)
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
                  <div className="flex items-center justify-between group">
                    {editingField === field.id ? (
                      <input
                        type="text"
                        value={editFieldName}
                        onChange={(e) => setEditFieldName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditField(field.id)
                          if (e.key === 'Escape') setEditingField(null)
                        }}
                        onBlur={() => handleEditField(field.id)}
                        className="w-full px-2 py-1 text-sm bg-white text-gray-900 rounded"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span
                          onClick={() => {
                            setEditingField(field.id)
                            setEditFieldName(field.display_name)
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {field.display_name}
                        </span>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="opacity-0 group-hover:opacity-100 ml-2 text-red-300 hover:text-red-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
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
            {/* Empty row for adding new records */}
            <tr className="bg-blue-50">
              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-400">
                +
              </td>
              {table.fields.map((field) => (
                <td
                  key={field.id}
                  className="border border-gray-300 px-3 py-2 text-sm cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    // Create new record and start editing
                    handleAddRecord()
                  }}
                >
                  <span className="text-gray-400 italic">Click to add...</span>
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-2"></td>
              <td className="border border-gray-300 px-2 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
