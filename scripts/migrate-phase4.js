const { getPool, closePool } = require('../config/database');

async function tableExists(tableName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return Boolean(rows[0] && Number(rows[0].total) > 0);
}

async function ensureColumn(tableName, columnName, definition) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  if (!rows[0] || Number(rows[0].total) === 0) {
    await getPool().query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureIndex(tableName, indexName, statement) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tableName, indexName]
  );

  if (!rows[0] || Number(rows[0].total) === 0) {
    await getPool().query(statement);
  }
}

async function createChildrenProfiles() {
  if (!(await tableExists('children_profiles'))) {
    await getPool().query(`
      CREATE TABLE children_profiles (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        child_code VARCHAR(20) NOT NULL,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NULL,
        gender ENUM('male','female') NOT NULL,
        date_of_birth DATE NULL,
        age INT NULL,
        community VARCHAR(150) NOT NULL,
        district VARCHAR(150) NULL,
        school_name VARCHAR(180) NULL,
        class_level VARCHAR(120) NULL,
        guardian_name VARCHAR(180) NULL,
        guardian_contact VARCHAR(120) NULL,
        biography TEXT NULL,
        profile_image_url VARCHAR(255) NULL,
        status ENUM('available','sponsored','graduated','inactive','archived') NOT NULL DEFAULT 'available',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY children_profiles_child_code_unique (child_code),
        KEY children_profiles_status_index (status),
        KEY children_profiles_community_index (community),
        KEY children_profiles_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function createSponsorshipProjects() {
  if (!(await tableExists('sponsorship_projects'))) {
    await getPool().query(`
      CREATE TABLE sponsorship_projects (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        slug VARCHAR(180) NOT NULL,
        category VARCHAR(120) NOT NULL,
        summary TEXT NOT NULL,
        description LONGTEXT NOT NULL,
        target_amount DECIMAL(12,2) NULL,
        current_amount DECIMAL(12,2) NULL,
        image_url VARCHAR(255) NULL,
        status ENUM('active','completed','archived') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY sponsorship_projects_slug_unique (slug),
        KEY sponsorship_projects_status_index (status),
        KEY sponsorship_projects_category_index (category),
        KEY sponsorship_projects_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function createMissionWorkers() {
  if (!(await tableExists('mission_workers'))) {
    await getPool().query(`
      CREATE TABLE mission_workers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        worker_code VARCHAR(20) NOT NULL,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        location VARCHAR(180) NOT NULL,
        ministry_focus VARCHAR(180) NOT NULL,
        biography TEXT NULL,
        profile_image_url VARCHAR(255) NULL,
        support_target DECIMAL(12,2) NULL,
        status ENUM('active','inactive','retired') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY mission_workers_worker_code_unique (worker_code),
        KEY mission_workers_status_index (status),
        KEY mission_workers_location_index (location),
        KEY mission_workers_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function createSponsorshipAssignments() {
  if (!(await tableExists('sponsorship_assignments'))) {
    await getPool().query(`
      CREATE TABLE sponsorship_assignments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        sponsor_user_id BIGINT UNSIGNED NULL,
        sponsorship_interest_id BIGINT UNSIGNED NULL,
        assignment_type ENUM('child','project','mission_worker') NOT NULL,
        child_id BIGINT UNSIGNED NULL,
        project_id BIGINT UNSIGNED NULL,
        mission_worker_id BIGINT UNSIGNED NULL,
        assigned_by BIGINT UNSIGNED NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY sponsorship_assignments_sponsor_index (sponsor_user_id),
        KEY sponsorship_assignments_interest_index (sponsorship_interest_id),
        KEY sponsorship_assignments_type_index (assignment_type),
        KEY sponsorship_assignments_status_index (status),
        KEY sponsorship_assignments_child_index (child_id),
        KEY sponsorship_assignments_project_index (project_id),
        KEY sponsorship_assignments_worker_index (mission_worker_id),
        KEY sponsorship_assignments_assigned_at_index (assigned_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function createChildUpdates() {
  if (!(await tableExists('child_updates'))) {
    await getPool().query(`
      CREATE TABLE child_updates (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        child_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(180) NOT NULL,
        update_text LONGTEXT NOT NULL,
        image_url VARCHAR(255) NULL,
        update_type ENUM('progress','education','health','general','prayer_request') NOT NULL DEFAULT 'general',
        visibility ENUM('private_sponsor','public') NOT NULL DEFAULT 'private_sponsor',
        created_by BIGINT UNSIGNED NULL,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY child_updates_child_index (child_id),
        KEY child_updates_visibility_index (visibility),
        KEY child_updates_archived_index (is_archived),
        KEY child_updates_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } else {
    await ensureColumn('child_updates', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
  }
}

async function createProjectUpdates() {
  if (!(await tableExists('project_updates'))) {
    await getPool().query(`
      CREATE TABLE project_updates (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        project_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(180) NOT NULL,
        update_text LONGTEXT NOT NULL,
        image_url VARCHAR(255) NULL,
        visibility ENUM('public','sponsors_only') NOT NULL DEFAULT 'public',
        created_by BIGINT UNSIGNED NULL,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY project_updates_project_index (project_id),
        KEY project_updates_visibility_index (visibility),
        KEY project_updates_archived_index (is_archived),
        KEY project_updates_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } else {
    await ensureColumn('project_updates', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
  }
}

async function createMissionWorkerUpdates() {
  if (!(await tableExists('mission_worker_updates'))) {
    await getPool().query(`
      CREATE TABLE mission_worker_updates (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        mission_worker_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(180) NOT NULL,
        update_text LONGTEXT NOT NULL,
        image_url VARCHAR(255) NULL,
        visibility ENUM('public','sponsors_only') NOT NULL DEFAULT 'public',
        created_by BIGINT UNSIGNED NULL,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY mission_worker_updates_worker_index (mission_worker_id),
        KEY mission_worker_updates_visibility_index (visibility),
        KEY mission_worker_updates_archived_index (is_archived),
        KEY mission_worker_updates_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } else {
    await ensureColumn('mission_worker_updates', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
  }
}

(async () => {
  try {
    await createChildrenProfiles();
    await createSponsorshipProjects();
    await createMissionWorkers();
    await createSponsorshipAssignments();
    await createChildUpdates();
    await createProjectUpdates();
    await createMissionWorkerUpdates();
    await ensureIndex('sponsorship_assignments', 'sponsorship_assignments_sponsor_status_index', 'ALTER TABLE sponsorship_assignments ADD KEY sponsorship_assignments_sponsor_status_index (sponsor_user_id, status)');

    console.log('Phase 4 sponsorship migration completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Phase 4 sponsorship migration failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
