const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', dashboardController.index);
router.get('/profile', dashboardController.profile);
router.post('/profile', dashboardController.updateProfile);
router.get('/change-password', dashboardController.changePasswordForm);
router.post('/change-password', dashboardController.changePassword);
router.get('/donations', dashboardController.donations);
router.get('/donations/:id', dashboardController.viewDonation);
router.get('/sponsorships', dashboardController.sponsorships);
router.get('/sponsorships/assignments/:id', dashboardController.viewSponsorshipAssignment);
router.get('/sponsorships/:id', dashboardController.viewSponsorship);
router.get('/applications', dashboardController.applications);
router.get('/applications/:id', dashboardController.viewApplication);
router.get('/prayer', dashboardController.prayer);
router.post('/prayer', dashboardController.updatePrayerPreferences);
router.get('/messages', dashboardController.messages);

module.exports = router;
