import React from "react";
import "../styles/confirmModal.css"; // you can reuse styles

const AlertModal = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <p>{message}</p>

        <div className="confirm-actions">
          <button className="danger" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
