import React from "react";
import "../styles/confirmModal.css";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <p>{message}</p>

        <div className="confirm-actions">
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>

          <button className="danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
