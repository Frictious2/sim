const siteContent = require('../data/site-content');
const BlogPost = require('../models/BlogPost');
const Project = require('../models/Project');
const HomepageSection = require('../models/HomepageSection');
const GalleryItem = require('../models/GalleryItem');
const Testimony = require('../models/Testimony');
const Page = require('../models/Page');
const ContactMessage = require('../models/ContactMessage');
const SiteSetting = require('../models/SiteSetting');
const EmailTemplate = require('../models/EmailTemplate');
const NotificationLog = require('../models/NotificationLog');
const Media = require('../models/Media');
const User = require('../models/User');
const Donation = require('../models/Donation');
const DonationStatusLog = require('../models/DonationStatusLog');
const EngagementNote = require('../models/EngagementNote');
const SponsorshipInterest = require('../models/SponsorshipInterest');
const VolunteerApplication = require('../models/VolunteerApplication');
const PrayerPartner = require('../models/PrayerPartner');
const PrayerRequest = require('../models/PrayerRequest');
const env = require('../config/env');
const { getSettingsGrouped, getPublicSiteContext } = require('../services/siteSettingsService');
const { logAction, listRecent, findForAdmin, findById: findAuditLogById } = require('../services/auditService');
const { renderTemplate } = require('../services/templateService');
const { sendTemplatedNotification, sendLoggedEmail } = require('../services/notificationService');
const { slugify, resolveUniqueSlug } = require('../utils/slug');
const { normalizeNullable, normalizeBoolean, pickAllowedValue, normalizeAmount, normalizeEnum, isValidEmail, isValidPhone } = require('../utils/validation');
const { formatDateTime, truncateText, stripHtml } = require('../utils/formatting');
const { sanitizeRichHtml } = require('../utils/sanitizeHtml');
const { normalizePage, normalizeLimit, buildPagination } = require('../utils/pagination');
const { rowsToCsv } = require('../utils/csv');

const BLOG_STATUSES = ['draft', 'published', 'archived'];
const PROJECT_STATUSES = ['planned', 'active', 'completed', 'paused'];
const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'];
const CONTENT_STATUSES = ['draft', 'published', 'archived'];
const PAGE_STATUSES = ['draft', 'published'];
const MEDIA_LIMIT = 12;
const DONATION_STATUSES = ['pending', 'verified', 'rejected', 'cancelled'];
const DONATION_DESIGNATIONS = ['general_mission', 'child_sponsorship', 'outreach', 'church_planting', 'community_support', 'other'];
const DONATION_METHODS = ['mobile_money', 'bank_transfer', 'cash', 'other'];
const DONATION_TYPES = ['one_time', 'monthly', 'quarterly', 'annual'];
const SPONSORSHIP_INTEREST_STATUSES = ['new', 'contacted', 'approved', 'rejected', 'archived'];
const SPONSORSHIP_INTEREST_TYPES = ['child', 'project', 'mission_worker', 'general'];
const SPONSORSHIP_INTEREST_PLANS = ['monthly', 'quarterly', 'annual', 'one_time'];
const VOLUNTEER_APPLICATION_STATUSES = ['new', 'reviewing', 'approved', 'rejected', 'archived'];
const VOLUNTEER_AREAS = ['field_outreach', 'children_ministry', 'media', 'administration', 'prayer', 'training', 'other'];
const PRAYER_PARTNER_STATUSES = ['active', 'inactive', 'unsubscribed'];
const PRAYER_FOCUS_VALUES = ['general', 'mission_fields', 'children', 'volunteers', 'church_planting', 'community_support'];
const PRAYER_REQUEST_STATUSES = ['new', 'reviewed', 'prayed', 'archived'];
const NOTIFICATION_STATUSES = ['skipped', 'sent', 'failed'];
const USER_ROLES = ['admin', 'user', 'donor', 'sponsor', 'volunteer', 'partner'];
const USER_STATUSES = ['active', 'inactive', 'suspended'];

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/admin',
    section: 'admin',
    content: siteContent,
    ...options
  });
}

function rememberFormData(req) {
  req.flash('formData', JSON.stringify(req.body || {}));
}

function getRememberedFormData(res) {
  return res.locals.formData || {};
}

function buildBlogPostFormState(blogPost, remembered = {}) {
  if (!blogPost && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(blogPost || {}),
    title: remembered.title ?? (blogPost ? blogPost.title : ''),
    slug: remembered.slug ?? (blogPost ? blogPost.slug : ''),
    category: remembered.category ?? (blogPost ? (blogPost.category || '') : ''),
    status: remembered.status ?? (blogPost ? blogPost.status : 'draft'),
    featured_image: remembered.featuredImage ?? (blogPost ? (blogPost.featured_image || '') : ''),
    excerpt: remembered.excerpt ?? (blogPost ? (blogPost.excerpt || '') : ''),
    meta_title: remembered.metaTitle ?? (blogPost ? (blogPost.meta_title || '') : ''),
    meta_description: remembered.metaDescription ?? (blogPost ? (blogPost.meta_description || '') : ''),
    body: remembered.body ?? (blogPost ? sanitizeRichHtml(blogPost.body || '') : '')
  };
}

function buildProjectFormState(project, remembered = {}) {
  if (!project && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(project || {}),
    title: remembered.title ?? (project ? project.title : ''),
    slug: remembered.slug ?? (project ? project.slug : ''),
    location: remembered.location ?? (project ? (project.location || '') : ''),
    category: remembered.category ?? (project ? (project.category || '') : ''),
    status: remembered.status ?? (project ? project.status : 'planned'),
    progress_label: remembered.progressLabel ?? (project ? (project.progress_label || '') : ''),
    featured_image: remembered.featuredImage ?? (project ? (project.featured_image || '') : ''),
    meta_title: remembered.metaTitle ?? (project ? (project.meta_title || '') : ''),
    meta_description: remembered.metaDescription ?? (project ? (project.meta_description || '') : ''),
    summary: remembered.summary ?? (project ? (project.summary || '') : ''),
    description: remembered.description ?? (project ? sanitizeRichHtml(project.description || '') : ''),
    is_featured: remembered.isFeatured !== undefined ? normalizeBoolean(remembered.isFeatured) : (project ? Boolean(project.is_featured) : false)
  };
}

function buildGalleryFormState(galleryItem, remembered = {}) {
  if (!galleryItem && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(galleryItem || {}),
    title: remembered.title ?? (galleryItem ? galleryItem.title : ''),
    sort_order: remembered.sortOrder ?? (galleryItem ? galleryItem.sort_order : 0),
    category: remembered.category ?? (galleryItem ? (galleryItem.category || '') : ''),
    status: remembered.status ?? (galleryItem ? galleryItem.status : 'draft'),
    image_url: remembered.imageUrl ?? (galleryItem ? galleryItem.image_url : ''),
    caption: remembered.caption ?? (galleryItem ? (galleryItem.caption || '') : '')
  };
}

function buildTestimonyFormState(testimony, remembered = {}) {
  if (!testimony && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(testimony || {}),
    name: remembered.name ?? (testimony ? testimony.name : ''),
    location: remembered.location ?? (testimony ? (testimony.location || '') : ''),
    status: remembered.status ?? (testimony ? testimony.status : 'draft'),
    is_featured: remembered.isFeatured !== undefined ? normalizeBoolean(remembered.isFeatured) : (testimony ? Boolean(testimony.is_featured) : false),
    image_url: remembered.imageUrl ?? (testimony ? (testimony.image_url || '') : ''),
    quote: remembered.quote ?? (testimony ? testimony.quote : ''),
    story: remembered.story ?? (testimony ? sanitizeRichHtml(testimony.story || '') : '')
  };
}

function buildPageFormState(pageItem, remembered = {}) {
  if (!pageItem && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(pageItem || {}),
    title: remembered.title ?? (pageItem ? pageItem.title : ''),
    slug: remembered.slug ?? (pageItem ? pageItem.slug : ''),
    subtitle: remembered.subtitle ?? (pageItem ? (pageItem.subtitle || '') : ''),
    status: remembered.status ?? (pageItem ? pageItem.status : 'draft'),
    body: remembered.body ?? (pageItem ? sanitizeRichHtml(pageItem.body || '') : ''),
    meta_title: remembered.metaTitle ?? (pageItem ? (pageItem.meta_title || '') : ''),
    meta_description: remembered.metaDescription ?? (pageItem ? (pageItem.meta_description || '') : '')
  };
}

function getListParams(query = {}, {
  allowedStatuses = [],
  fallbackStatus = '',
  limit = 10,
  allowedCategories = null,
  categoryField = 'category',
  extraFilters = {}
} = {}) {
  const params = {
    q: String(query.q || '').trim(),
    status: fallbackStatus,
    page: normalizePage(query.page),
    limit: normalizeLimit(query.limit, limit),
    category: '',
    ...extraFilters
  };

  if (allowedStatuses.length) {
    params.status = pickAllowedValue(String(query.status || fallbackStatus), [''].concat(allowedStatuses), fallbackStatus);
  }

  if (allowedCategories !== null) {
    params.category = String(query[categoryField] || '').trim();
  }

  return params;
}

function statusBadgeClass(status) {
  switch (status) {
    case 'published':
    case 'active':
    case 'replied':
      return 'text-bg-success-subtle text-success';
    case 'archived':
    case 'paused':
      return 'text-bg-secondary';
    case 'read':
    case 'completed':
      return 'text-bg-info-subtle text-info';
    case 'new':
      return 'text-bg-warning-subtle text-dark';
    default:
      return 'text-bg-light text-dark';
  }
}

function toDisplayStatus(value = '') {
  if (!value) {
    return '';
  }

  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function toPrettyLabel(value = '') {
  return toDisplayStatus(String(value || '').replace(/_/g, ' '));
}

function formatMoney(amount, currency = 'NLe') {
  const parsed = Number(amount || 0);
  return `${currency} ${parsed.toFixed(2)}`;
}

function buildTimelineItems(items = []) {
  return items.map((item) => ({
    ...item,
    oldStatusLabel: item.old_status ? toPrettyLabel(item.old_status) : null,
    newStatusLabel: toPrettyLabel(item.new_status),
    createdDisplay: formatDateTime(item.created_at)
  }));
}

function buildEngagementNotes(items = []) {
  return items.map((item) => ({
    ...item,
    createdDisplay: formatDateTime(item.created_at)
  }));
}

async function createDonationStatusLog({ donation, newStatus, note = null, changedBy = null }) {
  if (!donation || donation.status === newStatus) {
    return null;
  }

  return DonationStatusLog.create({
    donationId: donation.id,
    oldStatus: donation.status || null,
    newStatus,
    note,
    changedBy
  }).catch(() => null);
}

async function addEngagementNote({ entityType, entityId, note, createdBy }) {
  const trimmedNote = String(note || '').trim();
  if (!trimmedNote) {
    return null;
  }

  return EngagementNote.create({
    entityType,
    entityId,
    note: trimmedNote,
    createdBy
  }).catch(() => null);
}

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
  return res.send(rowsToCsv(headers, rows));
}

