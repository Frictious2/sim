const siteContent = require('../data/site-content');
const ChildProfile = require('../models/ChildProfile');
const SponsorshipProject = require('../models/SponsorshipProject');
const MissionWorker = require('../models/MissionWorker');
const SponsorshipAssignment = require('../models/SponsorshipAssignment');
const ChildUpdate = require('../models/ChildUpdate');
const ProjectUpdate = require('../models/ProjectUpdate');
const MissionWorkerUpdate = require('../models/MissionWorkerUpdate');
const { truncateText, stripHtml, formatDateTime } = require('../utils/formatting');
const { humanize } = require('../utils/engagementStatus');

function buildFallbackCatalog() {
  return {
    children: (siteContent.sponsorCatalogChildren || []).map((item) => ({ ...item, href: '#interest-form' })),
    projects: (siteContent.sponsorCatalogProjects || []).map((item) => ({ ...item, href: '#interest-form' })),
    workers: (siteContent.sponsorCatalogWorkers || []).map((item) => ({ ...item, href: '#interest-form' }))
  };
}

function mapChild(item) {
  return {
    id: item.id,
    name: `${item.first_name}${item.last_name ? ` ${item.last_name.charAt(0)}.` : ''}`,
    firstName: item.first_name,
    age: item.age,
    community: item.community,
    district: item.district,
    biography: truncateText(stripHtml(item.biography || ''), 140),
    image: item.profile_image_url,
    status: item.status,
    href: '#interest-form'
  };
}

function mapProject(item) {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    summary: item.summary,
    image: item.image_url,
    status: item.status,
    href: '#interest-form'
  };
}

function mapWorker(item) {
  return {
    id: item.id,
    name: `${item.first_name} ${item.last_name}`,
    location: item.location,
    ministryFocus: item.ministry_focus,
    biography: truncateText(stripHtml(item.biography || ''), 140),
    image: item.profile_image_url,
    status: item.status,
    href: '#interest-form'
  };
}

async function getPublicSponsorCatalog() {
  const fallback = buildFallbackCatalog();

  try {
    const [children, projects, workers] = await Promise.all([
      ChildProfile.findAvailable(12),
      SponsorshipProject.findAvailable(8),
      MissionWorker.findAvailable(8)
    ]);

    return {
      children: children.length ? children.map(mapChild) : fallback.children,
      projects: projects.length ? projects.map(mapProject) : fallback.projects,
      workers: workers.length ? workers.map(mapWorker) : fallback.workers
    };
  } catch (error) {
    return fallback;
  }
}

function mapAssignmentTarget(item) {
  if (item.assignment_type === 'child') {
    return {
      title: item.child_first_name || 'Child Assignment',
      subtitle: item.child_community || '',
      image: item.child_image_url || '',
      typeLabel: 'Child Sponsorship'
    };
  }

  if (item.assignment_type === 'project') {
    return {
      title: item.project_title || 'Project Assignment',
      subtitle: item.project_category || '',
      image: item.project_image_url || '',
      typeLabel: 'Project Sponsorship'
    };
  }

  return {
    title: `${item.worker_first_name || ''} ${item.worker_last_name || ''}`.trim() || 'Mission Worker Assignment',
    subtitle: item.worker_location || '',
    image: item.worker_image_url || '',
    typeLabel: 'Mission Worker Support'
  };
}

async function getLatestAssignmentUpdate(item) {
  if (item.assignment_type === 'child' && item.child_id) {
    const update = await ChildUpdate.latestForChild(item.child_id).catch(() => null);
    return update ? {
      title: update.title,
      summary: truncateText(stripHtml(update.update_text), 120),
      visibility: humanize(update.visibility),
      createdDisplay: formatDateTime(update.created_at)
    } : null;
  }

  if (item.assignment_type === 'project' && item.project_id) {
    const update = await ProjectUpdate.latestForProject(item.project_id).catch(() => null);
    return update ? {
      title: update.title,
      summary: truncateText(stripHtml(update.update_text), 120),
      visibility: humanize(update.visibility),
      createdDisplay: formatDateTime(update.created_at)
    } : null;
  }

  if (item.assignment_type === 'mission_worker' && item.mission_worker_id) {
    const update = await MissionWorkerUpdate.latestForWorker(item.mission_worker_id).catch(() => null);
    return update ? {
      title: update.title,
      summary: truncateText(stripHtml(update.update_text), 120),
      visibility: humanize(update.visibility),
      createdDisplay: formatDateTime(update.created_at)
    } : null;
  }

  return null;
}

async function getUserAssignments(userId) {
  const assignments = await SponsorshipAssignment.findForUser(userId).catch(() => []);
  const enriched = await Promise.all(assignments.map(async (item) => ({
    ...item,
    target: mapAssignmentTarget(item),
    latestUpdate: await getLatestAssignmentUpdate(item),
    assignmentDateDisplay: formatDateTime(item.assigned_at),
    statusLabel: humanize(item.status)
  })));
  return enriched;
}

async function getOwnedAssignmentDetail(id, userId) {
  const assignment = await SponsorshipAssignment.findOwnedById(id, userId).catch(() => null);
  if (!assignment) {
    return null;
  }

  let updates = [];
  if (assignment.assignment_type === 'child' && assignment.child_id) {
    updates = await ChildUpdate.findForChild(assignment.child_id, { includeArchived: false, limit: 10 }).catch(() => []);
  } else if (assignment.assignment_type === 'project' && assignment.project_id) {
    updates = await ProjectUpdate.findForProject(assignment.project_id, { includeArchived: false, limit: 10 }).catch(() => []);
  } else if (assignment.assignment_type === 'mission_worker' && assignment.mission_worker_id) {
    updates = await MissionWorkerUpdate.findForWorker(assignment.mission_worker_id, { includeArchived: false, limit: 10 }).catch(() => []);
  }

  return {
    ...assignment,
    target: mapAssignmentTarget(assignment),
    statusLabel: humanize(assignment.status),
    assignmentDateDisplay: formatDateTime(assignment.assigned_at),
    updates: updates.map((item) => ({
      ...item,
      visibilityLabel: humanize(item.visibility),
      typeLabel: item.update_type ? humanize(item.update_type) : '',
      createdDisplay: formatDateTime(item.created_at)
    }))
  };
}

module.exports = {
  getPublicSponsorCatalog,
  getUserAssignments,
  getOwnedAssignmentDetail
};
