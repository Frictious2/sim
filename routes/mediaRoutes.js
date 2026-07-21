const express = require('express');

const mediaController = require('../controllers/mediaController');
const { mediaUpload, handleUploadError } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', mediaController.index);
router.post(
  '/upload',
  (req, res, next) => mediaUpload.single('mediaFile')(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res, next);
      return;
    }
    next();
  }),
  mediaController.upload
);
router.post('/:id/delete', mediaController.delete);

module.exports = router;