async function buildNotificationPlaceholders(overrides = {}) {
  const site = await getPublicSiteContext().catch(() => siteContent);
  return {
    site_name: site.brand || siteContent.brand,
    admin_link: `${env.app.url}/admin`,
    name: '',
    amount: '',
    currency: 'NLe',
    designation: '',
    receipt_number: '',
    status: '',
    message: '',
    ...overrides
  };
}

async function renderTemplatePreview(template) {
  const placeholders = await buildNotificationPlaceholders({
    name: 'Mariama K.',
    amount: '150.00',
    designation: 'community support',
    receipt_number: 'SIM-RCP-2026-000123',
    status: 'verified',
    message: 'Thank you for your faithful partnership in prayer and giving.'
  });

  const rendered = await renderTemplate(template.template_key, placeholders).catch(() => null);
  return rendered || {
    subject: template.subject,
    html: template.html_body,
    text: template.text_body || ''
  };
}

async function findOrRedirectWithFlash(res, req, model, id, redirectPath, entityLabel) {
  const record = await model.findById(id);
  if (record) {
    return record;
  }

  req.flash('error', `${entityLabel} could not be found.`);
  res.redirect(redirectPath);
  return null;
}

function mergeAdminNote(currentNote, nextNote) {
  const trimmed = String(nextNote || '').trim();
  if (!trimmed) {
    return currentNote || null;
  }

  return currentNote ? `${currentNote}\n\n${trimmed}` : trimmed;
}

async function adminDashboardSummary() {
  const [blogPosts, projects, messages, donations, sponsorships, volunteers, prayerPartners, prayerRequests] = await Promise.all([
    BlogPost.findAll().catch(() => []),
    Project.findAll().catch(() => []),
    ContactMessage.findAll().catch(() => []),
    Donation.findForAdmin({ page: 1, limit: 5 }).catch(() => ({ rows: [] })),
    SponsorshipInterest.countsForAdmin().catch(() => ({ newCount: 0 })),
    VolunteerApplication.countsForAdmin().catch(() => ({ newCount: 0 })),
    PrayerPartner.countsForAdmin().catch(() => ({ activeCount: 0 })),
    PrayerRequest.countsForAdmin().catch(() => ({ newCount: 0 }))
  ]);

  siteContent.adminStats = [
    { value: String((donations.rows || []).filter((item) => item.status === 'pending').length), label: 'Pending Donations', icon: 'bi bi-wallet2' },
    { value: String(sponsorships.newCount || 0), label: 'New Sponsorship Interests', icon: 'bi bi-people' },
    { value: String(volunteers.newCount || 0), label: 'New Volunteer Applications', icon: 'bi bi-hand-thumbs-up' },
    { value: String(prayerPartners.activeCount || 0), label: 'Active Prayer Partners', icon: 'bi bi-stars' }
  ];

  return {
    blogPosts: blogPosts.slice(0, 3).map((item) => ({
      title: item.title,
      category: item.category || 'Updates',
      updated: formatDateTime(item.updated_at),
      status: toDisplayStatus(item.status)
    })),
    donations: (donations.rows || []).slice(0, 5).map((item) => ({
      donor: item.donor_name,
      campaign: toPrettyLabel(item.designation),
      date: formatDateTime(item.created_at),
      amount: formatMoney(item.amount, item.currency),
      status: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status)
    })),
    queue: {
      pendingDonations: (donations.rows || []).filter((item) => item.status === 'pending').length,
      newSponsorships: sponsorships.newCount || 0,
      newVolunteers: volunteers.newCount || 0,
      activePrayerPartners: prayerPartners.activeCount || 0,
      newPrayerRequests: prayerRequests.newCount || 0,
      unreadMessages: messages.filter((item) => item.status === 'new').length
    },
    messages: messages.slice(0, 3),
    projects: projects.slice(0, 3)
  };
}

exports.index = async (req, res) => {
  const summary = await adminDashboardSummary();
  return render(res, 'admin/index', {
    title: 'Admin Dashboard',
    blogSummary: summary.blogPosts,
    donationSummary: summary.donations,
    engagementQueue: summary.queue
  });
};

exports.users = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    role: pickAllowedValue(String(req.query.role || ''), [''].concat(USER_ROLES), ''),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(USER_STATUSES), ''),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await User.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const users = result.rows.map((item) => ({
    ...item,
    roleLabel: toPrettyLabel(item.role),
    statusLabel: toPrettyLabel(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    joinedDisplay: formatDateTime(item.created_at),
    lastLoginDisplay: item.last_login_at ? formatDateTime(item.last_login_at) : 'Not yet'
  }));

  return render(res, 'admin/users', {
    title: 'Manage Users',
    users,
    filters,
    pagination,
    userRoles: USER_ROLES,
    userStatuses: USER_STATUSES
  });
};

exports.newUser = (req, res) => render(res, 'admin/user-form', {
  title: 'Add Admin User',
  formTitle: 'Add a user or admin',
  formAction: '/admin/users',
  userItem: getRememberedFormData(res),
  userRoles: USER_ROLES,
  userStatuses: USER_STATUSES
});

exports.createUser = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = normalizeNullable(req.body.phone);
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');
  const role = pickAllowedValue(String(req.body.role || 'user'), USER_ROLES, 'user');
  const status = pickAllowedValue(String(req.body.status || 'active'), USER_STATUSES, 'active');

  if (!name || !isValidEmail(email) || password.length < 8 || password !== confirmPassword) {
    rememberFormData(req);
    req.flash('error', 'Please provide a name, valid email, matching passwords of at least 8 characters, and a valid role.');
    return res.redirect('/admin/users/create');
  }

  if (phone && !isValidPhone(phone)) {
    rememberFormData(req);
    req.flash('error', 'Please provide a valid phone number or leave the phone field blank.');
    return res.redirect('/admin/users/create');
  }

  if (await User.emailExists(email)) {
    rememberFormData(req);
    req.flash('error', 'A user with that email address already exists.');
    return res.redirect('/admin/users/create');
  }

  const createdUser = await User.createUser({ name, email, phone, password, role, status });
  await logAction({
    req,
    action: role === 'admin' ? 'create_admin_user' : 'create_user',
    entityType: 'user',
    entityId: createdUser.id,
    metadata: { email: createdUser.email, role: createdUser.role, status: createdUser.status }
  });

  req.flash('success', role === 'admin' ? 'Admin user created successfully.' : 'User created successfully.');
  return res.redirect('/admin/users');
};

exports.donations = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(DONATION_STATUSES), ''),
    designation: pickAllowedValue(String(req.query.designation || ''), [''].concat(DONATION_DESIGNATIONS), ''),
    paymentMethod: pickAllowedValue(String(req.query.paymentMethod || ''), [''].concat(DONATION_METHODS), ''),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await Donation.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const donations = result.rows.map((item) => ({
    ...item,
    donorName: item.donor_name,
    donorEmail: item.donor_email,
    amountDisplay: formatMoney(item.amount, item.currency),
    designationLabel: toPrettyLabel(item.designation),
    paymentMethodLabel: toPrettyLabel(item.payment_method),
    donationTypeLabel: toPrettyLabel(item.donation_type),
    statusLabel: toPrettyLabel(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    createdDisplay: formatDateTime(item.created_at)
  }));

  return render(res, 'admin/donations', {
    title: 'Manage Donations',
    donations,
    filters,
    pagination,
    donationStatuses: DONATION_STATUSES,
    donationDesignations: DONATION_DESIGNATIONS,
    donationMethods: DONATION_METHODS
  });
};

exports.viewDonation = async (req, res) => {
  const donation = await findOrRedirectWithFlash(res, req, Donation, req.params.id, '/admin/donations', 'Donation');
  if (!donation) {
    return;
  }

  const timeline = await DonationStatusLog.findForDonation(donation.id).catch(() => []);

  return render(res, 'admin/donation-view', {
    title: 'Donation Details',
    donation: {
      ...donation,
      amountDisplay: formatMoney(donation.amount, donation.currency),
      designationLabel: toPrettyLabel(donation.designation),
      paymentMethodLabel: toPrettyLabel(donation.payment_method),
      donationTypeLabel: toPrettyLabel(donation.donation_type),
      statusLabel: toPrettyLabel(donation.status),
      createdDisplay: formatDateTime(donation.created_at),
      verifiedDisplay: donation.verified_at ? formatDateTime(donation.verified_at) : null
    },
    timeline: buildTimelineItems(timeline)
  });
};

exports.viewDonationReceipt = async (req, res) => {
  const donation = await findOrRedirectWithFlash(res, req, Donation, req.params.id, '/admin/donations', 'Donation');
  if (!donation) {
    return;
  }

  if (donation.status !== 'verified' || !donation.receipt_number) {
    req.flash('error', 'A verified receipt is not available for that donation yet.');
    return res.redirect(`/admin/donations/${donation.id}`);
  }

  return res.render('pages/donation-receipt', {
    layout: 'layouts/main',
    title: 'Donation Receipt',
    pageTitle: `Donation Receipt ${donation.receipt_number}`,
    metaDescription: 'Donation receipt from Salone Interior Missions.',
    donation,
    content: siteContent,
    receiptViewMode: 'admin'
  });
};

