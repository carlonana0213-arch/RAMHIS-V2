import React from "react";

function DocumentViewerModal({ url, type, title, onClose }) {
  if (!url) return null;

  const getFileNameFromUrl = (fileUrl) => {
    try {
      const cleanUrl = fileUrl.split("?")[0];
      const fileName = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);

      return fileName || "document";
    } catch {
      return "document";
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getFileNameFromUrl(url);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);

      // fallback if browser blocks blob download
      window.open(url, "_blank", "noreferrer");
    }
  };

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

          <button
            type="button"
            onClick={handleDownload}
            className="doc-download-link"
          >
            ⬇ Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewerModal;