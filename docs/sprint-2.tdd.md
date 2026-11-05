# Sprint 2 TDD evidence

## Scope

Derived from `Project_ProductBacklog_Nhom16.docx` and `Project_UserStory_Nhom16.docx`: PB08, PB09, PB13, PB14, PB20, PB21, PB22 and PB23. PB09 was already present and was preserved.

## User journeys

- An approved employer can manage the lifecycle of its own job posts and attach a JD file.
- A candidate can apply once to an open job with a CV owned by that candidate.
- An employer can only view and update applications belonging to its own jobs.
- A candidate can see application status changes and in-app notifications.
- Candidates and employers can persist favorites with ownership checks.

## RED → GREEN evidence

| Guarantee | Test/command | Result |
| --- | --- | --- |
| Job and application status transitions reject invalid terminal transitions | `yarn test test/service/job/job-workflow.service.test.js` | RED: missing `job-workflow.service`; GREEN: 5 passing |
| Backend source compiles | `yarn build` in `backend` | PASS |
| Frontend types and production bundle compile | `yarn v-build` in `frontend` | PASS |
| Sprint 2 schema applies to MySQL | `yarn db:migrate` in `backend` | PASS, migration `202611040001` applied |
| API boots with initialized Sequelize associations | `yarn start`, then `GET /health` | PASS, HTTP 200 |

## Known pre-existing test gaps

The full backend suite currently reports 27 passing and 4 failing. The failures are pre-existing auth test contract mismatches (`createAuthController`, mocked role repository and registration validator fixture), not failures introduced by Sprint 2. The new Sprint 2 workflow test passes independently.

Frontend ESLint cannot run because the repository uses ESLint 9 without an `eslint.config.js`; TypeScript typecheck and Vite production build pass.

## Security review summary

- All new protected endpoints require JWT and numeric role checks.
- Employer job/application/CV operations verify ownership in services.
- Candidate application verifies CV ownership, job visibility and deadline.
- Unique database constraints prevent duplicate applications and favorites.
- JD upload checks extension, MIME type, file count and maximum size; files are stored locally and MySQL stores metadata only.
- Status changes and notification creation are atomic in a short transaction.
- Sequelize parameterization is used for database input; no raw string SQL was added.
