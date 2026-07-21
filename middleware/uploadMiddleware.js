const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const mediaDirectory = path.join(process.cwd(), 'public', 'uploads', 'media');
const proofDirectory = path.join(process.cwd(), 'public', 'uploads', 'proofs');

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const proofMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const proofExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

fs.mkdirSync(mediaDirectory, { recursive: true });
fs.mkdirSync(proofDirectory, { recursive: true });

function generateFilename(originalName = '', allowedExtensions = new Set()) {
  const extension = path.extname(String(originalName || '')).toLowerCase();
  const safeExtension = allowedExtensions.has(extension) ? extension : '.bin';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`;
}

function createUpload({ destination, allowedMimeTypes, allowedExtensions, maxFileSize, errorMessage }) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname, allowedExtensions))
  });

  function fileFilter(_req, file, cb) {
    const extension = path.extname(String(file.originalname || '')).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      cb(new Error(errorMessage));
      return;
    }

    cb(null, true);
  }

  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter
  });
}

function fileMatchesAllowedSignature(buffer, mimeType = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
  }

  if (mimeType === 'image/webp') {
    return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }

  return false;
}

function fileMatchesProofSignature(buffer, mimeType = '') {
  if (mimeType === 'application/pdf') {
    return Buffer.isBuffer(buffer) && buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-';
  }

  return fileMatchesAllowedSignature(buffer, mimeType);
}

function handleUploadErrorFactory({ redirectPath, sizeMessage, fallbackMessage }) {
  return (err, req, res, next) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', sizeMessage);
      res.redirect(redirectPath);
      return;
    }

    req.flash('error', err.message || fallbackMessage);
    res.redirect(redirectPath);
  };
}

const mediaUpload = createUpload({
  destination: mediaDirectory,
  allowedMimeTypes: imageMimeTypes,
  allowedExtensions: imageExtensions,
  maxFileSize: 5 * 1024 * 1024,
  errorMessage: 'Only JPG, JPEG, PNG, and WEBP image uploads are allowed.'
});

const proofUpload = createUpload({
  destination: proofDirectory,
  allowedMimeTypes: proofMimeTypes,
  allowedExtensions: proofExtensions,
  maxFileSize: 5 * 1024 * 1024,
  errorMessage: 'Only JPG, JPEG, PNG, WEBP, and PDF proof uploads are allowed.'
});

const handleUploadError = handleUploadErrorFactory({
  redirectPath: '/admin/media',
  sizeMessage: 'Image uploads must be 5MB or smaller.',
  fallbackMessage: 'The upload could not be processed.'
});

const handleProofUploadError = handleUploadErrorFactory({
  redirectPath: '/donate',
  sizeMessage: 'Proof files must be 5MB or smaller.',
  fallbackMessage: 'The donation proof upload could not be processed.'
});

module.exports = {
  mediaUpload,
  proofUpload,
  handleUploadError,
  handleProofUploadError,
  mediaDirectory,
  proofDirectory,
  fileMatchesAllowedSignature,
  fileMatchesProofSignature
};
