const { closePool } = require('../config/database');
const Page = require('../models/Page');
const HomepageSection = require('../models/HomepageSection');
const BlogPost = require('../models/BlogPost');
const Project = require('../models/Project');
const Testimony = require('../models/Testimony');
const GalleryItem = require('../models/GalleryItem');
const User = require('../models/User');
const SiteSetting = require('../models/SiteSetting');
const EmailTemplate = require('../models/EmailTemplate');

const homepageSections = [
  {
    sectionKey: 'hero',
    title: 'Reaching Interior Communities With the Gospel and Transforming Lives',
    subtitle: 'Evangelism, discipleship, church planting, child support, and community transformation across Sierra Leone.',
    content: JSON.stringify({
      trust: 'Partnering with churches, donors, volunteers, and local communities.',
      stats: [
        { value: '25+', label: 'Communities Reached' },
        { value: '150+', label: 'Children Supported' },
        { value: '40+', label: 'Mission Workers Trained' }
      ],
      secondaryButtonLabel: 'Sponsor a Child',
      secondaryButtonUrl: '/sponsor'
    }),
    buttonLabel: 'Donate Now',
    buttonUrl: '/donate',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 10,
    isActive: 1
  },
  {
    sectionKey: 'intro',
    title: 'Who We Are',
    subtitle: 'A Christ-centered ministry walking with interior communities through prayer, local partnership, and long-term presence.',
    content: JSON.stringify({
      body: 'Salone Interior Missions exists to strengthen churches, encourage leaders, support children, and serve overlooked communities with the hope of Christ.',
      ctaLabel: 'Learn About SIM',
      ctaUrl: '/about'
    }),
    buttonLabel: 'Learn About SIM',
    buttonUrl: '/about',
    imageUrl: null,
    sortOrder: 20,
    isActive: 1
  },
  {
    sectionKey: 'impact_band',
    title: 'Visible impact across the field',
    subtitle: 'A growing story of outreach, support, and discipleship.',
    content: JSON.stringify([
      { value: '25+', label: 'Interior Communities Reached' },
      { value: '150+', label: 'Children and Families Supported' },
      { value: '40+', label: 'Mission Volunteers and Workers' },
      { value: '12+', label: 'Outreach Programs Completed' }
    ]),
    sortOrder: 30,
    isActive: 1
  },
  {
    sectionKey: 'partnership_cta',
    title: 'Pray, give, volunteer, and partner in what God is doing.',
    subtitle: 'Join a mission story shaped by Gospel witness, compassionate care, and long-term community transformation.',
    content: 'Prayer and partnership remain at the heart of every outreach, sponsorship, and discipleship effort.',
    buttonLabel: 'Become a Prayer Partner',
    buttonUrl: '/get-involved',
    sortOrder: 40,
    isActive: 1
  },
  {
    sectionKey: 'newsletter',
    title: 'Stay close to the stories, prayers, and ministry milestones.',
    subtitle: 'Receive warm, mission-focused updates from Salone Interior Missions.',
    content: 'We will only send ministry updates, testimonies, and prayer opportunities.',
    buttonLabel: 'Join the Newsletter',
    buttonUrl: '/newsletter/subscribe',
    sortOrder: 50,
    isActive: 1
  }
];

