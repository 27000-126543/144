import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { AppLayout } from '../components/Layout/AppLayout';
import type { UserRole } from '../types';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Messages from '../pages/Messages';
import FarmerDashboard from '../pages/farmer/Dashboard';
import FarmerPlanting from '../pages/farmer/Planting';
import FarmerTraceCodes from '../pages/farmer/TraceCodes';
import FarmerPesticide from '../pages/farmer/Pesticide';
import FarmerSubsidy from '../pages/farmer/Subsidy';
import BuyerDashboard from '../pages/buyer/Dashboard';
import BuyerScan from '../pages/buyer/Scan';
import BuyerBatches from '../pages/buyer/Batches';
import InspectorDashboard from '../pages/inspector/Dashboard';
import InspectorTasks from '../pages/inspector/Tasks';
import InspectorReports from '../pages/inspector/Reports';
import CertifierDashboard from '../pages/certifier/Dashboard';
import CertifierReviews from '../pages/certifier/Reviews';
import CertifierCertificates from '../pages/certifier/Certificates';
import RegulatorDashboard from '../pages/regulator/Dashboard';
import RegulatorThreshold from '../pages/regulator/Threshold';
import RegulatorComplaints from '../pages/regulator/Complaints';
import RegulatorSubsidyApproval from '../pages/regulator/SubsidyApproval';
import RegulatorReports from '../pages/regulator/Reports';
import ConsumerTrace from '../pages/consumer/Trace';
import ConsumerComplaint from '../pages/consumer/Complaint';
import ConsumerCertificate from '../pages/consumer/Certificate';

const roleRoutes: Record<UserRole, { path: string; element: ReactNode }[]> = {
  farmer: [
    { path: 'dashboard', element: <FarmerDashboard /> },
    { path: 'planting', element: <FarmerPlanting /> },
    { path: 'trace-codes', element: <FarmerTraceCodes /> },
    { path: 'pesticide', element: <FarmerPesticide /> },
    { path: 'subsidy', element: <FarmerSubsidy /> },
  ],
  buyer: [
    { path: 'dashboard', element: <BuyerDashboard /> },
    { path: 'scan', element: <BuyerScan /> },
    { path: 'batches', element: <BuyerBatches /> },
  ],
  inspector: [
    { path: 'dashboard', element: <InspectorDashboard /> },
    { path: 'tasks', element: <InspectorTasks /> },
    { path: 'reports', element: <InspectorReports /> },
  ],
  certifier: [
    { path: 'dashboard', element: <CertifierDashboard /> },
    { path: 'reviews', element: <CertifierReviews /> },
    { path: 'certificates', element: <CertifierCertificates /> },
  ],
  regulator: [
    { path: 'dashboard', element: <RegulatorDashboard /> },
    { path: 'threshold', element: <RegulatorThreshold /> },
    { path: 'complaints', element: <RegulatorComplaints /> },
    { path: 'subsidy-approval', element: <RegulatorSubsidyApproval /> },
    { path: 'reports', element: <RegulatorReports /> },
  ],
  consumer: [
    { path: 'trace', element: <ConsumerTrace /> },
    { path: 'complaint', element: <ConsumerComplaint /> },
    { path: 'certificate', element: <ConsumerCertificate /> },
  ],
};

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return;
    }
  }, [isAuthenticated, user, allowedRoles]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">403 无权限访问</h1>
          <p className="text-gray-500 mb-6">您没有权限访问此页面</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/consumer/trace',
    element: <ConsumerTrace />,
  },
  {
    path: '/consumer/complaint',
    element: <ConsumerComplaint />,
  },
  {
    path: '/consumer/certificate',
    element: <ConsumerCertificate />,
  },
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Messages /> },
    ],
  },
  {
    path: '/farmer',
    element: (
      <ProtectedRoute allowedRoles={['farmer']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      ...roleRoutes.farmer,
    ],
  },
  {
    path: '/buyer',
    element: (
      <ProtectedRoute allowedRoles={['buyer']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      ...roleRoutes.buyer,
    ],
  },
  {
    path: '/inspector',
    element: (
      <ProtectedRoute allowedRoles={['inspector']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      ...roleRoutes.inspector,
    ],
  },
  {
    path: '/certifier',
    element: (
      <ProtectedRoute allowedRoles={['certifier']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      ...roleRoutes.certifier,
    ],
  },
  {
    path: '/regulator',
    element: (
      <ProtectedRoute allowedRoles={['regulator']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      ...roleRoutes.regulator,
    ],
  },
  {
    path: '/404',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
