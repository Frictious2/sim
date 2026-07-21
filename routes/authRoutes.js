const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, requireGuest } = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/login', requireGuest, authController.showLogin);
router.post('/login', requireGuest, authRateLimiter, authController.login);
router.get('/register', requireGuest, authController.showRegister);
router.post('/register', requireGuest, authRateLimiter, authController.register);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
