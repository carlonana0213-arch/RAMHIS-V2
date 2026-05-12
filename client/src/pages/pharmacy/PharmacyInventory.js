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
          <h4>No Stock Medicines</h4>

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
                <tr
                  key={m._id}
                  className={
                    m.quantity <= 0
                      ? "no-stock"
                      : m.quantity <= 50
                        ? "low-stock"
                        : ""
                  }
                >
                  <td>{m.names?.join(", ")}</td>
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
      {showModal && (
        <div className="medicine-modal-overlay">
          <div className="medicine-modal">
            <h3>Add Medicine</h3>

            <input
              placeholder="Medicine Names (comma separated)"
              value={names}
              onChange={(e) => setNames(e.target.value)}
            />
            <input
              placeholder="Brand Name"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
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
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={async () => {
                  await handleAdd();
                  setShowModal(false);
                }}
              >
                Save Medicine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacyInventory;
