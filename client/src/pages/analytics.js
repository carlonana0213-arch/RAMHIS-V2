import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../services/patientService";
import Dashboard from "./analytics/dashboard";
import PatientTable from "./analytics/PatientsTable";
import "../styles/analytics.css";

const Analytics = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
  const navigate = useNavigate();

  const handleSelectPatient = (id) => {
    navigate("/registry", {
      state: { patientId: id },
    });
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
    <div className="admin-container">
      {" "}
      {/* Changed class to match AdminDashboard */}
      <Dashboard patients={patients} />
      <div className="admin-header-actions">
        {" "}
        {/* New wrapper for consistency */}
        <h1 className="text-2xl font-bold">Patient Analytics</h1>
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
    </div>
  );
};

export default Analytics;
