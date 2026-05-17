import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import SalesHistory from './pages/SalesHistory';
import Navbar from './components/Navbar';

function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  const showNavbar = user && location.pathname !== '/login' && location.pathname !== '/orders';

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#fff',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600'
          }
        }}
      />
      {children}
      {showNavbar && <Navbar />}
    </>
  );
}

const ProtectedRoute = ({ children, user }: { children: React.ReactNode; user: any }) => {
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const PublicRoute = ({ children, user }: { children: React.ReactNode; user: any }) => {
  if (user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout><ProtectedRoute user={user}><Dashboard /></ProtectedRoute></Layout>
    },
    {
      path: "/login",
      element: <Layout><PublicRoute user={user}><Login /></PublicRoute></Layout>
    },
    {
      path: "/tables",
      element: <Layout><ProtectedRoute user={user}><Tables /></ProtectedRoute></Layout>
    },
    {
      path: "/orders",
      element: <Layout><ProtectedRoute user={user}><Orders /></ProtectedRoute></Layout>
    },
    {
      path: "/products",
      element: <Layout><ProtectedRoute user={user}><Products /></ProtectedRoute></Layout>
    },
    {
      path: "/customers",
      element: <Layout><ProtectedRoute user={user}><Customers /></ProtectedRoute></Layout>
    },
    {
      path: "/finance",
      element: <Layout><ProtectedRoute user={user}><Finance /></ProtectedRoute></Layout>
    },
    {
      path: "/history",
      element: <Layout><ProtectedRoute user={user}><SalesHistory /></ProtectedRoute></Layout>
    },
    {
      path: "/reports",
      element: <Layout><ProtectedRoute user={user}><Reports /></ProtectedRoute></Layout>
    }
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  });

  return <RouterProvider router={router} />;
}
