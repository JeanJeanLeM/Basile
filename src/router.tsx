import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PlanningPage from './pages/PlanningPage';
import SuggestionsPage from './pages/SuggestionsPage';
import TodoPage from './pages/TodoPage';
import CropsPage from './pages/CropsPage';
import BasilPage from './pages/BasilPage';
import SharePage from './pages/SharePage';
import ImportPage from './pages/ImportPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/planning" replace />,
      },
      {
        path: 'planning',
        element: <PlanningPage />,
      },
      {
        path: 'planning/suggestions',
        element: <SuggestionsPage />,
      },
      {
        path: 'todo',
        element: <TodoPage />,
      },
      {
        path: 'crops',
        element: <CropsPage />,
      },
      {
        path: 'basil',
        element: <BasilPage />,
      },
      {
        path: 'share',
        element: <SharePage />,
      },
      {
        path: 'import',
        element: <ImportPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]);
