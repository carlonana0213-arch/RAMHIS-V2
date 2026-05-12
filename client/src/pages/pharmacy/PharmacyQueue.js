import { useEffect, useState } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import "../../styles/pharmacy.css";

function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const loadPrescriptions = async () => {
    const data = await apiFetch(
      "http://localhost:5000/api/prescriptions/pending",
    );
    setPrescriptions(data);
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handleMarkAsGiven = async (prescriptionId, itemId) => {
    await apiFetch(
      `http://localhost:5000/api/prescriptions/${prescriptionId}/${itemId}`,
      { method: "PATCH" },
    );

    loadPrescriptions();
  };
  const filteredPrescriptions = prescriptions.flatMap((p) =>
    p.items
      .filter((item) => {
        const patientName = p.patient?.generalInfo?.name || "";

        const medicineNames =
          item.medicine?.names?.join(", ") || item.medicine?.name || "";

        return (
          patientName.toLowerCase().includes(search.toLowerCase()) ||
          medicineNames.toLowerCase().includes(search.toLowerCase())
        );
      })
      .map((item) => ({
        prescription: p,
        item,
      })),
  );
  const pendingCount = prescriptions
    .flatMap((p) => p.items)
    .filter((item) => !item.isGiven).length;

  const givenCount = prescriptions
    .flatMap((p) => p.items)
    .filter((item) => item.isGiven).length;

  const pendingItems = filteredPrescriptions.filter(
    ({ item }) => !item.isGiven,
  );

  const givenItems = filteredPrescriptions.filter(({ item }) => item.isGiven);
  return (
    <div className="pharmacy-container">
      <div className="pharmacy-header">
        <h2>Prescription Queue</h2>
      </div>
      <div className="queue-stats-grid">
        {/* PENDING */}
        <div className="queue-stat-card pending">
          <div className="queue-stat-icon">
            <FiClock />
          </div>

          <div>
            <h4>Prescriptions in Queue</h4>
            <div className="queue-stat-value">{pendingCount}</div>
          </div>
        </div>

        {/* GIVEN */}
        <div className="queue-stat-card completed">
          <div className="queue-stat-icon">
            <FiCheckCircle />
          </div>

          <div>
            <h4>Prescriptions Given Out</h4>
            <div className="queue-stat-value">{givenCount}</div>
          </div>
        </div>
      </div>
      <div className="pharmacy-topbar">
        <input
          className="pharmacy-search"
          type="text"
          placeholder="Search patient or medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="pharmacy-section">
        {prescriptions.length === 0 && <p>No pending prescriptions</p>}

        <div className="inventory-table">
          <h3 className="queue-section-title">Prescriptions In Queue</h3>

          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Quantity</th>

                <th>Prescribed By</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {pendingItems.map(({ prescription: p, item }) => (
                <tr key={item._id}>
                  <td>{p.patient.generalInfo.name}</td>

                  <td>
                    {item.medicine?.names?.join(", ") ||
                      item.medicine?.name ||
                      "Unknown Medicine"}
                  </td>

                  <td>{item.medicine?.dosage || "-"}</td>

                  <td>{item.quantity}</td>

                  <td>{p.doctor?.name || "Unknown Doctor"}</td>

                  <td>
                    {!item.isGiven ? (
                      <button
                        onClick={() => handleMarkAsGiven(p._id, item._id)}
                      >
                        Mark as Given
                      </button>
                    ) : (
                      <span>✅ Given</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pharmacy-section">
        <h3 className="queue-section-title">Prescriptions Given Out</h3>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Quantity</th>
                <th>Prescribed By</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {givenItems.map(({ prescription: p, item }) => (
                <tr key={item._id}>
                  <td>{p.patient.generalInfo.name}</td>

                  <td>
                    {item.medicine?.names?.join(", ") ||
                      item.medicine?.name ||
                      "Unknown Medicine"}
                  </td>

                  <td>{item.medicine?.dosage || "-"}</td>

                  <td>{item.quantity}</td>

                  <td>{p.doctor?.name || "Unknown Doctor"}</td>

                  <td>
                    <span className="given-status">✅ Given</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PharmacyQueue;
