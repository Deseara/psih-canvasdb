import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Database, Workflow, Eye } from 'lucide-react'
import TablesPage from './pages/TablesPage'
import CanvasPage from './pages/CanvasPage'
import ViewsPage from './pages/ViewsPage'

function App() {
  const location = useLocation()

  const navigation = [
    { name: 'Tables', href: '/', icon: Database },
    { name: 'Canvas', href: '/canvas', icon: Workflow },
    { name: 'Views', href: '/views', icon: Eye },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-primary">PSIH CanvasDB</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<TablesPage />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/views" element={<ViewsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
