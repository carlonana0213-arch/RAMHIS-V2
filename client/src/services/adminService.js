const API = "http://localhost:5000/api/admin";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.msg || "Request failed");
  }

  return data;
}

export const getAllUsers = async () => {
  const res = await fetch(`${API}/users`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(res);
};

export const approveUser = async (id) => {
  const res = await fetch(`${API}/approve/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse(res);
};

export const rejectUser = async (id) => {
  const res = await fetch(`${API}/reject/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse(res);
};

export const updateUser = async (data) => {
  const res = await fetch(`${API}/users/${data._id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(res);
};

export const updateUserStatus = async (id, status) => {
  const res = await fetch(`${API}/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      verificationStatus: status,
    }),
  });

  return handleResponse(res);
};