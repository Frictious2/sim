const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/', adminController.index);
router.get('/users', adminController.users);
router.get('/blog-posts', adminController.blogPosts);
router.get('/projects', adminController.projects);
router.get('/donations', adminController.donations);
router.get('/sponsorships', adminController.sponsorships);
router.get('/volunteers', adminController.volunteers);
router.get('/messages', adminController.messages);

module.exports = router;
