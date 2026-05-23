import { useEffect, useState } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import "../../styles/pharmacy.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [confirmState, setConfirmState] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
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
    try {
      await apiFetch(
        `http://localhost:5000/api/prescriptions/${prescriptionId}/${itemId}`,
        { method: "PATCH" },
      );

      setAlertMessage("Prescription marked as given");

      loadPrescriptions();
    } catch (err) {
      console.error("FULL ERROR:", err);

      if (err.response) {
        console.log("STATUS:", err.response.status);
        console.log("DATA:", err.response.data);
      }

      setAlertMessage("Failed to mark prescription as given");
    }
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

  const sortedPrescriptions = [...filteredPrescriptions]

    .filter(({ item }) => {
      if (filter === "Pending") {
        return !item.isGiven;
      }

      return item.isGiven;
    })
    .sort((a, b) => {
      return Number(a.item.isGiven) - Number(b.item.isGiven);
    });
  const totalPrescriptions = sortedPrescriptions.length;

  const totalPages = Math.ceil(totalPrescriptions / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = startIndex + ITEMS_PER_PAGE;

  const displayedPrescriptions = sortedPrescriptions.slice(
    startIndex,
    endIndex,
  );

  const displayedCount = Math.min(endIndex, totalPrescriptions);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);
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
        <div className="filter-group">
          <button
            className={filter === "Pending" ? "active" : ""}
            onClick={() => setFilter("Pending")}
          >
            Pending
          </button>

          <button
            className={filter === "Given" ? "active" : ""}
            onClick={() => setFilter("Given")}
          >
            Given
          </button>
        </div>
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
                <th>Stock Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {displayedPrescriptions.map(({ prescription: p, item }) => (
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
                    {item.medicine?.quantity <= 0 ? (
                      <span className="stock-pill out">Out of Stock</span>
                    ) : item.medicine?.quantity <= 50 ? (
                      <span className="stock-pill low">Low Stock</span>
                    ) : (
                      <span className="stock-pill ready">Ready</span>
                    )}
                  </td>

                  <td>
                    {!item.isGiven ? (
                      item.medicine?.quantity <= 0 ? (
                        <button className="disabled-btn" disabled>
                          Unavailable
                        </button>
                      ) : (
                        <button
                          className="mark-given-btn"
                          onClick={() => {
                            setConfirmState({
                              message: "Mark this prescription as given?",
                              onConfirm: async () => {
                                await handleMarkAsGiven(p._id, item._id);

                                setConfirmState(null);
                              },
                            });
                          }}
                        >
                          Mark as Given
                        </button>
                      )
                    ) : (
                      <span className="given-pill">Given</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPrescriptions > 0 && (
            <div className="pharmacy-pagination">
              <button
                className="pharmacy-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              <span className="pharmacy-pagination-text">
                {displayedCount} of {totalPrescriptions}
              </span>

              <button
                className="pharmacy-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
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

export default PharmacyQueue;
