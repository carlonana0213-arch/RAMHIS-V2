import React from "react";

function DocumentViewerModal({ url, type, title, onClose }) {
  if (!url) return null;

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div
        className={`doc-modal ${type === "pdf" ? "doc-modal-pdf" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doc-modal-header">
          <span>{title || "Document Viewer"}</span>

          <button
            type="button"
            className="doc-modal-close-btn"
            onClick={onClose}
            aria-label="Close document viewer"
          >
            ✕
          </button>
        </div>

        <div className="doc-modal-body">
          {type === "image" && (
            <img
              src={url}
              alt={title || "Document"}
              className="doc-preview-image"
            />
          )}

          {type === "pdf" && (
            <iframe
              src={url}
              width="100%"
              height="500px"
              title={title || "PDF Document"}
              className="doc-preview-frame"
            />
          )}

          {type !== "image" && type !== "pdf" && (
            <div className="doc-unsupported">
              <p>This file type cannot be previewed here.</p>

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="doc-open-link"
              >
                🔗 Open file
              </a>
            </div>
          )}
        </div>

        <div className="doc-modal-footer">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="doc-open-link"
          >
            🔗 Open in new tab
          </a>

          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            className="doc-download-link"
          >
            ⬇ Download
          </a>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewerModal;