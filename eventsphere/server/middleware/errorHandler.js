export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for development
  console.error('Error Stack:', err.stack);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    res.status(404);
  }

  // Mongoose Duplicate Key Error (e.g. email already exists)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(', ');
    const message = `Duplicate field value entered for [${fields}]. Please use another value.`;
    error = new Error(message);
    res.status(400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    res.status(400);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    data: null,
    message: error.message || 'Server Error'
  });
};
