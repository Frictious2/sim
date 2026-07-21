const siteContent = require('../data/site-content');
const ChildProfile = require('../models/ChildProfile');
const SponsorshipProject = require('../models/SponsorshipProject');
const MissionWorker = require('../models/MissionWorker');
const SponsorshipAssignment = require('../models/SponsorshipAssignment');
const ChildUpdate = require('../models/ChildUpdate');
const ProjectUpdate = require('../models/ProjectUpdate');
const MissionWorkerUpdate = require('../models/MissionWorkerUpdate');
const SponsorshipInterest = require('../models/SponsorshipInterest');
const { logAction } = require('../services/auditService');
const { sendTemplatedNotification } = require('../services/notificationService');
const { normalizePage, normalizeLimit, buildPagination } = require('../utils/pagination');
const { normalizeNullable, pickAllowedValue, normalizeAmount } = require('../utils/validation');
const { formatDateTime, truncateText, stripHtml } = require('../utils/formatting');
const { slugify, resolveUniqueSlug } = require('../utils/slug');
const { sanitizeRichHtml } = require('../utils/sanitizeHtml');

const CHILD_STATUSES = ['available', 'sponsored', 'graduated', 'inactive', 'archived'];
const CHILD_GENDERS = ['male', 'female'];
const ASSIGNMENT_TYPES = ['child', 'project', 'mission_worker'];
const ASSIGNMENT_STATUSES = ['active', 'paused', 'completed', 'cancelled'];
const PROJECT_STATUSES = ['active', 'completed', 'archived'];
const WORKER_STATUSES = ['active', 'inactive', 'retired'];
const CHILD_UPDATE_TYPES = ['progress', 'education', 'health', 'general', 'prayer_request'];
const CHILD_UPDATE_VISIBILITY = ['private_sponsor', 'public'];
const UPDATE_VISIBILITY = ['public', 'sponsors_only'];

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/admin',
    section: 'admin',
    content: siteContent,
    ...options
  });
}

