const siteContent = require('../data/site-content');
const HomepageSection = require('../models/HomepageSection');
const BlogPost = require('../models/BlogPost');
const Project = require('../models/Project');
const Testimony = require('../models/Testimony');
const GalleryItem = require('../models/GalleryItem');
const Page = require('../models/Page');
const { formatDate, truncateText, parseJsonContent, stripHtml } = require('../utils/formatting');
const { sanitizeRichHtml } = require('../utils/sanitizeHtml');

function buildFallbackContent() {
  return JSON.parse(JSON.stringify(siteContent));
}

function mapProjectToCard(project) {
  return {
    title: project.title,
    description: project.summary || truncateText(stripHtml(project.description), 150),
    badge: project.progress_label || project.category || 'Field Ministry',
    href: '/projects',
    image: project.featured_image,
    location: project.location,
    status: project.status
  };
}

function mapProjectToFeatured(project) {
  return {
    title: project.title,
    location: project.location || 'Sierra Leone',
    summary: project.summary || truncateText(stripHtml(project.description), 180),
    image: project.featured_image,
    progress: project.progress_label || project.status,
    raised: project.category || 'Mission Project',
    goal: project.status
  };
}

function mapBlogPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category || 'Updates',
    author: post.resolved_author_name || post.author_name || 'SIM Communications',
    date: formatDate(post.published_at || post.updated_at, { month: 'long' }) || formatDate(post.updated_at),
    excerpt: post.excerpt || truncateText(stripHtml(post.body), 160),
    image: post.featured_image,
    metaTitle: post.meta_title || null,
    metaDescription: post.meta_description || null
  };
}

function mapTestimony(item) {
  return {
    id: item.id,
    quote: item.quote,
    name: item.name,
    role: item.location || 'SIM Testimony',
    image: item.image_url,
    location: item.location,
    story: item.story
  };
}

function mapStory(item) {
  return {
    title: item.name,
    excerpt: truncateText(stripHtml(item.story || item.quote), 140),
    tag: item.location || 'Testimony',
    image: item.image_url,
    quote: item.quote,
    slug: item.id
  };
}

function mapGalleryItem(item) {
  return {
    title: item.title,
    image: item.image_url,
    caption: item.caption,
    category: item.category
  };
}

function applyHomepageSections(content, sections) {
  const sectionMap = new Map(sections.map((section) => [section.section_key, section]));

  const hero = sectionMap.get('hero');
  if (hero) {
    const heroContent = parseJsonContent(hero.content, {});
    content.homeHero = {
      ...content.homeHero,
      title: hero.title || content.homeHero.title,
      text: hero.subtitle || content.homeHero.text,
      trust: heroContent.trust || content.homeHero.trust,
      primary: {
        label: hero.button_label || content.homeHero.primary.label,
        href: hero.button_url || content.homeHero.primary.href
      },
      secondary: {
        label: heroContent.secondaryButtonLabel || content.homeHero.secondary.label,
        href: heroContent.secondaryButtonUrl || content.homeHero.secondary.href
      }
    };

    if (Array.isArray(heroContent.stats) && heroContent.stats.length) {
      content.homeHeroStats = content.homeHeroStats.map((fallbackStat, index) => heroContent.stats[index] || fallbackStat);
    }

    if (hero.image_url) {
      content.homeHeroImage = hero.image_url;
    }
  }

  const intro = sectionMap.get('intro');
  if (intro) {
    const introContent = parseJsonContent(intro.content, { body: intro.content });
    content.homeIntro = {
      title: intro.title || 'Who we are',
      subtitle: intro.subtitle || content.homeIntro?.subtitle,
      content: sanitizeRichHtml(introContent.body || intro.content || ''),
      buttonLabel: intro.button_label || introContent.ctaLabel || 'Learn About SIM',
      buttonUrl: intro.button_url || introContent.ctaUrl || '/about',
      image: intro.image_url || null
    };
  }

  const impactBand = sectionMap.get('impact_band');
  if (impactBand) {
    const stats = parseJsonContent(impactBand.content, null);
    if (Array.isArray(stats) && stats.length) {
      content.homeImpactBand = stats;
    }
  }

  const partnershipCta = sectionMap.get('partnership_cta');
  if (partnershipCta) {
    content.homePartnershipCta = {
      title: partnershipCta.title,
      subtitle: partnershipCta.subtitle,
      content: sanitizeRichHtml(partnershipCta.content || ''),
      buttonLabel: partnershipCta.button_label,
      buttonUrl: partnershipCta.button_url,
      image: partnershipCta.image_url || null
    };
  }

  const newsletter = sectionMap.get('newsletter');
  if (newsletter) {
    content.newsletter = {
      ...content.newsletter,
      title: newsletter.title || content.newsletter.title,
      text: newsletter.subtitle || content.newsletter.text,
      privacyText: newsletter.content || content.newsletter.privacyText || 'We will only send ministry updates, stories, and prayer opportunities. No spam.',
      button: newsletter.button_label || content.newsletter.button
    };
  }

  return content;
}

