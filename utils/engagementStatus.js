function humanize(value = '') {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildStatusMeta(config, value, fallbackKey) {
  const key = value && config[value] ? value : fallbackKey;
  return {
    key,
    label: config[key].label,
    badgeClass: config[key].badgeClass,
    description: config[key].description
  };
}

const donationStatuses = {
  pending: {
    label: 'Pending Review',
    badgeClass: 'text-bg-warning-subtle text-dark',
    description: 'Your donation submission has been received and is waiting for SIM staff to verify the details.'
  },
  verified: {
    label: 'Verified',
    badgeClass: 'text-bg-success-subtle text-success',
    description: 'Your donation has been verified and a receipt is available for your records.'
  },
  rejected: {
    label: 'Needs Attention',
    badgeClass: 'text-bg-danger-subtle text-danger',
    description: 'The SIM team could not verify this donation yet. Review the note and reach out if you need support.'
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'text-bg-secondary-subtle text-secondary',
    description: 'This donation was cancelled in the current workflow.'
  }
};

const sponsorshipStatuses = {
  new: {
    label: 'New Interest',
    badgeClass: 'text-bg-warning-subtle text-dark',
    description: 'Your sponsorship interest has been received and is waiting for supporter-care follow-up.'
  },
  contacted: {
    label: 'Contacted',
    badgeClass: 'text-bg-info-subtle text-info',
    description: 'The SIM team has started the follow-up conversation with you.'
  },
  approved: {
    label: 'Approved',
    badgeClass: 'text-bg-success-subtle text-success',
    description: 'Your sponsorship interest has been approved and is ready for the next steps.'
  },
  rejected: {
    label: 'Closed',
    badgeClass: 'text-bg-danger-subtle text-danger',
    description: 'This sponsorship request was closed in the current workflow.'
  },
  archived: {
    label: 'Archived',
    badgeClass: 'text-bg-secondary-subtle text-secondary',
    description: 'This sponsorship interest has been archived for record-keeping.'
  }
};

const volunteerStatuses = {
  new: {
    label: 'New Application',
    badgeClass: 'text-bg-warning-subtle text-dark',
    description: 'Your volunteer application has been received and is waiting for review.'
  },
  reviewing: {
    label: 'Reviewing',
    badgeClass: 'text-bg-info-subtle text-info',
    description: 'The SIM team is currently reviewing your volunteer application.'
  },
  approved: {
    label: 'Approved',
    badgeClass: 'text-bg-success-subtle text-success',
    description: 'Your application has been approved. The team will follow up with next steps.'
  },
  rejected: {
    label: 'Closed',
    badgeClass: 'text-bg-danger-subtle text-danger',
    description: 'This application was reviewed and closed in the current workflow.'
  },
  archived: {
    label: 'Archived',
    badgeClass: 'text-bg-secondary-subtle text-secondary',
    description: 'This volunteer application has been archived for record-keeping.'
  }
};

const prayerPartnerStatuses = {
  active: {
    label: 'Active',
    badgeClass: 'text-bg-success-subtle text-success',
    description: 'You are actively receiving prayer partnership touchpoints from SIM.'
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'text-bg-warning-subtle text-dark',
    description: 'Your prayer partnership is currently paused.'
  },
  unsubscribed: {
    label: 'Unsubscribed',
    badgeClass: 'text-bg-secondary-subtle text-secondary',
    description: 'You are no longer on the active prayer partner list.'
  }
};

const prayerRequestStatuses = {
  new: {
    label: 'New Request',
    badgeClass: 'text-bg-warning-subtle text-dark',
    description: 'Your prayer request has been received.'
  },
  reviewed: {
    label: 'Reviewed',
    badgeClass: 'text-bg-info-subtle text-info',
    description: 'Your prayer request has been reviewed by the team.'
  },
  prayed: {
    label: 'Prayed For',
    badgeClass: 'text-bg-success-subtle text-success',
    description: 'Your prayer request has been prayed for and noted by the team.'
  },
  archived: {
    label: 'Archived',
    badgeClass: 'text-bg-secondary-subtle text-secondary',
    description: 'This prayer request has been archived.'
  }
};

function getDonationStatusMeta(status) {
  return buildStatusMeta(donationStatuses, status, 'pending');
}

function getSponsorshipStatusMeta(status) {
  return buildStatusMeta(sponsorshipStatuses, status, 'new');
}

function getVolunteerStatusMeta(status) {
  return buildStatusMeta(volunteerStatuses, status, 'new');
}

function getPrayerPartnerStatusMeta(status) {
  return buildStatusMeta(prayerPartnerStatuses, status, 'active');
}

function getPrayerRequestStatusMeta(status) {
  return buildStatusMeta(prayerRequestStatuses, status, 'new');
}

function getDonationNextStep(status) {
  switch (status) {
    case 'verified':
      return 'Your receipt is ready. You can download it now or submit another gift.';
    case 'rejected':
      return 'Review the note on this donation and contact the SIM team if you would like help correcting it.';
    case 'cancelled':
      return 'If this was cancelled by mistake, you can submit a new donation record.';
    default:
      return 'The SIM team is reviewing your payment reference and proof file. No action is needed unless we contact you.';
  }
}

function getSponsorshipNextStep(status) {
  switch (status) {
    case 'approved':
      return 'Your sponsorship interest is approved. Expect a follow-up from the team to confirm the next step.';
    case 'contacted':
      return 'A team member has started follow-up. Watch for a message from SIM soon.';
    case 'rejected':
      return 'This request was closed for now, but you can submit another sponsorship interest at any time.';
    case 'archived':
      return 'This record is archived for your history. Submit a new interest if you would like to restart the conversation.';
    default:
      return 'Your sponsorship interest is waiting for supporter-care review.';
  }
}

function getVolunteerNextStep(status) {
  switch (status) {
    case 'approved':
      return 'Your application has been approved. The SIM team will follow up with service details and next steps.';
    case 'rejected':
      return 'This application was closed for now. You are still welcome to express interest again later.';
    case 'reviewing':
      return 'Your application is currently under review by the SIM team.';
    case 'archived':
      return 'This application has been archived in the current workflow.';
    default:
      return 'Awaiting review from the SIM team.';
  }
}

module.exports = {
  humanize,
  getDonationStatusMeta,
  getDonationNextStep,
  getSponsorshipStatusMeta,
  getSponsorshipNextStep,
  getVolunteerStatusMeta,
  getVolunteerNextStep,
  getPrayerPartnerStatusMeta,
  getPrayerRequestStatusMeta
};