function toPrettyLabel(value = '') {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusBadgeClass(status) {
  switch (status) {
    case 'available':
    case 'active':
    case 'public':
    case 'completed':
    case 'graduated':
      return 'text-bg-success-subtle text-success';
    case 'paused':
    case 'inactive':
      return 'text-bg-warning-subtle text-dark';
    case 'cancelled':
    case 'archived':
    case 'retired':
      return 'text-bg-secondary';
    case 'sponsored':
      return 'text-bg-info-subtle text-info';
    default:
      return 'text-bg-light text-dark';
  }
}

function rememberFormData(req) {
  req.flash('formData', JSON.stringify(req.body || {}));
}

function getRememberedFormData(res) {
  return res.locals.formData || {};
}

function mapChildForm(item, remembered = {}) {
  if (!item && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(item || {}),
    first_name: remembered.firstName ?? (item ? item.first_name : ''),
    last_name: remembered.lastName ?? (item ? (item.last_name || '') : ''),
    gender: remembered.gender ?? (item ? item.gender : 'female'),
    date_of_birth: remembered.dateOfBirth ?? (item ? (item.date_of_birth || '') : ''),
    age: remembered.age ?? (item ? (item.age || '') : ''),
    community: remembered.community ?? (item ? item.community : ''),
    district: remembered.district ?? (item ? (item.district || '') : ''),
    school_name: remembered.schoolName ?? (item ? (item.school_name || '') : ''),
    class_level: remembered.classLevel ?? (item ? (item.class_level || '') : ''),
    guardian_name: remembered.guardianName ?? (item ? (item.guardian_name || '') : ''),
    guardian_contact: remembered.guardianContact ?? (item ? (item.guardian_contact || '') : ''),
    biography: remembered.biography ?? (item ? (item.biography || '') : ''),
    profile_image_url: remembered.profileImageUrl ?? (item ? (item.profile_image_url || '') : ''),
    status: remembered.status ?? (item ? item.status : 'available')
  };
}

function mapSponsorshipProjectForm(item, remembered = {}) {
  if (!item && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(item || {}),
    title: remembered.title ?? (item ? item.title : ''),
    slug: remembered.slug ?? (item ? item.slug : ''),
    category: remembered.category ?? (item ? item.category : ''),
    summary: remembered.summary ?? (item ? item.summary : ''),
    description: remembered.description ?? (item ? sanitizeRichHtml(item.description || '') : ''),
    target_amount: remembered.targetAmount ?? (item ? (item.target_amount || '') : ''),
    current_amount: remembered.currentAmount ?? (item ? (item.current_amount || '') : ''),
    image_url: remembered.imageUrl ?? (item ? (item.image_url || '') : ''),
    status: remembered.status ?? (item ? item.status : 'active')
  };
}

function mapMissionWorkerForm(item, remembered = {}) {
  if (!item && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(item || {}),
    first_name: remembered.firstName ?? (item ? item.first_name : ''),
    last_name: remembered.lastName ?? (item ? item.last_name : ''),
    location: remembered.location ?? (item ? item.location : ''),
    ministry_focus: remembered.ministryFocus ?? (item ? item.ministry_focus : ''),
    biography: remembered.biography ?? (item ? (item.biography || '') : ''),
    profile_image_url: remembered.profileImageUrl ?? (item ? (item.profile_image_url || '') : ''),
    support_target: remembered.supportTarget ?? (item ? (item.support_target || '') : ''),
    status: remembered.status ?? (item ? item.status : 'active')
  };
}

function mapAssignmentForm(item, remembered = {}) {
  if (!item && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(item || {}),
    sponsor_user_id: remembered.sponsorUserId ?? (item ? (item.sponsor_user_id || '') : ''),
    sponsorship_interest_id: remembered.sponsorshipInterestId ?? (item ? (item.sponsorship_interest_id || '') : ''),
    assignment_type: remembered.assignmentType ?? (item ? item.assignment_type : 'child'),
    child_id: remembered.childId ?? (item ? (item.child_id || '') : ''),
    project_id: remembered.projectId ?? (item ? (item.project_id || '') : ''),
    mission_worker_id: remembered.missionWorkerId ?? (item ? (item.mission_worker_id || '') : ''),
    status: remembered.status ?? (item ? item.status : 'active'),
    notes: remembered.notes ?? (item ? (item.notes || '') : '')
  };
}

function mapUpdateForm(item, remembered = {}) {
  if (!item && !Object.keys(remembered).length) {
    return null;
  }

  return {
    ...(item || {}),
    title: remembered.title ?? (item ? item.title : ''),
    update_text: remembered.updateText ?? (item ? item.update_text : ''),
    image_url: remembered.imageUrl ?? (item ? (item.image_url || '') : ''),
    update_type: remembered.updateType ?? (item ? (item.update_type || 'general') : 'general'),
    visibility: remembered.visibility ?? (item ? item.visibility : 'public')
  };
}

async function sendAssignmentNotification(assignment, notificationType, templateKey) {
  if (!assignment || !assignment.sponsor_email) {
    return;
  }

  const targetName = assignment.assignment_type === 'child'
    ? assignment.child_first_name
    : (assignment.assignment_type === 'project'
      ? assignment.project_title
      : `${assignment.worker_first_name || ''} ${assignment.worker_last_name || ''}`.trim());

  await sendTemplatedNotification({
    templateKey,
    to: assignment.sponsor_email,
    placeholders: {
      name: assignment.sponsor_name || 'Supporter',
      message: assignment.notes || '',
      status: toPrettyLabel(assignment.status),
      designation: targetName || '',
      site_name: siteContent.brand,
      admin_link: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/sponsorships`
    },
    notificationType,
    relatedEntityType: 'sponsorship_assignment',
    relatedEntityId: assignment.id
  });
}

exports.children = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(CHILD_STATUSES), ''),
    community: String(req.query.community || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await ChildProfile.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });

  return render(res, 'admin/children', {
    title: 'Children Registry',
    children: result.rows.map((item) => ({
      ...item,
      statusLabel: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status),
      createdDisplay: formatDateTime(item.created_at)
    })),
    filters,
    pagination,
    childStatuses: CHILD_STATUSES,
    communities: result.communities || []
  });
};

exports.newChild = (req, res) => render(res, 'admin/child-form', {
  title: 'Create Child Profile',
  formTitle: 'Create Child Profile',
  formAction: '/admin/children',
  child: mapChildForm(null, getRememberedFormData(res)),
  childGenders: CHILD_GENDERS,
  childStatuses: CHILD_STATUSES,
  updateForm: null,
  updates: []
});

exports.createChild = async (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const gender = pickAllowedValue(String(req.body.gender || ''), CHILD_GENDERS, '');
  const community = String(req.body.community || '').trim();
  const status = pickAllowedValue(String(req.body.status || 'available'), CHILD_STATUSES, 'available');

  if (!firstName || !gender || !community) {
    req.flash('error', 'Please provide the child first name, gender, and community.');
    rememberFormData(req);
    return res.redirect('/admin/children/create');
  }

  const child = await ChildProfile.create({
    firstName,
    lastName: normalizeNullable(req.body.lastName),
    gender,
    dateOfBirth: normalizeNullable(req.body.dateOfBirth),
    age: normalizeNullable(req.body.age),
    community,
    district: normalizeNullable(req.body.district),
    schoolName: normalizeNullable(req.body.schoolName),
    classLevel: normalizeNullable(req.body.classLevel),
    guardianName: normalizeNullable(req.body.guardianName),
    guardianContact: normalizeNullable(req.body.guardianContact),
    biography: normalizeNullable(req.body.biography),
    profileImageUrl: normalizeNullable(req.body.profileImageUrl),
    status
  });

  await logAction({ req, action: 'create_child_profile', entityType: 'child_profile', entityId: child.id, metadata: { childCode: child.child_code } });
  req.flash('success', `Child profile ${child.child_code} created successfully.`);
  return res.redirect(`/admin/children/${child.id}/edit`);
};

exports.editChild = async (req, res) => {
  const child = await ChildProfile.findById(req.params.id);
  if (!child) {
    req.flash('error', 'Child profile could not be found.');
    return res.redirect('/admin/children');
  }

  const updateId = req.query.update || '';
  const updates = await ChildUpdate.findForChild(child.id, { includeArchived: true, limit: 50 }).catch(() => []);
  const updateRecord = updateId ? await ChildUpdate.findById(updateId).catch(() => null) : null;

  return render(res, 'admin/child-form', {
    title: 'Edit Child Profile',
    formTitle: `Edit ${child.child_code}`,
    formAction: `/admin/children/${child.id}`,
    child: mapChildForm(child, getRememberedFormData(res)),
    childGenders: CHILD_GENDERS,
    childStatuses: CHILD_STATUSES,
    updates: updates.map((item) => ({
      ...item,
      typeLabel: toPrettyLabel(item.update_type),
      visibilityLabel: toPrettyLabel(item.visibility),
      createdDisplay: formatDateTime(item.created_at)
    })),
    updateForm: mapUpdateForm(updateRecord, getRememberedFormData(res)),
    updateFormAction: updateRecord ? `/admin/children/${child.id}/updates/${updateRecord.id}` : `/admin/children/${child.id}/updates`
  });
};

exports.updateChild = async (req, res) => {
  const child = await ChildProfile.findById(req.params.id);
  if (!child) {
    req.flash('error', 'Child profile could not be found.');
    return res.redirect('/admin/children');
  }

  const firstName = String(req.body.firstName || '').trim();
  const gender = pickAllowedValue(String(req.body.gender || ''), CHILD_GENDERS, '');
  const community = String(req.body.community || '').trim();
  const status = pickAllowedValue(String(req.body.status || child.status), CHILD_STATUSES, child.status);

  if (!firstName || !gender || !community) {
    req.flash('error', 'Please provide the child first name, gender, and community.');
    rememberFormData(req);
    return res.redirect(`/admin/children/${child.id}/edit`);
  }

  await ChildProfile.update(child.id, {
    firstName,
    lastName: normalizeNullable(req.body.lastName),
    gender,
    dateOfBirth: normalizeNullable(req.body.dateOfBirth),
    age: normalizeNullable(req.body.age),
    community,
    district: normalizeNullable(req.body.district),
    schoolName: normalizeNullable(req.body.schoolName),
    classLevel: normalizeNullable(req.body.classLevel),
    guardianName: normalizeNullable(req.body.guardianName),
    guardianContact: normalizeNullable(req.body.guardianContact),
    biography: normalizeNullable(req.body.biography),
    profileImageUrl: normalizeNullable(req.body.profileImageUrl),
    status
  });

  await logAction({ req, action: 'update_child_profile', entityType: 'child_profile', entityId: child.id, metadata: { status } });
  req.flash('success', 'Child profile updated successfully.');
  return res.redirect(`/admin/children/${child.id}/edit`);
};

exports.archiveChild = async (req, res) => {
  const child = await ChildProfile.findById(req.params.id);
  if (!child) {
    req.flash('error', 'Child profile could not be found.');
    return res.redirect('/admin/children');
  }
  await ChildProfile.updateStatus(child.id, 'archived');
  await logAction({ req, action: 'archive_child_profile', entityType: 'child_profile', entityId: child.id, metadata: {} });
  req.flash('success', 'Child profile archived successfully.');
  return res.redirect('/admin/children');
};

exports.createChildUpdate = async (req, res) => {
  const child = await ChildProfile.findById(req.params.id);
  if (!child) {
    req.flash('error', 'Child profile could not be found.');
    return res.redirect('/admin/children');
  }

  const title = String(req.body.title || '').trim();
  const updateType = pickAllowedValue(String(req.body.updateType || 'general'), CHILD_UPDATE_TYPES, 'general');
  const visibility = pickAllowedValue(String(req.body.visibility || 'private_sponsor'), CHILD_UPDATE_VISIBILITY, 'private_sponsor');
  const updateText = String(req.body.updateText || '').trim();

  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/children/${child.id}/edit`);
  }

  const update = await ChildUpdate.create({
    childId: child.id,
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    updateType,
    visibility,
    createdBy: req.session.user.id
  });
  await logAction({ req, action: 'create_child_update', entityType: 'child_update', entityId: update.id, metadata: { childId: child.id } });
  req.flash('success', 'Child update saved successfully.');
  return res.redirect(`/admin/children/${child.id}/edit`);
};

exports.updateChildUpdate = async (req, res) => {
  const child = await ChildProfile.findById(req.params.id);
  const update = await ChildUpdate.findById(req.params.updateId);
  if (!child || !update || Number(update.child_id) !== Number(child.id)) {
    req.flash('error', 'Child update could not be found.');
    return res.redirect('/admin/children');
  }

  const title = String(req.body.title || '').trim();
  const updateType = pickAllowedValue(String(req.body.updateType || update.update_type), CHILD_UPDATE_TYPES, update.update_type);
  const visibility = pickAllowedValue(String(req.body.visibility || update.visibility), CHILD_UPDATE_VISIBILITY, update.visibility);
  const updateText = String(req.body.updateText || '').trim();
  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/children/${child.id}/edit?update=${update.id}`);
  }

  await ChildUpdate.update(update.id, {
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    updateType,
    visibility
  });
  await logAction({ req, action: 'update_child_update', entityType: 'child_update', entityId: update.id, metadata: { childId: child.id } });
  req.flash('success', 'Child update updated successfully.');
  return res.redirect(`/admin/children/${child.id}/edit`);
};

exports.archiveChildUpdate = async (req, res) => {
  const update = await ChildUpdate.findById(req.params.updateId);
  if (!update) {
    req.flash('error', 'Child update could not be found.');
    return res.redirect('/admin/children');
  }
  await ChildUpdate.archive(update.id);
  await logAction({ req, action: 'archive_child_update', entityType: 'child_update', entityId: update.id, metadata: { childId: update.child_id } });
  req.flash('success', 'Child update archived successfully.');
  return res.redirect(`/admin/children/${update.child_id}/edit`);
};

exports.sponsorshipProjects = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(PROJECT_STATUSES), ''),
    category: String(req.query.category || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await SponsorshipProject.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });

  return render(res, 'admin/sponsorship-projects', {
    title: 'Sponsorship Projects',
    projects: result.rows.map((item) => ({
      ...item,
      statusLabel: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status),
      createdDisplay: formatDateTime(item.created_at)
    })),
    filters,
    pagination,
    projectStatuses: PROJECT_STATUSES,
    projectCategories: result.categories || []
  });
};

exports.newSponsorshipProject = (req, res) => render(res, 'admin/sponsorship-project-form', {
  title: 'Create Sponsorship Project',
  formTitle: 'Create Sponsorship Project',
  formAction: '/admin/sponsorship-projects',
  project: mapSponsorshipProjectForm(null, getRememberedFormData(res)),
  projectStatuses: PROJECT_STATUSES,
  updates: [],
  updateForm: null
});

exports.createSponsorshipProject = async (req, res) => {
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || '').trim();
  const summary = String(req.body.summary || '').trim();
  const description = String(req.body.description || '').trim();
  const status = pickAllowedValue(String(req.body.status || 'active'), PROJECT_STATUSES, 'active');

  if (!title || !category || !summary || !description) {
    req.flash('error', 'Please complete the required project fields.');
    rememberFormData(req);
    return res.redirect('/admin/sponsorship-projects/create');
  }

  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => SponsorshipProject.slugExists(candidate));
  const project = await SponsorshipProject.create({
    title,
    slug,
    category,
    summary,
    description: sanitizeRichHtml(description),
    targetAmount: normalizeAmount(req.body.targetAmount),
    currentAmount: normalizeAmount(req.body.currentAmount),
    imageUrl: normalizeNullable(req.body.imageUrl),
    status
  });
  await logAction({ req, action: 'create_sponsorship_project', entityType: 'sponsorship_project', entityId: project.id, metadata: { slug } });
  req.flash('success', 'Sponsorship project created successfully.');
  return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
};

exports.editSponsorshipProject = async (req, res) => {
  const project = await SponsorshipProject.findById(req.params.id);
  if (!project) {
    req.flash('error', 'Sponsorship project could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  const updateId = req.query.update || '';
  const updates = await ProjectUpdate.findForProject(project.id, { includeArchived: true, limit: 50 }).catch(() => []);
  const updateRecord = updateId ? await ProjectUpdate.findById(updateId).catch(() => null) : null;
  return render(res, 'admin/sponsorship-project-form', {
    title: 'Edit Sponsorship Project',
    formTitle: `Edit ${project.title}`,
    formAction: `/admin/sponsorship-projects/${project.id}`,
    project: mapSponsorshipProjectForm(project, getRememberedFormData(res)),
    projectStatuses: PROJECT_STATUSES,
    updates: updates.map((item) => ({
      ...item,
      visibilityLabel: toPrettyLabel(item.visibility),
      createdDisplay: formatDateTime(item.created_at)
    })),
    updateForm: mapUpdateForm(updateRecord, getRememberedFormData(res)),
    updateFormAction: updateRecord ? `/admin/sponsorship-projects/${project.id}/updates/${updateRecord.id}` : `/admin/sponsorship-projects/${project.id}/updates`
  });
};

exports.updateSponsorshipProject = async (req, res) => {
  const project = await SponsorshipProject.findById(req.params.id);
  if (!project) {
    req.flash('error', 'Sponsorship project could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || '').trim();
  const summary = String(req.body.summary || '').trim();
  const description = String(req.body.description || '').trim();
  const status = pickAllowedValue(String(req.body.status || project.status), PROJECT_STATUSES, project.status);
  if (!title || !category || !summary || !description) {
    req.flash('error', 'Please complete the required project fields.');
    rememberFormData(req);
    return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
  }
  const slug = await resolveUniqueSlug(String(req.body.slug || '').trim() || title, (candidate) => SponsorshipProject.slugExists(candidate, project.id));
  await SponsorshipProject.update(project.id, {
    title,
    slug,
    category,
    summary,
    description: sanitizeRichHtml(description),
    targetAmount: normalizeAmount(req.body.targetAmount),
    currentAmount: normalizeAmount(req.body.currentAmount),
    imageUrl: normalizeNullable(req.body.imageUrl),
    status
  });
  await logAction({ req, action: 'update_sponsorship_project', entityType: 'sponsorship_project', entityId: project.id, metadata: { slug, status } });
  req.flash('success', 'Sponsorship project updated successfully.');
  return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
};

exports.archiveSponsorshipProject = async (req, res) => {
  const project = await SponsorshipProject.findById(req.params.id);
  if (!project) {
    req.flash('error', 'Sponsorship project could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  await SponsorshipProject.updateStatus(project.id, 'archived');
  await logAction({ req, action: 'archive_sponsorship_project', entityType: 'sponsorship_project', entityId: project.id, metadata: {} });
  req.flash('success', 'Sponsorship project archived successfully.');
  return res.redirect('/admin/sponsorship-projects');
};

exports.createProjectUpdate = async (req, res) => {
  const project = await SponsorshipProject.findById(req.params.id);
  if (!project) {
    req.flash('error', 'Sponsorship project could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  const title = String(req.body.title || '').trim();
  const updateText = String(req.body.updateText || '').trim();
  const visibility = pickAllowedValue(String(req.body.visibility || 'public'), UPDATE_VISIBILITY, 'public');
  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
  }
  const update = await ProjectUpdate.create({
    projectId: project.id,
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    visibility,
    createdBy: req.session.user.id
  });
  await logAction({ req, action: 'create_project_update', entityType: 'project_update', entityId: update.id, metadata: { projectId: project.id } });
  req.flash('success', 'Project update saved successfully.');
  return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
};

exports.updateProjectUpdate = async (req, res) => {
  const project = await SponsorshipProject.findById(req.params.id);
  const update = await ProjectUpdate.findById(req.params.updateId);
  if (!project || !update || Number(update.project_id) !== Number(project.id)) {
    req.flash('error', 'Project update could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  const title = String(req.body.title || '').trim();
  const updateText = String(req.body.updateText || '').trim();
  const visibility = pickAllowedValue(String(req.body.visibility || update.visibility), UPDATE_VISIBILITY, update.visibility);
  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/sponsorship-projects/${project.id}/edit?update=${update.id}`);
  }
  await ProjectUpdate.update(update.id, {
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    visibility
  });
  await logAction({ req, action: 'update_project_update', entityType: 'project_update', entityId: update.id, metadata: { projectId: project.id } });
  req.flash('success', 'Project update updated successfully.');
  return res.redirect(`/admin/sponsorship-projects/${project.id}/edit`);
};

