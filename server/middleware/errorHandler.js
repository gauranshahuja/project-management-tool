// Central error handler — sab errors ek hi shape me bhejta hai: { error }.
// Mongoose ke common errors ko sahi status code deta hai.
const errorHandler = (err, req, res, next) => {
  // Galat ObjectId (e.g. /projects/abc) -> 400
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  // Mongoose validation error -> 400 (pehla message)
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ error: msg });
  }

  // Duplicate key (e.g. email already exists) -> 400
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate value' });
  }

  const status = err.statusCode || 500;
  console.error('Error:', err.message);
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
};

module.exports = errorHandler;
