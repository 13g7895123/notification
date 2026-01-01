import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { SendNotification } from './pages/SendNotification';
import { Messages } from './pages/Messages';
import { Logs } from './pages/Logs';
import { Templates } from './pages/Templates';
import { ApiKeys } from './pages/ApiKeys';
import { ApiUsage } from './pages/ApiUsage';
import { ApiDocs } from './pages/ApiDocs';
import { UserManagement } from './pages/UserManagement';
import { SchedulerManagement } from './pages/SchedulerManagement';
import { WindowsNotifications } from './pages/WindowsNotifications';
import { Changelog } from './pages/Changelog';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* 公開路由 */}
            <Route path="/login" element={<Login />} />

            {/* 受保護的路由 */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/channels" element={<Channels />} />
                    <Route path="/send" element={<SendNotification />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/api-keys" element={<ApiKeys />} />
                    <Route path="/api-usage" element={<ApiUsage />} />
                    <Route path="/api-docs" element={<ApiDocs />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/scheduler" element={<SchedulerManagement />} />
                    <Route path="/windows-notifications" element={<WindowsNotifications />} />
                    <Route path="/changelog" element={<Changelog />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
