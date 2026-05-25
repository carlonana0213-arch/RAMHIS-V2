import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE =
  "https://demotiles.maplibre.org/style.json";

const DEFAULT_CENTER = [121.0, 14.6];
const DEFAULT_ZOOM = 10;

export default function EventViewModal({
  event,
  onClose,
  onParticipantAction,
  onDelete,
  onRefresh,
  activeTab,
  setActiveTab,
}) {
  const overlayRef = useRef(null);

  const mapContainer = useRef(null);
  const map = useRef(null);

  const [mapWarning, setMapWarning] =
    useState("");

  const participants = useMemo(() => {
    return event?.participants || [];
  }, [event]);

  const filteredParticipants = useMemo(() => {
    if (activeTab === "Approved") {
      return participants.filter(
        (p) => p.status === "Approved"
      );
    }

    if (activeTab === "Rejected") {
      return participants.filter(
        (p) => p.status === "Rejected"
      );
    }

    if (activeTab === "Pending") {
      return participants.filter(
        (p) => p.status === "Pending"
      );
    }

    return participants;
  }, [participants, activeTab]);

  const statusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#22C55E";

      case "Rejected":
        return "#EF4444";

      case "Pending":
        return "#F59E0B";

      default:
        return "#64748B";
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

    map.current.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    const marker = new maplibregl.Marker();

    console.log("EVENT DATA:", event);
console.log("LAT:", event?.latitude);
console.log("LON:", event?.longitude);

    const lon = Number(event?.longitude);
const lat = Number(event?.latitude);

if (
  Number.isFinite(lat) &&
  Number.isFinite(lon)
) {
  map.current.flyTo({
    center: [lon, lat],
    zoom: 14,
  });

  marker
    .setLngLat([lon, lat])
    .setPopup(
      new maplibregl.Popup({
        offset: 25,
      }).setText(
        event?.location || "Event Location"
      )
    )
    .addTo(map.current);
} else {
  setMapWarning(
    "No coordinates available"
  );
}

    

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [event?.location]);

  const handleOverlayClick = (e) => {
    if (
      e.target === overlayRef.current
    ) {
      onClose();
    }
  };

  const handleDeleteClick =
    async () => {
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
        background:
          "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 12,
          width: "90%",
          maxWidth: 820,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
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
          }}
        >
          ✕
        </button>

        <div
          style={{
            display: "flex",
            gap: 16,
            padding: 20,
            flexWrap: "wrap",
          }}
        >
          {/* MAP */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              ref={mapContainer}
              style={{
                width: "100%",
                height: 220,
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
              flex: 1,
              minWidth: 0,
              maxHeight: 280,
              overflowY: "auto",
              border:
                "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                List of Volunteers
              </h3>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                "All",
                "Pending",
                "Approved",
                "Rejected",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(tab)
                  }
                  style={{
                    padding:
                      "6px 12px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background:
                      activeTab === tab
                        ? "#4169E1"
                        : "#E2E8F0",
                    color:
                      activeTab === tab
                        ? "#fff"
                        : "#111827",
                    fontWeight: 600,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {filteredParticipants.map(
              (participant) => {
                const name =
                  participant?.name ||
                  participant?.user?.name ||
                  "Unknown";

                const role =
                  participant
                    ?.account_type ||
                  participant?.role ||
                  participant?.user
                    ?.account_type ||
                  "Volunteer";

                const status =
                  participant?.status ||
                  "Pending";

                return (
                  <div
                    key={
                      participant?._id
                    }
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 10,
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid #F1F5F9",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius:
                          "50%",
                        background:
                          "#4169E1",
                        color: "#fff",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontWeight: 700,
                      }}
                    >
                      {name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {name}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color:
                            "#64748B",
                        }}
                      >
                        {role}
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          statusColor(
                            status
                          ),
                        color: "#fff",
                        padding:
                          "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {status}
                    </span>

                    {status ===
                      "Pending" && (
                      <>
                        <button
                          onClick={() =>
                            onParticipantAction(
                              event._id,
                              participant
                                .userId ||
                                participant
                                  ?._id,
                              "Approved"
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            onParticipantAction(
                              event._id,
                              participant
                                .userId ||
                                participant
                                  ?._id,
                              "Rejected"
                            )
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {status ===
                      "Approved" && (
                      <button
                        onClick={() =>
                          onParticipantAction(
                            event._id,
                            participant
                              .userId ||
                              participant
                                ?._id,
                            "Removed"
                          )
                        }
                      >
                        Remove
                      </button>
                    )}

                    {status ===
                      "Rejected" && (
                      <button
                        onClick={() =>
                          onParticipantAction(
                            event._id,
                            participant
                              .userId ||
                              participant
                                ?._id,
                            "Pending"
                          )
                        }
                      >
                        Restore
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* BOTTOM */}
        <div
          style={{
            padding:
              "0 20px 20px",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {event?.title}
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 1.6,
            }}
          >
            {event?.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <button>
              Edit
            </button>

            <button
              onClick={
                handleDeleteClick
              }
              style={{
                background:
                  "#EF4444",
                color: "#fff",
                border: "none",
                padding:
                  "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Delete
            </button>

            <span
              style={{
                background:
                  statusColor(
                    event?.status
                  ),
                color: "#fff",
                padding:
                  "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {event?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}