const pages = [
  {
    title: 'About Salone Interior Missions',
    slug: 'about',
    subtitle: 'A Christ-centered ministry serving Sierra Leone’s interior communities with Gospel hope and practical compassion.',
    body: 'Salone Interior Missions exists to proclaim Christ, disciple believers, strengthen churches, and serve communities through long-term local partnership.',
    metaTitle: 'About SIM',
    metaDescription: 'Learn about the story, mission, vision, and values behind Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Mission and Vision',
    slug: 'mission',
    subtitle: 'A Gospel-rooted mission for spiritual renewal, strong churches, and transformed communities.',
    body: 'We long to see interior communities transformed by the love of Christ through thriving churches, equipped leaders, supported children, and resilient families.',
    metaTitle: 'Mission and Vision',
    metaDescription: 'Explore the theological and organizational mission of Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Mission Fields',
    slug: 'mission-fields',
    subtitle: 'Where the ministry serves and how the work is taking shape across interior communities.',
    body: 'Salone Interior Missions serves in communities where spiritual hunger and practical needs often meet. Each field is a story of Gospel outreach, pastoral care, and long-term transformation.',
    metaTitle: 'Mission Fields',
    metaDescription: 'Explore the regions, needs, and ministry activities that shape the mission fields of Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Get Involved',
    slug: 'get-involved',
    subtitle: 'Choose a way to participate in the mission through prayer, giving, service, and partnership.',
    body: 'From prayer and child sponsorship to church partnerships and volunteer interest, there are many meaningful ways to walk with Salone Interior Missions.',
    metaTitle: 'Get Involved',
    metaDescription: 'Discover how to give, pray, volunteer, sponsor, or partner with Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Donate',
    slug: 'donate',
    subtitle: 'Give with confidence to support Gospel witness, practical compassion, and community renewal.',
    body: 'Every gift helps carry the Gospel, strengthen churches, support children, and serve communities in Sierra Leone through prayerful, accountable ministry.',
    metaTitle: 'Donate to SIM',
    metaDescription: 'Support Salone Interior Missions through simple, trustworthy giving that advances outreach, discipleship, and community care.',
    status: 'published'
  },
  {
    title: 'Sponsor',
    slug: 'sponsor',
    subtitle: 'Sponsor a child, project, or mission worker through prayerful partnership and practical care.',
    body: 'Sponsorship helps connect generous partners with children, mission workers, and field priorities that need steady encouragement, support, and prayer.',
    metaTitle: 'Sponsor with SIM',
    metaDescription: 'Explore child, project, and mission worker sponsorship opportunities with Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Projects',
    slug: 'projects',
    subtitle: 'Explore active mission programs supporting evangelism, discipleship, sponsorship, and community transformation.',
    body: 'Projects help supporters understand the field priorities currently shaping ministry across Sierra Leone interior communities.',
    metaTitle: 'SIM Projects',
    metaDescription: 'Explore active Salone Interior Missions projects and programs.',
    status: 'published'
  },
  {
    title: 'Blog',
    slug: 'blog',
    subtitle: 'Read ministry updates, stories, reflections, and field reports from Salone Interior Missions.',
    body: 'The blog shares ministry milestones, field reflections, prayer needs, and stories of Gospel-centered transformation.',
    metaTitle: 'SIM Blog',
    metaDescription: 'Read ministry updates and stories from Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Stories',
    slug: 'stories',
    subtitle: 'Stories and testimonies of prayer, hope, discipleship, sponsorship, and community renewal.',
    body: 'These stories help partners see how prayer, generosity, and local mission presence touch real people and communities.',
    metaTitle: 'SIM Stories',
    metaDescription: 'Read testimonies and stories from Salone Interior Missions.',
    status: 'published'
  },
  {
    title: 'Gallery',
    slug: 'gallery',
    subtitle: 'View moments from outreach, discipleship, child support, church gatherings, and community care.',
    body: 'The gallery provides a visual window into the ministry work, relationships, and field moments across SIM communities.',
    metaTitle: 'SIM Gallery',
    metaDescription: 'View photos from Salone Interior Missions outreach and community ministry.',
    status: 'published'
  },
  {
    title: 'Contact',
    slug: 'contact',
    subtitle: 'Reach out for donation support, partnership, volunteering, prayer, or general ministry inquiries.',
    body: 'Whether you are a visitor, donor, sponsor, volunteer, church, or ministry partner, the SIM team is ready to hear from you and respond with care.',
    metaTitle: 'Contact SIM',
    metaDescription: 'Contact Salone Interior Missions for support, partnership, volunteering, prayer, or sponsorship inquiries.',
    status: 'published'
  },
  {
    title: 'Stay close to the mission through prayer, giving, and partnership.',
    slug: 'login',
    subtitle: 'Log in to access your supporter dashboard, follow your giving journey, and stay connected to the story of what God is doing through Salone Interior Missions.',
    body: 'Your dashboard helps keep your partnership organized as the platform grows with donor, sponsor, volunteer, and prayer partner tools.',
    metaTitle: 'Login',
    metaDescription: 'Log in to your Salone Interior Missions supporter dashboard.',
    status: 'published'
  },
  {
    title: 'Create your account and begin your partnership journey.',
    slug: 'register',
    subtitle: 'Register as a donor, sponsor, volunteer, or ministry partner to stay connected with the work of Salone Interior Missions in a personal and organized way.',
    body: 'A supporter account helps you follow your giving, sponsorship, prayer, and volunteer engagement as SIM continues to expand the platform.',
    metaTitle: 'Register',
    metaDescription: 'Create a Salone Interior Missions supporter account.',
    status: 'published'
  }
];

