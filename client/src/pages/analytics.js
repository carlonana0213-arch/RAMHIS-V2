import { useEffect, useState } from "react";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [mission, setMission] = useState("latest");

  useEffect(() => {
    fetch("/api/analytics")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${text}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Frontend analytics error:", err);
      });
  }, [mission]);

  if (!data || !data.patients) return <div>Loading...</div>;

  const filtered = data.patients.filter((p) =>
    p.generalInfo?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce((acc, p) => {
    const key = `${p.missionDate || "Unknown"} - ${p.location || "Unknown"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="px-6 py-8">
      {/* FILTER */}
      <select
        onChange={(e) => setMission(e.target.value)}
        className="mb-4 border p-2 rounded"
      >
        <option value="latest">Latest Mission</option>
        <option value="all">All Missions</option>
      </select>

      {/* DASHBOARD */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2>Gender</h2>
          {Object.entries(data.genderStats).map(([g, c]) => (
            <p key={g}>
              {g}: {c}
            </p>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Diagnoses</h2>
          {Object.entries(data.diagnosisStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([d, c]) => (
              <p key={d}>
                {d}: {c}
              </p>
            ))}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Medicines</h2>
          {Object.entries(data.medicineStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([m, c]) => (
              <p key={m}>
                {m}: {c}
              </p>
            ))}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search patient..."
        className="border p-2 w-full mb-6"
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      {Object.entries(grouped).map(([mission, patients]) => (
        <div key={mission} className="mb-8">
          <h2 className="font-bold">{mission}</h2>

          <table className="w-full border">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>{p.generalInfo?.name}</td>
                  <td>{p.generalInfo?.age}</td>
                  <td>{p.generalInfo?.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Analytics;
