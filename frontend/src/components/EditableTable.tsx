import { useState } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { Table, Record as TableRecord, Field } from '../types'
import { Button } from './ui/Button'
import { FieldConfigModal } from './FieldConfigModal'
import axios from 'axios'

interface EditableTableProps {
  table: Table
  tables: Table[]
  records: TableRecord[]
  onUpdate: () => void
}

export function EditableTable({ table, tables, records, onUpdate }: EditableTableProps) {
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
      
      await axios.patch(`http://localhost:8000/api/t/${encodeURIComponent(table.name)}/records/${recordId}`, {
        data: updatedData
      })
      
      setEditingCell(null)
      onUpdate()
    } catch (err) {
      console.error('Error updating cell:', err)
    }
  }

  const handleAddField = async (config: {
    name: string
    display_name: string
    field_type: 'text' | 'number' | 'relation'
    relation_table?: string
  }) => {
    try {
      // Add field to table
      await axios.post(`http://localhost:8000/api/tables/${table.id}/fields`, {
        name: config.name,
        display_name: config.display_name,
        field_type: config.field_type,
        required: false,
        relation_table: config.relation_table
      })

      setAddingField(false)
      onUpdate()
    } catch (err) {
      console.error('Error adding field:', err)
      alert('Error adding field: ' + (err as Error).message)
    }
  }

  const handleDeleteField = async (fieldId: number) => {
    console.log('Deleting field:', fieldId)

    try {
      console.log('Sending delete request...')
      const response = await axios.delete(`http://localhost:8000/api/fields/${fieldId}`)
      console.log('Delete response:', response.data)
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
      if (table.fields.length === 0) {
        alert('Please add at least one column first')
        return
      }

      const emptyData: Record<string, any> = {}
      table.fields.forEach(field => {
        emptyData[field.name] = ''
      })

      console.log('Adding record with data:', emptyData)
      console.log('Table name:', table.name)
      
      const response = await axios.post(`http://localhost:8000/api/t/${encodeURIComponent(table.name)}`, {
        data: emptyData
      })

      console.log('Record added successfully:', response.data)
      
      // Force refresh after a short delay
      await new Promise(resolve => setTimeout(resolve, 200))
      onUpdate()
    } catch (err) {
      console.error('Error adding record:', err)
      alert('Error adding record: ' + (err as Error).message)
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    console.log('Deleting record:', recordId)
    
    try {
      console.log('Sending delete record request...')
      const response = await axios.delete(`http://localhost:8000/api/t/${encodeURIComponent(table.name)}/records/${recordId}`)
      console.log('Delete record response:', response.data)
      onUpdate()
    } catch (err) {
      console.error('Error deleting record:', err)
      alert('Error deleting record: ' + (err as Error).message)
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
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('DELETE COLUMN CLICKED for field:', field.id)
                            handleDeleteField(field.id)
                          }}
                          className="relative z-10 ml-2 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
                          title="Delete column"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </th>
              ))}
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
                <td className="border border-gray-300 px-2 py-2 relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('DELETE BUTTON CLICKED for record:', record.id)
                      handleDeleteRecord(record.id)
                    }}
                    className="relative z-10 p-2 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    title="Delete row"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td colSpan={table.fields.length + 3} className="border border-gray-300 px-3 py-2 text-center">
                <button
                  onClick={handleAddRecord}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm py-1 px-3 rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {addingField && (
        <FieldConfigModal
          tables={tables}
          onSave={handleAddField}
          onClose={() => setAddingField(false)}
        />
      )}
    </div>
  )
}
