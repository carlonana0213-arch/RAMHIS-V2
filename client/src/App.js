import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/register";
import Registry from "./pages/patients/Registry";
import DoctorSheet from "./pages/DoctorSheet.js";
import PatientQueue from "./pages/patients/PatientQueue.js";
import Account from "./pages/Account.js";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./services/ProtectedRoute.js";
import UserManagement from "./pages/UserManagement";
import Patient from "./pages/Patient.js";
import Analytics from "./pages/analytics.js";
import PharmacyQueue from "./pages/pharmacy/PharmacyQueue";
import PharmacyInventory from "./pages/pharmacy/PharmacyInventory";
import LandingPage from "./pages/Landing";
import Dashboard from "./pages/Dashboard.js";
import Doctor from "./pages/Doctor.js";
import EventManagement from "./pages/EventManagement";
import ConnectionStatus from "./components/ConnectionStatus";
import AuditLog from "./pages/AuditLog";
function App() {
  return (
    <Router>
      {/*<ConnectionStatus />*/}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Patient />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                {" "}
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Doctor />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Registry />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy/queue"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PharmacyQueue />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy/inventory"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PharmacyInventory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-sheet"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DoctorSheet />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient-queue"
          element={
            <ProtectedRoute>
              {" "}
              <AppLayout>
                <PatientQueue />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Account />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/event"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
  path="/audit-log"
  element={
    <ProtectedRoute>
      <AppLayout>
        <AuditLog />
      </AppLayout>
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;
