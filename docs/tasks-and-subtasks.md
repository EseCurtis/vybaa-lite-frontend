# Tasks and subtasks — 20 October 2026

## Product behavior

Tasks is the user-facing name for the existing Goal v2 domain. Routes stay at
`/app/goal` and mutations stay at `/api/v2/goals`, preserving existing links,
alarms, recommendations, reward ledgers and saved drafts.

The library has compact completion rows, selected list filters, server-side title
search, and a quick one-time task form with a due date. Each row keeps its existing
seeded accent. Quick completion uses the existing progress endpoint only when a
check-in task is due. Quantity and future tasks open their full detail flow.

The full creator retains count, check-in and adherence tracking, recurrence,
reminders, advanced miss policies, AI setup and saved drafts. “Finish once” now
means one check-in on a one-time schedule. “Stay consistent” is the existing
date-based adherence mode; existing adherence tasks are not reinterpreted. Changing
the tracking choice preserves typed counts and units. Placeholder and greeting
randomizers, feature flags and walkthrough persistence remain in place.

Task details open on Overview. Timeline still fetches only when its tab is active.
Overview independently loads subtasks; a subtask failure does not block task details.
Subtasks support add, rename, complete/reopen, remove and undo removal. They are
planning steps for the task's whole run, not repeating daily check-ins. They do not
award points or change parent progress. Ended, paused and archived tasks are read-only.

## API and storage

`GET /api/v2/goals/:goalId/subtasks` returns up to 100 active subtasks in stable
creation order. `POST` accepts a client-generated UUID and trimmed title. Repeating
the same creation request is idempotent. `PATCH /:subtaskId` accepts a revision and
title/completed/deleted changes. Stale revisions return 409; the UI refreshes the
saved state while preserving typed input. Unknown payload fields are rejected.

All operations derive ownership from authentication and the parent task. Mutations
lock the parent row, preventing concurrent requests from exceeding the 100-step
limit. Removal is soft deletion and supports undo. Parent deletion cascades to its
subtasks. No mutation changes existing rewards, recurrence or occurrence records.

The additive migration is:

`cloud/prisma/migrations/20261020010000_goal_subtasks/migration.sql`

Deploy the backend migration before releasing the app's subtask interface. Database
deployment is separate from these local commits. The local integration test uses
an explicitly isolated PostgreSQL database and refuses remote database targets.

## Verification

App tests cover the real Finish once payload, preservation of quantity inputs and
adherence drafts, and subtask add/complete/remove/restore with server revisions.
Backend tests exercise authenticated HTTP routes against temporary PostgreSQL:
ownership, persistence, retries, invalid payloads, stale updates, read-only states,
concurrent additions at the limit, search ownership and unchanged parent progress.

Run the database test with DATABASE_URL and SUBTASK_TEST_DATABASE_URL both pointing
to `postgresql://…@127.0.0.1:PORT/vybaa_subtask_test`, plus test JWT secrets, then:

`node_modules/.bin/tsx --test src/services/goal-subtask.integration.test.ts`

The default backend test suite skips database integration unless that explicit test
database variable is present.
