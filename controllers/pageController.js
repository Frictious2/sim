const fs = require('fs/promises');
const path = require('path');

const siteContent = require('../data/site-content');
const cmsContentService = require('../services/cmsContentService');
const ContactMessage = require('../models/ContactMessage');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const Donation = require('../models/Donation');
const SponsorshipInterest = require('../models/SponsorshipInterest');
const VolunteerApplication = require('../models/VolunteerApplication');
const PrayerPartner = require('../models/PrayerPartner');
const PrayerRequest = require('../models/PrayerRequest');
const { getPublicSiteContext } = require('../services/siteSettingsService');
const { getPublicSponsorCatalog } = require('../services/sponsorshipCatalogService');
const { sendTemplatedNotification, sendAdminNotification } = require('../services/notificationService');
const { fileMatchesProofSignature } = require('../middleware/uploadMiddleware');
const {
  isValidEmail,
  isValidPhone,
  normalizeNullable,
  isPositiveAmount,
  normalizeAmount,
  normalizeEnum
} = require('../utils/validation');

const DONATION_TYPES = ['one_time', 'monthly', 'quarterly', 'annual'];
const DONATION_DESIGNATIONS = ['general_mission', 'child_sponsorship', 'outreach', 'church_planting', 'community_support', 'other'];
const PAYMENT_METHODS = ['mobile_money', 'bank_transfer', 'cash', 'other'];
const SPONSORSHIP_TYPES = ['child', 'project', 'mission_worker', 'general'];
const SPONSORSHIP_PLANS = ['monthly', 'quarterly', 'annual', 'one_time'];
const VOLUNTEER_AREAS = ['field_outreach', 'children_ministry', 'media', 'administration', 'prayer', 'training', 'other'];
const PRAYER_FOCUS_VALUES = ['general', 'mission_fields', 'children', 'volunteers', 'church_planting', 'community_support'];
const PRAYER_FREQUENCY_VALUES = ['daily', 'weekly', 'monthly'];

function render(res, view, options = {}) {
  const pageTitle = options.pageTitle || options.title || '';
  const metaDescription = options.metaDescription || '';
  const ogTitle = options.ogTitle || pageTitle;
  const ogDescription = options.ogDescription || metaDescription;
  const ogImage = options.ogImage || '';

  return res.render(view, {
    ...options,
    content: options.content || siteContent,
    pageTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage
  });
}

function getSafeRedirectPath(req, fallback = '/') {
  const referer = req.get('referer');
  if (!referer) {
    return fallback;
  }

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.host === req.get('host')) {
      return `${refererUrl.pathname}${refererUrl.search || ''}`;
    }
  } catch (error) {
    if (referer.startsWith('/') && !referer.startsWith('//')) {
      return referer;
    }
  }

  return fallback;
}

exports.home = async (req, res) => {
  const content = await cmsContentService.getHomePageContent();
  return render(res, 'pages/home', {
    title: 'Home',
    content,
    pageTitle: 'Home',
    metaDescription: 'Support Gospel outreach, discipleship, church planting, child sponsorship, and community transformation across Sierra Leone.',
    ogImage: content.homeHeroImage || (content.gallery[0] ? content.gallery[0].image : '')
  });
};

async function renderManagedPage(req, res, slug, view, title, fallbackMetaDescription) {
  const pageRecord = await cmsContentService.getManagedPage(slug);
  return render(res, view, {
    title,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || title,
    metaDescription: (pageRecord && pageRecord.meta_description) || fallbackMetaDescription
  });
}

async function getManagedPageRecord(slug) {
  return cmsContentService.getManagedPage(slug).catch(() => null);
}

