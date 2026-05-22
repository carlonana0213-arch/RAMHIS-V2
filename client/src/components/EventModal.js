import { useState } from "react";
import { createEvent } from "../services/eventService";
import "../styles/EventModal.css";

const EventModal = ({ onClose, refreshEvents }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "Medical Mission",
    status: "Upcoming",
    imageUrl: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createEvent(formData);
      refreshEvents();
      onClose();
    } catch (error) {
  console.error("Create event error:", error.response?.data || error.message);
  alert(error.response?.data?.message || "Failed to create event");
}
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">
        <div className="event-modal-header">
          <h2>Create New Event</h2>
          <button onClick={onClose}>×</button>
        </div>

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
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
          />

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

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          <input
            name="imageUrl"
            placeholder="Image URL optional"
            value={formData.imageUrl}
            onChange={handleChange}
          />

          <button type="submit" className="save-event-btn">
            Save Event
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventModal;