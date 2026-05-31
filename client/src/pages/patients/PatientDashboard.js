import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import CardsSkeleton from "../../components/loading/cardSkeleton";
import "../../styles/queue.css";
import {
  FaBaby,
  FaBone,
  FaEye,
  FaTooth,
  FaHeartbeat,
  FaStethoscope,
} from "react-icons/fa";
const departments = [
  "Pediatrics",
  "Ortho",
  "Opta",
  "Dental",
  "Cardio",
  "General",
];
const departmentIcons = {
  Pediatrics: <FaBaby />,
  Ortho: <FaBone />,
  Opta: <FaEye />,
  Dental: <FaTooth />,
  Cardio: <FaHeartbeat />,
  General: <FaStethoscope />,
};
const PatientDashboard = ({ summary, loading }) => {
  return loading ? (
    <CardsSkeleton count={6} />
  ) : (
    <div className="patient-dashboard">
      {departments.map((dept) => (
        <div className="patient-card" key={dept}>
          <div className="patient-card-icon">{departmentIcons[dept]}</div>

          <div className="patient-card-content">
            <h4>{dept}</h4>
            <p>{summary?.[dept] ?? 0}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientDashboard;
