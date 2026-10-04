# Sprint 21 baseline evidence

Before implementation, on 2026-09-06:

- Branch: `dev`, HEAD `2fa4a60` (`sprint-20: close (success)`).
- Existing user work: removed tracked `marginalia` and `tome` sample files,
  untracked `src/content/books/bible/`, modified `tome.config.toml`, and an
  untracked `.claude/` directory. Preserve all of it.
- `current-phase.sh`: `ready-for-next-sprint`.
- `check-substrate.sh`: `substrate-outdated:1->4`.
- `deploy-substrate.sh --check`: only pending action is substrate stamp 4.
- `deploy-substrate.sh`: `substrate-complete`, existing dev/main and remote
  human-approve profile preserved.
- `init-sprint.sh`: initialized Sprint 21; router reports `research`.
- `node --version`: `v24.12.0`.
- `node node_modules/vitest/vitest.mjs run`: exit 1; 18 test files passed and
  2 failed; 94 tests passed and 3 failed; reported duration 51.30 seconds.
  - `test_books_library`: expected marginalia/tome; observed bible.
  - `test_pager_prev_next`: no tome sample exists in the active content tree.
  - `test_resolve_owner_precedence`: direct test call to `userInfo()` throws
    `uv_os_get_passwd` ENOMEM in the restricted Windows execution environment.
- No production source edits or mutating fixture checks performed.
