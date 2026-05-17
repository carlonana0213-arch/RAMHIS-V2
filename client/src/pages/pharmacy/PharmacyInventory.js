import { useEffect, useState } from "react";
import {
  getMedicines,
  addMedicine,
  deleteMedicine,
  updateMedicine,
} from "../../services/pharmacyService";
import "../../styles/pharmacy.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";

function PharmacyInventory() {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [names, setNames] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");
  const [brand, setBrand] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const loadMedicines = async () => {
    const data = await getMedicines();
    setMedicines(data);
  };
  const totalMedicines = medicines.length;

  const lowStockCount = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= 50,
  ).length;

  const noStockCount = medicines.filter((m) => m.quantity <= 0).length;
  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.names?.some((n) => n.toLowerCase().includes(search.toLowerCase())) ||
      String(m.brand || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(m.dosage || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    let matchesFilter = true;

    if (filter === "Low Stock") {
      matchesFilter = m.quantity > 0 && m.quantity <= 50;
    }

    if (filter === "No Stock") {
      matchesFilter = m.quantity <= 0;
    }

    if (filter === "Available") {
      matchesFilter = m.quantity > 10;
    }

    return matchesSearch && matchesFilter;
  });
  useEffect(() => {
    loadMedicines();
  }, []);
  const handleAdd = async () => {
    try {
      await addMedicine({
        names: names
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),

        brand,

        quantity,

        dosage,

        expiryDate,
      });

      setNames("");
      setBrand("");
      setExpiryDate("");
      setQuantity("");
      setDosage("");

      setAlertMessage("Medicine added successfully");

      loadMedicines();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to add medicine");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateMedicine(id, { quantity: editQuantity });

      setEditingId(null);
      setEditQuantity("");

      setAlertMessage("Medicine quantity updated successfully");

      loadMedicines();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to update medicine quantity");
    }
  };

  return (
    <div className="pharmacy-container">
      {/* FORM */}
      <div className="pharmacy-header">
        <div>
          <h2>Pharmacy Inventory</h2>
          <p>Manage medicine inventory and stock levels.</p>
        </div>

        <button className="add-medicine-btn" onClick={() => setShowModal(true)}>
          Add Medicine
        </button>
      </div>

      {/* INVENTORY STATS */}
      <div className="inventory-stats-grid">
        {/* LEFT */}
        <div className="inventory-stat-card">
          <h4>Total Medicines</h4>

          <div className="stat-value">{totalMedicines}</div>

          <p>Medicines currently in inventory</p>
        </div>

        {/* MIDDLE */}
        <div className="inventory-stat-card warning">
          <h4>Low Stock Medicines</h4>

          <div className="stat-value">{lowStockCount}</div>

          <p>Medicines with low remaining stock</p>
        </div>

        {/* RIGHT */}
        <div className="inventory-stat-card danger">
          <h4>Out of Stock Medicines</h4>

          <div className="stat-value">{noStockCount}</div>

          <p>Medicines currently unavailable</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="pharmacy-topbar">
        <input
          className="pharmacy-search"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filter-group">
          <button
            className={filter === "All" ? "active" : ""}
            onClick={() => setFilter("All")}
          >
            All
          </button>

          <button
            className={filter === "Available" ? "active" : ""}
            onClick={() => setFilter("Available")}
          >
            Available
          </button>

          <button
            className={filter === "Low Stock" ? "active" : ""}
            onClick={() => setFilter("Low Stock")}
          >
            Low Stock
          </button>

          <button
            className={filter === "No Stock" ? "active" : ""}
            onClick={() => setFilter("No Stock")}
          >
            No Stock
          </button>
        </div>
      </div>
      {/* TABLE */}
      <div className="pharmacy-section">
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Medicine Names</th>
                <th>Brand</th>
                <th>Quantity</th>
                <th>Dosage</th>
                <th>Expiry Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMedicines.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="medicine-name-cell">
                      <span>{m.names?.join(", ")}</span>

                      {m.quantity <= 0 ? (
                        <span className="stock-pill no-stock-pill">
                          No Stock
                        </span>
                      ) : m.quantity <= 50 ? (
                        <span className="stock-pill low-stock-pill">
                          Low Stock
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{m.brand || "-"}</td>

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
                    {m.expiryDate
                      ? new Date(m.expiryDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {editingId === m._id ? (
                      <>
                        <button
                          onClick={() => {
                            setConfirmState({
                              message: "Save updated medicine quantity?",
                              onConfirm: async () => {
                                await handleUpdate(m._id);

                                setConfirmState(null);
                              },
                            });
                          }}
                        >
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

                        <button onClick={() => deleteMedicine(m._id)}>
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
      {showModal && (
        <div className="medicine-modal-overlay">
          <div className="medicine-modal">
            <h3>Add Medicine</h3>

            <div className="medicine-form-grid">
              <div className="form-group">
                <label>Medicine Names</label>

                <input
                  placeholder="Comma separated names"
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Brand Name</label>

                <input
                  placeholder="Enter brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>

                <input
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Dosage</label>

                <input
                  placeholder="e.g. 500mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label>Expiry Date</label>

                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={() => {
                  setConfirmState({
                    message: "Are you sure you want to add this medicine?",
                    onConfirm: async () => {
                      await handleAdd();

                      setShowModal(false);

                      setConfirmState(null);
                    },
                  });
                }}
              >
                Save Medicine
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}
    </div>
  );
}

export default PharmacyInventory;
