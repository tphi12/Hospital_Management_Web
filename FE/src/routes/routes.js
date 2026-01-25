import LoginPage from '../features/auth/pages/LoginPage.jsx';

const routes = [
  { 
    path: '/login', 
    element: <LoginPage />, // Dùng element thay vì component
    isPublic: true 
  },

];