import { useEffect, useState } from "react";
import {
  getMedicines,
  addMedicine,
  deleteMedicine,
  updateMedicine,
} from "../../services/pharmacyService";
import "../../styles/pharmacy.css";

function PharmacyInventory() {
  const [medicines, setMedicines] = useState([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  const loadMedicines = async () => {
    const data = await getMedicines();
    setMedicines(data);
  };

  useEffect(() => {
    loadMedicines();
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

  return (
    <div className="pharmacy-container">
      {/* FORM */}
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

      {/* TABLE */}
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
