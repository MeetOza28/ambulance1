// import winston from "winston";

// const logger = winston.createLogger({
//   level: process.env.NODE_ENV === "production" ? "info" : "debug",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
//   ),
//   transports: [new winston.transports.Console()]
// });

// // Add morgan stream support
// logger.stream = {
//   write: (message) => logger.info(message.trim())
// };

// export default logger;