exports.about = (req, res) => renderManagedPage(req, res, 'about', 'pages/about', 'About', 'Learn about the story, values, and long-term ministry vision of Salone Interior Missions.');
exports.mission = (req, res) => renderManagedPage(req, res, 'mission', 'pages/mission', 'Mission', 'Explore the Gospel-rooted mission and vision guiding Salone Interior Missions.');
exports.missionFields = (req, res) => renderManagedPage(req, res, 'mission-fields', 'pages/mission-fields', 'Mission Fields', 'See where Salone Interior Missions serves and what ministry work is happening across interior communities.');
exports.getInvolved = (req, res) => renderManagedPage(req, res, 'get-involved', 'pages/get-involved', 'Get Involved', 'Find practical ways to pray, give, volunteer, sponsor, and partner with Salone Interior Missions.');
exports.sponsor = async (req, res) => {
  const pageRecord = await getManagedPageRecord('sponsor');
  const catalog = await getPublicSponsorCatalog().catch(() => ({
    children: siteContent.sponsorCatalogChildren || [],
    projects: siteContent.sponsorCatalogProjects || [],
    workers: siteContent.sponsorCatalogWorkers || []
  }));

  return render(res, 'pages/sponsor', {
    title: 'Sponsor',
    catalog,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Sponsor',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Sponsor children, mission projects, or field workers with Salone Interior Missions.'
  });
};
exports.contact = async (req, res) => {
  const pageRecord = await getManagedPageRecord('contact');
  return render(res, 'pages/contact', {
    title: 'Contact',
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Contact',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Contact Salone Interior Missions for donations, sponsorship, volunteer, prayer, and partnership inquiries.'
  });
};
exports.donate = (req, res) => renderManagedPage(req, res, 'donate', 'pages/donate', 'Donate', 'Give with confidence to support Gospel witness, practical compassion, and community transformation.');
exports.donateThankYou = (req, res) => render(res, 'pages/donate-thank-you', {
  title: 'Thank You',
  pageTitle: 'Donation Received',
  metaDescription: 'Thank you for beginning a donation with Salone Interior Missions.'
});
exports.sponsorThankYou = (req, res) => render(res, 'pages/sponsor-thank-you', {
  title: 'Sponsorship Interest Received',
  pageTitle: 'Sponsorship Interest Received',
  metaDescription: 'Thank you for expressing sponsorship interest with Salone Interior Missions.'
});
exports.volunteerThankYou = (req, res) => render(res, 'pages/volunteer-thank-you', {
  title: 'Volunteer Application Received',
  pageTitle: 'Volunteer Application Received',
  metaDescription: 'Thank you for offering to serve with Salone Interior Missions.'
});
exports.prayerPartnerThankYou = (req, res) => render(res, 'pages/prayer-partner-thank-you', {
  title: 'Prayer Partnership Received',
  pageTitle: 'Prayer Partnership Received',
  metaDescription: 'Thank you for joining the SIM prayer partnership.'
});
exports.prayerRequestThankYou = (req, res) => render(res, 'pages/prayer-request-thank-you', {
  title: 'Prayer Request Received',
  pageTitle: 'Prayer Request Received',
  metaDescription: 'Thank you for sharing a prayer request with Salone Interior Missions.'
});

exports.projects = async (req, res) => {
  const content = await cmsContentService.getProjectsContent();
  const pageRecord = await getManagedPageRecord('projects');
  return render(res, 'pages/projects', {
    title: 'Projects',
    content,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Projects',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Explore active Salone Interior Missions projects serving interior communities through sponsorship, outreach, discipleship, and community care.'
  });
};

exports.blog = async (req, res) => {
  const content = await cmsContentService.getBlogListingContent();
  const pageRecord = await getManagedPageRecord('blog');
  return render(res, 'pages/blog', {
    title: 'Blog',
    content,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Blog, News and Updates',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Read ministry updates, stories, and field reflections from Salone Interior Missions.'
  });
};

exports.blogPostLegacy = async (req, res) => {
  req.params.slug = 'featured-post';
  return exports.blogPost(req, res);
};

exports.blogPost = async (req, res) => {
  const slug = req.params.slug || 'featured-post';
  const { content, post, relatedPosts } = await cmsContentService.getBlogPostContent(slug);

  if (!post && slug !== 'featured-post') {
    return res.status(404).render('errors/404', { title: 'Post Not Found' });
  }

  return render(res, 'pages/blog-post', {
    title: post ? post.title : 'Why Mission Partnership Must Feel Personal',
    content,
    post,
    relatedPosts,
    pageTitle: post ? (post.metaTitle || post.title) : 'Featured Post',
    metaDescription: post ? (post.metaDescription || post.excerpt) : 'Read the latest ministry stories and updates from Salone Interior Missions.',
    ogImage: post ? post.featuredImage : ''
  });
};

exports.stories = async (req, res) => {
  const content = await cmsContentService.getStoriesContent();
  const pageRecord = await getManagedPageRecord('stories');
  return render(res, 'pages/stories', {
    title: 'Stories',
    content,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Stories and Testimonies',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Read stories of hope, prayer, transformation, and faithful ministry from the mission field.'
  });
};

