import { useEffect, useState } from "react";
import { FaCalendarAlt, FaUsers, FaEye } from "react-icons/fa";
import {
  getAllEvents,
  deleteEvent,
  updateEvent,
  updateParticipantStatus,
} from "../services/eventService";

import EventModal from "../components/EventModal";

import "../styles/EventManagement.css";

import EventViewModal from "../components/EventViewModal";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] =
  useState(null);

const [showViewModal, setShowViewModal] =
  useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this event?");

    if (!confirmDelete) return;

    try {
      await deleteEvent(id);
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "#3949AB";

      case "Ongoing":
        return "#2E7D32";

      case "Completed":
        return "#757575";

      case "Cancelled":
        return "#D32F2F";

      default:
        return "#999";
    }
  };

  const handleParticipantStatus = async (eventId, userId, status) => {
  try {
    const response = await updateParticipantStatus(
      eventId,
      userId,
      status
    );

    await fetchEvents();

    if (response?.data) {
      setSelectedEvent(response.data);
    }
  } catch (error) {
    console.error(
      "Update participant status error:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
        "Failed to update participant status"
    );
  }
};


const handleEditEvent = (event) => {
  setEditEvent(event);
  setShowViewModal(false);
  setShowModal(true);
};

const handleStatusChange = async (event) => {
  const statusOrder = [
    "Upcoming",
    "Ongoing",
    "Completed",
    "Cancelled",
  ];

  const currentIndex = statusOrder.indexOf(event.status);

  const nextStatus =
    statusOrder[(currentIndex + 1) % statusOrder.length];

  try {
    const response = await updateEvent(event._id, {
      status: nextStatus,
    });

    await fetchEvents();

    if (response?.data) {
      setSelectedEvent(response.data);
    }
  } catch (error) {
    console.error(
      "Update status error:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
        "Failed to update event status"
    );
  }
};


  return (
    <div className="event-page">
      {/* HEADER */}
      <div className="event-header">
        <div>
          <h1>
            <FaCalendarAlt /> Event Management
          </h1>

          <p>Create and manage community health events</p>
        </div>

        <button
  className="create-btn"
  onClick={() => {
    setEditEvent(null);
    setShowModal(true);
  }}
>
  + Create New Event
</button>
      </div>

      {/* EVENTS TABLE */}
      <div className="event-card">
        <div className="card-title">
          <FaUsers /> My Created Events
        </div>

        <table className="event-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event._id}>
                <td>{event.title}</td>

                <td>{new Date(event.date).toLocaleDateString()}</td>

                <td>{event.location}</td>

                <td>{event.type}</td>

                <td>
                  <span
                    className="status-badge"
                    style={{
                      background: statusColor(event.status),
                    }}
                  >
                    {event.status}
                  </span>
                </td>

                <td>{event.participants?.length || 0}</td>
<td className="action-buttons">
  <button
    onClick={() => {
      setSelectedEvent(event);
      setShowViewModal(true);
    }}
  >
    <FaEye />
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {showViewModal &&
  selectedEvent && (
    <EventViewModal
      event={selectedEvent}
      onClose={() => {
        setShowViewModal(false);
        setSelectedEvent(null);
      }}
      onParticipantAction={
        handleParticipantStatus
      }
      onDelete={handleDelete}
      onRefresh={fetchEvents}
      onEdit={handleEditEvent}
onStatusChange={handleStatusChange}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  )}
  {showModal && (
  <EventModal
    event={editEvent}
    onClose={() => {
      setShowModal(false);
      setEditEvent(null);
    }}
    refreshEvents={fetchEvents}
  />
)}
    </div>
  );
};

export default EventManagement;
