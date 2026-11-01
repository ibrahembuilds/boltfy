/**
 * Form slugs end up in public URLs (/f/:slug), so they must be URL-safe and
 * non-empty. The old inline logic stripped everything but [a-z0-9-], which
 * turns a name such as "نموذج الاتصال" or "联系我们" into "" - and two such
 * forms then collide on the unique slug.
 */

/** "My Form!" -> "my-form". Returns "" if nothing usable is left. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: é -> e
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function randomSuffix(length = 6): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** A slug from the form's name, with a random fallback for names that have no Latin letters or digits. */
export function makeSlug(name: string, suffix: () => string = randomSuffix): string {
  return slugify(name) || `form-${suffix()}`;
}

/** Same, but keeps an author-typed slug when it is usable. */
export function resolveSlug(typedSlug: string, name: string, suffix?: () => string): string {
  return slugify(typedSlug) || makeSlug(name, suffix);
}