exports.verifyDonation = async (req, res) => {
  const donation = await findOrRedirectWithFlash(res, req, Donation, req.params.id, '/admin/donations', 'Donation');
  if (!donation) {
    return;
  }

  await createDonationStatusLog({
    donation,
    newStatus: 'verified',
    note: 'Donation verified by admin.',
    changedBy: req.session.user.id
  });

  await Donation.updateStatus(donation.id, {
    status: 'verified',
    verifiedBy: req.session.user.id,
    verifiedAt: new Date(),
    rejectionReason: null
  });
  const updated = await Donation.assignReceiptNumberIfMissing(donation.id, new Date());
  const verifyPlaceholders = await buildNotificationPlaceholders({
    name: updated.donor_name,
    amount: Number(updated.amount || 0).toFixed(2),
    currency: updated.currency || 'NLe',
    designation: String(updated.designation || '').replace(/_/g, ' '),
    receipt_number: updated.receipt_number || '',
    status: 'verified'
  });
  await sendTemplatedNotification({
    templateKey: 'donation_verified_user',
    to: updated.donor_email,
    placeholders: verifyPlaceholders,
    notificationType: 'donation_verified_user',
    relatedEntityType: 'donation',
    relatedEntityId: updated.id
  });
  await logAction({
    req,
    action: 'verify_donation',
    entityType: 'donation',
    entityId: donation.id,
    metadata: { donorEmail: donation.donor_email, amount: donation.amount, receiptNumber: updated ? updated.receipt_number : null }
  });
  req.flash('success', `Donation from ${updated.donor_name} marked as verified.`);
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/donations/${donation.id}` : '/admin/donations');
};

exports.rejectDonation = async (req, res) => {
  const donation = await findOrRedirectWithFlash(res, req, Donation, req.params.id, '/admin/donations', 'Donation');
  if (!donation) {
    return;
  }

  const rejectionReason = normalizeNullable(req.body.rejectionReason);
  await createDonationStatusLog({
    donation,
    newStatus: 'rejected',
    note: rejectionReason || 'Donation rejected by admin.',
    changedBy: req.session.user.id
  });
  await Donation.updateStatus(donation.id, {
    status: 'rejected',
    verifiedBy: req.session.user.id,
    verifiedAt: new Date(),
    rejectionReason
  });
  const rejectedDonation = await Donation.findById(donation.id);
  const rejectPlaceholders = await buildNotificationPlaceholders({
    name: rejectedDonation.donor_name,
    amount: Number(rejectedDonation.amount || 0).toFixed(2),
    currency: rejectedDonation.currency || 'NLe',
    designation: String(rejectedDonation.designation || '').replace(/_/g, ' '),
    status: 'rejected',
    message: rejectionReason || 'Your donation submission could not be verified at this time.'
  });
  await sendTemplatedNotification({
    templateKey: 'donation_rejected_user',
    to: rejectedDonation.donor_email,
    placeholders: rejectPlaceholders,
    notificationType: 'donation_rejected_user',
    relatedEntityType: 'donation',
    relatedEntityId: rejectedDonation.id
  });
  await logAction({
    req,
    action: 'reject_donation',
    entityType: 'donation',
    entityId: donation.id,
    metadata: { donorEmail: donation.donor_email, rejectionReason }
  });
  req.flash('success', 'Donation marked as rejected.');
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/donations/${donation.id}` : '/admin/donations');
};

exports.cancelDonation = async (req, res) => {
  const donation = await findOrRedirectWithFlash(res, req, Donation, req.params.id, '/admin/donations', 'Donation');
  if (!donation) {
    return;
  }

  await createDonationStatusLog({
    donation,
    newStatus: 'cancelled',
    note: normalizeNullable(req.body.rejectionReason) || 'Donation cancelled by admin.',
    changedBy: req.session.user.id
  });
  await Donation.updateStatus(donation.id, {
    status: 'cancelled',
    verifiedBy: req.session.user.id,
    verifiedAt: donation.verified_at,
    rejectionReason: normalizeNullable(req.body.rejectionReason)
  });
  await logAction({
    req,
    action: 'cancel_donation',
    entityType: 'donation',
    entityId: donation.id,
    metadata: { donorEmail: donation.donor_email }
  });
  req.flash('success', 'Donation cancelled.');
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/donations/${donation.id}` : '/admin/donations');
};

exports.createManualDonation = async (req, res) => {
  const donorName = String(req.body.donorName || '').trim();
  const donorEmail = String(req.body.donorEmail || '').trim().toLowerCase();
  const amount = normalizeAmount(req.body.amount);
  const donationType = normalizeEnum(req.body.donationType, DONATION_TYPES, 'one_time');
  const designation = normalizeEnum(req.body.designation, DONATION_DESIGNATIONS, 'general_mission');
  const paymentMethod = normalizeEnum(req.body.paymentMethod, DONATION_METHODS, 'other');

  if (!donorName || !donorEmail || !amount || !isValidEmail(donorEmail)) {
    req.flash('error', 'Please provide a valid donor name, email, and amount for the manual donation record.');
    return res.redirect('/admin/donations');
  }

  const donation = await Donation.create({
    userId: null,
    donorName,
    donorEmail,
    donorPhone: normalizeNullable(req.body.donorPhone),
    amount,
    currency: 'NLe',
    donationType,
    designation,
    paymentMethod,
    paymentReference: normalizeNullable(req.body.paymentReference),
    proofFileUrl: null,
    message: normalizeNullable(req.body.message),
    status: pickAllowedValue(String(req.body.status || 'verified'), DONATION_STATUSES, 'verified'),
    verifiedBy: req.session.user.id,
    verifiedAt: new Date()
  });
  const receiptReadyDonation = donation.status === 'verified'
    ? await Donation.assignReceiptNumberIfMissing(donation.id, new Date())
    : donation;
  await createDonationStatusLog({
    donation,
    newStatus: donation.status,
    note: 'Manual donation record created by admin.',
    changedBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'create_manual_donation',
    entityType: 'donation',
    entityId: donation.id,
    metadata: { donorEmail, amount, designation, receiptNumber: receiptReadyDonation ? receiptReadyDonation.receipt_number : null }
  });
  req.flash('success', 'Manual donation record created successfully.');
  return res.redirect('/admin/donations');
};

exports.sponsorships = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(SPONSORSHIP_INTEREST_STATUSES), ''),
    sponsorshipType: pickAllowedValue(String(req.query.sponsorshipType || ''), [''].concat(SPONSORSHIP_INTEREST_TYPES), ''),
    preferredPlan: pickAllowedValue(String(req.query.preferredPlan || ''), [''].concat(SPONSORSHIP_INTEREST_PLANS), ''),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await SponsorshipInterest.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const sponsorships = result.rows.map((item) => ({
    ...item,
    amountDisplay: item.amount ? formatMoney(item.amount, item.currency) : 'Open to discussion',
    sponsorshipTypeLabel: toPrettyLabel(item.sponsorship_type),
    preferredPlanLabel: toPrettyLabel(item.preferred_plan),
    statusLabel: toPrettyLabel(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    createdDisplay: formatDateTime(item.created_at),
    reviewedDisplay: item.reviewed_at ? formatDateTime(item.reviewed_at) : null
  }));

  return render(res, 'admin/sponsorships', {
    title: 'Manage Sponsorships',
    sponsorships,
    filters,
    pagination,
    sponsorshipStatuses: SPONSORSHIP_INTEREST_STATUSES,
    sponsorshipTypes: SPONSORSHIP_INTEREST_TYPES,
    sponsorshipPlans: SPONSORSHIP_INTEREST_PLANS
  });
};

exports.viewSponsorship = async (req, res) => {
  const sponsorship = await findOrRedirectWithFlash(res, req, SponsorshipInterest, req.params.id, '/admin/sponsorships', 'Sponsorship interest');
  if (!sponsorship) {
    return;
  }

  const notes = await EngagementNote.findForEntity('sponsorship_interest', sponsorship.id).catch(() => []);

  return render(res, 'admin/sponsorship-view', {
    title: 'Sponsorship Interest',
    sponsorship: {
      ...sponsorship,
      amountDisplay: sponsorship.amount ? formatMoney(sponsorship.amount, sponsorship.currency) : 'Open to discussion',
      sponsorshipTypeLabel: toPrettyLabel(sponsorship.sponsorship_type),
      preferredPlanLabel: toPrettyLabel(sponsorship.preferred_plan),
      statusLabel: toPrettyLabel(sponsorship.status),
      createdDisplay: formatDateTime(sponsorship.created_at),
      reviewedDisplay: sponsorship.reviewed_at ? formatDateTime(sponsorship.reviewed_at) : null
    },
    notes: buildEngagementNotes(notes)
  });
};

async function updateSponsorshipStatus(req, res, status) {
  const sponsorship = await findOrRedirectWithFlash(res, req, SponsorshipInterest, req.params.id, '/admin/sponsorships', 'Sponsorship interest');
  if (!sponsorship) {
    return;
  }

  const adminNote = normalizeNullable(req.body && req.body.adminNote);
  await SponsorshipInterest.updateStatus(sponsorship.id, {
    status,
    reviewedBy: req.session.user.id,
    reviewedAt: new Date(),
    adminNote,
    appendNote: Boolean(adminNote)
  });
  await addEngagementNote({
    entityType: 'sponsorship_interest',
    entityId: sponsorship.id,
    note: adminNote,
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'update_sponsorship_interest_status',
    entityType: 'sponsorship_interest',
    entityId: sponsorship.id,
    metadata: { status, sponsorEmail: sponsorship.sponsor_email }
  });
  req.flash('success', `Sponsorship interest updated to ${toPrettyLabel(status)}.`);
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/sponsorships/${sponsorship.id}` : '/admin/sponsorships');
}

exports.markSponsorshipContacted = (req, res) => updateSponsorshipStatus(req, res, 'contacted');
exports.approveSponsorship = (req, res) => updateSponsorshipStatus(req, res, 'approved');
exports.rejectSponsorship = (req, res) => updateSponsorshipStatus(req, res, 'rejected');
exports.archiveSponsorship = (req, res) => updateSponsorshipStatus(req, res, 'archived');

exports.addSponsorshipNote = async (req, res) => {
  const sponsorship = await findOrRedirectWithFlash(res, req, SponsorshipInterest, req.params.id, '/admin/sponsorships', 'Sponsorship interest');
  if (!sponsorship) {
    return;
  }

  const note = String(req.body.adminNote || '').trim();
  if (!note) {
    req.flash('error', 'Please add a note before saving.');
    return res.redirect(`/admin/sponsorships/${sponsorship.id}`);
  }

  await SponsorshipInterest.updateNote(sponsorship.id, note, req.session.user.id);
  await addEngagementNote({
    entityType: 'sponsorship_interest',
    entityId: sponsorship.id,
    note,
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'add_sponsorship_interest_note',
    entityType: 'sponsorship_interest',
    entityId: sponsorship.id,
    metadata: { sponsorEmail: sponsorship.sponsor_email }
  });
  req.flash('success', 'Sponsorship note added successfully.');
  return res.redirect(`/admin/sponsorships/${sponsorship.id}`);
};

