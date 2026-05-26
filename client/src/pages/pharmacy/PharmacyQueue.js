import { useEffect, useState } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import { API_BASE_URL } from "../../services/apiConfig";
import "../../styles/pharmacy.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import TableSkeleton from "../../components/loading/tableSkeleton";
function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [confirmState, setConfirmState] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [loading, setLoading] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState({});
  const loadPrescriptions = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(`${API_BASE_URL}/api/prescriptions/pending`);

      setPrescriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handleMarkAsGiven = async (prescriptionId, itemId) => {
    try {
      await apiFetch(
        `${API_BASE_URL}/api/prescriptions/${prescriptionId}/${itemId}`,
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
  const filteredPrescriptions = prescriptions
    .map((p) => {
      const filteredItems = p.items.filter((item) => {
        const patientName = p.patient?.generalInfo?.name || "";

        const medicineNames =
          item.medicine?.names?.join(", ") || item.medicine?.name || "";

        const matchesSearch =
          patientName.toLowerCase().includes(search.toLowerCase()) ||
          medicineNames.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
          filter === "Pending" ? !item.isGiven : item.isGiven;

        return matchesSearch && matchesFilter;
      });

      return {
        ...p,
        filteredItems,
      };
    })
    .filter((p) => p.filteredItems.length > 0);

  const pendingCount = prescriptions
    .flatMap((p) => p.items)
    .filter((item) => !item.isGiven).length;

  const givenCount = prescriptions
    .flatMap((p) => p.items)
    .filter((item) => item.isGiven).length;

  const totalPrescriptions = filteredPrescriptions.length;

  const totalPages = Math.ceil(totalPrescriptions / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = startIndex + ITEMS_PER_PAGE;

  const displayedPrescriptions = filteredPrescriptions.slice(
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
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <>
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
                  {displayedPrescriptions.map((p) => {
                    const hasMultipleMedicines = p.filteredItems.length > 1;

                    // SINGLE MEDICINE → NORMAL ROW
                    if (!hasMultipleMedicines) {
                      const item = p.filteredItems[0];

                      return (
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
                              <span className="stock-pill out">
                                Out of Stock
                              </span>
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
                                      message:
                                        "Mark this prescription as given?",
                                      onConfirm: async () => {
                                        await handleMarkAsGiven(
                                          p._id,
                                          item._id,
                                        );

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
                      );
                    }

                    // MULTIPLE MEDICINES → DROPDOWN
                    return (
                      <>
                        <tr
                          key={p._id}
                          className="expandable-row"
                          onClick={() =>
                            setExpandedPatients((prev) => ({
                              ...prev,
                              [p._id]: !prev[p._id],
                            }))
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            {expandedPatients[p._id] ? "▼" : "▶"}{" "}
                            {p.patient.generalInfo.name}
                          </td>

                          <td colSpan="5">
                            {p.filteredItems.length} medicine(s)
                          </td>

                          <td></td>
                        </tr>

                        {expandedPatients[p._id] &&
                          p.filteredItems.map((item) => (
                            <tr key={item._id} className="medicine-sub-row">
                              <td></td>

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
                                  <span className="stock-pill out">
                                    Out of Stock
                                  </span>
                                ) : item.medicine?.quantity <= 50 ? (
                                  <span className="stock-pill low">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="stock-pill ready">
                                    Ready
                                  </span>
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
                                          message:
                                            "Mark this prescription as given?",
                                          onConfirm: async () => {
                                            await handleMarkAsGiven(
                                              p._id,
                                              item._id,
                                            );

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
                      </>
                    );
                  })}
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
            </>
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