exports.gallery = async (req, res) => {
  const content = await cmsContentService.getGalleryContent();
  const pageRecord = await getManagedPageRecord('gallery');
  return render(res, 'pages/gallery', {
    title: 'Gallery',
    content,
    pageRecord,
    pageTitle: (pageRecord && (pageRecord.meta_title || pageRecord.title)) || 'Gallery',
    metaDescription: (pageRecord && pageRecord.meta_description) || 'Explore outreach, children, church gatherings, and community moments through the Salone Interior Missions gallery.'
  });
};

async function cleanupUploadedFile(file) {
  if (!file || !file.path) {
    return;
  }

  await fs.unlink(file.path).catch(() => {});
}

function buildLoggedInUserId(req) {
  return req.session && req.session.user ? req.session.user.id : null;
}

async function buildNotificationPlaceholders(overrides = {}) {
  const site = await getPublicSiteContext().catch(() => siteContent);
  return {
    site_name: site.brand || siteContent.brand,
    admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/admin`,
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

exports.submitDonation = async (req, res) => {
  const payload = {
    donorName: String(req.body.donorName || '').trim(),
    donorEmail: String(req.body.donorEmail || '').trim().toLowerCase(),
    donorPhone: String(req.body.donorPhone || '').trim(),
    amount: req.body.amount,
    donationType: normalizeEnum(req.body.donationType, DONATION_TYPES),
    designation: normalizeEnum(req.body.designation, DONATION_DESIGNATIONS),
    paymentMethod: normalizeEnum(req.body.paymentMethod, PAYMENT_METHODS),
    paymentReference: String(req.body.paymentReference || '').trim(),
    message: String(req.body.message || '').trim()
  };

  const formData = { ...req.body };

  if (!payload.donorName || !payload.donorEmail || !isPositiveAmount(payload.amount) || !payload.donationType || !payload.designation || !payload.paymentMethod) {
    await cleanupUploadedFile(req.file);
    req.flash('error', 'Please complete the required donation fields before continuing.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/donate');
  }

  if (!isValidEmail(payload.donorEmail)) {
    await cleanupUploadedFile(req.file);
    req.flash('error', 'Please enter a valid donor email address.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/donate');
  }

  if (!isValidPhone(payload.donorPhone)) {
    await cleanupUploadedFile(req.file);
    req.flash('error', 'Please enter a valid phone number or leave that field blank.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/donate');
  }

  let proofFileUrl = null;
  if (req.file) {
    const buffer = await fs.readFile(req.file.path);
    if (!fileMatchesProofSignature(buffer, req.file.mimetype)) {
      await cleanupUploadedFile(req.file);
      req.flash('error', 'The uploaded proof file did not match a valid image or PDF format.');
      req.flash('formData', JSON.stringify(formData));
      return res.redirect('/donate');
    }
    proofFileUrl = `/uploads/proofs/${req.file.filename}`;
  }

  try {
    const donation = await Donation.create({
      userId: buildLoggedInUserId(req),
      donorName: payload.donorName,
      donorEmail: payload.donorEmail,
      donorPhone: normalizeNullable(payload.donorPhone),
      amount: normalizeAmount(payload.amount),
      currency: 'NLe',
      donationType: payload.donationType,
      designation: payload.designation,
      paymentMethod: payload.paymentMethod,
      paymentReference: normalizeNullable(payload.paymentReference),
      proofFileUrl,
      message: normalizeNullable(payload.message),
      status: 'pending'
    });

    const placeholders = await buildNotificationPlaceholders({
      name: donation.donor_name,
      amount: Number(donation.amount || 0).toFixed(2),
      currency: donation.currency || 'NLe',
      designation: String(donation.designation || '').replace(/_/g, ' '),
      message: donation.message || '',
      admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/admin/donations/${donation.id}`
    });

    await sendTemplatedNotification({
      templateKey: 'donation_submitted_user',
      to: donation.donor_email,
      placeholders,
      notificationType: 'donation_submitted_user',
      relatedEntityType: 'donation',
      relatedEntityId: donation.id
    });

    await sendAdminNotification({
      templateKey: 'donation_submitted_admin',
      placeholders,
      notificationType: 'donation_submitted_admin',
      relatedEntityType: 'donation',
      relatedEntityId: donation.id
    });

    req.flash('success', 'Your donation record has been received and is pending review. Thank you for partnering with the mission.');
    return res.redirect('/donate/thank-you');
  } catch (error) {
    await cleanupUploadedFile(req.file);
    req.flash('error', 'We could not save your donation right now. Please try again shortly.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/donate');
  }
};

