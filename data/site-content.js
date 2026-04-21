const publicNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Mission', href: '/mission' },
  { label: 'Mission Fields', href: '/mission-fields' },
  { label: 'Projects', href: '/projects' },
  { label: 'Sponsor', href: '/sponsor' },
  { label: 'Blog', href: '/blog' },
  { label: 'Stories', href: '/stories' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
  { label: 'Donate', href: '/donate' }
];

const dashboardNav = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Profile', href: '/dashboard/profile' },
  { label: 'Donation History', href: '/dashboard/donations' },
  { label: 'Sponsorship History', href: '/dashboard/sponsorships' }
];

const adminNav = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Blog Posts', href: '/admin/blog-posts' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Donations', href: '/admin/donations' },
  { label: 'Sponsorships', href: '/admin/sponsorships' },
  { label: 'Volunteers', href: '/admin/volunteers' },
  { label: 'Messages', href: '/admin/messages' }
];

module.exports = {
  brand: 'Salone Interior Missions Platform',
  publicNav,
  dashboardNav,
  adminNav,
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
    bio: 'Grace supports child sponsorship, literacy outreach, and womens ministry gatherings through monthly giving and prayer.'
  },
  userStats: [
    { value: '4', label: 'Donations made', icon: 'bi bi-heart' },
    { value: '2', label: 'Active sponsorships', icon: 'bi bi-people' },
    { value: '$460', label: 'Total pledged this year', icon: 'bi bi-wallet2' }
  ],
  userDonations: [
    { date: 'Apr 12, 2026', campaign: 'General Mission Fund', amount: '$75', status: 'Completed' },
    { date: 'Mar 28, 2026', campaign: 'Kono Learning Hub', amount: '$150', status: 'Completed' },
    { date: 'Feb 18, 2026', campaign: 'Village Outreach', amount: '$50', status: 'Completed' }
  ],
  userSponsorships: [
    { date: 'Active since Jan 2026', type: 'Child Sponsorship', target: 'Aminata', amount: '$35/mo', status: 'Active' },
    { date: 'Active since Mar 2026', type: 'Program Sponsorship', target: 'Reading Circle', amount: '$60/mo', status: 'Active' }
  ],
  adminStats: [
    { value: '324', label: 'Registered supporters' },
    { value: '18', label: 'Open projects' },
    { value: '57', label: 'Pending sponsorship reviews' },
    { value: '23', label: 'Unread messages' }
  ],
  adminUsers: [
    { name: 'Grace Conteh', email: 'grace@example.com', role: 'User', joined: 'Apr 05, 2026' },
    { name: 'Joseph Kamara', email: 'joseph@example.com', role: 'User', joined: 'Apr 10, 2026' },
    { name: 'Admin User', email: 'admin@saloneinteriormissions.org', role: 'Admin', joined: 'Apr 01, 2026' }
  ],
  adminDonations: [
    { donor: 'Grace Conteh', campaign: 'General Mission Fund', amount: '$75', status: 'Completed' },
    { donor: 'Joseph Kamara', campaign: 'Kono Learning Hub', amount: '$150', status: 'Pending' }
  ],
  adminMessages: [
    { name: 'Mary Johnson', subject: 'Partnership enquiry', date: 'Apr 14, 2026', status: 'New' },
    { name: 'Samuel Koroma', subject: 'Volunteer interest', date: 'Apr 13, 2026', status: 'New' }
  ]
};
