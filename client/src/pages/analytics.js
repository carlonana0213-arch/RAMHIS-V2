import { useEffect, useState, useMemo } from "react";
import { getPatients } from "../services/patientService";
import Dashboard from "./analytics/dashboard";
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

  // Normalize backend data safely
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
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center col-small">Sex</th>
              <th className="text-center col-small">Age</th>
              <th>Diagnosis</th>
              <th className="text-center">Date of Visit</th>
              <th className="text-center">Place of Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td className="text-center">{p.sex}</td>
                <td className="text-center">{p.age}</td>
                <td className="diagnosis-cell">{p.diagnosis}</td>
                <td className="text-center">
                  {p.visitDate
                    ? new Date(p.visitDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="text-center">{p.visitPlace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