exports.viewDonationReceipt = async (req, res) => {
  const donation = await Donation.findById(req.params.id).catch(() => null);
  if (!donation) {
    req.flash('error', 'That donation receipt could not be found.');
    return res.redirect('/dashboard/donations');
  }

  const currentUser = req.session && req.session.user ? req.session.user : null;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isOwner = currentUser && donation.user_id && Number(donation.user_id) === Number(currentUser.id);

  if (!isAdmin && !isOwner) {
    req.flash('error', 'You do not have permission to view that donation receipt.');
    return res.redirect('/dashboard/donations');
  }

  if (donation.status !== 'verified' || !donation.receipt_number) {
    req.flash('error', 'A verified receipt is not available for that donation yet.');
    return res.redirect(isAdmin ? `/admin/donations/${donation.id}` : `/dashboard/donations/${donation.id}`);
  }

  return render(res, 'pages/donation-receipt', {
    title: 'Donation Receipt',
    pageTitle: `Donation Receipt ${donation.receipt_number}`,
    metaDescription: 'Donation receipt from Salone Interior Missions.',
    donation,
    receiptViewMode: isAdmin ? 'admin' : 'owner'
  });
};

exports.submitSponsorshipInterest = async (req, res) => {
  const payload = {
    sponsorName: String(req.body.sponsorName || '').trim(),
    sponsorEmail: String(req.body.sponsorEmail || '').trim().toLowerCase(),
    sponsorPhone: String(req.body.sponsorPhone || '').trim(),
    sponsorshipType: normalizeEnum(req.body.sponsorshipType, SPONSORSHIP_TYPES),
    preferredPlan: normalizeEnum(req.body.preferredPlan, SPONSORSHIP_PLANS),
    amount: req.body.amount,
    preferredContactMethod: String(req.body.preferredContactMethod || '').trim(),
    message: String(req.body.message || '').trim()
  };

  if (!payload.sponsorName || !payload.sponsorEmail || !payload.sponsorshipType || !payload.preferredPlan) {
    req.flash('error', 'Please complete the required sponsorship interest fields.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/sponsor#interest-form');
  }

  if (!isValidEmail(payload.sponsorEmail)) {
    req.flash('error', 'Please enter a valid sponsor email address.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/sponsor#interest-form');
  }

  if (!isValidPhone(payload.sponsorPhone)) {
    req.flash('error', 'Please enter a valid sponsor phone number or leave it blank.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/sponsor#interest-form');
  }

  if (payload.amount && !isPositiveAmount(payload.amount)) {
    req.flash('error', 'Please enter a positive sponsorship amount or leave it blank.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/sponsor#interest-form');
  }

  try {
    const interest = await SponsorshipInterest.create({
      userId: buildLoggedInUserId(req),
      sponsorName: payload.sponsorName,
      sponsorEmail: payload.sponsorEmail,
      sponsorPhone: normalizeNullable(payload.sponsorPhone),
      sponsorshipType: payload.sponsorshipType,
      preferredPlan: payload.preferredPlan,
      amount: payload.amount ? normalizeAmount(payload.amount) : null,
      preferredContactMethod: normalizeNullable(payload.preferredContactMethod),
      message: normalizeNullable(payload.message),
      status: 'new'
    });

    const placeholders = await buildNotificationPlaceholders({
      name: interest.sponsor_name,
      amount: interest.amount ? Number(interest.amount).toFixed(2) : '',
      currency: interest.currency || 'NLe',
      designation: String(interest.sponsorship_type || '').replace(/_/g, ' '),
      message: interest.message || '',
      admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/admin/sponsorships/${interest.id}`
    });

    await sendTemplatedNotification({
      templateKey: 'sponsorship_interest_user',
      to: interest.sponsor_email,
      placeholders,
      notificationType: 'sponsorship_interest_user',
      relatedEntityType: 'sponsorship_interest',
      relatedEntityId: interest.id
    });

    await sendAdminNotification({
      templateKey: 'sponsorship_interest_admin',
      placeholders,
      notificationType: 'sponsorship_interest_admin',
      relatedEntityType: 'sponsorship_interest',
      relatedEntityId: interest.id
    });

    req.flash('success', 'Your sponsorship interest has been received. Our team will follow up with you soon.');
    return res.redirect('/sponsor/thank-you');
  } catch (error) {
    req.flash('error', 'We could not save your sponsorship interest right now. Please try again shortly.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/sponsor#interest-form');
  }
};

exports.submitVolunteerApplication = async (req, res) => {
  const payload = {
    fullName: String(req.body.fullName || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    phone: String(req.body.phone || '').trim(),
    location: String(req.body.location || '').trim(),
    areaOfInterest: normalizeEnum(req.body.areaOfInterest, VOLUNTEER_AREAS),
    availability: String(req.body.availability || '').trim(),
    experience: String(req.body.experience || '').trim(),
    motivation: String(req.body.motivation || '').trim()
  };

  if (!payload.fullName || !payload.email || !payload.areaOfInterest) {
    req.flash('error', 'Please complete your name, email address, and area of interest before applying.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#volunteer-interest');
  }

  if (!isValidEmail(payload.email)) {
    req.flash('error', 'Please enter a valid volunteer email address.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#volunteer-interest');
  }

  if (!isValidPhone(payload.phone)) {
    req.flash('error', 'Please enter a valid phone number or leave it blank.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#volunteer-interest');
  }

  try {
    const application = await VolunteerApplication.create({
      userId: buildLoggedInUserId(req),
      fullName: payload.fullName,
      email: payload.email,
      phone: normalizeNullable(payload.phone),
      location: normalizeNullable(payload.location),
      areaOfInterest: payload.areaOfInterest,
      availability: normalizeNullable(payload.availability),
      experience: normalizeNullable(payload.experience),
      motivation: normalizeNullable(payload.motivation),
      status: 'new'
    });

    const placeholders = await buildNotificationPlaceholders({
      name: application.full_name,
      designation: String(application.area_of_interest || '').replace(/_/g, ' '),
      message: application.motivation || application.experience || '',
      admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/admin/volunteers/${application.id}`
    });

    await sendTemplatedNotification({
      templateKey: 'volunteer_application_user',
      to: application.email,
      placeholders,
      notificationType: 'volunteer_application_user',
      relatedEntityType: 'volunteer_application',
      relatedEntityId: application.id
    });

    await sendAdminNotification({
      templateKey: 'volunteer_application_admin',
      placeholders,
      notificationType: 'volunteer_application_admin',
      relatedEntityType: 'volunteer_application',
      relatedEntityId: application.id
    });

    req.flash('success', 'Your volunteer application has been received. Thank you for offering to serve.');
    return res.redirect('/volunteer/thank-you');
  } catch (error) {
    req.flash('error', 'We could not save your volunteer application right now. Please try again soon.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#volunteer-interest');
  }
};

