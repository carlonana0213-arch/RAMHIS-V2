import { useState, useEffect } from "react";
import { createEvent, updateEvent } from "../services/eventService";
import "../styles/EventModal.css";

const EventModal = ({ onClose, refreshEvents, event }) => {
  const isEditMode = Boolean(event?._id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "Medical Mission",
    status: "Upcoming",
    imageUrl: "",
  });

  // ── Pre-fill form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        latitude: event.latitude ?? "",
        longitude: event.longitude ?? "",
        googleMapsUrl: event.googleMapsUrl || "",
        date: event.date
          ? new Date(event.date).toISOString().split("T")[0]
          : "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        type: event.type || "Medical Mission",
        status: event.status || "Upcoming",
        imageUrl: event.imageUrl || "",
      });
    }
  }, [event, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
      };

      if (isEditMode) {
        console.log("UPDATE EVENT PAYLOAD:", payload);
        await updateEvent(event._id, payload);
      } else {
        console.log("CREATE EVENT PAYLOAD:", payload);
        await createEvent(payload);
      }

      refreshEvents();
      onClose();
    } catch (error) {
      console.error(
        isEditMode ? "Update event error:" : "Create event error:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          (isEditMode ? "Failed to update event" : "Failed to create event")
      );
    }
  };

  const handleDetectCoordinates = async () => {
    try {
      const input = formData.location.trim();

      if (!input) {
        alert("Please enter a place name or Google Maps link.");
        return;
      }

      let lat = null;
      let lon = null;
      let placeName = "";

      const coordinateMatch =
        input.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
        input.match(/q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
        input.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

      if (coordinateMatch) {
        lat = coordinateMatch[1];
        lon = coordinateMatch[2];

        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const reverseData = await reverseResponse.json();
        placeName = reverseData?.display_name || formData.location;
      } else {
        const query = encodeURIComponent(input);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
        );
        const data = await response.json();

        if (!data?.length) {
          alert("Location not found.");
          return;
        }

        lat = data[0].lat;
        lon = data[0].lon;
        placeName = data[0].display_name || input;
      }

      setFormData({
        ...formData,
        location: placeName,
        latitude: lat,
        longitude: lon,
        googleMapsUrl: input.includes("google.com/maps") ? input : "",
      });

      alert("Place name and coordinates detected!");
    } catch (err) {
      console.error(err);
      alert("Failed to detect coordinates.");
    }
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">

        {/* ── Header ── */}
        <div className="event-modal-header">
          <h2>{isEditMode ? "Edit Event" : "Create New Event"}</h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: "#64748B",
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EF4444";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.color = "#64748B";
              e.currentTarget.style.borderColor = "#E2E8F0";
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="event-form">
          <input
            name="title"
            placeholder="Event title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />

          <input
            name="location"
            placeholder="Location name"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <button
            type="button"
            onClick={handleDetectCoordinates}
            style={{
              marginBottom: 14,
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#4169E1",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Detect Coordinates
          </button>

          <div className="event-form-row">
            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
            />
            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
            />
          </div>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <div className="event-form-row">
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>

          <select name="type" value={formData.type} onChange={handleChange}>
            <option>Medical Mission</option>
            <option>Training</option>
            <option>Seminar</option>
            <option>Community Outreach</option>
            <option>Other</option>
          </select>

          <select name="status" value={formData.status} onChange={handleChange}>
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          <input
            name="imageUrl"
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={handleChange}
          />

          <button type="submit" className="save-event-btn">
            {isEditMode ? "Update Event" : "Save Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventModal;