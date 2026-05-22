// server/middleware/logger.js

const COLORS = {
  GET: "\x1b[32m",
  POST: "\x1b[34m",
  PUT: "\x1b[33m",
  PATCH: "\x1b[33m",
  DELETE: "\x1b[31m",
  RESET: "\x1b[0m",
};

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

function logger(req, res, next) {
  if (req.path === "/" || req.path === "/health") {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const responseTime = Number(end - start) / 1_000_000;

    const method = req.method.toUpperCase();
    const color = COLORS[method] || "";
    const reset = COLORS.RESET;

    console.log(
      `[${formatTimestamp()}] ${color}${method}${reset} ${req.originalUrl} ${res.statusCode} ${Math.round(
        responseTime
      )}ms`
    );
  });

  next();
}

module.exports = logger;
module.exports.logger = logger;
module.exports.default = logger;