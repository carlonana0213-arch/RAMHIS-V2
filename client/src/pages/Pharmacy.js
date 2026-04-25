import { useEffect, useState } from "react";
import {
  getMedicines,
  addMedicine,
  deleteMedicine,
  updateMedicine,
} from "../services/pharmacyService";
import { apiFetch } from "../services/api";
import "../styles/pharmacy.css";

function PharmacyInventory() {
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  const loadMedicines = async () => {
    const data = await getMedicines();
    setMedicines(data);
  };

  const loadPrescriptions = async () => {
    const data = await apiFetch(
      "http://localhost:5000/api/prescriptions/pending",
    );

    setPrescriptions(data);
  };

  useEffect(() => {
    loadMedicines();
    loadPrescriptions();
  }, []);

  const handleAdd = async () => {
    await addMedicine({ name, quantity, dosage });
    setName("");
    setQuantity("");
    setDosage("");
    loadMedicines();
  };

  const handleDelete = async (id) => {
    await deleteMedicine(id);
    loadMedicines();
  };

  const handleUpdate = async (id) => {
    await updateMedicine(id, { quantity: editQuantity });
    setEditingId(null);
    setEditQuantity("");
    loadMedicines();
  };

  const handleMarkAsGiven = async (prescriptionId, itemId) => {
    await apiFetch(
      `http://localhost:5000/api/prescriptions/${prescriptionId}/${itemId}`,
      {
        method: "PATCH",
      },
    );

    loadPrescriptions();
    loadMedicines();
  };

  return (
    <div className="pharmacy-container">
      {/* =========================
        PRESCRIPTION QUEUE
      ========================= */}
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

      {/* =========================
        INVENTORY FORM
      ========================= */}
      <div className="pharmacy-section">
        <h2>Pharmacy Inventory</h2>

        <div className="inventory-form">
          <input
            placeholder="Medicine Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            placeholder="Dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
          />

          <button onClick={handleAdd}>Add Medicine</button>
        </div>
      </div>

      {/* =========================
        INVENTORY TABLE
      ========================= */}
      <div className="pharmacy-section">
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Quantity</th>
                <th>Dosage</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {medicines.map((m) => (
                <tr key={m._id} className={m.quantity < 10 ? "low-stock" : ""}>
                  <td>{m.name}</td>

                  <td>
                    {editingId === m._id ? (
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                      />
                    ) : (
                      m.quantity
                    )}
                  </td>

                  <td>{m.dosage}</td>

                  <td>
                    {editingId === m._id ? (
                      <>
                        <button onClick={() => handleUpdate(m._id)}>
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(m._id);
                            setEditQuantity(m.quantity);
                          }}
                        >
                          Edit
                        </button>

                        <button onClick={() => handleDelete(m._id)}>
                          Delete
                        </button>
                      </>
                    )}
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

export default PharmacyInventory;
