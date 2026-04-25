import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Registry from "./pages/Registry";
import DoctorSheet from "./pages/DoctorSheet.js";
import Pharmacy from "./pages/Pharmacy.js";
import PatientQueue from "./pages/PatientQueue.js";
import Account from "./pages/Account.js";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./services/ProtectedRoute.js";
import AdminDashboard from "./pages/AdminDashboard";
import Patient from "./pages/Patient.js";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout>
                {" "}
                <AdminDashboard />
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
          path="/pharmacy"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Pharmacy />
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
      </Routes>
    </Router>
  );
}

export default App;
