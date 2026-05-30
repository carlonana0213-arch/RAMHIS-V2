import { io } from "socket.io-client";
import { API_BASE_URL } from "./apiConfig";

const socket = io(API_BASE_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;
