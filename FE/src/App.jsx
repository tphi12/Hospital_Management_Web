import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ROLES } from "./lib/roles";

// Pages
// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/admin/UserManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import DocumentUpload from "./pages/documents/DocumentUpload";
import DocumentList from "./pages/documents/DocumentList";
import { DocumentApprovals } from "./pages/documents/DocumentPages";
import { MySchedule, DeptSchedule, MasterSchedule } from "./pages/schedule/SchedulePages";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes Wrapper */}
        <Route element={<Layout />}>

          {/* Public inside app (but authenticated) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <ProtectedRoute>
                <Unauthorized />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />

          {/* Document Routes */}
          <Route
            path="/documents/upload"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT]}>
                <DocumentUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/approvals"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEAD_OF_DEPT]}>
                <DocumentApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/repository"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HOSPITAL_CLERK, ROLES.ADMIN, ROLES.HEAD_OF_DEPT, ROLES.STAFF]}>
                <DocumentList />
              </ProtectedRoute>
            }
          />

          {/* Schedule Routes */}
          <Route
            path="/schedule/me"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH]}>
                <MySchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule/department"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DEPT_CLERK]}>
                <DeptSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule/master"
            element={
              <ProtectedRoute allowedRoles={[ROLES.KHTH, ROLES.ADMIN]}>
                <MasterSchedule />
              </ProtectedRoute>
            }
          />

        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;