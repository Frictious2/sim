const content = require('../data/site-content');
const User = require('../models/User');
const Donation = require('../models/Donation');
const DonationStatusLog = require('../models/DonationStatusLog');
const SponsorshipInterest = require('../models/SponsorshipInterest');
const VolunteerApplication = require('../models/VolunteerApplication');
const PrayerPartner = require('../models/PrayerPartner');
const PrayerRequest = require('../models/PrayerRequest');
const BlogPost = require('../models/BlogPost');
const { formatDate, formatDateTime } = require('../utils/formatting');
const { getUserAssignments, getOwnedAssignmentDetail } = require('../services/sponsorshipCatalogService');
const {
  isValidPhone,
  normalizeNullable,
  pickAllowedValue
} = require('../utils/validation');
const {
  humanize,
  getDonationStatusMeta,
  getDonationNextStep,
  getSponsorshipStatusMeta,
  getSponsorshipNextStep,
  getVolunteerStatusMeta,
  getVolunteerNextStep,
  getPrayerPartnerStatusMeta,
  getPrayerRequestStatusMeta
} = require('../utils/engagementStatus');
const { logAction } = require('../services/auditService');

const DONATION_STATUSES = ['pending', 'verified', 'rejected', 'cancelled'];
const DONATION_DESIGNATIONS = ['general_mission', 'child_sponsorship', 'outreach', 'church_planting', 'community_support', 'other'];
const SPONSORSHIP_STATUSES = ['new', 'contacted', 'approved', 'rejected', 'archived'];
const SPONSORSHIP_TYPES = ['child', 'project', 'mission_worker', 'general'];
const PRAYER_FOCUS_VALUES = ['general', 'mission_fields', 'children', 'volunteers', 'church_planting', 'community_support'];
const PRAYER_FREQUENCY_VALUES = ['daily', 'weekly', 'monthly'];

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/dashboard',
    section: 'dashboard',
    ...options,
    content
  });
}

function formatMoney(amount, currency = 'NLe') {
  return `${currency} ${Number(amount || 0).toFixed(2)}`;
}

function sessionUserFromRecord(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function regenerateWithUser(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.user = sessionUserFromRecord(user);
      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });
}

function mapDonation(item) {
  const statusMeta = getDonationStatusMeta(item.status);
  return {
    ...item,
    amountDisplay: formatMoney(item.amount, item.currency),
    designationLabel: humanize(item.designation),
    paymentMethodLabel: humanize(item.payment_method),
    donationTypeLabel: humanize(item.donation_type),
    statusMeta,
    statusLabel: statusMeta.label,
    createdDisplay: formatDateTime(item.created_at),
    dateDisplay: formatDate(item.created_at),
    verifiedDisplay: item.verified_at ? formatDateTime(item.verified_at) : null,
    nextStep: getDonationNextStep(item.status),
    referenceLabel: item.payment_reference || 'Pending reference'
  };
}

function mapSponsorship(item) {
  const statusMeta = getSponsorshipStatusMeta(item.status);
  return {
    ...item,
    amountDisplay: item.amount ? formatMoney(item.amount, item.currency) : 'Open to discussion',
    typeLabel: humanize(item.sponsorship_type),
    planLabel: humanize(item.preferred_plan),
    statusMeta,
    statusLabel: statusMeta.label,
    createdDisplay: formatDateTime(item.created_at),
    dateLabel: formatDate(item.created_at),
    nextStep: getSponsorshipNextStep(item.status)
  };
}

function mapApplication(item) {
  const statusMeta = getVolunteerStatusMeta(item.status);
  return {
    ...item,
    focusLabel: humanize(item.area_of_interest),
    statusMeta,
    statusLabel: statusMeta.label,
    createdDisplay: formatDateTime(item.created_at),
    submittedLabel: formatDate(item.created_at),
    reviewedDisplay: item.reviewed_at ? formatDateTime(item.reviewed_at) : null,
    nextStep: getVolunteerNextStep(item.status)
  };
}

function mapPrayerPartner(item) {
  if (!item) {
    return null;
  }

  const statusMeta = getPrayerPartnerStatusMeta(item.status);
  return {
    ...item,
    focusLabel: humanize(item.prayer_focus),
    frequencyLabel: humanize(item.frequency),
    statusMeta,
    statusLabel: statusMeta.label,
    createdDisplay: formatDateTime(item.created_at)
  };
}

function mapPrayerRequest(item) {
  const statusMeta = getPrayerRequestStatusMeta(item.status);
  return {
    ...item,
    statusMeta,
    statusLabel: statusMeta.label,
    createdDisplay: formatDateTime(item.created_at),
    isPublicLabel: item.is_public ? 'Public request' : 'Private request'
  };
}

