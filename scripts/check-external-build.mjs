// External-book build gate: for each fixture book, builds Tome with
// TOME_BOOK pointed at it and asserts the external book renders (its routes
// replace the sample). A single external book stays at the root (adaptive
// single-tome mode). Covers the standard layout (book.toml + src/, incl. a
// relative image) AND a config-less docs/ layout (no book.toml — detected).
// src/content/books/ is restored to HEAD after EACH book and on any failure, so
// the gate is idempotent and leaves the tree at HEAD. Runs locally and in CI.
//
// NOTE: this gate replaces src/content/books/. It refuses to start unless that
// target is pristine, then strictly restores tracked content and removes only
// fixture residue within the target after each case.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { createFixtureGate, errorMessage } from "./fixture-gate.mjs";

const root = process.cwd();
const dist = join(root, "dist");
const gate = createFixtureGate({ root });

function verifyHandbookInBrowser() {
  gate.command("npx --no-install playwright test", {
    TOME_EXTERNAL_BOOK_E2E: "1",
  });
}

function fail(message) {
  throw new Error(message);
}

function requireRoute(slug, label) {
  if (!existsSync(join(dist, slug, "index.html")))
    fail(`${label}: dist/${slug}/ was not generated`);
}
function requireAbsent(slug, label) {
  if (existsSync(join(dist, slug, "index.html")))
    fail(`${label}: dist/${slug}/ is still present`);
}
function readRoute(slug) {
  return readFileSync(join(dist, slug, "index.html"), "utf8");
}

function requireOptimizedAsset(slug, basename, label) {
  const escaped = basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = readRoute(slug).match(
    new RegExp(`src="(/_astro/${escaped}\\.[^"]+\\.svg)"`),
  );
  if (!match)
    fail(`${label}: ${basename} did not render as an optimized /_astro/ asset`);
  const emitted = join(dist, match[1].slice(1));
  if (!existsSync(emitted) || statSync(emitted).size === 0) {
    fail(`${label}: optimized asset ${match[1]} is missing or empty`);
  }
}

// Each case: a fixture book + its assertions on the built dist/.
const CASES = [
  {
    name: "handbook (standard: book.toml + src/, relative image)",
    book: join(root, "fixtures", "handbook"),
    browser: true,
    check() {
      requireRoute("first", "handbook");
      requireAbsent("getting-started", "handbook"); // sample replaced
      requireOptimizedAsset("first", "plate", "handbook in-source image");
      requireOptimizedAsset(
        "first",
        "parent-plate",
        "handbook parent-relative image",
      );
    },
  },
  {
    name: "docs-book (config-less: no book.toml, docs/ layout)",
    book: join(root, "fixtures", "docs-book"),
    check() {
      requireRoute("overview", "docs-book"); // detected docs/ source
      requireRoute("details/deep", "docs-book"); // nested from detected source
      requireAbsent("getting-started", "docs-book"); // sample replaced
      if (!readRoute("").includes(">docs-book<")) {
        fail(
          'docs-book: the directory-name title "docs-book" is not shown in the sidebar',
        );
      }
    },
  },
];

function runCase({ name, book, check, browser = false }) {
  return gate.withFixture(() => {
    console.log(`check-external-build: building ${name} …`);
    gate.build({ TOME_BOOK: book });
    check();
    if (browser) {
      console.log("check-external-build: verifying handbook in Chromium …");
      verifyHandbookInBrowser();
    }
    console.log(`check-external-build: OK — ${name}`);
  });
}

try {
  for (const fixtureCase of CASES) await runCase(fixtureCase);

  console.log(
    "check-external-build: all external books rendered; rebuilding default …",
  );
  await gate.rebuildDefault();
} catch (error) {
  console.error(`check-external-build: FAIL — ${errorMessage(error)}`);
  process.exitCode = 1;
}
