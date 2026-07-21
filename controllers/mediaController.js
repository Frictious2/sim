const fs = require('fs/promises');
const path = require('path');

const siteContent = require('../data/site-content');
const Media = require('../models/Media');
const { normalizeNullable } = require('../utils/validation');
const { fileMatchesAllowedSignature } = require('../middleware/uploadMiddleware');
const { normalizePage, normalizeLimit, buildPagination } = require('../utils/pagination');
const { logAction } = require('../services/auditService');

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/admin',
    section: 'admin',
    content: siteContent,
    ...options
  });
}

exports.index = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    mimeType: String(req.query.mimeType || '').trim(),
    usageType: String(req.query.usageType || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 12, 48)
  };
  const result = await Media.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const mediaItems = result.rows.map((item) => ({
    ...item,
    uploadedByName: item.uploaded_by_name || 'SIM Staff',
    fileSizeLabel: `${Math.max(1, Math.round(Number(item.file_size || 0) / 1024))} KB`
  }));

  return render(res, 'admin/media', {
    title: 'Media Library',
    mediaItems,
    filters,
    pagination,
    mimeTypes: result.mimeTypes || [],
    usageTypes: result.usageTypes || []
  });
};

exports.upload = async (req, res) => {
  if (!req.file) {
    req.flash('error', 'Please choose an image to upload.');
    return res.redirect('/admin/media');
  }

  const absolutePath = req.file.path;
  const publicUrl = `/uploads/media/${req.file.filename}`;
  const relativeFilepath = path.posix.join('public', 'uploads', 'media', req.file.filename);

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    if (!fileMatchesAllowedSignature(fileBuffer, req.file.mimetype)) {
      await fs.unlink(absolutePath).catch(() => {});
      req.flash('error', 'The uploaded file did not match a valid JPG, PNG, or WEBP image signature.');
      return res.redirect('/admin/media');
    }

    const mediaItem = await Media.create({
      title: normalizeNullable(req.body.title),
      altText: normalizeNullable(req.body.altText),
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filepath: relativeFilepath,
      publicUrl,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.session.user.id,
      usageType: normalizeNullable(req.body.usageType)
    });
    await logAction({
      req,
      action: 'upload_media',
      entityType: 'media',
      entityId: mediaItem ? mediaItem.id : null,
      metadata: { publicUrl, mimeType: req.file.mimetype }
    });

    req.flash('success', 'Image uploaded to the media library.');
    return res.redirect('/admin/media');
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    req.flash('error', 'The upload could not be saved right now. Please try again.');
    return res.redirect('/admin/media');
  }
};

exports.delete = async (req, res) => {
  const mediaItem = await Media.findById(req.params.id);
  if (!mediaItem) {
    req.flash('error', 'That media item could not be found.');
    return res.redirect('/admin/media');
  }

  const absolutePath = path.join(process.cwd(), mediaItem.filepath);
  await Media.delete(mediaItem.id);
  await fs.unlink(absolutePath).catch(() => {});
  await logAction({
    req,
    action: 'delete_media',
    entityType: 'media',
    entityId: mediaItem.id,
    metadata: { publicUrl: mediaItem.public_url }
  });

  req.flash('success', 'Media item deleted successfully.');
  return res.redirect('/admin/media');
};
