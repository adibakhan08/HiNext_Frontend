import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminDashboard } from "./features/admin/dashboard/AdminDashboard";
import { StudentDashboard } from "./features/student/dashboard/StudentDashboard";
import { CandidatesPage } from "./features/admin/candidates/CandidatesPage";
import { CompaniesPage } from "./features/admin/companies/CompaniesPage";
import { DrivesPage } from "./features/admin/drives/DrivesPage";
import { AcademicsPage } from "./features/admin/academics/AcademicsPage";
import { CalendarPage } from "./features/admin/calendar/CalendarPage";
import { StudentProfilePage } from "./features/student/profile/StudentProfilePage";
import { StudentDrivesPage } from "./features/student/drives/StudentDrivesPage";
import { StudentApplicationsPage } from "./features/student/application/StudentApplicationsPage";
import { ApplicationsPage } from "./features/admin/applications/ApplicationsPage";
import { AnalyticsPage } from "./features/admin/analytics/AnalyticsPage";
import { ReportsPage } from "./features/admin/reports/ReportsPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Portal */}
          <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
            <Route element={<AppShell />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/candidates" element={<CandidatesPage />} />
              <Route path="/admin/companies" element={<CompaniesPage />} />
              <Route path="/admin/drives" element={<DrivesPage />} />
              <Route path="/admin/applications" element={<ApplicationsPage />} />
              <Route path="/admin/academics" element={<AcademicsPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/calendar" element={<CalendarPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Student Portal */}
          <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route element={<AppShell />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/drives" element={<StudentDrivesPage />} />
              <Route path="/student/applications" element={<StudentApplicationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
