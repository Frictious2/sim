const publicNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Mission', href: '/mission' },
  { label: 'Mission Fields', href: '/mission-fields' },
  { label: 'Projects', href: '/projects' },
  { label: 'Get Involved', href: '/get-involved' },
  { label: 'Sponsor', href: '/sponsor' },
  { label: 'Blog', href: '/blog' },
  { label: 'Stories', href: '/stories' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
  { label: 'Donate', href: '/donate' }
];

const dashboardNav = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'My Profile', href: '/dashboard/profile' },
  { label: 'My Donations', href: '/dashboard/donations' },
  { label: 'My Sponsorships', href: '/dashboard/sponsorships' },
  { label: 'My Applications', href: '/dashboard/applications' },
  { label: 'Prayer', href: '/dashboard/prayer' },
  { label: 'Messages and Updates', href: '/dashboard/messages' }
];

const adminNav = [
  { label: 'Overview', href: '/admin' },
  { label: 'Manage Users', href: '/admin/users' },
  { label: 'Manage Donations', href: '/admin/donations' },
  { label: 'Manage Sponsorships', href: '/admin/sponsorships' },
  { label: 'Children Registry', href: '/admin/children' },
  { label: 'Sponsorship Projects', href: '/admin/sponsorship-projects' },
  { label: 'Mission Workers', href: '/admin/mission-workers' },
  { label: 'Sponsorship Assignments', href: '/admin/sponsorship-assignments' },
  { label: 'Volunteer Applications', href: '/admin/volunteers' },
  { label: 'Prayer and Partners', href: '/admin/prayer' },
  { label: 'Media Library', href: '/admin/media' },
  { label: 'Manage Blog Posts', href: '/admin/blog-posts' },
  { label: 'Projects and Programs', href: '/admin/projects' },
  { label: 'Manage Gallery', href: '/admin/gallery' },
  { label: 'Manage Testimonies', href: '/admin/testimonies' },
  { label: 'Editable Pages', href: '/admin/pages' },
  { label: 'Contact Messages', href: '/admin/messages' },
  { label: 'Homepage Content', href: '/admin/homepage-content' },
  { label: 'Email Templates', href: '/admin/email-templates' },
  { label: 'Notification Logs', href: '/admin/notification-logs' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Audit Logs', href: '/admin/audit-logs' }
];

module.exports = {
  brand: 'Salone Interior Missions Platform',
  contactEmail: 'hello@saloneinteriormissions.org',
  contactPhone: '+232 70 000000',
  officeAddress: 'Freetown, Sierra Leone',
  facebookUrl: '#',
  youtubeUrl: '#',
  whatsappNumber: '+23270000000',
  defaultMetaTitle: 'Salone Interior Missions Platform',
  defaultMetaDescription: 'A warm, trustworthy digital home for ministry engagement, storytelling, and community transformation in Sierra Leone.',
  publicNav,
  dashboardNav,
  adminNav,
  homeHero: {
    title: 'Reaching Interior Communities With the Gospel and Transforming Lives',
    text: 'Salone Interior Missions serves Sierra Leone through evangelism, discipleship, church planting, child support, leadership development, and practical community transformation rooted in Christ-centered partnership.',
    primary: { label: 'Donate Now', href: '/donate' },
    secondary: { label: 'Sponsor a Child', href: '/sponsor' },
    trust: 'Partnering with churches, donors, volunteers, and local communities.'
  },
  homeHeroStats: [
    { value: '25+', label: 'Communities Reached' },
    { value: '150+', label: 'Children Supported' },
    { value: '40+', label: 'Mission Workers Trained' }
  ],
  homeImpactBand: [
    { value: '25+', label: 'Interior Communities Reached' },
    { value: '150+', label: 'Children and Families Supported' },
    { value: '40+', label: 'Mission Volunteers and Workers' },
    { value: '12+', label: 'Outreach Programs Completed' }
  ],
  homePrograms: [
    {
      title: 'Sponsor a Child',
      description: 'Support education, encouragement, and practical care for children in vulnerable interior communities.',
      badge: 'Most Needed',
      href: '/sponsor'
    },
    {
      title: 'Rural Evangelism Outreach',
      description: 'Equip field teams to reach villages with Gospel witness, prayer, and follow-up discipleship.',
      badge: 'Field Ministry',
      href: '/projects'
    },
    {
      title: 'Leadership and Discipleship Training',
      description: 'Strengthen pastors, evangelists, and emerging leaders through biblical formation and mentoring.',
      badge: 'Training',
      href: '/mission'
    },
    {
      title: 'Community Support Projects',
      description: 'Help families through literacy support, women empowerment, mercy outreach, and practical care.',
      badge: 'Community Care',
      href: '/projects'
    }
  ],
  cta: {
    title: 'Partner in gospel witness and community renewal.',
    text: 'Support discipleship, sponsorship, education, relief, and local leadership across Sierra Leone through prayerful, practical generosity.',
    primary: { label: 'Give to the Mission', href: '/donate' },
    secondary: { label: 'Become a Sponsor', href: '/sponsor' }
  },
  newsletter: {
    title: 'Stay close to the stories, prayers, and ministry milestones.',
    text: 'A simple newsletter module for future mission updates, testimonies, and opportunities to pray or serve.',
    placeholder: 'Enter your email address',
    button: 'Join the Newsletter'
  },
  impactStats: [
    { value: '42+', label: 'Communities reached' },
    { value: '680', label: 'Children receiving support' },
    { value: '18', label: 'Local ministry partners' },
    { value: '120', label: 'Volunteer team members' }
  ],
  ministryFields: [
    {
      title: 'Evangelism and Church Planting',
      text: 'Supporting local evangelists, village outreaches, and new fellowships with biblical teaching and pastoral care.',
      icon: 'bi bi-megaphone'
    },
    {
      title: 'Discipleship and Leadership',
      text: 'Training pastors, youth leaders, and ministry teams for faithful service rooted in Scripture and community presence.',
      icon: 'bi bi-book-half'
    },
    {
      title: 'Child Sponsorship and Education',
      text: 'Helping children access school materials, mentorship, prayer support, and practical care through trusted sponsorship pathways.',
      icon: 'bi bi-mortarboard'
    },
    {
      title: 'Community Transformation',
      text: 'Strengthening families through women empowerment, literacy, mercy outreach, and resilient local initiatives.',
      icon: 'bi bi-houses'
    }
  ],
  testimonials: [
    {
      quote: 'When our reading club received support, the children came back with joy and confidence. The mission felt close, not distant.',
      name: 'Mariama K.',
      role: 'Community teacher, Kono District'
    },
    {
      quote: 'The leadership gatherings have refreshed pastors who often serve in isolation. We now feel seen, equipped, and encouraged.',
      name: 'Pastor Sorie T.',
      role: 'Rural church leader, Northern Province'
    },
    {
      quote: 'Sponsorship became more than funding. It opened a relationship of prayer, dignity, and steady encouragement for our family.',
      name: 'Hawa B.',
      role: 'Parent and ministry participant'
    }
  ],
  featuredProjects: [
    {
      title: 'Kono Learning and Discipleship Hub',
      location: 'Kono District',
      summary: 'A flexible center for literacy classes, youth mentorship, pastoral gatherings, and community prayer events.',
      image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80',
      progress: 62,
      raised: '$7,400',
      goal: '$12,000'
    },
    {
      title: 'Village Evangelism Outreach Network',
      location: 'Northern Region',
      summary: 'Equipping local evangelists with transport, Scripture resources, and follow-up discipleship tools.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      progress: 48,
      raised: '$5,600',
      goal: '$11,500'
    },
    {
      title: 'Womens Enterprise and Prayer Cooperative',
      location: 'Bo District',
      summary: 'Supporting women with training, seed support, prayer circles, and household resilience pathways.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
      progress: 39,
      raised: '$3,900',
      goal: '$10,000'
    }
  ],
  blogPosts: [
    {
      title: 'Why Mission Partnership Must Feel Personal',
      category: 'Mission Strategy',
      author: 'SIM Communications',
      date: 'April 2026',
      excerpt: 'Healthy mission support grows where stewardship, prayer, and local ownership meet.'
    },
    {
      title: 'A Literacy Club That Became a Discipleship Space',
      category: 'Education',
      author: 'Field Stories Team',
      date: 'April 2026',
      excerpt: 'What started as reading support became a trusted gathering place for children and families.'
    },
    {
      title: 'Supporting Pastors Beyond the Conference Stage',
      category: 'Leadership',
      author: 'Ministry Network Desk',
      date: 'March 2026',
      excerpt: 'Sustainable encouragement often looks like small, steady investments in relationships and resources.'
    }
  ],
  stories: [
    {
      title: 'A Classroom Reopened in Hope',
      excerpt: 'After months of interruption, a local learning space reopened with fresh paint, school materials, and renewed prayer support.',
      tag: 'Education'
    },
    {
      title: 'Young Leaders Growing in Courage',
      excerpt: 'A weekend discipleship camp helped teenagers take their first steps into public witness, service, and Scripture memory.',
      tag: 'Youth Ministry'
    },
    {
      title: 'Mothers Leading Community Change',
      excerpt: 'Prayer circles and enterprise coaching are strengthening households in practical, visible ways.',
      tag: 'Community Renewal'
    }
  ],
  gallery: [
    { title: 'Village outreach prayer gathering', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Children in a reading circle', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Pastors workshop session', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Women gathering for skills training', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Community children outdoors', image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Mission team site visit', image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=80' }
  ],
  sponsorshipOptions: [
    { title: 'Child Sponsorship', amount: '$35/mo', text: 'Encourage a child through education support, prayer, and practical care.' },
    { title: 'Program Sponsorship', amount: '$150/mo', text: 'Help sustain literacy, discipleship, or community outreach programs.' },
    { title: 'Project Sponsorship', amount: '$500+', text: 'Strengthen long-term ministry infrastructure and strategic field initiatives.' }
  ],
  sponsorCatalogChildren: [
    {
      name: 'Aminata K.',
      age: 9,
      community: 'Kono District',
      district: 'Eastern Province',
      biography: 'A bright learner who benefits from school materials, prayer, and a stable encouragement network around her education journey.',
      image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=900&q=80',
      href: '#interest-form'
    },
    {
      name: 'Ibrahim S.',
      age: 11,
      community: 'Northern Region',
      district: 'Bombali District',
      biography: 'A thoughtful young student who needs continuity for school attendance, books, and pastoral encouragement close to home.',
      image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
      href: '#interest-form'
    },
    {
      name: 'Hawa M.',
      age: 8,
      community: 'Bo District',
      district: 'Southern Province',
      biography: 'An eager child whose family is being strengthened through literacy support, prayer, and practical community care.',
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
      href: '#interest-form'
    }
  ],
  sponsorCatalogProjects: [
    {
      title: 'Kono Reading and Discipleship Circles',
      category: 'Child Development',
      summary: 'A village-based support initiative combining literacy help, prayer, and follow-up discipleship for children and caregivers.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
      href: '#interest-form'
    },
    {
      title: 'Rural Outreach Transport Fund',
      category: 'Evangelism',
      summary: 'Support local field teams with movement, follow-up visits, and practical ministry access into hard-to-reach interior communities.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      href: '#interest-form'
    }
  ],
  sponsorCatalogWorkers: [
    {
      name: 'Pastor Samuel K.',
      location: 'Northern Province',
      ministryFocus: 'Church planting and discipleship training',
      biography: 'Serving village churches through mentoring, Scripture teaching, and leadership encouragement for isolated pastors.',
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      href: '#interest-form'
    },
    {
      name: 'Sister Mariama T.',
      location: 'Kono District',
      ministryFocus: 'Children and community learning ministry',
      biography: 'Walking with children and caregivers through reading support, prayer gatherings, and practical community coordination.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
      href: '#interest-form'
    }
  ],
  donationLevels: [
    { amount: '$25', label: 'School materials for one child' },
    { amount: '$75', label: 'Support a monthly outreach activity' },
    { amount: '$150', label: 'Help resource a discipleship cohort' },
    { amount: '$500', label: 'Advance a project milestone' }
  ],
  userProfile: {
    name: 'Grace Conteh',
    role: 'Community Supporter',
    email: 'grace@example.com',
    phone: '+232 71 111111',
    location: 'Freetown, Sierra Leone',
    bio: 'Grace supports child sponsorship, literacy outreach, and womens ministry gatherings through monthly giving and prayer.',
    memberSince: 'January 2025',
    preferredFocus: 'Child sponsorship and literacy outreach',
    prayerCommitment: 'Monthly prayer partner',
    communicationPreference: 'Email updates and field stories'
  },
  userStats: [
    { value: '4', label: 'Donations made', icon: 'bi bi-heart' },
    { value: '2', label: 'Active sponsorships', icon: 'bi bi-people' },
    { value: '$460', label: 'Given this year', icon: 'bi bi-wallet2' },
    { value: '3', label: 'Open applications and messages', icon: 'bi bi-chat-left-text' }
  ],
  userDonations: [
    { date: 'Apr 12, 2026', campaign: 'General Mission Fund', amount: '$75', status: 'Completed', frequency: 'Monthly', receipt: 'SIM-2026-0412' },
    { date: 'Mar 28, 2026', campaign: 'Kono Learning Hub', amount: '$150', status: 'Completed', frequency: 'One-time', receipt: 'SIM-2026-0328' },
    { date: 'Feb 18, 2026', campaign: 'Village Outreach', amount: '$50', status: 'Completed', frequency: 'One-time', receipt: 'SIM-2026-0218' }
  ],
  userSponsorships: [
    { date: 'Active since Jan 2026', type: 'Child Sponsorship', target: 'Aminata K.', amount: '$35/mo', status: 'Active', community: 'Kono District', focus: 'School support and care encouragement' },
    { date: 'Active since Mar 2026', type: 'Program Sponsorship', target: 'Reading Circle', amount: '$60/mo', status: 'Active', community: 'Northern Region', focus: 'Literacy and discipleship gatherings' }
  ],
  userApplications: [
    { submitted: 'Apr 09, 2026', type: 'Volunteer Interest', focus: 'Storytelling and communications support', status: 'Under review', nextStep: 'Coordinator follow-up call' },
    { submitted: 'Feb 22, 2026', type: 'Prayer Team Signup', focus: 'Monthly intercession group', status: 'Confirmed', nextStep: 'Prayer email list active' }
  ],
  userMessages: [
    { date: 'Apr 16, 2026', subject: 'April field update now available', source: 'SIM Communications', preview: 'See how village outreach and literacy support progressed this month.', type: 'Update', status: 'New' },
    { date: 'Apr 11, 2026', subject: 'Volunteer interest received', source: 'Supporter Care Team', preview: 'Thank you for sharing your interest in serving with SIM. We will be in touch soon.', type: 'Message', status: 'Read' },
    { date: 'Mar 30, 2026', subject: 'Prayer focus for rural pastors', source: 'Field Leadership Desk', preview: 'Please join us in praying for encouragement, transport needs, and upcoming teaching gatherings.', type: 'Prayer Note', status: 'Read' }
  ],
  latestMinistryUpdate: {
    category: 'Latest ministry update',
    title: 'Three village visits opened new doors for prayer, Scripture sharing, and child support follow-up.',
    date: 'April 2026',
    summary: 'This month the field team reported stronger attendance at reading circles, fresh conversations with local pastors, and encouraging progress in sponsorship follow-up for children in Kono and the Northern Region.',
    linkLabel: 'Read update preview',
    linkHref: '/blog/featured-post'
  },
  adminProfile: {
    name: 'Pastor Samuel Koroma',
    role: 'Administrator',
    email: 'admin@saloneinteriormissions.org'
  },
  adminStats: [
    { value: '324', label: 'Total donors', icon: 'bi bi-people' },
    { value: '57', label: 'Total sponsorships', icon: 'bi bi-heart' },
    { value: '23', label: 'New messages', icon: 'bi bi-envelope-open' },
    { value: '12', label: 'Pending volunteer applications', icon: 'bi bi-clipboard-check' }
  ],
  adminUsers: [
    { name: 'Grace Conteh', email: 'grace@example.com', role: 'Donor', joined: 'Apr 05, 2026', status: 'Active' },
    { name: 'Joseph Kamara', email: 'joseph@example.com', role: 'Sponsor', joined: 'Apr 10, 2026', status: 'Active' },
    { name: 'Mariama Kanu', email: 'mariama@example.com', role: 'Volunteer', joined: 'Apr 14, 2026', status: 'Pending' },
    { name: 'Admin User', email: 'admin@saloneinteriormissions.org', role: 'Admin', joined: 'Apr 01, 2026', status: 'Active' }
  ],
  adminDonations: [
    { donor: 'Grace Conteh', campaign: 'General Mission Fund', amount: '$75', frequency: 'Monthly', date: 'Apr 12, 2026', status: 'Completed' },
    { donor: 'Joseph Kamara', campaign: 'Kono Learning Hub', amount: '$150', frequency: 'One-time', date: 'Apr 09, 2026', status: 'Pending' },
    { donor: 'Mary Johnson', campaign: 'Outreach Programs', amount: '$250', frequency: 'Quarterly', date: 'Apr 02, 2026', status: 'Completed' }
  ],
  adminSponsorships: [
    { sponsor: 'Grace Conteh', target: 'Aminata K.', type: 'Child Sponsorship', amount: '$35/mo', field: 'Kono District', status: 'Active' },
    { sponsor: 'Joseph Kamara', target: 'Reading Circle', type: 'Program Sponsorship', amount: '$60/mo', field: 'Northern Region', status: 'Active' },
    { sponsor: 'Mary Johnson', target: 'Youth Discipleship Fund', type: 'Program Sponsorship', amount: '$100/mo', field: 'Bo District', status: 'Review' }
  ],
  adminVolunteerApplications: [
    { name: 'Mariama Kanu', area: 'Media and storytelling', submitted: 'Apr 14, 2026', availability: 'Weekends', status: 'Pending' },
    { name: 'David Fofanah', area: 'Prayer coordination', submitted: 'Apr 11, 2026', availability: 'Flexible', status: 'Interview' },
    { name: 'Sarah Johnson', area: 'Administrative support', submitted: 'Apr 08, 2026', availability: 'Part-time', status: 'Approved' }
  ],
  adminMessages: [
    { name: 'Mary Johnson', subject: 'Partnership inquiry', category: 'Partnership', date: 'Apr 14, 2026', status: 'New' },
    { name: 'Samuel Koroma', subject: 'Volunteer interest', category: 'Volunteer', date: 'Apr 13, 2026', status: 'New' },
    { name: 'Abigail Smith', subject: 'Donation support question', category: 'Donation', date: 'Apr 12, 2026', status: 'Answered' }
  ],
  adminBlogPosts: [
    { title: 'Why Mission Partnership Must Feel Personal', author: 'SIM Communications', category: 'Mission Strategy', status: 'Published', updated: 'Apr 16, 2026' },
    { title: 'A Literacy Club That Became a Discipleship Space', author: 'Field Stories Team', category: 'Education', status: 'Draft', updated: 'Apr 10, 2026' },
    { title: 'Supporting Pastors Beyond the Conference Stage', author: 'Ministry Network Desk', category: 'Leadership', status: 'Published', updated: 'Mar 29, 2026' }
  ],
  adminProjects: [
    { title: 'Kono Learning and Discipleship Hub', type: 'Program', region: 'Kono District', progress: '62%', status: 'Active' },
    { title: 'Village Evangelism Outreach Network', type: 'Project', region: 'Northern Region', progress: '48%', status: 'Active' },
    { title: 'Women Enterprise and Prayer Cooperative', type: 'Program', region: 'Bo District', progress: '39%', status: 'Planning' }
  ],
  adminHomepageContent: [
    { section: 'Hero headline', status: 'Live', updated: 'Apr 15, 2026', owner: 'Communications Team' },
    { section: 'Impact stats', status: 'Needs review', updated: 'Apr 12, 2026', owner: 'Programs Team' },
    { section: 'Featured programs', status: 'Live', updated: 'Apr 09, 2026', owner: 'Admin Desk' },
    { section: 'Prayer CTA', status: 'Draft', updated: 'Apr 03, 2026', owner: 'Supporter Care' }
  ],
  adminSettingsGroups: [
    { label: 'Organization profile', detail: 'Brand name, contact email, office number, address', status: 'Configured' },
    { label: 'Donations and designations', detail: 'Preset amounts, recurring frequencies, category labels', status: 'Configured' },
    { label: 'Notification preferences', detail: 'Admin alerts, contact form routing, inbox rules', status: 'Review needed' },
    { label: 'Content roles and access', detail: 'Editor permissions, admin access, preview settings', status: 'Configured' }
  ]
};

