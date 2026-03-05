import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-primary)'
            }}>
                <div className="loading-spinner" style={{
                    width: 48,
                    height: 48,
                    border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--accent-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const redirectMap = {
            Student: '/dashboard/student',
            Teacher: '/dashboard/teacher',
            Parent: '/dashboard/parent'
        };
        return <Navigate to={redirectMap[user.role] || '/login'} replace />;
    }

    return children;
}
