const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', dashboardController.index);
router.get('/profile', dashboardController.profile);
router.get('/donations', dashboardController.donations);
router.get('/sponsorships', dashboardController.sponsorships);

module.exports = router;