const siteSettings = [
  { settingKey: 'site_name', settingValue: 'Salone Interior Missions Platform', settingGroup: 'general' },
  { settingKey: 'contact_email', settingValue: 'hello@saloneinteriormissions.org', settingGroup: 'contact' },
  { settingKey: 'contact_phone', settingValue: '+232 70 000000', settingGroup: 'contact' },
  { settingKey: 'office_address', settingValue: 'Freetown, Sierra Leone', settingGroup: 'contact' },
  { settingKey: 'facebook_url', settingValue: '#', settingGroup: 'social' },
  { settingKey: 'youtube_url', settingValue: '#', settingGroup: 'social' },
  { settingKey: 'whatsapp_number', settingValue: '+23270000000', settingGroup: 'social' },
  { settingKey: 'logo_url', settingValue: '', settingGroup: 'branding' },
  { settingKey: 'favicon_url', settingValue: '', settingGroup: 'branding' },
  { settingKey: 'default_meta_title', settingValue: 'Salone Interior Missions Platform', settingGroup: 'seo' },
  { settingKey: 'default_meta_description', settingValue: 'A warm, trustworthy digital home for ministry engagement, storytelling, and community transformation in Sierra Leone.', settingGroup: 'seo' }
];

const phase4EmailTemplates = [
  {
    templateKey: 'assignment_created_user',
    name: 'Sponsorship Assignment Created',
    subject: 'Your SIM sponsorship assignment is ready',
    htmlBody: '<p>Dear {{name}},</p><p>We are grateful for your partnership with Salone Interior Missions. A sponsorship assignment has now been prepared for <strong>{{designation}}</strong>.</p><p>{{message}}</p><p>You can review your dashboard for updates and prayer points.</p><p>Blessings,<br>{{site_name}}</p>',
    textBody: 'Dear {{name}},\n\nThank you for your partnership with Salone Interior Missions. A sponsorship assignment has now been prepared for {{designation}}.\n\n{{message}}\n\nYou can review your dashboard for updates and prayer points.\n\nBlessings,\n{{site_name}}',
    isActive: true
  },
  {
    templateKey: 'assignment_status_changed_user',
    name: 'Sponsorship Assignment Status Updated',
    subject: 'An update on your SIM sponsorship assignment',
    htmlBody: '<p>Dear {{name}},</p><p>Your sponsorship assignment for <strong>{{designation}}</strong> is now marked as <strong>{{status}}</strong>.</p><p>{{message}}</p><p>You can log in to your dashboard for the latest ministry updates.</p><p>Blessings,<br>{{site_name}}</p>',
    textBody: 'Dear {{name}},\n\nYour sponsorship assignment for {{designation}} is now marked as {{status}}.\n\n{{message}}\n\nYou can log in to your dashboard for the latest ministry updates.\n\nBlessings,\n{{site_name}}',
    isActive: true
  }
];

const blogPosts = [
  {
    title: 'Why Mission Partnership Must Feel Personal',
    slug: 'featured-post',
    excerpt: 'Healthy mission support grows where stewardship, prayer, and local ownership meet.',
    body: 'Mission partnership is strongest when it feels close enough to carry real names, real burdens, and real stories. For Salone Interior Missions, generosity is part of shared obedience and long-term trust.',
    featuredImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',
    category: 'Mission Strategy',
    status: 'published',
    publishedAt: '2026-04-18 09:00:00'
  },
  {
    title: 'A Literacy Club That Became a Discipleship Space',
    slug: 'literacy-club-discipleship-space',
    excerpt: 'What started as reading support became a trusted gathering place for children and families.',
    body: 'In one interior community, a simple reading circle slowly became a place where children learned, caregivers felt seen, and prayer became part of the weekly rhythm.',
    featuredImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80',
    category: 'Education',
    status: 'published',
    publishedAt: '2026-04-12 09:00:00'
  },
  {
    title: 'Supporting Pastors Beyond the Conference Stage',
    slug: 'supporting-pastors-beyond-the-conference-stage',
    excerpt: 'Sustainable encouragement often looks like small, steady investments in relationships and resources.',
    body: 'Pastor support in Sierra Leone is rarely about one event. It grows through follow-up, friendship, resources, prayer, and the confidence that leaders are not serving alone.',
    featuredImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
    category: 'Leadership',
    status: 'published',
    publishedAt: '2026-03-29 09:00:00'
  }
];

