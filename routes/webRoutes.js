const express = require('express');
const pageController = require('../controllers/pageController');
const { proofUpload, handleProofUploadError } = require('../middleware/uploadMiddleware');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', pageController.home);
router.get('/about', pageController.about);
router.get('/mission', pageController.mission);
router.get('/mission-fields', pageController.missionFields);
router.get('/projects', pageController.projects);
router.get('/get-involved', pageController.getInvolved);
router.post('/volunteer/apply', pageController.submitVolunteerApplication);
router.post('/prayer-partner/signup', pageController.signupPrayerPartner);
router.post('/prayer-request', pageController.submitPrayerRequest);
router.get('/sponsor', pageController.sponsor);
router.post('/sponsor', pageController.submitSponsorshipInterest);
router.get('/sponsor/thank-you', pageController.sponsorThankYou);
router.get('/blog', pageController.blog);
router.get('/blog/featured-post', pageController.blogPostLegacy);
router.get('/blog/:slug', pageController.blogPost);
router.get('/stories', pageController.stories);
router.get('/gallery', pageController.gallery);
router.get('/contact', pageController.contact);
router.post('/contact', pageController.submitContact);
router.get('/donate', pageController.donate);
router.post(
  '/donate',
  (req, res, next) => proofUpload.single('proofFile')(req, res, (error) => {
    if (error) {
      handleProofUploadError(error, req, res, next);
      return;
    }
    next();
  }),
  pageController.submitDonation
);
router.get('/donate/thank-you', pageController.donateThankYou);
router.get('/volunteer/thank-you', pageController.volunteerThankYou);
router.get('/prayer-partner/thank-you', pageController.prayerPartnerThankYou);
router.get('/prayer-request/thank-you', pageController.prayerRequestThankYou);
router.get('/donations/:id/receipt', requireAuth, pageController.viewDonationReceipt);
router.post('/newsletter/subscribe', pageController.subscribeNewsletter);

module.exports = router;