exports.archiveProjectUpdate = async (req, res) => {
  const update = await ProjectUpdate.findById(req.params.updateId);
  if (!update) {
    req.flash('error', 'Project update could not be found.');
    return res.redirect('/admin/sponsorship-projects');
  }
  await ProjectUpdate.archive(update.id);
  await logAction({ req, action: 'archive_project_update', entityType: 'project_update', entityId: update.id, metadata: { projectId: update.project_id } });
  req.flash('success', 'Project update archived successfully.');
  return res.redirect(`/admin/sponsorship-projects/${update.project_id}/edit`);
};

exports.missionWorkers = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(WORKER_STATUSES), ''),
    location: String(req.query.location || '').trim(),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await MissionWorker.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });

  return render(res, 'admin/mission-workers', {
    title: 'Mission Workers',
    workers: result.rows.map((item) => ({
      ...item,
      statusLabel: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status),
      createdDisplay: formatDateTime(item.created_at)
    })),
    filters,
    pagination,
    workerStatuses: WORKER_STATUSES,
    locations: result.locations || []
  });
};

exports.newMissionWorker = (req, res) => render(res, 'admin/mission-worker-form', {
  title: 'Create Mission Worker',
  formTitle: 'Create Mission Worker',
  formAction: '/admin/mission-workers',
  worker: mapMissionWorkerForm(null, getRememberedFormData(res)),
  workerStatuses: WORKER_STATUSES,
  updates: [],
  updateForm: null
});

