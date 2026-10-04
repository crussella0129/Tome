// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const contentPath = "src/content/books";
const samplePath = `${contentPath}/sample/README.md`;
const sample = "# Committed sample\n";
const liveFixture = "# Active live fixture\n";
const tempParent = resolve(tmpdir());
const tempPrefix = "tome-fixture-commands-";

function write(root: string, path: string, contents: string) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function git(root: string, ...args: string[]) {
  return execFileSync(
    "git",
    [
      "-c",
      "core.autocrlf=false",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.name=Fixture Command Test",
      "-c",
      "user.email=fixture-command@example.invalid",
      ...args,
    ],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function status(root: string) {
  return git(
    root,
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--ignored=matching",
    "--",
    contentPath,
  );
}

function removeTemp(target: string, prefix: string) {
  const resolved = resolve(target);
  const withinTemp = relative(tempParent, resolved);
  if (
    !withinTemp ||
    withinTemp.startsWith("..") ||
    isAbsolute(withinTemp) ||
    !basename(resolved).startsWith(prefix)
  ) {
    throw new Error(
      `Refusing to remove unexpected test directory: ${resolved}`,
    );
  }
  rmSync(resolved, { recursive: true, force: true });
}

function alive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

describe("fixture commands — real CLI failure and preservation paths", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tempParent, tempPrefix));
    write(root, samplePath, sample);
    write(root, `${contentPath}/sample/staged.txt`, "committed staged file\n");
    write(
      root,
      ".gitignore",
      `${contentPath}/ignored/\nnode_modules/\n.astro/\ndist/\n`,
    );
    write(root, "outside/sentinel.txt", "outside must survive\n");
    git(root, "init", "--quiet");
    git(root, "add", "--", ".");
    git(root, "commit", "--quiet", "-m", "Commit fixture sample");
  });

  afterEach(() => {
    const started = join(root, "server-started.json");
    if (existsSync(started)) {
      const { pid, book } = JSON.parse(readFileSync(started, "utf8")) as {
        pid: number;
        book: string;
      };
      if (alive(pid)) process.kill(pid, "SIGKILL");
      const bookParent = dirname(book);
      if (existsSync(bookParent)) removeTemp(bookParent, "tome-lr-");
    }
    removeTemp(root, tempPrefix);
  });

  function run(script: string, overrides: NodeJS.ProcessEnv = {}) {
    return spawnSync(process.execPath, [join(projectRoot, "scripts", script)], {
      cwd: root,
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
        ...overrides,
      },
      encoding: "utf8",
      timeout: 30_000,
      windowsHide: true,
    });
  }

  function expectSample() {
    expect(readFileSync(join(root, samplePath), "utf8")).toBe(sample);
    expect(status(root)).toBe("");
    expect(readFileSync(join(root, "outside/sentinel.txt"), "utf8")).toBe(
      "outside must survive\n",
    );
  }

  it.each([
    "check-external-build.mjs",
    "check-multibook.mjs",
    "check-search.mjs",
    "check-live-reload.mjs",
  ])(
    "test_fixture_commands_refuse_dirty_content: %s exits before setup or cleanup",
    (script) => {
      const personal = {
        [samplePath]: "# Personal tracked content\n",
        [`${contentPath}/sample/staged.txt`]: "personal staged content\n",
        [`${contentPath}/untracked.txt`]: "personal untracked content\n",
        [`${contentPath}/ignored/personal.txt`]: "personal ignored content\n",
      };
      for (const [path, contents] of Object.entries(personal))
        write(root, path, contents);
      git(root, "add", "--", `${contentPath}/sample/staged.txt`);
      const beforeStatus = status(root);
      const beforeIndex = git(
        root,
        "show",
        `:${contentPath}/sample/staged.txt`,
      );
      write(
        root,
        "package.json",
        JSON.stringify({
          scripts: { build: "node started.mjs", dev: "node started.mjs" },
        }),
      );
      write(
        root,
        "started.mjs",
        "import { writeFileSync } from 'node:fs'; writeFileSync('setup-ran.txt', 'unexpected');\n",
      );

      const result = run(script);

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/refusing destructive fixture sync/);
      expect(existsSync(join(root, "setup-ran.txt"))).toBe(false);
      expect(status(root)).toBe(beforeStatus);
      expect(git(root, "show", `:${contentPath}/sample/staged.txt`)).toBe(
        beforeIndex,
      );
      for (const [path, contents] of Object.entries(personal))
        expect(readFileSync(join(root, path), "utf8")).toBe(contents);
      expect(readFileSync(join(root, "outside/sentinel.txt"), "utf8")).toBe(
        "outside must survive\n",
      );
    },
  );

  it("test_fixture_gate_reports_build_failure: real multibook CLI fails on its final default rebuild", () => {
    write(
      root,
      "package.json",
      JSON.stringify({ scripts: { build: "node build.mjs" } }),
    );
    write(
      root,
      "build.mjs",
      `
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const samplePath = ${JSON.stringify(samplePath)};
if (process.env.TOME_BOOKS) {
  assert.equal(process.env.TOME_BOOKS, 'fixtures/handbook,fixtures/docs-book');
  writeFileSync(samplePath, '# Fixture content\\n');
  writeFileSync('${contentPath}/fixture-residue.txt', 'fixture residue');
  const html = '<a href="/handbook" aria-current="true">The Sacred Handbook</a><a href="/docs-book">docs-book</a>';
  for (const slug of ['', 'handbook', 'handbook/first', 'handbook/section/nested', 'docs-book', 'docs-book/overview', 'docs-book/details/deep']) {
    const file = 'dist/' + (slug ? slug + '/' : '') + 'index.html';
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }
} else {
  assert.equal(readFileSync(samplePath, 'utf8'), ${JSON.stringify(sample)});
  writeFileSync('final-build-evidence.txt', 'default build saw restored sample');
  console.log('FINAL DEFAULT BUILD FAILURE');
  writeFileSync(samplePath, '# Failed default build content\\n');
  writeFileSync('${contentPath}/default-residue.txt', 'default residue');
  process.exit(37);
}
`.trimStart(),
    );

    const result = run("check-multibook.mjs");

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("OK — two-tome Bibliotheca");
    expect(result.stdout).toContain("rebuilding default");
    expect(result.stdout).toContain("FINAL DEFAULT BUILD FAILURE");
    expect(result.stderr).toContain("FAIL");
    expect(readFileSync(join(root, "final-build-evidence.txt"), "utf8")).toBe(
      "default build saw restored sample",
    );
    expectSample();
    expect(readdirSync(join(root, contentPath))).toEqual(["sample"]);
  });

  it("test_live_reload_stops_before_restore_on_failure: real server stops before content and temp cleanup", () => {
    cpSync(
      join(projectRoot, "fixtures/handbook"),
      join(root, "fixtures/handbook"),
      { recursive: true },
    );
    symlinkSync(
      join(projectRoot, "node_modules"),
      join(root, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    write(
      root,
      "package.json",
      JSON.stringify({ scripts: { dev: "node start-dev.mjs" } }),
    );
    write(
      root,
      "start-dev.mjs",
      `
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(samplePath)}, ${JSON.stringify(liveFixture)});
const child = spawn(process.execPath, ['server.mjs'], { env: process.env, detached: true, stdio: 'ignore', windowsHide: true });
child.unref();
const deadline = Date.now() + 5000;
while (!existsSync('.astro/dev.json') && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
if (!existsSync('.astro/dev.json')) throw new Error('test server failed to start');
`.trimStart(),
    );
    write(
      root,
      "server.mjs",
      `
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const book = process.env.TOME_BOOK;
const server = createServer((_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(readFileSync(join(book, 'src/first.md'), 'utf8').includes('LIVE RELOAD CONFIRMED') ? '<h1>LIVE RELOAD CONFIRMED</h1>' : '<h1>First Chapter</h1>');
});
server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const data = { pid: process.pid, port, url: 'http://127.0.0.1:' + port, background: true, startedAt: new Date().toISOString() };
  mkdirSync('.astro', { recursive: true });
  writeFileSync('server-started.json', JSON.stringify({ ...data, book }));
  writeFileSync('.astro/dev.json', JSON.stringify(data));
});
setTimeout(() => { server.close(); process.exit(0); }, 25000).unref();
`.trimStart(),
    );
    // Windows terminates Node directly on SIGTERM. Observe the real Astro
    // liveness probe instead of relying on an unavailable child signal handler.
    // Forward every syscall and its result unchanged; this only records order.
    write(
      root,
      "observe-stop.mjs",
      `
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const kill = process.kill.bind(process);
process.kill = function (pid, signal) {
  try {
    return kill(pid, signal);
  } catch (error) {
    if (signal === 0 && error.code === 'ESRCH' && existsSync('server-started.json') && !existsSync('stop-evidence.json')) {
      const started = JSON.parse(readFileSync('server-started.json', 'utf8'));
      if (pid === started.pid) writeFileSync('stop-evidence.json', JSON.stringify({ pid, content: readFileSync(${JSON.stringify(samplePath)}, 'utf8'), bookExists: existsSync(started.book), argv: process.argv }));
    }
    throw error;
  }
};
`.trimStart(),
    );
    const observer = pathToFileURL(join(root, "observe-stop.mjs")).href;

    const result = run("check-live-reload.mjs", {
      NODE_OPTIONS: `--import=${observer}`,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("original chapter served");
    expect(result.stderr).toContain(
      "the parent-relative image did not resolve after the live edit",
    );
    const started = JSON.parse(
      readFileSync(join(root, "server-started.json"), "utf8"),
    ) as { pid: number; book: string };
    const stopped = JSON.parse(
      readFileSync(join(root, "stop-evidence.json"), "utf8"),
    );
    expect(stopped.pid).toBe(started.pid);
    expect(stopped.content).toBe(liveFixture);
    expect(stopped.bookExists).toBe(true);
    expect(stopped.argv).toContain("stop");
    expect(alive(started.pid)).toBe(false);
    expect(existsSync(started.book)).toBe(false);
    expect(existsSync(dirname(started.book))).toBe(false);
    expectSample();
  }, 35_000);
});
