const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.home);
router.get('/about', pageController.about);
router.get('/mission', pageController.mission);
router.get('/mission-fields', pageController.missionFields);
router.get('/projects', pageController.projects);
router.get('/sponsor', pageController.sponsor);
router.get('/blog', pageController.blog);
router.get('/stories', pageController.stories);
router.get('/gallery', pageController.gallery);
router.get('/contact', pageController.contact);
router.get('/donate', pageController.donate);

module.exports = router;
