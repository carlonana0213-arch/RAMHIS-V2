import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER = [121.0, 14.6];
const DEFAULT_ZOOM = 10;

export default function EventViewModal({
  event,
  onClose,
  onParticipantAction,
  onDelete,
  onRefresh,
  onEdit,
  onStatusChange,
  activeTab,
  setActiveTab,
}) {
  const overlayRef = useRef(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapWarning, setMapWarning] = useState("");

  const participants = useMemo(() => event?.participants || [], [event]);

  const filteredParticipants = useMemo(() => {
    if (activeTab === "Approved") return participants.filter((p) => p.status === "Approved");
    if (activeTab === "Rejected") return participants.filter((p) => p.status === "Rejected");
    if (activeTab === "Pending") return participants.filter((p) => p.status === "Pending");
    return participants;
  }, [participants, activeTab]);

  const statusColor = (status) => {
    switch (status) {
      case "Approved":  return "#22C55E";
      case "Rejected":  return "#EF4444";
      case "Pending":   return "#F59E0B";
      case "Upcoming":  return "#3949AB";
      case "Ongoing":   return "#2E7D32";
      case "Completed": return "#757575";
      case "Cancelled": return "#D32F2F";
      default:          return "#64748B";
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    const marker = new maplibregl.Marker();

    const lon = Number(event?.longitude);
    const lat = Number(event?.latitude);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.current.flyTo({ center: [lon, lat], zoom: 14 });
      marker
        .setLngLat([lon, lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setText(
            event?.location || "Event Location"
          )
        )
        .addTo(map.current);
    } else {
      setMapWarning("No coordinates available");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [event?._id, event?.latitude, event?.longitude, event?.location]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDeleteClick = async () => {
    await onDelete(event._id);
    onClose();
    onRefresh?.();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      {/* ── Modal container ── */}
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 16,
          width: "95vw",
          height: "90vh",
          maxWidth: "1400px",
          maxHeight: "900px",
          minWidth: "800px",
          minHeight: "600px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            fontSize: 20,
            cursor: "pointer",
            border: "none",
            background: "none",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* ── Top section: Map + Participants ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "20px 20px 12px 20px",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* MAP */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div
              ref={mapContainer}
              style={{
                width: "100%",
                flex: 1,
                minHeight: 200,
                borderRadius: 8,
                overflow: "hidden",
                background: "#E5E7EB",
              }}
            />
            {mapWarning && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#EF4444",
                }}
              >
                {mapWarning}
              </div>
            )}
          </div>

          {/* PARTICIPANTS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 12,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                List of Volunteers
              </h3>
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                flexShrink: 0,
              }}
            >
              {["All", "Pending", "Approved", "Rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === tab ? "#4169E1" : "#E2E8F0",
                    color: activeTab === tab ? "#fff" : "#111827",
                    fontWeight: 600,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable participant list */}
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {filteredParticipants.map((participant) => {
                const userId =
                  participant?.userId?._id ||
                  participant?.userId ||
                  participant?.user?._id ||
                  participant?.user ||
                  participant?._id;

                const name =
                  participant?.userId?.name ||
                  participant?.user?.name ||
                  participant?.name ||
                  "Unknown";

                const role =
                  participant?.userId?.role ||
                  participant?.userId?.account_type ||
                  participant?.user?.role ||
                  participant?.user?.account_type ||
                  participant?.role ||
                  participant?.account_type ||
                  "Volunteer";

                const status = participant?.status || "Pending";

                return (
                  <div
                    key={userId || participant?._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#4169E1",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Role */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        {role}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      style={{
                        background: statusColor(status),
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {status}
                    </span>

                    {/* Action buttons */}
                    {status === "Pending" && (
                      <>
                        <button
                          onClick={() =>
                            onParticipantAction(event._id, userId, "Approved")
                          }
                          style={{
                            background: "#22C55E",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            onParticipantAction(event._id, userId, "Rejected")
                          }
                          style={{
                            background: "#EF4444",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {status === "Approved" && (
                      <button
                        onClick={() =>
                          onParticipantAction(event._id, userId, "Rejected")
                        }
                        style={{
                          background: "#EF4444",
                          color: "#fff",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        Remove
                      </button>
                    )}

                    {status === "Rejected" && (
                      <button
                        onClick={() =>
                          onParticipantAction(event._id, userId, "Pending")
                        }
                        style={{
                          background: "#F59E0B",
                          color: "#fff",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom section: Title + Description + Actions ── */}
        <div
          style={{
            padding: "12px 20px 20px",
            borderTop: "1px solid #E2E8F0",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
              marginTop: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event?.title}
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 1.6,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event?.description}
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => onEdit?.(event)}
              style={{
                background: "#4169E1",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Edit
            </button>

            <button
              onClick={handleDeleteClick}
              style={{
                background: "#EF4444",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Delete
            </button>

            <button
              onClick={() => onStatusChange?.(event)}
              style={{
                background: statusColor(event?.status),
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              {event?.status || "Upcoming"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}