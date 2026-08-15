// A remark plugin that renders GitHub-style admonitions/callouts. A blockquote
// whose first paragraph begins with `[!TYPE]` (NOTE/TIP/IMPORTANT/WARNING/
// CAUTION, case-insensitive) becomes a titled admonition block:
//
//   > [!WARNING]
//   > Be careful.
//     →  <div class="admonition admonition-warning">
//          <p class="admonition-title">Warning</p>
//          <p>Be careful.</p>
//        </div>
//
// Server-rendered at build time (no client JS). Ordinary blockquotes are left
// untouched. The div + classes come from mdast `data.hName`/`hProperties`, which
// Astro's remark→rehype pipeline honors.
import { visit } from 'unist-util-visit';

const TITLES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

const MARKER = /^\[!(note|tip|important|warning|caution)\]\s*/i;

export default function remarkAlerts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstParagraph = node.children[0];
      if (!firstParagraph || firstParagraph.type !== 'paragraph') return;
      const firstText = firstParagraph.children[0];
      if (!firstText || firstText.type !== 'text') return;

      const match = firstText.value.match(MARKER);
      if (!match) return;
      const type = match[1].toLowerCase();

      // Strip the marker (and the whitespace/newline after it) from the body.
      firstText.value = firstText.value.slice(match[0].length);
      // Drop the first paragraph if the marker was its only content.
      if (firstText.value === '' && firstParagraph.children.length === 1) {
        node.children.shift();
      }

      // Prepend the title, then turn the blockquote into an admonition container.
      node.children.unshift({
        type: 'paragraph',
        data: { hProperties: { className: ['admonition-title'] } },
        children: [{ type: 'text', value: TITLES[type] }],
      });
      node.data = node.data ?? {};
      node.data.hName = 'div';
      node.data.hProperties = { className: ['admonition', `admonition-${type}`] };
    });
  };
}
