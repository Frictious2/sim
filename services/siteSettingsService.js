const siteContent = require('../data/site-content');
const SiteSetting = require('../models/SiteSetting');

function toSettingMap(settings = []) {
  return settings.reduce((accumulator, item) => {
    accumulator[item.setting_key] = item.setting_value;
    return accumulator;
  }, {});
}

async function getPublicSiteContext() {
  try {
    const settings = await SiteSetting.findAll();
    const map = toSettingMap(settings);

    return {
      ...siteContent,
      brand: map.site_name || siteContent.brand,
      contactEmail: map.contact_email || siteContent.contactEmail,
      contactPhone: map.contact_phone || siteContent.contactPhone,
      officeAddress: map.office_address || siteContent.officeAddress,
      facebookUrl: map.facebook_url || siteContent.facebookUrl,
      youtubeUrl: map.youtube_url || siteContent.youtubeUrl,
      whatsappNumber: map.whatsapp_number || siteContent.whatsappNumber,
      logoUrl: map.logo_url || siteContent.logoUrl || '',
      faviconUrl: map.favicon_url || siteContent.faviconUrl || '',
      defaultMetaTitle: map.default_meta_title || siteContent.defaultMetaTitle || siteContent.brand,
      defaultMetaDescription: map.default_meta_description || siteContent.defaultMetaDescription || 'A warm, trustworthy digital home for mission engagement in Sierra Leone.'
    };
  } catch (error) {
    return {
      ...siteContent,
      contactEmail: siteContent.contactEmail,
      contactPhone: siteContent.contactPhone,
      officeAddress: siteContent.officeAddress,
      facebookUrl: siteContent.facebookUrl,
      youtubeUrl: siteContent.youtubeUrl,
      whatsappNumber: siteContent.whatsappNumber,
      logoUrl: siteContent.logoUrl || '',
      faviconUrl: siteContent.faviconUrl || '',
      defaultMetaTitle: siteContent.defaultMetaTitle || siteContent.brand,
      defaultMetaDescription: siteContent.defaultMetaDescription || 'A warm, trustworthy digital home for mission engagement in Sierra Leone.'
    };
  }
}

async function getSettingsGrouped() {
  const settings = await SiteSetting.findAll();
  const groups = new Map();
  for (const item of settings) {
    const group = item.setting_group || 'general';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(item);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}

module.exports = {
  getPublicSiteContext,
  getSettingsGrouped,
  toSettingMap
};
