import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Table as TableIcon, Edit, Trash2 } from 'lucide-react'
import { tablesApi, recordsApi } from '../lib/api'
import { Table, Record as TableRecord } from '../types'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [showCreateRecord, setShowCreateRecord] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TableRecord | null>(null)

  const queryClient = useQueryClient()

  // Fetch tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesApi.getAll().then(res => res.data),
  })

  // Fetch records for selected table
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['records', selectedTable?.name],
    queryFn: () => selectedTable ? recordsApi.getAll(selectedTable.name).then(res => res.data) : [],
    enabled: !!selectedTable,
  })

  if (tablesLoading) {
    return <div className="flex items-center justify-center h-64">Loading tables...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tables</h1>
        <Button onClick={() => setShowCreateTable(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Table
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
              <CardDescription>Select a table to view its data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTable?.id === table.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex items-center space-x-2">
                    <TableIcon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{table.display_name}</div>
                      <div className="text-sm opacity-70">{table.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Table Data */}
        <div className="lg:col-span-2">
          {selectedTable ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTable.display_name}</CardTitle>
                    <CardDescription>{selectedTable.description}</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateRecord(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <div className="text-center py-8">Loading records...</div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No records found. Add some data to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">ID</th>
                          {selectedTable.fields.map((field) => (
                            <th key={field.id} className="text-left p-2 font-medium">
                              {field.display_name}
                            </th>
                          ))}
                          <th className="text-left p-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={record.id} className="border-b hover:bg-accent/50">
                            <td className="p-2">{record.id}</td>
                            {selectedTable.fields.map((field) => (
                              <td key={field.id} className="p-2">
                                {record.data[field.name] || '-'}
                              </td>
                            ))}
                            <td className="p-2">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRecord(record)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm('Delete this record?')) {
                                      recordsApi.delete(selectedTable.name, record.id).then(() => {
                                        queryClient.invalidateQueries({ queryKey: ['records', selectedTable.name] })
                                      })
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <TableIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>Select a table to view its data</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateTable && (
        <CreateTableModal
          onClose={() => setShowCreateTable(false)}
          onSuccess={() => {
            setShowCreateTable(false)
            queryClient.invalidateQueries({ queryKey: ['tables'] })
          }}
        />
      )}

      {/* Create Record Modal */}
      {showCreateRecord && selectedTable && (
        <CreateRecordModal
          table={selectedTable}
          onClose={() => setShowCreateRecord(false)}
          onSuccess={() => {
            setShowCreateRecord(false)
            queryClient.invalidateQueries({ queryKey: ['records', selectedTable.name] })
          }}
        />
      )}

      {/* Edit Record Modal */}
      {editingRecord && selectedTable && (
        <EditRecordModal
          table={selectedTable}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null)
            queryClient.invalidateQueries({ queryKey: ['records', selectedTable.name] })
          }}
        />
      )}
    </div>
  )
}

// Create Table Modal Component
function CreateTableModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    fields: [{ name: '', display_name: '', field_type: 'text', required: false }]
  })

  const createTableMutation = useMutation({
    mutationFn: tablesApi.create,
    onSuccess,
  })

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', display_name: '', field_type: 'text', required: false }]
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const updateField = (index: number, field: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTableMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Table</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., users"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="e.g., Users"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Fields</label>
                <Button type="button" size="sm" onClick={addField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field
                </Button>
              </div>
              {formData.fields.map((field, index) => (
                <div key={index} className="border rounded p-3 mb-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Field name (e.g., email)"
                      value={field.name}
                      onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                    />
                    <Input
                      placeholder="Display name (e.g., Email)"
                      value={field.display_name}
                      onChange={(e) => updateField(index, { ...field, display_name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <select
                      value={field.field_type}
                      onChange={(e) => updateField(index, { ...field, field_type: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                          className="mr-1"
                        />
                        Required
                      </label>
                      {formData.fields.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTableMutation.isPending}>
                {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Create Record Modal Component
function CreateRecordModal({ 
  table, 
  onClose, 
  onSuccess 
}: { 
  table: Table; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState<any>({})

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => recordsApi.create(table.name, { data }),
    onSuccess,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRecordMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Add Record to {table.display_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {table.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-1">
                  {field.display_name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input
                  type={field.field_type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    [field.name]: field.field_type === 'number' ? Number(e.target.value) : e.target.value 
                  }))}
                  required={field.required}
                />
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRecordMutation.isPending}>
                {createRecordMutation.isPending ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Edit Record Modal Component
function EditRecordModal({ 
  table, 
  record, 
  onClose, 
  onSuccess 
}: { 
  table: Table; 
  record: TableRecord; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState<any>(record.data)

  const updateRecordMutation = useMutation({
    mutationFn: (data: any) => recordsApi.update(table.name, record.id, { data }),
    onSuccess,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateRecordMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Edit Record in {table.display_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {table.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-1">
                  {field.display_name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input
                  type={field.field_type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    [field.name]: field.field_type === 'number' ? Number(e.target.value) : e.target.value 
                  }))}
                  required={field.required}
                />
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRecordMutation.isPending}>
                {updateRecordMutation.isPending ? 'Updating...' : 'Update Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
