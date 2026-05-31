import { useEffect, useState, useMemo } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import { API_BASE_URL } from "../../services/apiConfig";
import "../../styles/pharmacy.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import TableSkeleton from "../../components/loading/tableSkeleton";
import socket from "../../services/socket";
function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPrescriptions, setTotalPrescriptions] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [confirmState, setConfirmState] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState({});
  let isFetching = false;

  const loadPrescriptions = async () => {
    if (isFetching) return;

    isFetching = true;

    try {
      setLoading(true);

      const data = await apiFetch(
        `${API_BASE_URL}/api/prescriptions/queue?page=${currentPage}&search=${search}&filter=${filter}`,
      );

      setPrescriptions(data.prescriptions);

      setTotalPrescriptions(data.total);

      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isFetching = false;
    }
  };

  useEffect(() => {
    loadPrescriptions();

    // socket sync
    socket.on("queueUpdated", () => {
      loadPrescriptions();
    });

    // fallback refresh
    const fallbackTimer = setInterval(() => {
      if (!document.hidden) {
        loadPrescriptions();
      }
    }, 60000);

    return () => {
      clearInterval(fallbackTimer);

      socket.off("queueUpdated");
    };
  }, [currentPage, search, filter]);

  const handleMarkAsGiven = async (prescriptionId, itemId) => {
    try {
      // optimistic UI
      setPrescriptions((prev) =>
        prev.map((prescription) => {
          if (prescription._id !== prescriptionId) {
            return prescription;
          }

          return {
            ...prescription,
            items: prescription.items.map((item) =>
              item._id === itemId
                ? {
                    ...item,
                    isGiven: true,
                  }
                : item,
            ),
          };
        }),
      );

      const result = await apiFetch(
        `${API_BASE_URL}/api/prescriptions/${prescriptionId}/${itemId}`,
        {
          method: "PATCH",
        },
      );

      setAlertMessage(
        result.patientReleased
          ? "Prescription completed. Patient released."
          : "Prescription marked as given",
      );
    } catch (err) {
      console.error("FULL ERROR:", err);

      // rollback on failure
      loadPrescriptions();

      setAlertMessage("Failed to mark prescription as given");
    }
  };

  const pendingCount = filter === "Pending" ? totalPrescriptions : 0;

  const givenCount = filter === "Given" ? totalPrescriptions : 0;
  const displayedPrescriptions = prescriptions;

  const displayedCount = Math.min(currentPage * 15, totalPrescriptions);
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
                              item.name ||
                              "Unknown Medicine"}
                          </td>

                          <td>{item.medicine?.dosage || item.dosage || "-"}</td>

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
                                          item.prescriptionId,
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
                                  item.name ||
                                  "Unknown Medicine"}
                              </td>

                              <td>
                                {item.medicine?.dosage || item.dosage || "-"}
                              </td>

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
                                              item.prescriptionId,
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