async function getHomePageContent() {
  const content = buildFallbackContent();

  try {
    const [sections, projects, testimonies, posts, gallery] = await Promise.all([
      HomepageSection.findPublished(),
      Project.findPublished(),
      Testimony.findPublished(3),
      BlogPost.findPublished(3),
      GalleryItem.findPublished(6)
    ]);

    applyHomepageSections(content, sections);

    if (projects.length) {
      content.homePrograms = projects.slice(0, 4).map(mapProjectToCard);
      content.featuredProjects = projects.slice(0, 4).map(mapProjectToFeatured);
    }

    if (testimonies.length) {
      content.testimonials = testimonies.slice(0, 3).map(mapTestimony);
      content.stories = testimonies.slice(0, 3).map(mapStory);
    }

    if (posts.length) {
      content.blogPosts = posts.map(mapBlogPost);
    }

    if (gallery.length) {
      content.gallery = gallery.map(mapGalleryItem);
    }
  } catch (error) {
    return content;
  }

  return content;
}

async function getBlogListingContent() {
  const content = buildFallbackContent();

  try {
    const [posts, gallery] = await Promise.all([
      BlogPost.findPublished(12),
      GalleryItem.findPublished(12)
    ]);

    if (posts.length) {
      content.blogPosts = posts.map(mapBlogPost);
    }

    if (gallery.length) {
      content.gallery = gallery.map(mapGalleryItem);
    }
  } catch (error) {
    return content;
  }

  return content;
}

async function getBlogPostContent(slug) {
  const fallback = buildFallbackContent();

  try {
    const [post, relatedPosts, gallery] = await Promise.all([
      BlogPost.findBySlug(slug),
      BlogPost.findPublished(6),
      GalleryItem.findPublished(6)
    ]);

    if (!post || post.status !== 'published') {
      return {
        content: fallback,
        post: null,
        relatedPosts: fallback.blogPosts.map((item, index) => ({ ...item, image: fallback.gallery[index] ? fallback.gallery[index].image : null, href: '/blog/featured-post' }))
      };
    }

    return {
      content: {
        ...fallback,
        blogPosts: relatedPosts.map(mapBlogPost),
        gallery: gallery.length ? gallery.map(mapGalleryItem) : fallback.gallery
      },
      post: {
        ...mapBlogPost(post),
        body: sanitizeRichHtml(post.body || ''),
        featuredImage: post.featured_image,
        publishedDate: formatDate(post.published_at || post.updated_at, { month: 'long', day: 'numeric', year: 'numeric' }),
        author: post.resolved_author_name || post.author_name || 'SIM Communications'
      },
      relatedPosts: relatedPosts
        .filter((item) => item.slug !== post.slug)
        .slice(0, 3)
        .map((item) => ({ ...mapBlogPost(item), href: `/blog/${item.slug}` }))
    };
  } catch (error) {
    return {
      content: fallback,
      post: null,
      relatedPosts: []
    };
  }
}

async function getProjectsContent() {
  const content = buildFallbackContent();
  try {
    const projects = await Project.findPublished();
    if (projects.length) {
      content.featuredProjects = projects.map(mapProjectToFeatured);
    }
  } catch (error) {
    return content;
  }
  return content;
}

async function getStoriesContent() {
  const content = buildFallbackContent();
  try {
    const [testimonies, gallery] = await Promise.all([
      Testimony.findPublished(12),
      GalleryItem.findPublished(12)
    ]);
    if (testimonies.length) {
      content.stories = testimonies.map(mapStory);
      content.testimonials = testimonies.map(mapTestimony);
    }
    if (gallery.length) {
      content.gallery = gallery.map(mapGalleryItem);
    }
  } catch (error) {
    return content;
  }
  return content;
}

async function getGalleryContent() {
  const content = buildFallbackContent();
  try {
    const gallery = await GalleryItem.findPublished(24);
    if (gallery.length) {
      content.gallery = gallery.map(mapGalleryItem);
    }
  } catch (error) {
    return content;
  }
  return content;
}

async function getManagedPage(slug) {
  try {
    const page = await Page.findBySlug(slug);
    if (!page || page.status !== 'published') {
      return null;
    }
    return {
      ...page,
      body: sanitizeRichHtml(page.body || '')
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  getHomePageContent,
  getBlogListingContent,
  getBlogPostContent,
  getProjectsContent,
  getStoriesContent,
  getGalleryContent,
  getManagedPage,
  buildFallbackContent,
  mapBlogPost,
  mapProjectToFeatured,
  mapProjectToCard,
  mapTestimony,
  mapStory,
  mapGalleryItem
};