exports.volunteers = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(VOLUNTEER_APPLICATION_STATUSES), ''),
    areaOfInterest: pickAllowedValue(String(req.query.areaOfInterest || ''), [''].concat(VOLUNTEER_AREAS), ''),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await VolunteerApplication.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const volunteers = result.rows.map((item) => ({
    ...item,
    areaLabel: toPrettyLabel(item.area_of_interest),
    statusLabel: toPrettyLabel(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    createdDisplay: formatDateTime(item.created_at),
    reviewedDisplay: item.reviewed_at ? formatDateTime(item.reviewed_at) : null,
    motivationPreview: truncateText(stripHtml(item.motivation || item.experience || ''), 90)
  }));

  return render(res, 'admin/volunteers', {
    title: 'Manage Volunteer Applications',
    volunteers,
    filters,
    pagination,
    volunteerStatuses: VOLUNTEER_APPLICATION_STATUSES,
    volunteerAreas: VOLUNTEER_AREAS
  });
};

exports.viewVolunteer = async (req, res) => {
  const volunteer = await findOrRedirectWithFlash(res, req, VolunteerApplication, req.params.id, '/admin/volunteers', 'Volunteer application');
  if (!volunteer) {
    return;
  }

  const notes = await EngagementNote.findForEntity('volunteer_application', volunteer.id).catch(() => []);

  return render(res, 'admin/volunteer-view', {
    title: 'Volunteer Application',
    volunteer: {
      ...volunteer,
      areaLabel: toPrettyLabel(volunteer.area_of_interest),
      statusLabel: toPrettyLabel(volunteer.status),
      createdDisplay: formatDateTime(volunteer.created_at),
      reviewedDisplay: volunteer.reviewed_at ? formatDateTime(volunteer.reviewed_at) : null
    },
    notes: buildEngagementNotes(notes)
  });
};

async function updateVolunteerStatus(req, res, status) {
  const volunteer = await findOrRedirectWithFlash(res, req, VolunteerApplication, req.params.id, '/admin/volunteers', 'Volunteer application');
  if (!volunteer) {
    return;
  }

  const adminNote = normalizeNullable(req.body && req.body.adminNote);
  await VolunteerApplication.updateStatus(volunteer.id, {
    status,
    reviewedBy: req.session.user.id,
    reviewedAt: new Date(),
    adminNote,
    appendNote: Boolean(adminNote)
  });
  await addEngagementNote({
    entityType: 'volunteer_application',
    entityId: volunteer.id,
    note: adminNote,
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'update_volunteer_application_status',
    entityType: 'volunteer_application',
    entityId: volunteer.id,
    metadata: { status, email: volunteer.email }
  });
  req.flash('success', `Volunteer application updated to ${toPrettyLabel(status)}.`);
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/volunteers/${volunteer.id}` : '/admin/volunteers');
}

exports.markVolunteerReviewing = (req, res) => updateVolunteerStatus(req, res, 'reviewing');
exports.approveVolunteer = (req, res) => updateVolunteerStatus(req, res, 'approved');
exports.rejectVolunteer = (req, res) => updateVolunteerStatus(req, res, 'rejected');
exports.archiveVolunteer = (req, res) => updateVolunteerStatus(req, res, 'archived');

exports.addVolunteerNote = async (req, res) => {
  const volunteer = await findOrRedirectWithFlash(res, req, VolunteerApplication, req.params.id, '/admin/volunteers', 'Volunteer application');
  if (!volunteer) {
    return;
  }

  const note = String(req.body.adminNote || '').trim();
  if (!note) {
    req.flash('error', 'Please add a note before saving.');
    return res.redirect(`/admin/volunteers/${volunteer.id}`);
  }

  await VolunteerApplication.updateNote(volunteer.id, note, req.session.user.id);
  await addEngagementNote({
    entityType: 'volunteer_application',
    entityId: volunteer.id,
    note,
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'add_volunteer_application_note',
    entityType: 'volunteer_application',
    entityId: volunteer.id,
    metadata: { email: volunteer.email }
  });
  req.flash('success', 'Volunteer application note added successfully.');
  return res.redirect(`/admin/volunteers/${volunteer.id}`);
};

exports.prayer = async (req, res) => {
  const partnerFilters = {
    q: String(req.query.partnerQ || '').trim(),
    status: pickAllowedValue(String(req.query.partnerStatus || ''), [''].concat(PRAYER_PARTNER_STATUSES), ''),
    prayerFocus: pickAllowedValue(String(req.query.prayerFocus || ''), [''].concat(PRAYER_FOCUS_VALUES), ''),
    page: normalizePage(req.query.partnerPage),
    limit: normalizeLimit(req.query.partnerLimit, 10)
  };
  const requestFilters = {
    q: String(req.query.requestQ || '').trim(),
    status: pickAllowedValue(String(req.query.requestStatus || ''), [''].concat(PRAYER_REQUEST_STATUSES), ''),
    isPublic: pickAllowedValue(String(req.query.isPublic || ''), ['', 'public', 'private'], ''),
    page: normalizePage(req.query.requestPage),
    limit: normalizeLimit(req.query.requestLimit, 10)
  };

  const [partnerResult, requestResult] = await Promise.all([
    PrayerPartner.findForAdmin(partnerFilters),
    PrayerRequest.findForAdmin(requestFilters)
  ]);
  const partnerPagination = buildPagination({ page: partnerFilters.page, limit: partnerFilters.limit, total: partnerResult.total });
  const requestPagination = buildPagination({ page: requestFilters.page, limit: requestFilters.limit, total: requestResult.total });

  return render(res, 'admin/prayer', {
    title: 'Prayer & Partners',
    partnerFilters,
    requestFilters,
    partnerPagination,
    requestPagination,
    prayerPartners: partnerResult.rows.map((item) => ({
      ...item,
      statusLabel: toPrettyLabel(item.status),
      focusLabel: toPrettyLabel(item.prayer_focus),
      frequencyLabel: toPrettyLabel(item.frequency),
      createdDisplay: formatDateTime(item.created_at)
    })),
    prayerRequests: requestResult.rows.map((item) => ({
      ...item,
      statusLabel: toPrettyLabel(item.status),
      createdDisplay: formatDateTime(item.created_at),
      requestPreview: truncateText(stripHtml(item.request_text || ''), 120)
    })),
    prayerPartnerStatuses: PRAYER_PARTNER_STATUSES,
    prayerFocusValues: PRAYER_FOCUS_VALUES,
    prayerRequestStatuses: PRAYER_REQUEST_STATUSES
  });
};

exports.viewPrayerRequest = async (req, res) => {
  const prayerRequest = await findOrRedirectWithFlash(res, req, PrayerRequest, req.params.id, '/admin/prayer', 'Prayer request');
  if (!prayerRequest) {
    return;
  }

  const notes = await EngagementNote.findForEntity('prayer_request', prayerRequest.id).catch(() => []);

  return render(res, 'admin/prayer-request-view', {
    title: 'Prayer Request Details',
    prayerRequest: {
      ...prayerRequest,
      statusLabel: toPrettyLabel(prayerRequest.status),
      createdDisplay: formatDateTime(prayerRequest.created_at)
    },
    notes: buildEngagementNotes(notes),
    prayerRequestStatuses: PRAYER_REQUEST_STATUSES
  });
};

exports.updatePrayerPartnerStatus = async (req, res) => {
  const partner = await findOrRedirectWithFlash(res, req, PrayerPartner, req.params.id, '/admin/prayer', 'Prayer partner');
  if (!partner) {
    return;
  }

  const status = pickAllowedValue(String(req.body.status || ''), PRAYER_PARTNER_STATUSES, partner.status);
  await PrayerPartner.updateStatus(partner.id, status);
  await logAction({
    req,
    action: 'update_prayer_partner_status',
    entityType: 'prayer_partner',
    entityId: partner.id,
    metadata: { status, email: partner.email }
  });
  req.flash('success', 'Prayer partner status updated successfully.');
  return res.redirect('/admin/prayer');
};

exports.updatePrayerRequestStatus = async (req, res) => {
  const prayerRequest = await findOrRedirectWithFlash(res, req, PrayerRequest, req.params.id, '/admin/prayer', 'Prayer request');
  if (!prayerRequest) {
    return;
  }

  const status = pickAllowedValue(String(req.body.status || ''), PRAYER_REQUEST_STATUSES, prayerRequest.status);
  await PrayerRequest.updateStatus(prayerRequest.id, status);
  await addEngagementNote({
    entityType: 'prayer_request',
    entityId: prayerRequest.id,
    note: normalizeNullable(req.body.adminNote),
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'update_prayer_request_status',
    entityType: 'prayer_request',
    entityId: prayerRequest.id,
    metadata: { status }
  });
  req.flash('success', 'Prayer request status updated successfully.');
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/prayer/requests/${prayerRequest.id}` : '/admin/prayer');
};

