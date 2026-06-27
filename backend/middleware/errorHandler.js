const errorHandler = (err, req, res, next) => {

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ error: msg });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate value' });
  }

  const status = err.statusCode || 500;
  console.error('Error:', err.message);
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
};

module.exports = errorHandler;
