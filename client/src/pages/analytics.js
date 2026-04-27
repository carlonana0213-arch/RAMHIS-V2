import { useEffect, useState, useMemo } from "react";
import { getPatients } from "../services/patientService";

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
    <div className="p-6">
      {" "}
      <h1 className="text-2xl font-bold mb-4">Patient Analytics </h1>
      <input
        type="text"
        placeholder="Search name or diagnosis..."
        className="w-full border p-2 rounded mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border rounded">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Sex</th>
              <th className="p-2">Age</th>
              <th className="p-2">Diagnosis</th>
              <th className="p-2">Date of Visit</th>
              <th className="p-2">Place of Visit</th>
            </tr>
          </thead>

          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No patients found
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-center">{p.sex}</td>
                  <td className="p-2 text-center">{p.age}</td>
                  <td className="p-2">{p.diagnosis}</td>
                  <td className="p-2 text-center">
                    {p.visitDate
                      ? new Date(p.visitDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-2 text-center">{p.visitPlace}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
