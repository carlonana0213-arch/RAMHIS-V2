import { useState, useEffect } from "react";
import PatientQueue from "./PatientQueue";
import Registry from "./Registry";
import AddPatientModal from "./AddPatientModal";
import "../styles/patient.css";
import { useLocation } from "react-router-dom";

const Patient = () => {
  const [activeTab, setActiveTab] = useState("queue");
  const [showAddModal, setShowAddModal] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);
  return (
    <div className="patient-page">
      <div className="patient-tabs">
        <div
          className={`tab ${activeTab === "queue" ? "active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          Queue
        </div>
        <div
          className={`tab ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          Patient View
        </div>
        <div className="tab" onClick={() => setShowAddModal(true)}>
          Add Patient
        </div>
      </div>

      <div className="patient-content">
        {activeTab === "queue" && <PatientQueue />}
        {activeTab === "view" && (
          <Registry patientIdFromQueue={location.state?.patientId} />
        )}
      </div>

      {showAddModal && (
        <AddPatientModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default Patient;
