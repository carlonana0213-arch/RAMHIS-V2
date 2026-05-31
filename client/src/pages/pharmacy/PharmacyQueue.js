import React, { useEffect, useRef, useState } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import { API_BASE_URL } from "../../services/apiConfig";
import db from "../../services/localDB";
import "../../styles/pharmacy.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import TableSkeleton from "../../components/loading/tableSkeleton";
import socket from "../../services/socket";

function PharmacyQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");

  const [expandedPatients, setExpandedPatients] = useState({});

  const [confirmState, setConfirmState] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");

  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
  });

  const isFetching = useRef(false);

  const loadPrescriptions = async () => {
    if (isFetching.current) return;

    isFetching.current = true;
    setLoading(true);

    try {
      // OFFLINE FIRST
      if (!navigator.onLine) {
        const cached = await db.pharmacyQueue.toArray();

        setPrescriptions(cached);

        setTotalPrescriptions(cached.length);

        setTotalPages(Math.max(1, Math.ceil(cached.length / 15)));

        setStats({
          pending: cached.length,
          completed: 0,
        });

        setLoading(false);
        isFetching.current = false;

        return;
      }

      // ONLINE FETCH
      const data = await apiFetch(
        `${API_BASE_URL}/api/prescriptions/queue?page=${currentPage}&search=${search}&filter=${filter}`,
      );

      const queue = data.prescriptions || [];

      setPrescriptions(queue);

      setTotalPrescriptions(data.total || 0);

      setTotalPages(data.totalPages || 1);

      // stats
      try {
        const pharmacyStats = await apiFetch(
          `${API_BASE_URL}/api/prescriptions/stats`,
        );

        setStats({
          pending: pharmacyStats.pending || 0,
          completed: pharmacyStats.completed || 0,
        });
      } catch {
        // ignore stats failure
      }

      // cache queue
      await db.pharmacyQueue.bulkPut(
        queue.map((p) => ({
          ...p,
          patientId: p.patient?._id,
        })),
      );
    } catch (err) {
      console.error("Pharmacy queue error:", err);

      // emergency fallback
      const cached = await db.pharmacyQueue.toArray();

      setPrescriptions(cached);

      setTotalPrescriptions(cached.length);

      setTotalPages(Math.max(1, Math.ceil(cached.length / 15)));
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadPrescriptions();

    socket.on("queueUpdated", loadPrescriptions);

    const timer = setInterval(() => {
      if (!document.hidden) {
        loadPrescriptions();
      }
    }, 60000);

    return () => {
      socket.off("queueUpdated", loadPrescriptions);
      clearInterval(timer);
    };
  }, [currentPage, search, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const handleMarkAsGiven = async (prescriptionId, itemIndex) => {
    try {
      // optimistic UI
      setPrescriptions((prev) =>
        prev.map((p) => {
          if (p._id !== prescriptionId) {
            return p;
          }

          return {
            ...p,
            filteredItems: p.filteredItems.map((item, i) =>
              i === itemIndex
                ? {
                    ...item,
                    isGiven: true,
                  }
                : item,
            ),
          };
        }),
      );

      // OFFLINE → queue sync
      if (!navigator.onLine) {
        await db.syncQueue.add({
          type: "DISPENSE_MEDICINE",
          payload: {
            prescriptionId,
            itemIndex,
          },
        });

        setAlertMessage(
          "Medicine marked as given (offline). Will sync automatically.",
        );

        return;
      }

      // ONLINE
      const prescription = prescriptions.find((p) => p._id === prescriptionId);

      const item = prescription?.filteredItems?.[itemIndex];

      if (!item) {
        throw new Error("Item not found");
      }

      const result = await apiFetch(
        `${API_BASE_URL}/api/prescriptions/${prescriptionId}/${item._id}`,
        {
          method: "PATCH",
        },
      );

      setAlertMessage(
        result.patientReleased
          ? "Prescription completed. Patient released."
          : "Prescription marked as given",
      );

      loadPrescriptions();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to mark prescription as given");

      loadPrescriptions();
    }
  };

  const displayedCount = Math.min(currentPage * 15, totalPrescriptions);

  return (
    <div className="pharmacy-container">
      <div className="pharmacy-header">
        <h2>Prescription Queue</h2>
      </div>

      <div className="queue-stats-grid">
        <div className="queue-stat-card pending">
          <div className="queue-stat-icon">
            <FiClock />
          </div>

          <div>
            <h4>Prescriptions in Queue</h4>
            <div className="queue-stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="queue-stat-card completed">
          <div className="queue-stat-icon">
            <FiCheckCircle />
          </div>

          <div>
            <h4>Prescriptions Given Out</h4>
            <div className="queue-stat-value">{stats.completed}</div>
          </div>
        </div>
      </div>

      <div className="pharmacy-topbar">
        <input
          className="pharmacy-search"
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {prescriptions.map((p) => (
                  <React.Fragment key={p._id}>
                    <tr
                      className="expandable-row"
                      onClick={() =>
                        setExpandedPatients((prev) => ({
                          ...prev,
                          [p._id]: !prev[p._id],
                        }))
                      }
                    >
                      <td>
                        {expandedPatients[p._id] ? "▼" : "▶"}{" "}
                        {p.patient?.generalInfo?.name || "Unknown Patient"}
                      </td>

                      <td colSpan="5">
                        {p.filteredItems?.length || 0} medicine(s)
                      </td>
                    </tr>

                    {expandedPatients[p._id] &&
                      (p.filteredItems || []).map((item, index) => (
                        <tr key={`${p._id}-${index}`}>
                          <td></td>

                          <td>{item.name || "Unknown Medicine"}</td>

                          <td>{item.dosage || "-"}</td>

                          <td>{item.quantity}</td>

                          <td>
                            {item.isGiven ? (
                              <span className="given-pill">Given</span>
                            ) : (
                              <span className="stock-pill ready">Pending</span>
                            )}
                          </td>

                          <td>
                            {!item.isGiven ? (
                              <button
                                className="mark-given-btn"
                                onClick={() =>
                                  setConfirmState({
                                    message: "Mark this prescription as given?",
                                    onConfirm: async () => {
                                      await handleMarkAsGiven(p._id, index);

                                      setConfirmState(null);
                                    },
                                  })
                                }
                              >
                                Mark as Given
                              </button>
                            ) : (
                              <span className="given-pill">Given</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
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
          </>
        )}
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
