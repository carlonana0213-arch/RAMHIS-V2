import React from "react";
import "../styles/confirmModal.css";

const AlertModal = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <p
          style={{
            textAlign: "center",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "normal",
            maxWidth: "100%",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

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