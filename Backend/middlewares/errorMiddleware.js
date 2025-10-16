export const notFound = (req, res, next) => {
  res.status(404);
  const err = new Error(`Not Found - ${req.originalUrl}`);
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // show stack in development
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};