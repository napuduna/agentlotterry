const { randomUUID } = require('crypto');

const requestContext = (req, res, next) => {
  const incomingRequestId = String(req.header('x-request-id') || '').trim();
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};

module.exports = requestContext;
