CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'donor', 'sponsor', 'volunteer', 'partner') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_role_index (role),
  KEY users_status_index (status),
  KEY users_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY password_resets_email_index (email),
  KEY password_resets_token_index (token),
  KEY password_resets_expires_at_index (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  organization_name VARCHAR(190) NULL,
  preferred_contact_method VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_profiles_user_id_unique (user_id),
  KEY user_profiles_city_index (city),
  KEY user_profiles_country_index (country),
  CONSTRAINT user_profiles_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(190) NOT NULL,
  entity_type VARCHAR(120) NULL,
  entity_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_logs_user_id_index (user_id),
  KEY audit_logs_action_index (action),
  KEY audit_logs_entity_lookup_index (entity_type, entity_id),
  KEY audit_logs_created_at_index (created_at),
  CONSTRAINT audit_logs_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  subtitle VARCHAR(255) NULL,
  body LONGTEXT NULL,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY pages_slug_unique (slug),
  KEY pages_status_index (status),
  KEY pages_created_by_index (created_by),
  KEY pages_updated_by_index (updated_by),
  CONSTRAINT pages_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT pages_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS homepage_sections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_key VARCHAR(120) NOT NULL,
  title VARCHAR(190) NULL,
  subtitle VARCHAR(255) NULL,
  content LONGTEXT NULL,
  button_label VARCHAR(120) NULL,
  button_url VARCHAR(255) NULL,
  image_url VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY homepage_sections_section_key_unique (section_key),
  KEY homepage_sections_sort_order_index (sort_order),
  KEY homepage_sections_is_active_index (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  excerpt TEXT NULL,
  body LONGTEXT NOT NULL,
  featured_image VARCHAR(255) NULL,
  category VARCHAR(120) NULL,
  meta_title VARCHAR(190) NULL,
  meta_description VARCHAR(255) NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  author_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY blog_posts_slug_unique (slug),
  KEY blog_posts_status_index (status),
  KEY blog_posts_category_index (category),
  KEY blog_posts_published_at_index (published_at),
  KEY blog_posts_author_id_index (author_id),
  CONSTRAINT blog_posts_author_id_foreign FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  summary TEXT NULL,
  description LONGTEXT NULL,
  location VARCHAR(190) NULL,
  category VARCHAR(120) NULL,
  meta_title VARCHAR(190) NULL,
  meta_description VARCHAR(255) NULL,
  status ENUM('planned', 'active', 'completed', 'paused') NOT NULL DEFAULT 'planned',
  featured_image VARCHAR(255) NULL,
  progress_label VARCHAR(120) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY projects_slug_unique (slug),
  KEY projects_status_index (status),
  KEY projects_category_index (category),
  KEY projects_is_featured_index (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  location VARCHAR(190) NULL,
  quote TEXT NOT NULL,
  story LONGTEXT NULL,
  image_url VARCHAR(255) NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY testimonies_status_index (status),
  KEY testimonies_is_featured_index (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  caption TEXT NULL,
  image_url VARCHAR(255) NOT NULL,
  category VARCHAR(120) NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY gallery_items_category_index (category),
  KEY gallery_items_status_index (status),
  KEY gallery_items_sort_order_index (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NULL,
  subject VARCHAR(190) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY contact_messages_email_index (email),
  KEY contact_messages_status_index (status),
  KEY contact_messages_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(190) NULL,
  status ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
  source VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY newsletter_subscribers_email_unique (email),
  KEY newsletter_subscribers_status_index (status),
  KEY newsletter_subscribers_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_library (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NULL,
  alt_text VARCHAR(255) NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NULL,
  filepath VARCHAR(255) NOT NULL,
  public_url VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  usage_type VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY media_library_uploaded_by_index (uploaded_by),
  KEY media_library_mime_type_index (mime_type),
  KEY media_library_usage_type_index (usage_type),
  KEY media_library_created_at_index (created_at),
  CONSTRAINT media_library_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(190) NOT NULL,
  setting_value LONGTEXT NULL,
  setting_group VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY site_settings_setting_key_unique (setting_key),
  KEY site_settings_setting_group_index (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS children_profiles (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsorship_projects (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mission_workers (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsorship_assignments (
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
  KEY sponsorship_assignments_assigned_at_index (assigned_at),
  KEY sponsorship_assignments_sponsor_status_index (sponsor_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_updates (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_updates (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mission_worker_updates (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  donor_name VARCHAR(190) NOT NULL,
  donor_email VARCHAR(190) NOT NULL,
  donor_phone VARCHAR(50) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NLe',
  donation_type ENUM('one_time', 'monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'one_time',
  designation ENUM('general_mission', 'child_sponsorship', 'outreach', 'church_planting', 'community_support', 'other') NOT NULL DEFAULT 'general_mission',
  payment_method ENUM('mobile_money', 'bank_transfer', 'cash', 'other') NOT NULL DEFAULT 'other',
  payment_reference VARCHAR(190) NULL,
  proof_file_url VARCHAR(255) NULL,
  message TEXT NULL,
  status ENUM('pending', 'verified', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  verified_by BIGINT UNSIGNED NULL,
  verified_at DATETIME NULL,
  rejection_reason TEXT NULL,
  receipt_number VARCHAR(32) NULL,
  receipt_generated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY donations_user_id_index (user_id),
  KEY donations_email_index (donor_email),
  KEY donations_status_index (status),
  KEY donations_designation_index (designation),
  KEY donations_payment_method_index (payment_method),
  KEY donations_verified_by_index (verified_by),
  KEY donations_created_at_index (created_at),
  UNIQUE KEY donations_receipt_number_unique (receipt_number),
  CONSTRAINT donations_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT donations_verified_by_foreign FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donation_status_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  note TEXT NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY donation_status_logs_donation_id_index (donation_id),
  KEY donation_status_logs_changed_by_index (changed_by),
  KEY donation_status_logs_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsorship_interests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  sponsor_name VARCHAR(190) NOT NULL,
  sponsor_email VARCHAR(190) NOT NULL,
  sponsor_phone VARCHAR(50) NULL,
  sponsorship_type ENUM('child', 'project', 'mission_worker', 'general') NOT NULL DEFAULT 'child',
  preferred_plan ENUM('monthly', 'quarterly', 'annual', 'one_time') NOT NULL DEFAULT 'monthly',
  amount DECIMAL(12,2) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NLe',
  preferred_contact_method VARCHAR(50) NULL,
  message TEXT NULL,
  status ENUM('new', 'contacted', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'new',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  admin_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY sponsorship_interests_user_id_index (user_id),
  KEY sponsorship_interests_email_index (sponsor_email),
  KEY sponsorship_interests_status_index (status),
  KEY sponsorship_interests_type_index (sponsorship_type),
  KEY sponsorship_interests_plan_index (preferred_plan),
  KEY sponsorship_interests_reviewed_by_index (reviewed_by),
  KEY sponsorship_interests_created_at_index (created_at),
  CONSTRAINT sponsorship_interests_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT sponsorship_interests_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NULL,
  location VARCHAR(190) NULL,
  area_of_interest ENUM('field_outreach', 'children_ministry', 'media', 'administration', 'prayer', 'training', 'other') NOT NULL DEFAULT 'other',
  availability VARCHAR(190) NULL,
  experience TEXT NULL,
  motivation TEXT NULL,
  status ENUM('new', 'reviewing', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'new',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  admin_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY volunteer_applications_user_id_index (user_id),
  KEY volunteer_applications_email_index (email),
  KEY volunteer_applications_status_index (status),
  KEY volunteer_applications_interest_index (area_of_interest),
  KEY volunteer_applications_reviewed_by_index (reviewed_by),
  KEY volunteer_applications_created_at_index (created_at),
  CONSTRAINT volunteer_applications_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT volunteer_applications_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prayer_partners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NULL,
  prayer_focus ENUM('general', 'mission_fields', 'children', 'volunteers', 'church_planting', 'community_support') NOT NULL DEFAULT 'general',
  frequency ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'weekly',
  status ENUM('active', 'inactive', 'unsubscribed') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY prayer_partners_user_id_index (user_id),
  KEY prayer_partners_email_index (email),
  KEY prayer_partners_focus_index (prayer_focus),
  KEY prayer_partners_status_index (status),
  KEY prayer_partners_created_at_index (created_at),
  CONSTRAINT prayer_partners_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prayer_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NULL,
  email VARCHAR(190) NULL,
  request_text TEXT NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('new', 'reviewed', 'prayed', 'archived') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY prayer_requests_email_index (email),
  KEY prayer_requests_status_index (status),
  KEY prayer_requests_public_index (is_public),
  KEY prayer_requests_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS engagement_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type ENUM('sponsorship_interest', 'volunteer_application', 'prayer_request') NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY engagement_notes_entity_lookup_index (entity_type, entity_id),
  KEY engagement_notes_created_by_index (created_by),
  KEY engagement_notes_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  template_key VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_body LONGTEXT NOT NULL,
  text_body LONGTEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email_templates_template_key_unique (template_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  notification_type VARCHAR(150) NOT NULL,
  related_entity_type VARCHAR(100) NULL,
  related_entity_id BIGINT UNSIGNED NULL,
  status ENUM('skipped', 'sent', 'failed') NOT NULL DEFAULT 'skipped',
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY notification_logs_status_index (status),
  KEY notification_logs_type_index (notification_type),
  KEY notification_logs_related_lookup_index (related_entity_type, related_entity_id),
  KEY notification_logs_created_at_index (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
