/**
 * HTML sanitization for announcement bodies (rich text).
 *
 * isomorphic-dompurify works in both Deno (edge function) and browsers, so we
 * sanitize on write (server) AND on read as a defense-in-depth measure.
 */
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "a", "span",
  "h2", "h3", "h4",
  "blockquote",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|#|\/)/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  }) as unknown as string;
}
