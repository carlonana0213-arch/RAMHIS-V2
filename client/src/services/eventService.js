import axios from "axios";

const API_URL = "http://localhost:5000/api/events";

// Token helper
// Token helper
const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    user.token ||
    user.accessToken
  );
};

const getConfig = () => {
  const token = getToken();

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

// GET all events
export const getAllEvents = async () => {
  const response = await axios.get(API_URL, getConfig());
  return response.data;
};

// GET single event
export const getEventById = async (id) => {
  const response = await axios.get(
    `${API_URL}/${id}`,
    getConfig()
  );

  return response.data;
};

// CREATE event
export const createEvent = async (eventData) => {
  const response = await axios.post(
    API_URL,
    eventData,
    getConfig()
  );

  return response.data;
};

// UPDATE event
export const updateEvent = async (id, eventData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    eventData,
    getConfig()
  );

  return response.data;
};

// DELETE event
export const deleteEvent = async (id) => {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    getConfig()
  );

  return response.data;
};

// JOIN event
export const joinEvent = async (id) => {
  const response = await axios.post(
    `${API_URL}/${id}/join`,
    {},
    getConfig()
  );

  return response.data;
};

// UPDATE participant status
export const updateParticipantStatus = async (
  eventId,
  userId,
  status
) => {
  const response = await axios.patch(
    `${API_URL}/${eventId}/participants/${userId}/status`,
    { status },
    getConfig()
  );

  return response.data;
};