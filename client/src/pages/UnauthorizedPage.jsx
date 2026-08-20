import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  let homeLink = '/login';
  if (user?.role === 'admin') homeLink = '/admin/dashboard';
  else if (user?.role === 'inventory_manager') homeLink = '/inventory/dashboard';
  else if (user?.role === 'cashier') homeLink = '/pos';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6">You don't have permission to access this page.</p>
        <Link
          to={homeLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