const projects = [
  {
    title: 'Sponsor a Child',
    slug: 'sponsor-a-child',
    summary: 'Support education, encouragement, and practical care for children in vulnerable interior communities.',
    description: 'This program helps create a stronger support path for children through education, care coordination, prayer support, and local ministry presence.',
    location: 'Kono District',
    category: 'Child Sponsorship',
    status: 'active',
    featuredImage: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
    progressLabel: 'Most needed right now',
    isFeatured: 1
  },
  {
    title: 'Rural Evangelism Outreach',
    slug: 'rural-evangelism-outreach',
    summary: 'Equip local evangelists to reach villages with Gospel witness, prayer, and follow-up discipleship.',
    description: 'The outreach network supports transport, Scripture resources, field coordination, and pastoral follow-up in underserved communities.',
    location: 'Northern Region',
    category: 'Outreach',
    status: 'active',
    featuredImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    progressLabel: 'Field ministry underway',
    isFeatured: 1
  },
  {
    title: 'Leadership and Discipleship Training',
    slug: 'leadership-and-discipleship-training',
    summary: 'Strengthen pastors, evangelists, and emerging leaders through biblical formation and mentoring.',
    description: 'This program supports gatherings, teaching materials, pastoral encouragement, and mentoring pathways for rural church leaders.',
    location: 'Bo District',
    category: 'Training',
    status: 'active',
    featuredImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    progressLabel: 'Training cohorts open',
    isFeatured: 1
  },
  {
    title: 'Community Support Projects',
    slug: 'community-support-projects',
    summary: 'Help families through literacy support, women empowerment, mercy outreach, and practical care.',
    description: 'Community support projects combine prayer, practical care, literacy, and family strengthening to help communities flourish with dignity.',
    location: 'Eastern Region',
    category: 'Community Care',
    status: 'active',
    featuredImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    progressLabel: 'Community partnerships growing',
    isFeatured: 1
  }
];

const testimonies = [
  {
    name: 'Mariama K.',
    location: 'Kono District',
    quote: 'The children came back smiling. What looked like a small reopening became a sign that hope had not left our community.',
    story: 'A simple learning space reopened and became a place of prayer, encouragement, and renewed confidence for children and caregivers.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    isFeatured: 1
  },
  {
    name: 'Pastor Sorie T.',
    location: 'Northern Province',
    quote: 'The leadership gatherings have refreshed pastors who often serve in isolation.',
    story: 'Pastoral encouragement in the field is often quiet and steady. For many rural leaders, even a small fellowship gathering becomes a deep source of strength.',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    isFeatured: 1
  },
  {
    name: 'Hawa B.',
    location: 'Bo District',
    quote: 'Sponsorship became more than funding. It opened a relationship of prayer, dignity, and steady encouragement for our family.',
    story: 'Support reached one child, but its effects were felt across the whole household through encouragement, school continuity, and renewed confidence.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    isFeatured: 1
  }
];

const galleryItems = [
  {
    title: 'Village outreach prayer gathering',
    caption: 'Prayer and Scripture sharing with local families in an interior community.',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    category: 'Outreach',
    status: 'published',
    sortOrder: 10
  },
  {
    title: 'Children in a reading circle',
    caption: 'A literacy club that also became a discipleship and care space.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    category: 'Children',
    status: 'published',
    sortOrder: 20
  },
  {
    title: 'Pastors workshop session',
    caption: 'Rural leaders gathering for training, prayer, and mutual encouragement.',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    category: 'Church Planting',
    status: 'published',
    sortOrder: 30
  },
  {
    title: 'Women gathering for skills training',
    caption: 'Community support that strengthens households and builds resilience.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    category: 'Community Support',
    status: 'published',
    sortOrder: 40
  }
];

