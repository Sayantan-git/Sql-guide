# SQL Preparation Studio

A separate, portable SQL learning application inspired by the architecture explorer's navigation and indexed explanations. It contains original supplemental SQL study content; no PDF was accessible during creation, so it does not claim to reproduce an unseen PDF.

## Publish on GitHub Pages

Start with [GITHUB-SETUP.md](GITHUB-SETUP.md). It includes the other-PC upload steps, GitHub Pages settings, deployment, and browser checks. Visitors open the URL and use the app directly. There is no sign-in or remote progress storage.

The [GitHub upload ZIP](dist/SQL-Preparation-GitHub.zip) contains a standalone repository-root project, including `.github/workflows/deploy-pages.yml`. Extract it and upload its **contents** to a new public repository root; do not upload the ZIP or the full MM2 repository. In **Settings > Pages**, choose **GitHub Actions**. The workflow builds and tests the app, then publishes only `dist/site`. No remote resources have been created or deployed by preparing this package.

No Supabase project, OAuth application, access token, database, repository variables, or manually configured secrets are needed. The default github.io URL needs no paid domain. Public-repository Pages hosting is available on GitHub Free, subject to its quotas and policies.

Original browser-local progress remains: learned topics, bookmarks, notes, reviews, and latest quiz answers. Export/import is optional for manual transfer. Progress is not automatically shared across devices or uploaded to GitHub. The study material is public; never include confidential data in the published package.

## Open Without Installation

After building, separate folders and ZIPs are available:

- [Windows application](dist/SQL-Preparation-Windows/OPEN-SQL.html) and [Windows ZIP](dist/SQL-Preparation-Windows.zip).
- [Android application](dist/SQL-Preparation-Android/OPEN-SQL.html) and [Android ZIP](dist/SQL-Preparation-Android.zip).

Extract the ZIP, then open OPEN-SQL.html in a modern browser. Each folder has its own README. All UI libraries, fonts, diagrams, content, the worker, and the SQLite WebAssembly binary are embedded. No internet connection or laptop server is required after transfer.

Android file-manager previews may not execute JavaScript or grant Chrome access to local files. Use a compatible, approved offline HTML viewer/browser with JavaScript, WebAssembly, and Web Workers enabled, or an approved internal host. This is not an APK. On touch screens, tap instead of hovering.

## Study Scope

The twelve-stage roadmap covers relational foundations, keys/design, queries, joins/sets, grouping/windows, reusable objects, changes, transactions, performance, programmability, production, and interview patterns. Every lesson contains a concise definition, when, why, real-world case, syntax, pitfall, and recall answer.

Other views provide nineteen side-by-side comparisons, active-recall cards, thirty-two scored questions, seven worked coding challenges, syntax reference, personal notes/bookmarks, and a real local SQL playground. Progress can be exported/imported as JSON. Local persistence depends on browser/file-origin policy.

The lesson examples are SQL Server/T-SQL with a SQL Server 2022 baseline and selected version notes. They are isolated educational examples; DDL/DML and administrative snippets may need setup, parameters, permissions, and a disposable training database. SQL Server examples have not been executed against a live SQL Server instance.

The playground runs SQLite through SQL.js, not SQL Server. Its twelve exercises are executed in automated tests against the same fictional shop dataset. SQL Server-specific stored procedures, hints, isolation levels, and plans cannot be validated in this playground. Queries are isolated in a Web Worker and cancelled after four seconds; cancellation recreates sample data. Display is limited to 300 rows per result. The playground never connects to a remote database.

## Build, Test, and Preview

Use Node.js 20+ from this directory:

```powershell
npm ci
npm run build
npm test
npm start
```

The build generates both offline editions, the GitHub source ZIP, and the static Pages artifact. The server normally listens at http://127.0.0.1:4180 and selects another port if occupied. `/` previews the app; `/hosted/` previews the identical Pages output. It exposes only allowlisted pages/downloads. Editing source requires rebuilding before previewing. `npm run build:github` is used by the Pages workflow and needs no environment variables. Builds replace generated package folders so removed features cannot linger in old output.

## Files

| Location | Purpose |
|---|---|
| [content/](content/) | Original lessons, comparisons, interview questions, and sample SQL |
| [app.mjs](app.mjs) | Navigation, lesson drawer, study modes, search, and lab controls |
| [progress.mjs](progress.mjs) | Validated local study state and review intervals |
| [GITHUB-SETUP.md](GITHUB-SETUP.md) | Upload steps, Pages settings, URL access, and local progress limitations |
| [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) | Build, test, and deploy the static site on pushes to main |
| [worker.mjs](worker.mjs) | Actual SQLite execution away from the UI thread |
| [styles.css](styles.css) | Desktop/mobile layout and interaction styling |
| [build.mjs](build.mjs) | Offline bundling, fonts, notices, guide, source packaging, and ZIP checksums |
| [tests/](tests/) | Lesson contracts, cross-references, real SQL examples, progress, and package checks |

Tests cover the curriculum, executable SQLite examples, local progress validation, dark-theme contrast, standalone packages, and a Pages artifact with no account controls or remote-saving dependencies. The final GitHub deployment still needs the repository upload and Pages configuration described in the setup guide.

Further-reading links are available in the application's Scope & references view. The curriculum is broad core-to-advanced preparation, not an exhaustive catalog of every vendor-specific database feature. The packages contain no MM2 source, secrets, or environment files; all sample records are fictional.