function buildProfileForm(userProfile, formData = {}) {
  return {
    name: formData.name ?? userProfile.name ?? '',
    email: userProfile.email ?? '',
    phone: formData.phone ?? userProfile.phone ?? '',
    address: formData.address ?? userProfile.address ?? '',
    city: formData.city ?? userProfile.city ?? '',
    country: formData.country ?? userProfile.country ?? '',
    organizationName: formData.organizationName ?? userProfile.organization_name ?? '',
    preferredContactMethod: formData.preferredContactMethod ?? userProfile.preferred_contact_method ?? 'email'
  };
}

function buildOverviewUpdate(post) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || '',
    category: post.category || 'Updates',
    dateDisplay: formatDate(post.published_at || post.updated_at),
    href: post.slug ? `/blog/${post.slug}` : '/blog'
  };
}

function normalizeQueryFilters(query) {
  return {
    donationStatus: pickAllowedValue(String(query.status || ''), [''].concat(DONATION_STATUSES), ''),
    donationDesignation: pickAllowedValue(String(query.designation || ''), [''].concat(DONATION_DESIGNATIONS), ''),
    sponsorshipStatus: pickAllowedValue(String(query.status || ''), [''].concat(SPONSORSHIP_STATUSES), ''),
    sponsorshipType: pickAllowedValue(String(query.type || ''), [''].concat(SPONSORSHIP_TYPES), '')
  };
}

async function getCurrentUserProfile(userId) {
  return User.findProfileById(userId);
}

exports.index = async (req, res) => {
  const userId = req.session.user.id;
  const userProfile = await getCurrentUserProfile(userId);
  const [donationSummary, sponsorshipSummary, applicationSummary, donations, sponsorships, prayerPartner, updates] = await Promise.all([
    Donation.summaryForUser(userId).catch(() => ({ totalCount: 0, pendingCount: 0, verifiedCount: 0, totalAmount: 0 })),
    SponsorshipInterest.summaryForUser(userId).catch(() => ({ totalCount: 0, activeCount: 0 })),
    VolunteerApplication.summaryForUser(userId).catch(() => ({ totalCount: 0, newCount: 0, reviewingCount: 0, approvedCount: 0 })),
    Donation.findForUser(userId).catch(() => []),
    SponsorshipInterest.findForUser(userId).catch(() => []),
    PrayerPartner.findCurrentForUser({ userId, email: userProfile ? userProfile.email : '' }).catch(() => null),
    BlogPost.findPublished(3).catch(() => [])
  ]);

  const mappedDonations = donations.map(mapDonation);
  const mappedSponsorships = sponsorships.map(mapSponsorship);
  const prayerMeta = mapPrayerPartner(prayerPartner);

  return render(res, 'dashboard/index', {
    title: 'Supporter Dashboard',
    userProfile,
    quickActions: [
      { label: 'Make a Donation', href: '/donate', style: 'btn-sunrise' },
      { label: 'Sponsor or Support', href: '/sponsor', style: 'btn-outline-dark' },
      { label: 'Volunteer', href: '/get-involved#volunteer-interest', style: 'btn-outline-dark' },
      { label: 'Become Prayer Partner', href: '/get-involved#prayer-partner', style: 'btn-outline-dark' }
    ],
    engagementSummary: {
      totalDonationAmount: formatMoney(donationSummary.totalAmount || 0),
      donationsCount: Number(donationSummary.totalCount || 0),
      pendingDonations: Number(donationSummary.pendingCount || 0),
      verifiedDonations: Number(donationSummary.verifiedCount || 0),
      activeSponsorships: Number(sponsorshipSummary.activeCount || 0),
      totalSponsorships: Number(sponsorshipSummary.totalCount || 0),
      applicationCount: Number(applicationSummary.totalCount || 0),
      reviewingApplications: Number(applicationSummary.reviewingCount || 0),
      approvedApplications: Number(applicationSummary.approvedCount || 0)
    },
    prayerPartner: prayerMeta,
    recentDonations: mappedDonations.slice(0, 5),
    recentSponsorships: mappedSponsorships.slice(0, 3),
    latestUpdates: updates.map(buildOverviewUpdate)
  });
};

exports.profile = async (req, res) => {
  const userProfile = await getCurrentUserProfile(req.session.user.id);

  return render(res, 'dashboard/profile', {
    title: 'My Profile',
    userProfile,
    profileForm: buildProfileForm(userProfile, res.locals.formData)
  });
};

