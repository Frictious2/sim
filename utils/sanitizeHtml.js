const sanitizeHtml = require('sanitize-html');

const allowedTags = [
  'p',
  'br',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4'
];

const allowedAttributes = {
  a: ['href', 'target', 'rel']
};

function sanitizeRichHtml(value = '') {
  return sanitizeHtml(String(value || ''), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer'
      }, true)
    },
    disallowedTagsMode: 'discard'
  }).trim();
}

module.exports = {
  sanitizeRichHtml
};
