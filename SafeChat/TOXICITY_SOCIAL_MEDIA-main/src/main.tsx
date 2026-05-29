import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import DMThread from './pages/DMThread';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import CreatePost from './pages/CreatePost';
import Safety from './pages/Safety';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

const storedTheme = localStorage.getItem('theme_mode');
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Feed /> },
      { path: 'explore', element: <Explore /> },
      { path: 'messages', element: <Messages /> },
      { path: 'messages/:id', element: <DMThread /> },
      { path: 'profile/:username', element: <Profile /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'create', element: <CreatePost /> },
      { path: 'safety', element: <Safety /> },
      { path: 'settings', element: <AccountSettings /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <SignUp /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