exports.updateProfile = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const profileForm = {
    name,
    phone,
    address: String(req.body.address || '').trim(),
    city: String(req.body.city || '').trim(),
    country: String(req.body.country || '').trim(),
    organizationName: String(req.body.organizationName || '').trim(),
    preferredContactMethod: pickAllowedValue(String(req.body.preferredContactMethod || 'email'), ['email', 'phone', 'whatsapp'], 'email')
  };

  if (!name) {
    req.flash('error', 'Please provide your full name.');
    req.flash('formData', JSON.stringify(profileForm));
    return res.redirect('/dashboard/profile');
  }

  if (phone && !isValidPhone(phone)) {
    req.flash('error', 'Please enter a valid phone number or leave the field blank.');
    req.flash('formData', JSON.stringify(profileForm));
    return res.redirect('/dashboard/profile');
  }

  try {
    const updatedUser = await User.updateProfile(req.session.user.id, {
      name,
      phone: normalizeNullable(phone),
      address: normalizeNullable(profileForm.address),
      city: normalizeNullable(profileForm.city),
      country: normalizeNullable(profileForm.country),
      organizationName: normalizeNullable(profileForm.organizationName),
      preferredContactMethod: normalizeNullable(profileForm.preferredContactMethod)
    });

    req.session.user = sessionUserFromRecord(updatedUser);
    await saveSession(req);

    await logAction({
      req,
      action: 'update_profile',
      entityType: 'user',
      entityId: updatedUser.id,
      metadata: { preferredContactMethod: updatedUser.preferred_contact_method || 'email' }
    });

    req.flash('success', 'Your profile has been updated successfully.');
    return res.redirect('/dashboard/profile');
  } catch (error) {
    req.flash('error', `We could not update your profile. ${error.message}`);
    req.flash('formData', JSON.stringify(profileForm));
    return res.redirect('/dashboard/profile');
  }
};

exports.changePasswordForm = (req, res) => render(res, 'dashboard/change-password', {
  title: 'Change Password'
});

exports.changePassword = async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    req.flash('error', 'Please complete all password fields.');
    return res.redirect('/dashboard/change-password');
  }

  if (newPassword.length < 8) {
    req.flash('error', 'Your new password must be at least 8 characters long.');
    return res.redirect('/dashboard/change-password');
  }

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Password confirmation does not match.');
    return res.redirect('/dashboard/change-password');
  }

  const currentUser = await User.findById(req.session.user.id);
  const currentPasswordValid = await User.verifyPassword(currentUser, currentPassword);
  if (!currentPasswordValid) {
    req.flash('error', 'Your current password is incorrect.');
    return res.redirect('/dashboard/change-password');
  }

  await User.updatePassword(currentUser.id, newPassword);
  const refreshedUser = await User.findById(currentUser.id);
  await regenerateWithUser(req, refreshedUser);
  await logAction({
    req,
    action: 'change_password',
    entityType: 'user',
    entityId: refreshedUser.id,
    metadata: {}
  });
  req.flash('success', 'Your password has been changed successfully.');
  return res.redirect('/dashboard/change-password');
};

exports.donations = async (req, res) => {
  const filters = normalizeQueryFilters(req.query);
  const donations = (await Donation.findForUser(req.session.user.id, {
    status: filters.donationStatus,
    designation: filters.donationDesignation
  }).catch(() => [])).map(mapDonation);

  return render(res, 'dashboard/donations', {
    title: 'My Donations',
    donations,
    filters: {
      status: filters.donationStatus,
      designation: filters.donationDesignation
    },
    donationStatuses: DONATION_STATUSES.map((value) => ({ value, label: getDonationStatusMeta(value).label })),
    donationDesignations: DONATION_DESIGNATIONS.map((value) => ({ value, label: humanize(value) }))
  });
};

exports.sponsorships = async (req, res) => {
  const filters = normalizeQueryFilters(req.query);
  const [sponsorships, assignments] = await Promise.all([
    SponsorshipInterest.findForUser(req.session.user.id, {
      status: filters.sponsorshipStatus,
      sponsorshipType: filters.sponsorshipType
    }).catch(() => []),
    getUserAssignments(req.session.user.id).catch(() => [])
  ]);
  const mappedSponsorships = sponsorships.map(mapSponsorship);

  return render(res, 'dashboard/sponsorships', {
    title: 'My Sponsorships',
    sponsorships: mappedSponsorships,
    assignments,
    filters: {
      status: filters.sponsorshipStatus,
      type: filters.sponsorshipType
    },
    sponsorshipStatuses: SPONSORSHIP_STATUSES.map((value) => ({ value, label: getSponsorshipStatusMeta(value).label })),
    sponsorshipTypes: SPONSORSHIP_TYPES.map((value) => ({ value, label: humanize(value) }))
  });
};

