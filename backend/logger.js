const LEVELS = ["debug", "info", "warn", "error"];

function log(level, message, context = {}) {
  if (!LEVELS.includes(level)) {
    level = "info";
  }
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...context,
  };
  console.log(JSON.stringify(payload));
}

module.exports = {
  log,
  info: (message, context) => log("info", message, context),
  warn: (message, context) => log("warn", message, context),
  error: (message, context) => log("error", message, context),
};
