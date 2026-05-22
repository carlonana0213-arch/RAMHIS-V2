function safeServerError(res, error) {
  console.error("❌ SERVER ERROR:", error?.response?.body || error);

  return res.status(500).json({
    ok: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : error?.message || "Internal server error.",
  });
}

module.exports = {
  safeServerError,
};