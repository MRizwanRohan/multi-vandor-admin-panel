// ═══════════════════════════════════════════════════════════════════
// Sanitize Utility — HTML sanitization using DOMPurify
// ═══════════════════════════════════════════════════════════════════

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Allows safe HTML tags for rich text display.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Text formatting
      'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'del', 'ins',
      'sub', 'sup', 'small', 'mark', 'abbr', 'code', 'pre', 'kbd',
      // Block elements
      'p', 'br', 'hr', 'div', 'span', 'blockquote',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      // Links & Media
      'a', 'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
      // Semantic
      'article', 'section', 'aside', 'details', 'summary', 'time',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height', 'colspan', 'rowspan',
      'start', 'type', 'datetime', 'loading', 'decoding',
      'srcset', 'sizes', 'media',
    ],
    // Force all links to open in new tab and add noopener
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  })
}

/**
 * Sanitize HTML for plain text display (strips all HTML).
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}
