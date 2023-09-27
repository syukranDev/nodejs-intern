const { format, createLogger, transports } = require("winston");

const { combine, timestamp, label, printf } = format;
const DEV = "DEV ENVIRONMENT";

let todayDate = (new Date()).toISOString().split('T')[0]

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(label({ label: DEV }), timestamp(), customFormat),
  transports: [new transports.Console(),
      new transports.File({
        filename: `logs/${todayDate}.log`
      })
    ],
});

module.exports = logger;