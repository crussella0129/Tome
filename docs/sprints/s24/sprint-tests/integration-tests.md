# Sprint 24 Integration Verification

## Recorded during Build

### `verify_dev_serves_document` (T-072 clause 2), 23 November 2026

Run on this machine with a scratch script: the loader, then
`astro dev --background --port 4331` with `TOME_BOOK` set, a request for `/`,
an edit to the source on disk, ten seconds' wait, `astro dev logs`, and
`astro dev stop`. Not in CI, as the plan says.

| `TOME_BOOK` names | `/` | notice logged | watcher added | after the edit |
|---|---|---|---|---|
| a `.md` file | 200, shows its heading | yes | no | no `synced` line; the page shows the old text |
| a folder of documents | 200, shows its `README.md` | yes | no | no `synced` line; the page shows the old text |
| an mdBook (a copy of `fixtures/handbook`) | 200, shows its title | no | yes (`live reload watching …/src`) | `synced …/README.md → reloading`; the page shows the edit |

The notice, as logged under the label `tome-live-reload`: "live reload is off
for documents: restart `npm run dev` to see a change to them".

The first attempt read the server's own output and found no notice. The cause
was the check, not the hook: Astro 7 puts a dev server started without a
terminal in the background, so its lines are read with `astro dev logs` and it
is stopped with `astro dev stop`. The check was changed to do both.

### `verify_real_paper_converts` (T-066 Notes)

Not run. No paper of the owner's had been given when T-066 passed, so the
reading of a real Word or Google Docs file is still owed at the Test phase,
with the checklist in the test plan.
