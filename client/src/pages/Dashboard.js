import { useEffect, useMemo, useState } from "react";
import { getAllUsers } from "../services/adminService";
import { getPatients } from "../services/patientService";

import PatientDashboard from "./analytics/dashboard";
import UserDashboard from "./analytics/userDashboard";
import PatientTable from "./analytics/PatientsTable";
import PatientViewFinal from "./analytics/patientview";

import "../styles/analytics.css";
import "./analytics/modl.css";

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  //USERS
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();

        console.log("Fetched users:", data);

        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };

    loadUsers();
  }, []);

  //PATIENTS
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);
  const handleSelectPatient = (id) => {
    const patient = patients.find((p) => p._id === id);

    if (patient) {
      setSelectedPatient(patient);
    }
  };
  const normalizedPatients = useMemo(() => {
    return patients.map((p) => {
      const g = p.generalInfo || {};

      const latestSheet =
        p.doctorSheets && p.doctorSheets.length > 0
          ? p.doctorSheets[p.doctorSheets.length - 1]
          : null;

      return {
        id: p._id,

        name:
          g.name ||
          `${g.firstName || ""} ${g.lastName || ""}`.trim() ||
          "Unknown",

        sex: g.gender || g.sex || "—",

        age: g.age || "—",

        diagnosis: latestSheet?.diagnosis || "—",

        visitDate: p.createdAt || null,

        visitPlace: p.location || p.missionLocation || "—",
      };
    });
  }, [patients]);

  // Search (name + diagnosis)
  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();

    return normalizedPatients.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q)
      );
    });
  }, [normalizedPatients, search]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="users-header">
        <h2>Dashboard</h2>
      </div>

      <UserDashboard users={users} />
      <PatientDashboard patients={patients} />
      <div className="admin-header-actions">
        <div className="admin-controls">
          <input
            type="text"
            placeholder="Search name or diagnosis..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <PatientTable
        patients={filteredPatients}
        onSelectPatient={handleSelectPatient}
      />
      {selectedPatient && (
        <PatientViewFinal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;
