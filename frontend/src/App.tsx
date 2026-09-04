import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar, type TabType } from './components/Navbar'
import { ToastProvider } from './components/ToastContext'
import { SchedulesPage } from './pages/SchedulesPage'
import { RoomsPage } from './pages/RoomsPage'
import { EventsPage } from './pages/EventsPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { ChatPage } from './pages/ChatPage'

// Configure QueryClient with instant freshness for live synchronization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hash = window.location.hash.replace('#', '') as TabType
    if (['schedules', 'rooms', 'events', 'announcements', 'assignments', 'chat'].includes(hash)) {
      return hash
    }
    return 'schedules'
  })

  useEffect(() => {
    window.location.hash = activeTab
  }, [activeTab])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabType
      if (['schedules', 'rooms', 'events', 'announcements', 'assignments', 'chat'].includes(hash)) {
        setActiveTab(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="app-layout">
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="main-content">
            {activeTab === 'schedules' && <SchedulesPage />}
            {activeTab === 'rooms' && <RoomsPage />}
            {activeTab === 'events' && <EventsPage />}
            {activeTab === 'announcements' && <AnnouncementsPage />}
            {activeTab === 'assignments' && <AssignmentsPage />}
            {activeTab === 'chat' && <ChatPage />}
          </main>

          <footer className="app-footer">
            <div className="footer-content">
              <span>CampusOS — Smart Student Operations & Live AI Assistant</span>
              <span className="footer-sep">•</span>
              <span>AUST CSE Department</span>
              <span className="footer-sep">•</span>
              <span>Synchronized with Neon PostgreSQL & Google Gemini</span>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}
