import { useQuery } from '@tanstack/react-query'
import { Eye, Calendar } from 'lucide-react'
import { viewsApi } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'

export default function ViewsPage() {
  const { data: views = [], isLoading } = useQuery({
    queryKey: ['views'],
    queryFn: () => viewsApi.getAll().then(res => res.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading views...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Views</h1>
      </div>

      {views.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Eye className="mx-auto h-12 w-12 mb-4" />
              <p>No views created yet</p>
              <p className="text-sm">Execute a canvas workflow to create views</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {views.map((view) => (
            <ViewCard key={view.id} view={view} />
          ))}
        </div>
      )}
    </div>
  )
}

function ViewCard({ view }: { view: any }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{view.name}</CardTitle>
          <Eye className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription className="flex items-center text-sm">
          <Calendar className="mr-1 h-3 w-3" />
          {new Date(view.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Canvas ID: {view.canvas_id}
          </div>
          <div className="text-sm">
            <strong>{view.data.length}</strong> records
          </div>
          
          {/* Preview of data */}
          {view.data.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">Preview:</div>
              <div className="bg-muted/50 rounded p-2 text-xs">
                <pre className="whitespace-pre-wrap overflow-hidden">
                  {JSON.stringify(view.data.slice(0, 2), null, 2)}
                  {view.data.length > 2 && '\n...'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
