import React from "react";
import "../../styles/analytics.css";

const PatientTable = ({
  patients = [],
  onSelectPatient,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const PAGE_GROUP_SIZE = 10;

  const currentGroup = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE);

  const startPage = currentGroup * PAGE_GROUP_SIZE + 1;

  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

  if (!patients.length) {
    return (
      <div className="table-container" style={{ padding: "40px 20px" }}>
        <p
          style={{
            textAlign: "center",
            margin: 0,
            color: "#64748b",
            fontWeight: 500,
            fontSize: "0.95rem",
          }}
        >
          No historical datasets match this criteria location.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Patient Name</th>
            <th className="text-center col-small">Sex</th>
            <th className="text-center col-small">Age</th>
            <th>Latest Diagnosis Record</th>
            <th className="text-center">Date</th>
            <th className="text-center">Location Drop</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr
              key={p.id}
              className="clickable-row"
              onClick={() => onSelectPatient && onSelectPatient(p.id)}
            >
              <td>
                <strong>{p.name}</strong>
              </td>
              <td
                className="text-center"
                style={{ fontWeight: 600, color: "#334155" }}
              >
                {p.sex || "—"}
              </td>
              <td
                className="text-center"
                style={{ fontWeight: 600, color: "#334155" }}
              >
                {p.age || "—"}
              </td>
              <td className="diagnosis-cell">{p.diagnosis || "—"}</td>
              <td
                className="text-center"
                style={{
                  color: "#64748b",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                {p.visitDate && !isNaN(new Date(p.visitDate))
                  ? new Date(p.visitDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="text-center">
                <span
                  style={{
                    background: "#f1f5f9",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  {p.visitPlace || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
        >
          &lt;
        </button>

        {Array.from(
          {
            length: endPage - startPage + 1,
          },
          (_, i) => {
            const page = startPage + i;

            return (
              <button
                key={page}
                className={currentPage === page ? "active-page" : ""}
                onClick={() => onPageChange?.(page)}
              >
                {page}
              </button>
            );
          },
        )}

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PatientTable;
