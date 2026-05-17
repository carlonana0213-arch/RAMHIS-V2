import React, { useState } from "react";
import "../../styles/analytics.css";

const ITEMS_PER_PAGE = 10;

const PatientTable = ({ patients = [], onSelectPatient }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(patients.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPatients = patients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (!patients.length) {
    return (
      <div className="table-container">
        <p style={{ textAlign: "center", padding: "20px" }}>
          No patients found{" "}
        </p>{" "}
      </div>
    );
  }

  return (
    <div className="table-container">
      {" "}
      <table className="admin-table">
        {" "}
        <thead>
          {" "}
          <tr>
            {" "}
            <th>Name</th> <th className="text-center col-small">Sex</th>{" "}
            <th className="text-center col-small">Age</th> <th>Diagnosis</th>{" "}
            <th className="text-center">Date of Visit</th>{" "}
            <th className="text-center">Place of Visit</th>{" "}
          </tr>{" "}
        </thead>
        <tbody>
          {currentPatients.map((p) => (
            <tr
              key={p.id}
              className="clickable-row"
              onClick={() => onSelectPatient && onSelectPatient(p.id)}
            >
              <td>
                <strong>{p.name}</strong>
              </td>
              <td className="text-center">{p.sex || "—"}</td>
              <td className="text-center">{p.age || "—"}</td>
              <td className="diagnosis-cell">{p.diagnosis || "—"}</td>

              <td className="text-center">
                {p.visitDate && !isNaN(new Date(p.visitDate))
                  ? new Date(p.visitDate).toLocaleDateString()
                  : "—"}
              </td>

              <td className="text-center">{p.visitPlace || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ===== PAGINATION ===== */}
      <div className="pagination">
        <button onClick={() => goToPage(currentPage - 1)}>◀</button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active-page" : ""}
            onClick={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button onClick={() => goToPage(currentPage + 1)}>▶</button>
      </div>
    </div>
  );
};

export default PatientTable;