const emailTemplates = [
  {
    templateKey: 'donation_submitted_user',
    name: 'Donation Submitted - Donor Acknowledgement',
    subject: 'Thank you for your donation submission to {{site_name}}',
    htmlBody: '<p>Dear {{name}},</p><p>Thank you for submitting your donation of {{currency}} {{amount}} toward {{designation}}.</p><p>Our team will review your payment details and confirm your donation shortly.</p><p>Blessings,<br>{{site_name}}</p>',
    textBody: 'Dear {{name}},\n\nThank you for submitting your donation of {{currency}} {{amount}} toward {{designation}}.\nOur team will review your payment details and confirm your donation shortly.\n\nBlessings,\n{{site_name}}',
    isActive: true
  },
  {
    templateKey: 'donation_submitted_admin',
    name: 'Donation Submitted - Admin Alert',
    subject: 'New donation submission received',
    htmlBody: '<p>A new donation submission has been received from {{name}} for {{currency}} {{amount}}.</p><p>Designation: {{designation}}</p><p>Review it here: {{admin_link}}</p>',
    textBody: 'A new donation submission has been received from {{name}} for {{currency}} {{amount}}.\nDesignation: {{designation}}\nReview it here: {{admin_link}}',
    isActive: true
  },
  {
    templateKey: 'donation_verified_user',
    name: 'Donation Verified - Donor Notification',
    subject: 'Your donation has been verified',
    htmlBody: '<p>Dear {{name}},</p><p>Your donation has been verified successfully.</p><p>Receipt number: {{receipt_number}}</p><p>Thank you for partnering with {{site_name}}.</p>',
    textBody: 'Dear {{name}},\n\nYour donation has been verified successfully.\nReceipt number: {{receipt_number}}\n\nThank you for partnering with {{site_name}}.',
    isActive: true
  },
  {
    templateKey: 'donation_rejected_user',
    name: 'Donation Rejected - Donor Notification',
    subject: 'Your donation submission needs attention',
    htmlBody: '<p>Dear {{name}},</p><p>We could not verify your donation submission at this time.</p><p>Status: {{status}}</p><p>Message: {{message}}</p><p>Please contact us if you would like help resolving it.</p>',
    textBody: 'Dear {{name}},\n\nWe could not verify your donation submission at this time.\nStatus: {{status}}\nMessage: {{message}}\n\nPlease contact us if you would like help resolving it.',
    isActive: true
  },
  {
    templateKey: 'sponsorship_interest_user',
    name: 'Sponsorship Interest - User Acknowledgement',
    subject: 'We received your sponsorship interest',
    htmlBody: '<p>Dear {{name}},</p><p>Thank you for your interest in sponsorship with {{site_name}}.</p><p>Our team will follow up with you soon.</p>',
    textBody: 'Dear {{name}},\n\nThank you for your interest in sponsorship with {{site_name}}.\nOur team will follow up with you soon.',
    isActive: true
  },
  {
    templateKey: 'sponsorship_interest_admin',
    name: 'Sponsorship Interest - Admin Alert',
    subject: 'New sponsorship interest received',
    htmlBody: '<p>A new sponsorship interest has been submitted by {{name}}.</p><p>Review it here: {{admin_link}}</p>',
    textBody: 'A new sponsorship interest has been submitted by {{name}}.\nReview it here: {{admin_link}}',
    isActive: true
  },
  {
    templateKey: 'volunteer_application_user',
    name: 'Volunteer Application - User Acknowledgement',
    subject: 'We received your volunteer application',
    htmlBody: '<p>Dear {{name}},</p><p>Thank you for offering to serve with {{site_name}}.</p><p>We will review your application and follow up with you.</p>',
    textBody: 'Dear {{name}},\n\nThank you for offering to serve with {{site_name}}.\nWe will review your application and follow up with you.',
    isActive: true
  },
  {
    templateKey: 'volunteer_application_admin',
    name: 'Volunteer Application - Admin Alert',
    subject: 'New volunteer application received',
    htmlBody: '<p>A new volunteer application has been submitted by {{name}}.</p><p>Review it here: {{admin_link}}</p>',
    textBody: 'A new volunteer application has been submitted by {{name}}.\nReview it here: {{admin_link}}',
    isActive: true
  },
  {
    templateKey: 'prayer_partner_user',
    name: 'Prayer Partner - User Acknowledgement',
    subject: 'Thank you for becoming a prayer partner',
    htmlBody: '<p>Dear {{name}},</p><p>Thank you for joining {{site_name}} as a prayer partner.</p><p>Your chosen prayer focus is {{designation}}.</p>',
    textBody: 'Dear {{name}},\n\nThank you for joining {{site_name}} as a prayer partner.\nYour chosen prayer focus is {{designation}}.',
    isActive: true
  },
  {
    templateKey: 'prayer_request_user',
    name: 'Prayer Request - User Acknowledgement',
    subject: 'We received your prayer request',
    htmlBody: '<p>Dear {{name}},</p><p>Thank you for sharing your prayer request with {{site_name}}.</p><p>We are grateful to stand with you in prayer.</p>',
    textBody: 'Dear {{name}},\n\nThank you for sharing your prayer request with {{site_name}}.\nWe are grateful to stand with you in prayer.',
    isActive: true
  },
  {
    templateKey: 'contact_message_admin',
    name: 'Contact Message - Admin Alert',
    subject: 'New contact message received',
    htmlBody: '<p>A new contact message has been submitted by {{name}}.</p><p>Message: {{message}}</p><p>Review it here: {{admin_link}}</p>',
    textBody: 'A new contact message has been submitted by {{name}}.\nMessage: {{message}}\nReview it here: {{admin_link}}',
    isActive: true
  }
];

