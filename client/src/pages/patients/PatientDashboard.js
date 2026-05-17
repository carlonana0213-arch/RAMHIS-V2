import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

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
const PatientDashboard = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await apiFetch("http://localhost:5000/api/patients/queue");

        setPatients(data);
      } catch (err) {
        console.error("Error loading dashboard patients", err);
      }
    };

    fetchPatients();
  }, []);

  const activePatients = patients.filter((p) => p.status !== "released");

  const getDepartmentCount = (department) => {
    return activePatients.filter((p) => p.department === department).length;
  };

  return (
    <div className="patient-dashboard">
      {departments.map((dept) => (
        <div className="patient-card" key={dept}>
          <div className="patient-card-icon">{departmentIcons[dept]}</div>

          <div className="patient-card-content">
            <h4>{dept}</h4>

            <p>{getDepartmentCount(dept)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientDashboard;
