import type { SearchRecord, SearchHeading } from './search-index';

/** A ranked search result: the chapter, a deep-linking URL, and its score. */
export interface SearchHit {
  record: SearchRecord;
  /** `record.url`, suffixed with `#<heading-slug>` when the hit is in a section. */
  url: string;
  score: number;
  /** The section heading the hit resolved to, if any (depth ≥ 2). */
  heading?: SearchHeading;
}

const WORD_RE = /[a-z0-9]+/g;

/** Lowercase + split into alphanumeric word tokens. */
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

/** A term matches a token list on an exact or prefix hit. */
function matches(tokens: string[], term: string): boolean {
  return tokens.some((t) => t === term || t.startsWith(term));
}

// Field weights: a term in a title/heading outranks the same term in body.
const W_TITLE = 8;
const W_HEADING = 4;
const W_BODY = 1;

/**
 * Rank `records` against `query`. All query terms must match somewhere in a
 * record (AND semantics) with prefix matching; title and heading matches score
 * above body matches. Each hit resolves to the section heading (depth ≥ 2)
 * matching the most terms, deep-linking via `#slug`. An empty or whitespace-only
 * query returns `[]`. Results are sorted by score, then title, for stability.
 */
export function search(query: string, records: SearchRecord[], limit = 20): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const record of records) {
    const titleTokens = tokenize(`${record.tomeTitle} ${record.chapterTitle}`);
    const sections = record.headings
      .filter((h) => h.depth >= 2)
      .map((h) => ({ heading: h, tokens: tokenize(h.text) }));
    const bodyTokens = tokenize(record.text);

    let score = 0;
    let allMatch = true;
    for (const term of terms) {
      const inTitle = matches(titleTokens, term);
      const inHeading = sections.some((s) => matches(s.tokens, term));
      const inBody = matches(bodyTokens, term);
      if (!inTitle && !inHeading && !inBody) {
        allMatch = false;
        break;
      }
      score += (inTitle ? W_TITLE : 0) + (inHeading ? W_HEADING : 0) + (inBody ? W_BODY : 0);
    }
    if (!allMatch) continue;

    // Anchor to the section heading matching the most query terms.
    let heading: SearchHeading | undefined;
    let best = 0;
    for (const s of sections) {
      const count = terms.filter((term) => matches(s.tokens, term)).length;
      if (count > best) {
        best = count;
        heading = s.heading;
      }
    }

    hits.push({
      record,
      url: heading ? `${record.url}#${heading.slug}` : record.url,
      score,
      heading,
    });
  }

  hits.sort(
    (a, b) => b.score - a.score || a.record.chapterTitle.localeCompare(b.record.chapterTitle),
  );
  return hits.slice(0, limit);
}