async function seedHomepageSections() {
  for (const section of homepageSections) {
    const existing = await HomepageSection.findBySectionKey(section.sectionKey);
    if (!existing) {
      await HomepageSection.create(section);
    }
  }
}

async function seedPages(adminUserId) {
  for (const page of pages) {
    const existing = await Page.findBySlug(page.slug);
    const payload = {
      ...page,
      createdBy: adminUserId,
      updatedBy: adminUserId
    };
    if (!existing) {
      await Page.create(payload);
    }
  }
}

async function seedBlogPosts(adminUserId) {
  const existingItems = await BlogPost.findAll();
  for (const post of blogPosts) {
    const existing = (await BlogPost.findBySlug(post.slug)) || existingItems.find((entry) => entry.title === post.title);
    const payload = {
      ...post,
      authorId: adminUserId
    };
    if (!existing) {
      await BlogPost.create(payload);
    }
  }
}

async function seedProjects() {
  const existingItems = await Project.findAll();
  for (const item of projects) {
    const existing = (await Project.findBySlug(item.slug)) || existingItems.find((entry) => entry.title === item.title);
    if (!existing) {
      await Project.create(item);
    }
  }
}

async function seedTestimonies() {
  const existingItems = await Testimony.findAll();
  for (const item of testimonies) {
    const existing = existingItems.find((entry) => entry.name === item.name && entry.quote === item.quote);
    if (!existing) {
      await Testimony.create(item);
    }
  }
}

async function seedGalleryItems() {
  const existingItems = await GalleryItem.findAll();
  for (const item of galleryItems) {
    const existing = existingItems.find((entry) => entry.title === item.title);
    if (!existing) {
      await GalleryItem.create(item);
    }
  }
}

async function seedSiteSettings() {
  for (const item of siteSettings) {
    const existing = await SiteSetting.findByKey(item.settingKey);
    if (!existing) {
      await SiteSetting.upsert(item.settingKey, item.settingValue, item.settingGroup || null);
    }
  }
}

async function seedEmailTemplates() {
  for (const item of emailTemplates.concat(phase4EmailTemplates)) {
    await EmailTemplate.upsert(item);
  }
}

(async () => {
  try {
    let adminUserId = null;
    const adminUser = await User.findFirstAdmin();
    if (adminUser) {
      adminUserId = adminUser.id;
    }

    await seedHomepageSections();
    await seedPages(adminUserId);
    await seedBlogPosts(adminUserId);
    await seedProjects();
    await seedTestimonies();
    await seedGalleryItems();
    await seedSiteSettings();
    await seedEmailTemplates();

    console.log('CMS seed completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('CMS seed failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();