exports.createMissionWorker = async (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const location = String(req.body.location || '').trim();
  const ministryFocus = String(req.body.ministryFocus || '').trim();
  const status = pickAllowedValue(String(req.body.status || 'active'), WORKER_STATUSES, 'active');
  if (!firstName || !lastName || !location || !ministryFocus) {
    req.flash('error', 'Please complete the required mission worker fields.');
    rememberFormData(req);
    return res.redirect('/admin/mission-workers/create');
  }
  const worker = await MissionWorker.create({
    firstName,
    lastName,
    location,
    ministryFocus,
    biography: normalizeNullable(req.body.biography),
    profileImageUrl: normalizeNullable(req.body.profileImageUrl),
    supportTarget: normalizeAmount(req.body.supportTarget),
    status
  });
  await logAction({ req, action: 'create_mission_worker', entityType: 'mission_worker', entityId: worker.id, metadata: { workerCode: worker.worker_code } });
  req.flash('success', `Mission worker ${worker.worker_code} created successfully.`);
  return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
};

exports.editMissionWorker = async (req, res) => {
  const worker = await MissionWorker.findById(req.params.id);
  if (!worker) {
    req.flash('error', 'Mission worker could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  const updateId = req.query.update || '';
  const updates = await MissionWorkerUpdate.findForWorker(worker.id, { includeArchived: true, limit: 50 }).catch(() => []);
  const updateRecord = updateId ? await MissionWorkerUpdate.findById(updateId).catch(() => null) : null;
  return render(res, 'admin/mission-worker-form', {
    title: 'Edit Mission Worker',
    formTitle: `Edit ${worker.worker_code}`,
    formAction: `/admin/mission-workers/${worker.id}`,
    worker: mapMissionWorkerForm(worker, getRememberedFormData(res)),
    workerStatuses: WORKER_STATUSES,
    updates: updates.map((item) => ({
      ...item,
      visibilityLabel: toPrettyLabel(item.visibility),
      createdDisplay: formatDateTime(item.created_at)
    })),
    updateForm: mapUpdateForm(updateRecord, getRememberedFormData(res)),
    updateFormAction: updateRecord ? `/admin/mission-workers/${worker.id}/updates/${updateRecord.id}` : `/admin/mission-workers/${worker.id}/updates`
  });
};

exports.updateMissionWorker = async (req, res) => {
  const worker = await MissionWorker.findById(req.params.id);
  if (!worker) {
    req.flash('error', 'Mission worker could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const location = String(req.body.location || '').trim();
  const ministryFocus = String(req.body.ministryFocus || '').trim();
  const status = pickAllowedValue(String(req.body.status || worker.status), WORKER_STATUSES, worker.status);
  if (!firstName || !lastName || !location || !ministryFocus) {
    req.flash('error', 'Please complete the required mission worker fields.');
    rememberFormData(req);
    return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
  }
  await MissionWorker.update(worker.id, {
    firstName,
    lastName,
    location,
    ministryFocus,
    biography: normalizeNullable(req.body.biography),
    profileImageUrl: normalizeNullable(req.body.profileImageUrl),
    supportTarget: normalizeAmount(req.body.supportTarget),
    status
  });
  await logAction({ req, action: 'update_mission_worker', entityType: 'mission_worker', entityId: worker.id, metadata: { status } });
  req.flash('success', 'Mission worker updated successfully.');
  return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
};

exports.archiveMissionWorker = async (req, res) => {
  const worker = await MissionWorker.findById(req.params.id);
  if (!worker) {
    req.flash('error', 'Mission worker could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  await MissionWorker.updateStatus(worker.id, 'retired');
  await logAction({ req, action: 'archive_mission_worker', entityType: 'mission_worker', entityId: worker.id, metadata: {} });
  req.flash('success', 'Mission worker archived successfully.');
  return res.redirect('/admin/mission-workers');
};

exports.createMissionWorkerUpdate = async (req, res) => {
  const worker = await MissionWorker.findById(req.params.id);
  if (!worker) {
    req.flash('error', 'Mission worker could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  const title = String(req.body.title || '').trim();
  const updateText = String(req.body.updateText || '').trim();
  const visibility = pickAllowedValue(String(req.body.visibility || 'public'), UPDATE_VISIBILITY, 'public');
  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
  }
  const update = await MissionWorkerUpdate.create({
    missionWorkerId: worker.id,
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    visibility,
    createdBy: req.session.user.id
  });
  await logAction({ req, action: 'create_mission_worker_update', entityType: 'mission_worker_update', entityId: update.id, metadata: { missionWorkerId: worker.id } });
  req.flash('success', 'Mission worker update saved successfully.');
  return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
};

exports.updateMissionWorkerUpdate = async (req, res) => {
  const worker = await MissionWorker.findById(req.params.id);
  const update = await MissionWorkerUpdate.findById(req.params.updateId);
  if (!worker || !update || Number(update.mission_worker_id) !== Number(worker.id)) {
    req.flash('error', 'Mission worker update could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  const title = String(req.body.title || '').trim();
  const updateText = String(req.body.updateText || '').trim();
  const visibility = pickAllowedValue(String(req.body.visibility || update.visibility), UPDATE_VISIBILITY, update.visibility);
  if (!title || !updateText) {
    req.flash('error', 'Please provide both an update title and update text.');
    rememberFormData(req);
    return res.redirect(`/admin/mission-workers/${worker.id}/edit?update=${update.id}`);
  }
  await MissionWorkerUpdate.update(update.id, {
    title,
    updateText: sanitizeRichHtml(updateText),
    imageUrl: normalizeNullable(req.body.imageUrl),
    visibility
  });
  await logAction({ req, action: 'update_mission_worker_update', entityType: 'mission_worker_update', entityId: update.id, metadata: { missionWorkerId: worker.id } });
  req.flash('success', 'Mission worker update updated successfully.');
  return res.redirect(`/admin/mission-workers/${worker.id}/edit`);
};

exports.archiveMissionWorkerUpdate = async (req, res) => {
  const update = await MissionWorkerUpdate.findById(req.params.updateId);
  if (!update) {
    req.flash('error', 'Mission worker update could not be found.');
    return res.redirect('/admin/mission-workers');
  }
  await MissionWorkerUpdate.archive(update.id);
  await logAction({ req, action: 'archive_mission_worker_update', entityType: 'mission_worker_update', entityId: update.id, metadata: { missionWorkerId: update.mission_worker_id } });
  req.flash('success', 'Mission worker update archived successfully.');
  return res.redirect(`/admin/mission-workers/${update.mission_worker_id}/edit`);
};

exports.sponsorshipAssignments = async (req, res) => {
  const filters = {
    q: String(req.query.q || '').trim(),
    status: pickAllowedValue(String(req.query.status || ''), [''].concat(ASSIGNMENT_STATUSES), ''),
    assignmentType: pickAllowedValue(String(req.query.assignmentType || ''), [''].concat(ASSIGNMENT_TYPES), ''),
    page: normalizePage(req.query.page),
    limit: normalizeLimit(req.query.limit, 10)
  };
  const result = await SponsorshipAssignment.findForAdmin(filters);
  const pagination = buildPagination({ page: filters.page, limit: filters.limit, total: result.total });

  return render(res, 'admin/sponsorship-assignments', {
    title: 'Sponsorship Assignments',
    assignments: result.rows.map((item) => ({
      ...item,
      assignmentTypeLabel: toPrettyLabel(item.assignment_type),
      statusLabel: toPrettyLabel(item.status),
      statusBadgeClass: statusBadgeClass(item.status),
      assignedDisplay: formatDateTime(item.assigned_at),
      targetLabel: item.assignment_type === 'child'
        ? `${item.child_first_name || ''} ${item.child_last_name || ''}`.trim()
        : (item.assignment_type === 'project'
          ? item.project_title
          : `${item.worker_first_name || ''} ${item.worker_last_name || ''}`.trim())
    })),
    filters,
    pagination,
    assignmentStatuses: ASSIGNMENT_STATUSES,
    assignmentTypes: ASSIGNMENT_TYPES
  });
};

exports.newSponsorshipAssignment = async (req, res) => {
  const [children, projects, workers, interests] = await Promise.all([
    ChildProfile.findForAdmin({ page: 1, limit: 200, status: '' }).catch(() => ({ rows: [] })),
    SponsorshipProject.findForAdmin({ page: 1, limit: 200, status: '' }).catch(() => ({ rows: [] })),
    MissionWorker.findForAdmin({ page: 1, limit: 200, status: '' }).catch(() => ({ rows: [] })),
    SponsorshipInterest.findForAdmin({ page: 1, limit: 200, status: '' }).catch(() => ({ rows: [] }))
  ]);

  return render(res, 'admin/sponsorship-assignment-form', {
    title: 'Create Sponsorship Assignment',
    formTitle: 'Create Sponsorship Assignment',
    formAction: '/admin/sponsorship-assignments',
    assignment: mapAssignmentForm(null, getRememberedFormData(res)),
    assignmentStatuses: ASSIGNMENT_STATUSES,
    assignmentTypes: ASSIGNMENT_TYPES,
    childOptions: children.rows,
    projectOptions: projects.rows,
    workerOptions: workers.rows,
    interestOptions: interests.rows
  });
};

exports.createSponsorshipAssignment = async (req, res) => {
  const interestId = normalizeNullable(req.body.sponsorshipInterestId);
  const assignmentType = pickAllowedValue(String(req.body.assignmentType || 'child'), ASSIGNMENT_TYPES, 'child');
  const status = pickAllowedValue(String(req.body.status || 'active'), ASSIGNMENT_STATUSES, 'active');

  let sponsorUserId = normalizeNullable(req.body.sponsorUserId);
  let interest = null;
  if (interestId) {
    interest = await SponsorshipInterest.findById(interestId);
    if (!interest) {
      req.flash('error', 'Selected sponsorship interest could not be found.');
      rememberFormData(req);
      return res.redirect('/admin/sponsorship-assignments/create');
    }
    sponsorUserId = sponsorUserId || interest.user_id || null;
  }

  if (!sponsorUserId) {
    req.flash('error', 'Please provide a sponsor user ID or choose a sponsorship interest connected to a registered user.');
    rememberFormData(req);
    return res.redirect('/admin/sponsorship-assignments/create');
  }

  const childId = assignmentType === 'child' ? normalizeNullable(req.body.childId) : null;
  const projectId = assignmentType === 'project' ? normalizeNullable(req.body.projectId) : null;
  const missionWorkerId = assignmentType === 'mission_worker' ? normalizeNullable(req.body.missionWorkerId) : null;
  if (!(childId || projectId || missionWorkerId)) {
    req.flash('error', 'Please select a sponsorship target.');
    rememberFormData(req);
    return res.redirect('/admin/sponsorship-assignments/create');
  }

  const assignment = await SponsorshipAssignment.create({
    sponsorUserId,
    sponsorshipInterestId: interestId,
    assignmentType,
    childId,
    projectId,
    missionWorkerId,
    assignedBy: req.session.user.id,
    status,
    notes: normalizeNullable(req.body.notes)
  });

  await logAction({ req, action: 'create_assignment', entityType: 'sponsorship_assignment', entityId: assignment.id, metadata: { assignmentType, status } });
  await sendAssignmentNotification(assignment, 'assignment_created_user', 'assignment_created_user');
  req.flash('success', 'Sponsorship assignment created successfully.');
  return res.redirect(`/admin/sponsorship-assignments/${assignment.id}`);
};

exports.viewSponsorshipAssignment = async (req, res) => {
  const assignment = await SponsorshipAssignment.findById(req.params.id);
  if (!assignment) {
    req.flash('error', 'Sponsorship assignment could not be found.');
    return res.redirect('/admin/sponsorship-assignments');
  }

  let updates = [];
  if (assignment.assignment_type === 'child' && assignment.child_id) {
    updates = await ChildUpdate.findForChild(assignment.child_id, { includeArchived: false, limit: 10 }).catch(() => []);
  } else if (assignment.assignment_type === 'project' && assignment.project_id) {
    updates = await ProjectUpdate.findForProject(assignment.project_id, { includeArchived: false, limit: 10 }).catch(() => []);
  } else if (assignment.assignment_type === 'mission_worker' && assignment.mission_worker_id) {
    updates = await MissionWorkerUpdate.findForWorker(assignment.mission_worker_id, { includeArchived: false, limit: 10 }).catch(() => []);
  }

  return render(res, 'admin/sponsorship-assignment-view', {
    title: 'Sponsorship Assignment Details',
    assignment: {
      ...assignment,
      assignmentTypeLabel: toPrettyLabel(assignment.assignment_type),
      statusLabel: toPrettyLabel(assignment.status),
      statusBadgeClass: statusBadgeClass(assignment.status),
      assignedDisplay: formatDateTime(assignment.assigned_at),
      targetLabel: assignment.assignment_type === 'child'
        ? `${assignment.child_first_name || ''} ${assignment.child_last_name || ''}`.trim()
        : (assignment.assignment_type === 'project'
          ? assignment.project_title
          : `${assignment.worker_first_name || ''} ${assignment.worker_last_name || ''}`.trim())
    },
    assignmentStatuses: ASSIGNMENT_STATUSES,
    updates: updates.map((item) => ({
      ...item,
      createdDisplay: formatDateTime(item.created_at),
      visibilityLabel: toPrettyLabel(item.visibility),
      summary: truncateText(stripHtml(item.update_text), 140)
    }))
  });
};

exports.updateSponsorshipAssignmentStatus = async (req, res) => {
  const assignment = await SponsorshipAssignment.findById(req.params.id);
  if (!assignment) {
    req.flash('error', 'Sponsorship assignment could not be found.');
    return res.redirect('/admin/sponsorship-assignments');
  }

  const status = pickAllowedValue(String(req.body.status || assignment.status), ASSIGNMENT_STATUSES, assignment.status);
  const notes = normalizeNullable(req.body.notes);
  const updated = await SponsorshipAssignment.updateStatus(assignment.id, { status, notes });
  await logAction({ req, action: 'update_assignment', entityType: 'sponsorship_assignment', entityId: assignment.id, metadata: { status } });
  await sendAssignmentNotification(updated, 'assignment_status_changed_user', 'assignment_status_changed_user');
  req.flash('success', 'Assignment status updated successfully.');
  return res.redirect(`/admin/sponsorship-assignments/${assignment.id}`);
};
