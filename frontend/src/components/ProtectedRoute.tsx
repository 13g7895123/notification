import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // 保存嘗試訪問的路徑，登入後可以跳轉回去
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
