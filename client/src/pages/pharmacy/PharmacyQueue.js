import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import "../../styles/pharmacy.css";

function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);

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

  return (
    <div className="pharmacy-container">
      <div className="pharmacy-section">
        <h2>Prescription Queue</h2>

        {prescriptions.length === 0 && <p>No pending prescriptions</p>}

        <div className="prescription-row">
          {prescriptions.map((p) => (
            <div key={p._id} className="prescription-card">
              <h4>Patient: {p.patient.generalInfo.name}</h4>

              {p.items.map((item) => (
                <div key={item._id} className="prescription-item">
                  <strong>{item.medicine.name}</strong>
                  <div>Quantity: {item.quantity}</div>
                  <div>Directions: {item.directions}</div>

                  {!item.isGiven ? (
                    <button onClick={() => handleMarkAsGiven(p._id, item._id)}>
                      Mark as Given
                    </button>
                  ) : (
                    <span> ✅ Given</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PharmacyQueue;