exports.viewSponsorshipAssignment = async (req, res) => {
  const assignment = await getOwnedAssignmentDetail(req.params.id, req.session.user.id).catch(() => null);
  if (!assignment) {
    req.flash('error', 'That sponsorship assignment could not be found in your account.');
    return res.redirect('/dashboard/sponsorships');
  }

  return render(res, 'dashboard/sponsorship-assignment-view', {
    title: 'Assigned Sponsorship Details',
    assignment
  });
};

exports.applications = async (req, res) => {
  const applications = (await VolunteerApplication.findForUser(req.session.user.id).catch(() => [])).map(mapApplication);

  return render(res, 'dashboard/applications', {
    title: 'My Applications',
    applications
  });
};

exports.prayer = async (req, res) => {
  const userProfile = await getCurrentUserProfile(req.session.user.id);
  const [partner, requests] = await Promise.all([
    PrayerPartner.findCurrentForUser({ userId: req.session.user.id, email: userProfile ? userProfile.email : '' }).catch(() => null),
    PrayerRequest.findForUserEmail(userProfile ? userProfile.email : '').catch(() => [])
  ]);

  return render(res, 'dashboard/prayer', {
    title: 'Prayer',
    prayerPartner: mapPrayerPartner(partner),
    prayerRequests: requests.map(mapPrayerRequest),
    prayerFocusValues: PRAYER_FOCUS_VALUES.map((value) => ({ value, label: humanize(value) })),
    prayerFrequencyValues: PRAYER_FREQUENCY_VALUES.map((value) => ({ value, label: humanize(value) }))
  });
};

exports.updatePrayerPreferences = async (req, res) => {
  const userProfile = await getCurrentUserProfile(req.session.user.id);
  const partner = await PrayerPartner.findCurrentForUser({ userId: req.session.user.id, email: userProfile ? userProfile.email : '' }).catch(() => null);

  if (!partner) {
    req.flash('error', 'A prayer partner signup could not be found for your account.');
    return res.redirect('/dashboard/prayer');
  }

  const prayerFocus = pickAllowedValue(String(req.body.prayerFocus || ''), PRAYER_FOCUS_VALUES, '');
  const frequency = pickAllowedValue(String(req.body.frequency || ''), PRAYER_FREQUENCY_VALUES, '');

  if (!prayerFocus || !frequency) {
    req.flash('error', 'Please choose both a prayer focus and a frequency.');
    return res.redirect('/dashboard/prayer');
  }

  await PrayerPartner.updateOwnPreferences(partner.id, { prayerFocus, frequency }, {
    userId: req.session.user.id,
    email: userProfile ? userProfile.email : ''
  });

  await logAction({
    req,
    action: 'update_prayer_partner_preferences',
    entityType: 'prayer_partner',
    entityId: partner.id,
    metadata: { prayerFocus, frequency }
  });

  req.flash('success', 'Your prayer partner preferences have been updated.');
  return res.redirect('/dashboard/prayer');
};

exports.messages = async (req, res) => {
  const updates = await BlogPost.findPublished(1).catch(() => []);
  return render(res, 'dashboard/messages', {
    title: 'Messages and Updates',
    latestUpdate: updates[0] ? buildOverviewUpdate(updates[0]) : null
  });
};

exports.viewDonation = async (req, res) => {
  const donation = await Donation.findOwnedById(req.params.id, req.session.user.id).catch(() => null);
  if (!donation) {
    req.flash('error', 'That donation record could not be found in your account.');
    return res.redirect('/dashboard/donations');
  }

  const timeline = await DonationStatusLog.findForDonation(donation.id).catch(() => []);
  const mappedDonation = mapDonation(donation);

  return render(res, 'dashboard/donation-view', {
    title: 'Donation Details',
    donation: mappedDonation,
    timeline: timeline.map((item) => ({
      ...item,
      oldStatusLabel: item.old_status ? humanize(item.old_status) : null,
      newStatusLabel: humanize(item.new_status),
      createdDisplay: formatDateTime(item.created_at)
    }))
  });
};

exports.viewSponsorship = async (req, res) => {
  const sponsorship = await SponsorshipInterest.findOwnedById(req.params.id, req.session.user.id).catch(() => null);
  if (!sponsorship) {
    req.flash('error', 'That sponsorship record could not be found in your account.');
    return res.redirect('/dashboard/sponsorships');
  }

  return render(res, 'dashboard/sponsorship-view', {
    title: 'Sponsorship Details',
    sponsorship: mapSponsorship(sponsorship)
  });
};

exports.viewApplication = async (req, res) => {
  const application = await VolunteerApplication.findOwnedById(req.params.id, req.session.user.id).catch(() => null);
  if (!application) {
    req.flash('error', 'That application could not be found in your account.');
    return res.redirect('/dashboard/applications');
  }

  return render(res, 'dashboard/application-view', {
    title: 'Application Details',
    application: mapApplication(application)
  });
};