exports.signupPrayerPartner = async (req, res) => {
  const payload = {
    name: String(req.body.name || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    phone: String(req.body.phone || '').trim(),
    prayerFocus: normalizeEnum(req.body.prayerFocus, PRAYER_FOCUS_VALUES, 'general'),
    frequency: normalizeEnum(req.body.frequency, PRAYER_FREQUENCY_VALUES)
  };

  if (!payload.name || !payload.email || !payload.frequency) {
    req.flash('error', 'Please complete your prayer partner signup details.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#prayer-partner');
  }

  if (!isValidEmail(payload.email)) {
    req.flash('error', 'Please enter a valid email address for prayer partnership.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#prayer-partner');
  }

  if (!isValidPhone(payload.phone)) {
    req.flash('error', 'Please enter a valid phone number or leave it blank.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#prayer-partner');
  }

  try {
    const partner = await PrayerPartner.create({
      userId: buildLoggedInUserId(req),
      name: payload.name,
      email: payload.email,
      phone: normalizeNullable(payload.phone),
      prayerFocus: payload.prayerFocus,
      frequency: payload.frequency,
      status: 'active'
    });

    const placeholders = await buildNotificationPlaceholders({
      name: partner.name,
      designation: String(partner.prayer_focus || '').replace(/_/g, ' ')
    });

    await sendTemplatedNotification({
      templateKey: 'prayer_partner_user',
      to: partner.email,
      placeholders,
      notificationType: 'prayer_partner_user',
      relatedEntityType: 'prayer_partner',
      relatedEntityId: partner.id
    });

    req.flash('success', 'You have been added as a prayer partner. Thank you for standing with the mission in prayer.');
    return res.redirect('/prayer-partner/thank-you');
  } catch (error) {
    req.flash('error', 'We could not save your prayer partner signup right now. Please try again soon.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/get-involved#prayer-partner');
  }
};

exports.submitPrayerRequest = async (req, res) => {
  const payload = {
    name: String(req.body.name || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    requestText: String(req.body.requestText || '').trim(),
    isPublic: String(req.body.isPublic || '') === '1' || String(req.body.isPublic || '').toLowerCase() === 'true'
  };

  if (!payload.requestText) {
    req.flash('error', 'Please share the prayer request before submitting.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/contact#prayer-request');
  }

  if (payload.email && !isValidEmail(payload.email)) {
    req.flash('error', 'Please enter a valid email address or leave it blank.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/contact#prayer-request');
  }

  try {
    const prayerRequest = await PrayerRequest.create({
      name: normalizeNullable(payload.name),
      email: normalizeNullable(payload.email),
      requestText: payload.requestText,
      isPublic: payload.isPublic,
      status: 'new'
    });

    if (prayerRequest.email) {
      const placeholders = await buildNotificationPlaceholders({
        name: prayerRequest.name || 'Friend',
        message: prayerRequest.request_text
      });

      await sendTemplatedNotification({
        templateKey: 'prayer_request_user',
        to: prayerRequest.email,
        placeholders,
        notificationType: 'prayer_request_user',
        relatedEntityType: 'prayer_request',
        relatedEntityId: prayerRequest.id
      });
    }

    req.flash('success', 'Your prayer request has been received. We are grateful to pray with you.');
    return res.redirect('/prayer-request/thank-you');
  } catch (error) {
    req.flash('error', 'We could not save your prayer request right now. Please try again shortly.');
    req.flash('formData', JSON.stringify(req.body || {}));
    return res.redirect('/contact#prayer-request');
  }
};

exports.submitContact = async (req, res) => {
  const {
    firstName = '',
    lastName = '',
    email = '',
    phone = '',
    subject = '',
    organization = '',
    message = ''
  } = req.body;

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();
  const finalSubject = subject.trim() || normalizeNullable(organization) || 'General inquiry';
  const formData = { firstName, lastName, email, phone, subject, organization, message };

  if (!trimmedFirstName || !email.trim() || !message.trim()) {
    req.flash('error', 'Please complete your name, email address, and message before sending.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/contact');
  }

  if (!isValidEmail(email)) {
    req.flash('error', 'Please enter a valid email address.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/contact');
  }

  if (!isValidPhone(phone)) {
    req.flash('error', 'Please enter a valid phone number or leave the phone field blank.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/contact');
  }

  try {
    const contactMessage = await ContactMessage.create({
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: normalizeNullable(phone),
      subject: finalSubject,
      message: message.trim(),
      status: 'new'
    });

    const placeholders = await buildNotificationPlaceholders({
      name: contactMessage.name,
      message: contactMessage.message,
      admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/admin/messages/${contactMessage.id}`
    });

    await sendAdminNotification({
      templateKey: 'contact_message_admin',
      placeholders,
      notificationType: 'contact_message_admin',
      relatedEntityType: 'contact_message',
      relatedEntityId: contactMessage.id
    });

    req.flash('success', 'Your message has been received. Our team will follow up as soon as possible.');
    return res.redirect('/contact');
  } catch (error) {
    req.flash('error', 'Your message could not be saved right now. Please try again shortly.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/contact');
  }
};

exports.subscribeNewsletter = async (req, res) => {
  const { email = '', name = '', source = 'website' } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = getSafeRedirectPath(req, '/');

  if (!isValidEmail(normalizedEmail)) {
    req.flash('error', 'Please enter a valid email address for newsletter updates.');
    return res.redirect(redirectTo);
  }

  try {
    const existing = await NewsletterSubscriber.findByEmail(normalizedEmail);

    if (existing && existing.status === 'active') {
      req.flash('info', 'This email is already subscribed to ministry updates.');
      return res.redirect(redirectTo);
    }

    if (existing) {
      await NewsletterSubscriber.update(existing.id, {
        email: normalizedEmail,
        name: normalizeNullable(name),
        status: 'active',
        source: normalizeNullable(source)
      });
    } else {
      await NewsletterSubscriber.create({
        email: normalizedEmail,
        name: normalizeNullable(name),
        status: 'active',
        source: normalizeNullable(source) || 'website'
      });
    }

    req.flash('success', 'You have been subscribed to future ministry updates.');
    return res.redirect(redirectTo);
  } catch (error) {
    req.flash('error', 'We could not save your subscription right now. Please try again soon.');
    return res.redirect(redirectTo);
  }
};