exports.archivePrayerRequest = async (req, res) => {
  const prayerRequest = await findOrRedirectWithFlash(res, req, PrayerRequest, req.params.id, '/admin/prayer', 'Prayer request');
  if (!prayerRequest) {
    return;
  }

  await PrayerRequest.updateStatus(prayerRequest.id, 'archived');
  await logAction({
    req,
    action: 'archive_prayer_request',
    entityType: 'prayer_request',
    entityId: prayerRequest.id,
    metadata: {}
  });
  req.flash('success', 'Prayer request archived successfully.');
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/prayer/requests/${prayerRequest.id}` : '/admin/prayer');
};

exports.addPrayerRequestNote = async (req, res) => {
  const prayerRequest = await findOrRedirectWithFlash(res, req, PrayerRequest, req.params.id, '/admin/prayer', 'Prayer request');
  if (!prayerRequest) {
    return;
  }

  const note = String(req.body.adminNote || '').trim();
  if (!note) {
    req.flash('error', 'Please add a note before saving.');
    return res.redirect(`/admin/prayer/requests/${prayerRequest.id}`);
  }

  await addEngagementNote({
    entityType: 'prayer_request',
    entityId: prayerRequest.id,
    note,
    createdBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'add_prayer_request_note',
    entityType: 'prayer_request',
    entityId: prayerRequest.id,
    metadata: {}
  });
  req.flash('success', 'Prayer request note added successfully.');
  return res.redirect(`/admin/prayer/requests/${prayerRequest.id}`);
};

exports.exportDonationsCsv = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(DONATION_STATUSES), ''),
    designation: pickAllowedValue(String(req.query.designation || ''), [''].concat(DONATION_DESIGNATIONS), ''),
    paymentMethod: pickAllowedValue(String(req.query.paymentMethod || ''), [''].concat(DONATION_METHODS), ''),
    page: 1,
    limit: 5000
  };
  const result = await Donation.findForAdmin(filters);
  return sendCsv(res, 'donations.csv', [
    { key: 'id', label: 'ID' },
    { key: 'donor_name', label: 'Donor Name' },
    { key: 'donor_email', label: 'Donor Email' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'designation', label: 'Designation' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'payment_reference', label: 'Payment Reference' },
    { key: 'proof_file_url', label: 'Proof URL' },
    { key: 'status', label: 'Status' },
    { key: 'receipt_number', label: 'Receipt Number' },
    { key: 'created_at', label: 'Created At' }
  ], result.rows);
};

exports.exportSponsorshipsCsv = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(SPONSORSHIP_INTEREST_STATUSES), ''),
    sponsorshipType: pickAllowedValue(String(req.query.sponsorshipType || ''), [''].concat(SPONSORSHIP_INTEREST_TYPES), ''),
    preferredPlan: pickAllowedValue(String(req.query.preferredPlan || ''), [''].concat(SPONSORSHIP_INTEREST_PLANS), ''),
    page: 1,
    limit: 5000
  };
  const result = await SponsorshipInterest.findForAdmin(filters);
  return sendCsv(res, 'sponsorship-interests.csv', [
    { key: 'id', label: 'ID' },
    { key: 'sponsor_name', label: 'Sponsor Name' },
    { key: 'sponsor_email', label: 'Sponsor Email' },
    { key: 'sponsorship_type', label: 'Type' },
    { key: 'preferred_plan', label: 'Preferred Plan' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' }
  ], result.rows);
};

exports.exportVolunteersCsv = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(VOLUNTEER_APPLICATION_STATUSES), ''),
    areaOfInterest: pickAllowedValue(String(req.query.areaOfInterest || ''), [''].concat(VOLUNTEER_AREAS), ''),
    page: 1,
    limit: 5000
  };
  const result = await VolunteerApplication.findForAdmin(filters);
  return sendCsv(res, 'volunteer-applications.csv', [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'location', label: 'Location' },
    { key: 'area_of_interest', label: 'Area of Interest' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' }
  ], result.rows);
};

exports.exportPrayerPartnersCsv = async (req, res) => {
  const filters = {
    q: String(req.query.partnerQ || '').trim(),
    status: pickAllowedValue(String(req.query.partnerStatus || ''), [''].concat(PRAYER_PARTNER_STATUSES), ''),
    prayerFocus: pickAllowedValue(String(req.query.prayerFocus || ''), [''].concat(PRAYER_FOCUS_VALUES), ''),
    page: 1,
    limit: 5000
  };
  const result = await PrayerPartner.findForAdmin(filters);
  return sendCsv(res, 'prayer-partners.csv', [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'prayer_focus', label: 'Prayer Focus' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' }
  ], result.rows);
};

exports.exportPrayerRequestsCsv = async (req, res) => {
  const filters = {
    q: String(req.query.requestQ || '').trim(),
    status: pickAllowedValue(String(req.query.requestStatus || ''), [''].concat(PRAYER_REQUEST_STATUSES), ''),
    isPublic: pickAllowedValue(String(req.query.isPublic || ''), ['', 'public', 'private'], ''),
    page: 1,
    limit: 5000
  };
  const result = await PrayerRequest.findForAdmin(filters);
  return sendCsv(res, 'prayer-requests.csv', [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'request_text', label: 'Request' },
    { key: 'is_public', label: 'Is Public' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' }
  ], result.rows);
};

exports.demoNotes = (req, res) => render(res, 'admin/demo-notes', { title: 'Client Demo Notes' });
exports.auditLogs = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    action: String(req.query.action || '').trim(),
    entityType: String(req.query.entityType || '').trim(),
    userId: String(req.query.userId || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 20, 100)
  };

  const result = await findForAdmin(filters).catch(() => ({
    rows: [],
    total: 0,
    actions: [],
    entityTypes: []
  }));
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const logs = result.rows.map((item) => ({
    ...item,
    createdDisplay: formatDateTime(item.created_at),
    metadataPreview: truncateText(item.metadata_json || '', 120),
    entityLabel: item.entity_type || 'General',
    userLabel: item.user_name || 'System'
  }));

  return render(res, 'admin/audit-logs', {
    title: 'Audit Logs',
    logs,
    filters,
    pagination,
    actions: result.actions || [],
    entityTypes: result.entityTypes || []
  });
};

exports.viewAuditLog = async (req, res) => {
  const auditLog = await findAuditLogById(req.params.id).catch(() => null);

  if (!auditLog) {
    req.flash('error', 'Audit log entry could not be found.');
    return res.redirect('/admin/audit-logs');
  }

  let metadata = null;
  if (auditLog.metadata_json) {
    try {
      metadata = JSON.stringify(JSON.parse(auditLog.metadata_json), null, 2);
    } catch (error) {
      metadata = auditLog.metadata_json;
    }
  }

  return render(res, 'admin/audit-log-view', {
    title: 'Audit Log Details',
    auditLog: {
      ...auditLog,
      createdDisplay: formatDateTime(auditLog.created_at),
      userLabel: auditLog.user_name || 'System',
      entityLabel: auditLog.entity_type || 'General',
      metadataPretty: metadata
    }
  });
};

exports.blogPosts = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: BLOG_STATUSES,
    fallbackStatus: '',
    limit: 10,
    allowedCategories: true
  });
  const result = await BlogPost.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const blogPosts = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    updatedDisplay: formatDateTime(item.updated_at),
    authorName: item.resolved_author_name || item.author_name || 'SIM Communications',
    excerptPreview: item.excerpt || truncateText(stripHtml(item.body), 120)
  }));

  return render(res, 'admin/blog-posts', {
    title: 'Manage Blog Posts',
    blogPosts,
    filters,
    pagination,
    categories: result.categories || []
  });
};

exports.newBlogPost = (req, res) => render(res, 'admin/blog-post-form', {
  title: 'Create Blog Post',
  formTitle: 'Create Blog Post',
  formAction: '/admin/blog-posts',
  blogPost: buildBlogPostFormState(null, getRememberedFormData(res)),
  includeRichEditorAssets: true
});

exports.createBlogPost = async (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const bodyText = stripHtml(body);
  const category = normalizeNullable(req.body.category);
  const excerpt = normalizeNullable(req.body.excerpt);
  const featuredImage = normalizeNullable(req.body.featuredImage);
  const status = pickAllowedValue(String(req.body.status || 'draft'), BLOG_STATUSES, 'draft');

  if (!title || !bodyText) {
    req.flash('error', 'Please provide a title and body for the blog post.');
    rememberFormData(req);
    return res.redirect('/admin/blog-posts/new');
  }

  const desiredSlug = String(req.body.slug || '').trim() || title;
  const slug = await resolveUniqueSlug(desiredSlug, (candidate) => BlogPost.slugExists(candidate));
  const publishedAt = status === 'published' ? new Date() : null;

  const createdBlogPost = await BlogPost.create({
    title,
    slug,
    excerpt,
    body: sanitizeRichHtml(body),
    featuredImage,
    category,
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status,
    publishedAt,
    authorId: req.session.user.id
  });
  await logAction({
    req,
    action: 'create_blog_post',
    entityType: 'blog_post',
    entityId: createdBlogPost ? createdBlogPost.id : null,
    metadata: { title, status, category }
  });

  req.flash('success', 'Blog post saved successfully.');
  return res.redirect('/admin/blog-posts');
};

exports.editBlogPost = async (req, res) => {
  const blogPost = await BlogPost.findById(req.params.id);
  if (!blogPost) {
    return res.status(404).render('errors/404', { title: 'Post Not Found' });
  }

  return render(res, 'admin/blog-post-form', {
    title: 'Edit Blog Post',
    formTitle: 'Edit Blog Post',
    formAction: `/admin/blog-posts/${blogPost.id}`,
    blogPost: buildBlogPostFormState(blogPost, getRememberedFormData(res)),
    includeRichEditorAssets: true
  });
};

exports.updateBlogPost = async (req, res) => {
  const blogPost = await BlogPost.findById(req.params.id);
  if (!blogPost) {
    return res.status(404).render('errors/404', { title: 'Post Not Found' });
  }

  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const bodyText = stripHtml(body);
  const category = normalizeNullable(req.body.category);
  const excerpt = normalizeNullable(req.body.excerpt);
  const featuredImage = normalizeNullable(req.body.featuredImage);
  const status = pickAllowedValue(String(req.body.status || blogPost.status), BLOG_STATUSES, blogPost.status);

  if (!title || !bodyText) {
    req.flash('error', 'Please provide a title and body for the blog post.');
    rememberFormData(req);
    return res.redirect(`/admin/blog-posts/${blogPost.id}/edit`);
  }

  const desiredSlug = String(req.body.slug || '').trim() || title;
  const slug = await resolveUniqueSlug(desiredSlug, (candidate) => BlogPost.slugExists(candidate, blogPost.id));
  const publishedAt = status === 'published' ? (blogPost.published_at || new Date()) : null;

  await BlogPost.update(blogPost.id, {
    title,
    slug,
    excerpt,
    body: sanitizeRichHtml(body),
    featuredImage,
    category,
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status,
    publishedAt,
    authorId: blogPost.author_id || req.session.user.id
  });
  await logAction({
    req,
    action: 'update_blog_post',
    entityType: 'blog_post',
    entityId: blogPost.id,
    metadata: { title, status, category }
  });

  req.flash('success', 'Blog post updated successfully.');
  return res.redirect('/admin/blog-posts');
};

exports.updateBlogPostStatus = async (req, res) => {
  const blogPost = await BlogPost.findById(req.params.id);
  if (!blogPost) {
    return res.status(404).render('errors/404', { title: 'Post Not Found' });
  }

  const action = String(req.body.action || '').trim();
  if (action === 'delete') {
    await BlogPost.delete(blogPost.id);
    await logAction({
      req,
      action: 'delete_blog_post',
      entityType: 'blog_post',
      entityId: blogPost.id,
      metadata: { title: blogPost.title }
    });
    req.flash('success', 'Blog post deleted successfully.');
    return res.redirect('/admin/blog-posts');
  }

  const status = pickAllowedValue(action, BLOG_STATUSES, blogPost.status);
  await BlogPost.update(blogPost.id, {
    title: blogPost.title,
    slug: blogPost.slug,
    excerpt: blogPost.excerpt,
    body: blogPost.body,
    featuredImage: blogPost.featured_image,
    category: blogPost.category,
    metaTitle: blogPost.meta_title,
    metaDescription: blogPost.meta_description,
    status,
    publishedAt: status === 'published' ? (blogPost.published_at || new Date()) : null,
    authorId: blogPost.author_id || req.session.user.id
  });
  await logAction({
    req,
    action: `set_blog_post_${status}`,
    entityType: 'blog_post',
    entityId: blogPost.id,
    metadata: { title: blogPost.title, status }
  });

  req.flash('success', `Blog post moved to ${status}.`);
  return res.redirect('/admin/blog-posts');
};

exports.projects = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: PROJECT_STATUSES,
    fallbackStatus: '',
    limit: 10,
    allowedCategories: true
  });
  const result = await Project.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const projects = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    updatedDisplay: formatDateTime(item.updated_at)
  }));

  return render(res, 'admin/projects', {
    title: 'Manage Projects and Programs',
    projects,
    filters,
    pagination,
    categories: result.categories || []
  });
};

exports.newProject = (req, res) => render(res, 'admin/project-form', {
  title: 'Create Project',
  formTitle: 'Create Project or Program',
  formAction: '/admin/projects',
  project: buildProjectFormState(null, getRememberedFormData(res)),
  includeRichEditorAssets: true
});

exports.createProject = async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) {
    req.flash('error', 'Please provide a title for the project or program.');
    rememberFormData(req);
    return res.redirect('/admin/projects/new');
  }

  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => Project.slugExists(candidate));
  const createdProject = await Project.create({
    title,
    slug,
    summary: normalizeNullable(req.body.summary),
    description: sanitizeRichHtml(req.body.description || ''),
    location: normalizeNullable(req.body.location),
    category: normalizeNullable(req.body.category),
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status: pickAllowedValue(String(req.body.status || 'planned'), PROJECT_STATUSES, 'planned'),
    featuredImage: normalizeNullable(req.body.featuredImage),
    progressLabel: normalizeNullable(req.body.progressLabel),
    isFeatured: normalizeBoolean(req.body.isFeatured) ? 1 : 0
  });
  await logAction({
    req,
    action: 'create_project',
    entityType: 'project',
    entityId: createdProject ? createdProject.id : null,
    metadata: { title, status: createdProject ? createdProject.status : null }
  });

  req.flash('success', 'Project saved successfully.');
  return res.redirect('/admin/projects');
};

exports.editProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).render('errors/404', { title: 'Project Not Found' });
  }

  return render(res, 'admin/project-form', {
    title: 'Edit Project',
    formTitle: 'Edit Project or Program',
    formAction: `/admin/projects/${project.id}`,
    project: buildProjectFormState(project, getRememberedFormData(res)),
    includeRichEditorAssets: true
  });
};

exports.updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).render('errors/404', { title: 'Project Not Found' });
  }

  const title = String(req.body.title || '').trim();
  if (!title) {
    req.flash('error', 'Please provide a title for the project or program.');
    rememberFormData(req);
    return res.redirect(`/admin/projects/${project.id}/edit`);
  }

  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => Project.slugExists(candidate, project.id));
  await Project.update(project.id, {
    title,
    slug,
    summary: normalizeNullable(req.body.summary),
    description: sanitizeRichHtml(req.body.description || ''),
    location: normalizeNullable(req.body.location),
    category: normalizeNullable(req.body.category),
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status: pickAllowedValue(String(req.body.status || project.status), PROJECT_STATUSES, project.status),
    featuredImage: normalizeNullable(req.body.featuredImage),
    progressLabel: normalizeNullable(req.body.progressLabel),
    isFeatured: normalizeBoolean(req.body.isFeatured) ? 1 : 0
  });
  await logAction({
    req,
    action: 'update_project',
    entityType: 'project',
    entityId: project.id,
    metadata: { title, status: pickAllowedValue(String(req.body.status || project.status), PROJECT_STATUSES, project.status) }
  });

  req.flash('success', 'Project updated successfully.');
  return res.redirect('/admin/projects');
};

exports.updateProjectStatus = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).render('errors/404', { title: 'Project Not Found' });
  }

  const action = String(req.body.action || '').trim();
  if (action === 'delete') {
    await Project.delete(project.id);
    await logAction({
      req,
      action: 'delete_project',
      entityType: 'project',
      entityId: project.id,
      metadata: { title: project.title }
    });
    req.flash('success', 'Project deleted successfully.');
    return res.redirect('/admin/projects');
  }

  let status = project.status;
  let isFeatured = project.is_featured;

  if (action === 'feature') {
    isFeatured = 1;
  } else if (action === 'unfeature') {
    isFeatured = 0;
  } else {
    status = pickAllowedValue(action, PROJECT_STATUSES, project.status);
  }

  await Project.update(project.id, {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    location: project.location,
    category: project.category,
    metaTitle: project.meta_title,
    metaDescription: project.meta_description,
    status,
    featuredImage: project.featured_image,
    progressLabel: normalizeNullable(req.body.progressLabel) || project.progress_label,
    isFeatured
  });
  await logAction({
    req,
    action: action === 'feature' || action === 'unfeature' ? `project_${action}` : `set_project_${status}`,
    entityType: 'project',
    entityId: project.id,
    metadata: { title: project.title, status, isFeatured }
  });

  req.flash('success', 'Project status updated successfully.');
  return res.redirect('/admin/projects');
};

exports.homepageContent = async (req, res) => {
  const sections = (await HomepageSection.findAll()).map((item) => ({
    ...item,
    statusLabel: item.is_active ? 'Active' : 'Inactive',
    updatedDisplay: formatDateTime(item.updated_at)
  }));

  return render(res, 'admin/homepage-content', {
    title: 'Manage Homepage Content',
    sections
  });
};

exports.editHomepageSection = async (req, res) => {
  const section = await HomepageSection.findById(req.params.id);
  if (!section) {
    return res.status(404).render('errors/404', { title: 'Section Not Found' });
  }

  return render(res, 'admin/homepage-section-form', {
    title: 'Edit Homepage Section',
    formTitle: `Edit ${section.section_key}`,
    formAction: `/admin/homepage-content/${section.id}`,
    sectionItem: section
  });
};

exports.updateHomepageSection = async (req, res) => {
  const section = await HomepageSection.findById(req.params.id);
  if (!section) {
    return res.status(404).render('errors/404', { title: 'Section Not Found' });
  }

  const sectionKey = String(req.body.sectionKey || section.section_key).trim();
  if (!sectionKey) {
    req.flash('error', 'Section key is required.');
    return res.redirect(`/admin/homepage-content/${section.id}/edit`);
  }

  const existingSection = await HomepageSection.findBySectionKey(sectionKey);
  if (existingSection && Number(existingSection.id) !== Number(section.id)) {
    req.flash('error', 'Another homepage section is already using that section key.');
    return res.redirect(`/admin/homepage-content/${section.id}/edit`);
  }

  await HomepageSection.update(section.id, {
    sectionKey,
    title: normalizeNullable(req.body.title),
    subtitle: normalizeNullable(req.body.subtitle),
    content: normalizeNullable(req.body.content),
    buttonLabel: normalizeNullable(req.body.buttonLabel),
    buttonUrl: normalizeNullable(req.body.buttonUrl),
    imageUrl: normalizeNullable(req.body.imageUrl),
    sortOrder: Number(req.body.sortOrder || section.sort_order || 0),
    isActive: normalizeBoolean(req.body.isActive) ? 1 : 0
  });
  await logAction({
    req,
    action: 'update_homepage_section',
    entityType: 'homepage_section',
    entityId: section.id,
    metadata: { sectionKey, isActive: normalizeBoolean(req.body.isActive) ? 1 : 0 }
  });

  req.flash('success', 'Homepage section updated successfully.');
  return res.redirect('/admin/homepage-content');
};

exports.toggleHomepageSection = async (req, res) => {
  const section = await HomepageSection.findById(req.params.id);
  if (!section) {
    return res.status(404).render('errors/404', { title: 'Section Not Found' });
  }

  await HomepageSection.update(section.id, {
    sectionKey: section.section_key,
    title: section.title,
    subtitle: section.subtitle,
    content: section.content,
    buttonLabel: section.button_label,
    buttonUrl: section.button_url,
    imageUrl: section.image_url,
    sortOrder: section.sort_order,
    isActive: section.is_active ? 0 : 1
  });
  await logAction({
    req,
    action: 'toggle_homepage_section',
    entityType: 'homepage_section',
    entityId: section.id,
    metadata: { sectionKey: section.section_key, isActive: section.is_active ? 0 : 1 }
  });

  req.flash('success', 'Homepage section visibility updated.');
  return res.redirect('/admin/homepage-content');
};

exports.messages = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: MESSAGE_STATUSES,
    fallbackStatus: '',
    limit: 10
  });
  const result = await ContactMessage.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const messages = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    createdDisplay: formatDateTime(item.created_at),
    preview: truncateText(stripHtml(item.message), 90)
  }));

  return render(res, 'admin/messages', {
    title: 'Manage Contact Messages',
    messages,
    filters,
    pagination
  });
};

exports.viewMessage = async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    return res.status(404).render('errors/404', { title: 'Message Not Found' });
  }

  if (message.status === 'new') {
    await ContactMessage.updateStatus(message.id, 'read');
    message.status = 'read';
    await logAction({
      req,
      action: 'mark_message_read',
      entityType: 'contact_message',
      entityId: message.id,
      metadata: { email: message.email }
    });
  }

  return render(res, 'admin/message-view', {
    title: 'View Contact Message',
    message: {
      ...message,
      createdDisplay: formatDateTime(message.created_at),
      updatedDisplay: formatDateTime(message.updated_at),
      statusLabel: toDisplayStatus(message.status)
    }
  });
};

exports.updateMessageStatus = async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    return res.status(404).render('errors/404', { title: 'Message Not Found' });
  }

  const status = pickAllowedValue(String(req.body.status || '').trim(), MESSAGE_STATUSES, message.status);
  await ContactMessage.updateStatus(message.id, status);
  await logAction({
    req,
    action: `set_message_${status}`,
    entityType: 'contact_message',
    entityId: message.id,
    metadata: { email: message.email, subject: message.subject }
  });
  req.flash('success', 'Message status updated successfully.');
  return res.redirect(req.body.redirectTo === 'detail' ? `/admin/messages/${message.id}` : '/admin/messages');
};

function buildPagePreviewHref(slug) {
  if (!slug) {
    return null;
  }

  return slug === 'about' ||
    slug === 'mission' ||
    slug === 'mission-fields' ||
    slug === 'get-involved' ||
    slug === 'donate'
    ? `/${slug}`
    : null;
}

exports.gallery = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: CONTENT_STATUSES,
    fallbackStatus: '',
    limit: 12,
    allowedCategories: true
  });
  const result = await GalleryItem.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const galleryItems = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    updatedDisplay: formatDateTime(item.updated_at)
  }));

  return render(res, 'admin/gallery', {
    title: 'Manage Gallery',
    galleryItems,
    filters,
    pagination,
    categories: result.categories || []
  });
};

exports.newGalleryItem = (req, res) => render(res, 'admin/gallery-form', {
  title: 'Create Gallery Item',
  formTitle: 'Create Gallery Item',
  formAction: '/admin/gallery',
  galleryItem: buildGalleryFormState(null, getRememberedFormData(res))
});

exports.createGalleryItem = async (req, res) => {
  const title = String(req.body.title || '').trim();
  const imageUrl = String(req.body.imageUrl || '').trim();

  if (!title || !imageUrl) {
    req.flash('error', 'Please provide a title and image URL for the gallery item.');
    rememberFormData(req);
    return res.redirect('/admin/gallery/create');
  }

  const createdGalleryItem = await GalleryItem.create({
    title,
    caption: normalizeNullable(req.body.caption),
    imageUrl,
    category: normalizeNullable(req.body.category),
    status: pickAllowedValue(String(req.body.status || 'draft'), CONTENT_STATUSES, 'draft'),
    sortOrder: Number(req.body.sortOrder || 0)
  });
  await logAction({
    req,
    action: 'create_gallery_item',
    entityType: 'gallery_item',
    entityId: createdGalleryItem ? createdGalleryItem.id : null,
    metadata: { title, status: createdGalleryItem ? createdGalleryItem.status : null }
  });

  req.flash('success', 'Gallery item created successfully.');
  return res.redirect('/admin/gallery');
};

exports.editGalleryItem = async (req, res) => {
  const galleryItem = await GalleryItem.findById(req.params.id);
  if (!galleryItem) {
    return res.status(404).render('errors/404', { title: 'Gallery Item Not Found' });
  }

  return render(res, 'admin/gallery-form', {
    title: 'Edit Gallery Item',
    formTitle: 'Edit Gallery Item',
    formAction: `/admin/gallery/${galleryItem.id}`,
    galleryItem: buildGalleryFormState(galleryItem, getRememberedFormData(res))
  });
};

exports.updateGalleryItem = async (req, res) => {
  const galleryItem = await GalleryItem.findById(req.params.id);
  if (!galleryItem) {
    return res.status(404).render('errors/404', { title: 'Gallery Item Not Found' });
  }

  const title = String(req.body.title || '').trim();
  const imageUrl = String(req.body.imageUrl || '').trim();

  if (!title || !imageUrl) {
    req.flash('error', 'Please provide a title and image URL for the gallery item.');
    rememberFormData(req);
    return res.redirect(`/admin/gallery/${galleryItem.id}/edit`);
  }

  await GalleryItem.update(galleryItem.id, {
    title,
    caption: normalizeNullable(req.body.caption),
    imageUrl,
    category: normalizeNullable(req.body.category),
    status: pickAllowedValue(String(req.body.status || galleryItem.status), CONTENT_STATUSES, galleryItem.status),
    sortOrder: Number(req.body.sortOrder || galleryItem.sort_order || 0)
  });
  await logAction({
    req,
    action: 'update_gallery_item',
    entityType: 'gallery_item',
    entityId: galleryItem.id,
    metadata: { title, status: pickAllowedValue(String(req.body.status || galleryItem.status), CONTENT_STATUSES, galleryItem.status) }
  });

  req.flash('success', 'Gallery item updated successfully.');
  return res.redirect('/admin/gallery');
};

exports.archiveGalleryItem = async (req, res) => {
  const galleryItem = await GalleryItem.findById(req.params.id);
  if (!galleryItem) {
    return res.status(404).render('errors/404', { title: 'Gallery Item Not Found' });
  }

  await GalleryItem.updateStatus(galleryItem.id, 'archived');
  await logAction({
    req,
    action: 'archive_gallery_item',
    entityType: 'gallery_item',
    entityId: galleryItem.id,
    metadata: { title: galleryItem.title }
  });
  req.flash('success', 'Gallery item archived successfully.');
  return res.redirect('/admin/gallery');
};

exports.deleteGalleryItem = async (req, res) => {
  const galleryItem = await GalleryItem.findById(req.params.id);
  if (!galleryItem) {
    return res.status(404).render('errors/404', { title: 'Gallery Item Not Found' });
  }

  await GalleryItem.delete(galleryItem.id);
  await logAction({
    req,
    action: 'delete_gallery_item',
    entityType: 'gallery_item',
    entityId: galleryItem.id,
    metadata: { title: galleryItem.title }
  });
  req.flash('success', 'Gallery item deleted successfully.');
  return res.redirect('/admin/gallery');
};

exports.testimonies = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: CONTENT_STATUSES,
    fallbackStatus: '',
    limit: 10,
    extraFilters: {
      featured: pickAllowedValue(String(req.query.featured || ''), ['', 'featured', 'standard'], '')
    }
  });
  const result = await Testimony.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const testimonies = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    updatedDisplay: formatDateTime(item.updated_at)
  }));

  return render(res, 'admin/testimonies', {
    title: 'Manage Testimonies',
    testimonies,
    filters,
    pagination
  });
};

exports.newTestimony = (req, res) => render(res, 'admin/testimony-form', {
  title: 'Create Testimony',
  formTitle: 'Create Testimony',
  formAction: '/admin/testimonies',
  testimony: buildTestimonyFormState(null, getRememberedFormData(res)),
  includeRichEditorAssets: true
});

exports.createTestimony = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const quote = String(req.body.quote || '').trim();

  if (!name || !quote) {
    req.flash('error', 'Please provide a name and testimony quote.');
    rememberFormData(req);
    return res.redirect('/admin/testimonies/create');
  }

  const createdTestimony = await Testimony.create({
    name,
    location: normalizeNullable(req.body.location),
    quote,
    story: sanitizeRichHtml(req.body.story || ''),
    imageUrl: normalizeNullable(req.body.imageUrl),
    status: pickAllowedValue(String(req.body.status || 'draft'), CONTENT_STATUSES, 'draft'),
    isFeatured: normalizeBoolean(req.body.isFeatured) ? 1 : 0
  });
  await logAction({
    req,
    action: 'create_testimony',
    entityType: 'testimony',
    entityId: createdTestimony ? createdTestimony.id : null,
    metadata: { name, status: createdTestimony ? createdTestimony.status : null }
  });

  req.flash('success', 'Testimony created successfully.');
  return res.redirect('/admin/testimonies');
};

exports.editTestimony = async (req, res) => {
  const testimony = await Testimony.findById(req.params.id);
  if (!testimony) {
    return res.status(404).render('errors/404', { title: 'Testimony Not Found' });
  }

  return render(res, 'admin/testimony-form', {
    title: 'Edit Testimony',
    formTitle: 'Edit Testimony',
    formAction: `/admin/testimonies/${testimony.id}`,
    testimony: buildTestimonyFormState(testimony, getRememberedFormData(res)),
    includeRichEditorAssets: true
  });
};

exports.updateTestimony = async (req, res) => {
  const testimony = await Testimony.findById(req.params.id);
  if (!testimony) {
    return res.status(404).render('errors/404', { title: 'Testimony Not Found' });
  }

  const name = String(req.body.name || '').trim();
  const quote = String(req.body.quote || '').trim();

  if (!name || !quote) {
    req.flash('error', 'Please provide a name and testimony quote.');
    rememberFormData(req);
    return res.redirect(`/admin/testimonies/${testimony.id}/edit`);
  }

  await Testimony.update(testimony.id, {
    name,
    location: normalizeNullable(req.body.location),
    quote,
    story: sanitizeRichHtml(req.body.story || ''),
    imageUrl: normalizeNullable(req.body.imageUrl),
    status: pickAllowedValue(String(req.body.status || testimony.status), CONTENT_STATUSES, testimony.status),
    isFeatured: normalizeBoolean(req.body.isFeatured) ? 1 : 0
  });
  await logAction({
    req,
    action: 'update_testimony',
    entityType: 'testimony',
    entityId: testimony.id,
    metadata: { name, status: pickAllowedValue(String(req.body.status || testimony.status), CONTENT_STATUSES, testimony.status) }
  });

  req.flash('success', 'Testimony updated successfully.');
  return res.redirect('/admin/testimonies');
};

exports.archiveTestimony = async (req, res) => {
  const testimony = await Testimony.findById(req.params.id);
  if (!testimony) {
    return res.status(404).render('errors/404', { title: 'Testimony Not Found' });
  }

  await Testimony.updateStatus(testimony.id, 'archived');
  await logAction({
    req,
    action: 'archive_testimony',
    entityType: 'testimony',
    entityId: testimony.id,
    metadata: { name: testimony.name }
  });
  req.flash('success', 'Testimony archived successfully.');
  return res.redirect('/admin/testimonies');
};

exports.toggleFeaturedTestimony = async (req, res) => {
  const testimony = await Testimony.findById(req.params.id);
  if (!testimony) {
    return res.status(404).render('errors/404', { title: 'Testimony Not Found' });
  }

  await Testimony.updateFeatured(testimony.id, testimony.is_featured ? 0 : 1);
  await logAction({
    req,
    action: testimony.is_featured ? 'unfeature_testimony' : 'feature_testimony',
    entityType: 'testimony',
    entityId: testimony.id,
    metadata: { name: testimony.name, isFeatured: testimony.is_featured ? 0 : 1 }
  });
  req.flash('success', `Testimony ${testimony.is_featured ? 'removed from' : 'added to'} featured stories.`);
  return res.redirect('/admin/testimonies');
};

exports.pages = async (req, res) => {
  const filters = getListParams(req.query, {
    allowedStatuses: PAGE_STATUSES,
    fallbackStatus: '',
    limit: 10
  });
  const result = await Page.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });
  const pages = result.rows.map((item) => ({
    ...item,
    statusLabel: toDisplayStatus(item.status),
    statusBadgeClass: statusBadgeClass(item.status),
    updatedDisplay: formatDateTime(item.updated_at),
    previewHref: buildPagePreviewHref(item.slug)
  }));

  return render(res, 'admin/pages', {
    title: 'Editable Pages',
    pages,
    filters,
    pagination
  });
};

exports.newPage = (req, res) => render(res, 'admin/page-form', {
  title: 'Create Page',
  formTitle: 'Create Editable Page',
  formAction: '/admin/pages',
  pageItem: buildPageFormState(null, getRememberedFormData(res)),
  includeRichEditorAssets: true
});

exports.createPage = async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) {
    req.flash('error', 'Please provide a page title.');
    rememberFormData(req);
    return res.redirect('/admin/pages/create');
  }

  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => Page.slugExists(candidate));
  const createdPage = await Page.create({
    title,
    slug,
    subtitle: normalizeNullable(req.body.subtitle),
    body: sanitizeRichHtml(req.body.body || ''),
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status: pickAllowedValue(String(req.body.status || 'draft'), PAGE_STATUSES, 'draft'),
    createdBy: req.session.user.id,
    updatedBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'create_page',
    entityType: 'page',
    entityId: createdPage ? createdPage.id : null,
    metadata: { title, slug }
  });

  req.flash('success', 'Editable page created successfully.');
  return res.redirect('/admin/pages');
};

exports.editPage = async (req, res) => {
  const pageItem = await Page.findById(req.params.id);
  if (!pageItem) {
    return res.status(404).render('errors/404', { title: 'Page Not Found' });
  }

  return render(res, 'admin/page-form', {
    title: 'Edit Page',
    formTitle: 'Edit Editable Page',
    formAction: `/admin/pages/${pageItem.id}`,
    pageItem: buildPageFormState(pageItem, getRememberedFormData(res)),
    includeRichEditorAssets: true
  });
};

exports.updatePage = async (req, res) => {
  const pageItem = await Page.findById(req.params.id);
  if (!pageItem) {
    return res.status(404).render('errors/404', { title: 'Page Not Found' });
  }

  const title = String(req.body.title || '').trim();
  if (!title) {
    req.flash('error', 'Please provide a page title.');
    rememberFormData(req);
    return res.redirect(`/admin/pages/${pageItem.id}/edit`);
  }

  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => Page.slugExists(candidate, pageItem.id));
  await Page.update(pageItem.id, {
    title,
    slug,
    subtitle: normalizeNullable(req.body.subtitle),
    body: sanitizeRichHtml(req.body.body || ''),
    metaTitle: normalizeNullable(req.body.metaTitle),
    metaDescription: normalizeNullable(req.body.metaDescription),
    status: pickAllowedValue(String(req.body.status || pageItem.status), PAGE_STATUSES, pageItem.status),
    updatedBy: req.session.user.id
  });
  await logAction({
    req,
    action: 'update_page',
    entityType: 'page',
    entityId: pageItem.id,
    metadata: { title, slug }
  });

  req.flash('success', 'Editable page updated successfully.');
  return res.redirect('/admin/pages');
};

exports.archivePage = async (req, res) => {
  const pageItem = await Page.findById(req.params.id);
  if (!pageItem) {
    return res.status(404).render('errors/404', { title: 'Page Not Found' });
  }

  await Page.archive(pageItem.id, req.session.user.id);
  await logAction({
    req,
    action: 'archive_page',
    entityType: 'page',
    entityId: pageItem.id,
    metadata: { title: pageItem.title, slug: pageItem.slug }
  });
  req.flash('success', 'Page moved back to draft.');
  return res.redirect('/admin/pages');
};

exports.emailTemplates = async (req, res) => {
  const templates = await EmailTemplate.findForAdmin().catch(() => []);

  return render(res, 'admin/email-templates', {
    title: 'Email Templates',
    templates: templates.map((item) => ({
      ...item,
      updatedDisplay: formatDateTime(item.updated_at)
    }))
  });
};

exports.editEmailTemplate = async (req, res) => {
  const template = await findOrRedirectWithFlash(res, req, EmailTemplate, req.params.id, '/admin/email-templates', 'Email template');
  if (!template) {
    return;
  }

  const preview = await renderTemplatePreview(template);

  return render(res, 'admin/email-template-form', {
    title: 'Edit Email Template',
    template,
    preview
  });
};

exports.updateEmailTemplate = async (req, res) => {
  const template = await findOrRedirectWithFlash(res, req, EmailTemplate, req.params.id, '/admin/email-templates', 'Email template');
  if (!template) {
    return;
  }

  const subject = String(req.body.subject || '').trim();
  const htmlBody = String(req.body.htmlBody || '').trim();

  if (!subject || !htmlBody) {
    req.flash('error', 'Please provide both a subject and HTML body for the email template.');
    return res.redirect(`/admin/email-templates/${template.id}/edit`);
  }

  const updated = await EmailTemplate.update(template.id, {
    subject,
    htmlBody: sanitizeRichHtml(htmlBody),
    textBody: normalizeNullable(req.body.textBody),
    isActive: normalizeBoolean(req.body.isActive)
  });

  await logAction({
    req,
    action: 'update_email_template',
    entityType: 'email_template',
    entityId: template.id,
    metadata: { templateKey: template.template_key }
  });

  req.flash('success', `Email template "${updated.name}" updated successfully.`);
  return res.redirect(`/admin/email-templates/${template.id}/edit`);
};

exports.notificationLogs = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(NOTIFICATION_STATUSES), ''),
    type: String(req.query.type || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };

  const result = await NotificationLog.findForAdmin(filters).catch(() => ({ rows: [], total: 0, notificationTypes: [] }));
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });

  return render(res, 'admin/notification-logs', {
    title: 'Notification Logs',
    filters,
    pagination,
    notificationStatuses: NOTIFICATION_STATUSES,
    notificationTypes: result.notificationTypes || [],
    logs: result.rows.map((item) => ({
      ...item,
      createdDisplay: formatDateTime(item.created_at),
      statusLabel: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status === 'sent' ? 'published' : (item.status === 'failed' ? 'archived' : 'new'))
    }))
  });
};

exports.settings = async (req, res) => {
  const groups = await getSettingsGrouped().catch(() => []);

  return render(res, 'admin/settings', {
    title: 'Settings',
    settingGroups: groups
  });
};

exports.updateSettings = async (req, res) => {
  const payload = [
    { settingKey: 'site_name', settingValue: normalizeNullable(req.body.site_name), settingGroup: 'general' },
    { settingKey: 'contact_email', settingValue: normalizeNullable(req.body.contact_email), settingGroup: 'contact' },
    { settingKey: 'contact_phone', settingValue: normalizeNullable(req.body.contact_phone), settingGroup: 'contact' },
    { settingKey: 'office_address', settingValue: normalizeNullable(req.body.office_address), settingGroup: 'contact' },
    { settingKey: 'facebook_url', settingValue: normalizeNullable(req.body.facebook_url), settingGroup: 'social' },
    { settingKey: 'youtube_url', settingValue: normalizeNullable(req.body.youtube_url), settingGroup: 'social' },
    { settingKey: 'whatsapp_number', settingValue: normalizeNullable(req.body.whatsapp_number), settingGroup: 'social' },
    { settingKey: 'logo_url', settingValue: normalizeNullable(req.body.logo_url), settingGroup: 'branding' },
    { settingKey: 'favicon_url', settingValue: normalizeNullable(req.body.favicon_url), settingGroup: 'branding' },
    { settingKey: 'default_meta_title', settingValue: normalizeNullable(req.body.default_meta_title), settingGroup: 'seo' },
    { settingKey: 'default_meta_description', settingValue: normalizeNullable(req.body.default_meta_description), settingGroup: 'seo' }
  ];

  await SiteSetting.upsertMany(payload);
  await logAction({
    req,
    action: 'update_settings',
    entityType: 'site_settings',
    entityId: null,
    metadata: { keys: payload.map((item) => item.settingKey) }
  });
  req.flash('success', 'Settings updated successfully.');
  return res.redirect('/admin/settings');
};

exports.sendTestEmail = async (req, res) => {
  const recipient = String(req.body.test_email || '').trim() || env.mail.adminNotificationEmail;

  if (!recipient) {
    req.flash('error', 'Please provide a test email address or set ADMIN_NOTIFICATION_EMAIL in your environment.');
    return res.redirect('/admin/settings');
  }

  if (!isValidEmail(recipient)) {
    req.flash('error', 'Please provide a valid test email address.');
    return res.redirect('/admin/settings');
  }

  const site = await getPublicSiteContext().catch(() => siteContent);
  const result = await sendLoggedEmail({
    to: recipient,
    subject: `Test email from ${site.brand}`,
    html: `<p>This is a test email from <strong>${site.brand}</strong>.</p><p>If you received this, the communication layer is ready.</p>`,
    text: `This is a test email from ${site.brand}. If you received this, the communication layer is ready.`,
    notificationType: 'test_email',
    relatedEntityType: 'site_settings',
    relatedEntityId: null
  });

  await logAction({
    req,
    action: 'send_test_email',
    entityType: 'notification',
    entityId: null,
    metadata: { recipient, result: result.sent ? 'sent' : (result.skipped ? 'skipped' : 'failed') }
  });

  if (result.sent) {
    req.flash('success', `Test email sent to ${recipient}.`);
  } else if (result.skipped) {
    req.flash('info', result.error || 'Email sending is disabled or not configured, so the test email was skipped.');
  } else {
    req.flash('error', `Test email failed: ${result.error}`);
  }

  return res.redirect('/admin/settings');
};
