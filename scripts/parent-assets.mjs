// Prepare inline Markdown images that leave an external book's detected source
// directory but remain inside its configured book root. Only referenced files
// are copied, under a tome-private reserved directory in the staged content.
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';

export const PARENT_ASSET_DIR = '__tome_parent_assets__';

/** True when target is root itself or a descendant, including Windows drive checks. */
export function isPathInside(root, target, pathApi = path) {
  const rel = pathApi.relative(pathApi.resolve(root), pathApi.resolve(target));
  return (
    rel === '' ||
    (!pathApi.isAbsolute(rel) &&
      rel !== '..' &&
      !rel.startsWith(`..${pathApi.sep}`))
  );
}

/** Convert a platform relative path to an encoded Markdown URL. */
export function toMarkdownPath(value) {
  const slashPath = value.replaceAll('\\', '/');
  const encoded = slashPath
    .split('/')
    .map((segment) =>
      segment === '.' || segment === '..'
        ? segment
        : encodeURIComponent(segment).replace(
            /[!'()*]/g,
            (character) =>
              `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
          ),
    )
    .join('/');
  return encoded.startsWith('.') ? encoded : `./${encoded}`;
}

/**
 * Parse CommonMark and return exact raw destination-token offsets for inline
 * image resources. The custom exit hook mirrors mdast-util-from-markdown's
 * built-in handler before recording the concrete micromark token.
 */
export function imageDestinationSpans(markdown) {
  const spans = [];
  fromMarkdown(markdown, {
    mdastExtensions: [
      {
        exit: {
          resourceDestinationString(token) {
            const url = this.resume();
            const node = this.stack[this.stack.length - 1];
            node.url = url;
            if (
              node.type === 'image' &&
              Number.isInteger(token.start.offset) &&
              Number.isInteger(token.end.offset)
            ) {
              spans.push({
                start: token.start.offset,
                end: token.end.offset,
                url,
              });
            }
          },
        },
      },
    ],
  });
  return spans;
}

function splitLocalUrl(url) {
  if (
    !url ||
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('?') ||
    /^[A-Za-z][A-Za-z\d+.-]*:/.test(url)
  ) {
    return null;
  }

  const suffixAt = url.search(/[?#]/);
  const encodedPath = suffixAt === -1 ? url : url.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? '' : url.slice(suffixAt);
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(encodedPath);
  } catch {
    throw new Error('has malformed percent encoding');
  }
  if (!decodedPath) return null;
  // Treat both URL and Windows separators as path boundaries on every host so
  // a Windows-authored traversal cannot become a benign POSIX filename.
  return { path: decodedPath.replace(/[\\/]+/g, path.sep), suffix };
}

async function markdownFiles(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && /\.md(?:own)?$/i.test(entry.name)) {
        files.push(full);
      }
    }
  }
  await walk(root);
  return files;
}

function assetFailure(sourceDir, sourceFile, url, reason) {
  const chapter =
    path.relative(sourceDir, sourceFile) || path.basename(sourceFile);
  return new Error(
    `parent asset ${JSON.stringify(url)} in ${chapter} ${reason}`,
  );
}

async function ensurePrivateDir(privateDir, context) {
  try {
    await lstat(privateDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await mkdir(privateDir, { recursive: true });
    return;
  }
  throw assetFailure(
    context.sourceDir,
    context.sourceFile,
    context.url,
    `collides with reserved directory ${JSON.stringify(PARENT_ASSET_DIR)}`,
  );
}

/**
 * Rewrite and copy the parent-relative inline image assets of ONE staged chapter.
 * The containment checks (in-source skip, root confinement, realpath, regular
 * file) are the security boundary shared by the whole-tome build path and the
 * dev live-reload path; only the reserved-directory policy differs, injected as
 * `ensurePrivate`. `sourceDir` stays lexical on purpose (declared/symlinked
 * sources can live beyond `root`); each target is independently confined to
 * `root`. Returns whether any asset was rewritten.
 */
async function rewriteChapterAssets({
  root,
  realRoot,
  sourceDir,
  sourceFile,
  stagedFile,
  privateDir,
  ensurePrivate,
}) {
  const markdown = await readFile(stagedFile, 'utf8');
  const replacements = [];

  for (const span of imageDestinationSpans(markdown)) {
    let local;
    try {
      local = splitLocalUrl(span.url);
    } catch (error) {
      throw assetFailure(sourceDir, sourceFile, span.url, error.message);
    }
    if (!local) continue;

    const target = path.resolve(path.dirname(sourceFile), local.path);
    if (isPathInside(sourceDir, target)) continue;
    if (!isPathInside(root, target)) {
      throw assetFailure(
        sourceDir,
        sourceFile,
        span.url,
        'escapes the configured book root',
      );
    }

    let realTarget;
    try {
      realTarget = await realpath(target);
    } catch {
      throw assetFailure(sourceDir, sourceFile, span.url, 'does not exist');
    }
    if (!isPathInside(realRoot, realTarget)) {
      throw assetFailure(
        sourceDir,
        sourceFile,
        span.url,
        'resolves outside the configured book root',
      );
    }
    if (!(await stat(realTarget)).isFile()) {
      throw assetFailure(
        sourceDir,
        sourceFile,
        span.url,
        'does not resolve to a regular file',
      );
    }

    await ensurePrivate({ sourceDir, sourceFile, url: span.url });
    const rootRelative = path.relative(root, target);
    const stagedAsset = path.join(privateDir, rootRelative);
    await mkdir(path.dirname(stagedAsset), { recursive: true });
    await copyFile(realTarget, stagedAsset);

    const rewritten = `${toMarkdownPath(path.relative(path.dirname(stagedFile), stagedAsset))}${local.suffix}`;
    replacements.push({ ...span, rewritten });
  }

  if (replacements.length > 0) {
    let output = markdown;
    for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
      output =
        output.slice(0, replacement.start) +
        replacement.rewritten +
        output.slice(replacement.end);
    }
    await writeFile(stagedFile, output);
  }

  return replacements.length > 0;
}

/**
 * Rewrite and copy parent-relative inline image assets for one staged tome
 * (the build/load path). `sourceDir` remains lexical on purpose: declared or
 * symlinked sources can live beyond `root`, while each target is independently
 * confined to `root`. Throws if the reserved directory preexists — a file below
 * that name in the source would otherwise bypass preparation.
 */
export async function prepareParentAssets({ root, sourceDir, stagedTome }) {
  const realRoot = await realpath(root);
  const privateDir = path.join(stagedTome, PARENT_ASSET_DIR);
  let privateDirPreexisting = false;
  try {
    await lstat(privateDir);
    privateDirPreexisting = true;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  // Create the reserved directory on first use, rejecting a preexisting one.
  let privateDirCreated = false;
  const ensurePrivate = async (context) => {
    if (privateDirCreated) return;
    await ensurePrivateDir(privateDir, context);
    privateDirCreated = true;
  };

  for (const stagedFile of await markdownFiles(stagedTome)) {
    const sourceFile = path.join(
      sourceDir,
      path.relative(stagedTome, stagedFile),
    );
    await rewriteChapterAssets({
      root,
      realRoot,
      sourceDir,
      sourceFile,
      stagedFile,
      privateDir,
      ensurePrivate,
    });
  }

  // The name is exclusively owned by Tome even when the source happened not
  // to contain a rewritable image outside it. Rejecting it unconditionally
  // prevents authored files below the reserved path from bypassing preparation.
  if (privateDirPreexisting) {
    throw assetFailure(
      sourceDir,
      path.join(sourceDir, PARENT_ASSET_DIR),
      PARENT_ASSET_DIR,
      `collides with reserved directory ${JSON.stringify(PARENT_ASSET_DIR)}`,
    );
  }
}

/**
 * Rewrite and copy the parent-relative assets of ONE chapter synced by the dev
 * live-reload watcher (INT-0009). Unlike the build path it reuses the already-
 * staged tome's `__tome_parent_assets__` directory (idempotent `mkdir`, no
 * preexisting-dir guard — the dev destination is Tome's own, created at load),
 * while applying the identical containment checks and URL rewrite. `sourceFile`
 * is the edited source chapter (for resolving relative targets); `stagedFile` is
 * its copy under `stagedTome`. Returns whether an asset was rewritten.
 */
export async function prepareChapterParentAssets({
  root,
  sourceDir,
  stagedTome,
  sourceFile,
  stagedFile,
}) {
  const realRoot = await realpath(root);
  const privateDir = path.join(stagedTome, PARENT_ASSET_DIR);
  const ensurePrivate = async () => {
    await mkdir(privateDir, { recursive: true });
  };
  return rewriteChapterAssets({
    root,
    realRoot,
    sourceDir,
    sourceFile,
    stagedFile,
    privateDir,
    ensurePrivate,
  });
}
