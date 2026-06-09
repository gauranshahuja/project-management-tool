// Async route handlers ko wrap karta hai taaki rejected promises
// central error handler tak pahunchein (har jagah try/catch repeat na karna pade).
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
