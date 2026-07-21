const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    if (req.flash) {
      req.flash('error', 'Too many authentication attempts. Please try again in a few minutes.');
    }

    res.redirect(req.originalUrl.includes('register') ? '/register' : '/login');
  }
});

module.exports = {
  authRateLimiter
};
