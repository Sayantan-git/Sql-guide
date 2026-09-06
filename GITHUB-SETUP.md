# GitHub Pages Deployment

This package is the independent SQL Preparation Studio. It must be uploaded into its own repository, not into the MM2 application repository. It contains no MM2 backend files or credentials. Use your organization's approved hosting and data-storage services when sharing company-related work.

## What You Need

- A GitHub account to upload and deploy the app.
- A new public repository for free GitHub Pages hosting, subject to GitHub's limits and policies.
- The current SQL-Preparation-GitHub ZIP, extracted on the PC used for uploading.

Visitors open the Pages URL and immediately use the app. No visitor login, Supabase project, OAuth application, access token, database, repository variables, or manually configured secrets are needed. GitHub Actions supplies its own temporary deployment credentials.

The site and its learning material are public. Original browser-local progress and optional export/import remain; there is no cloud saving, automatic device synchronization, or central learner tracking. Never upload private notes, credentials, or the MM2 application to the public repository.

## 1. Extract the GitHub Project on the Other PC

Download and extract `SQL-Preparation-GitHub.zip`. Open the extracted `SQL-Preparation-GitHub` folder. Its root must contain:

```text
package.json
package-lock.json
README.md
GITHUB-SETUP.md
app.mjs
index.html
styles.css
progress.mjs
worker.mjs
build.mjs
server.mjs
content/
tests/
.github/workflows/deploy-pages.yml
```

Do not upload the ZIP itself as the website, or upload an extra enclosing folder. Do not upload `node_modules`, `.env` files, or generated `dist` files. GitHub Actions builds the site from the source. Make sure the hidden `.github` directory is included.

## 2. Create the GitHub Repository

Create a repository such as `sql-preparation-studio` under your personal account or approved organization. The expected project Pages URL is:

```text
https://YOUR-USERNAME.github.io/sql-preparation-studio/
```

Choose **Public** for the simplest free personal-account setup. Pages availability for private repositories depends on your GitHub plan and organization policy. Start with an empty repository if you plan to push via Git. Preparing this package does not create a repository, push code, or deploy remotely.

## 3. Upload the Source

### Option A: GitHub Desktop

1. Clone the empty repository on the other PC using GitHub Desktop.
2. Copy the extracted project contents into that cloned repository root, including `.github`.
3. Review the changed files. Confirm no `.env`, `node_modules`, private keys, MM2 source, or unrelated files are included.
4. Commit and push to `main` using GitHub Desktop's authenticated workflow.

### Option B: Git Command Line

Run from the extracted project folder after installing Git:

```powershell
git init
git branch -M main
git add .
git commit -m "Add SQL study studio for GitHub Pages"
git remote add origin https://github.com/YOUR-USERNAME/sql-preparation-studio.git
git push -u origin main
```

Authenticate through Git Credential Manager/GitHub's browser prompt. Never put a token in the remote URL or commit it. These commands assume an empty target repository; for an existing repository, clone it and copy the project into the clone rather than force-pushing.

### Option C: Browser Upload

Use **Add file > Upload files** to upload the extracted contents, not the ZIP. Verify that `package.json` is at the repository root and `.github/workflows/deploy-pages.yml` exists. Some file pickers hide dot directories; GitHub Desktop or Git is more reliable for preserving `.github`. No single source file in this package needs the large generated HTML to be uploaded manually.

## 4. Enable Pages and Deploy

1. Open **Repository > Settings > Pages** and select **GitHub Actions** as the build/deployment source.
2. In **Actions**, enable workflows if prompted and run **Deploy SQL Studio to GitHub Pages** using **Run workflow**, or push to `main`.
3. The workflow installs locked dependencies, builds the static website and offline packages, and runs the tests. The deploy job runs only after a successful build/test job. Node.js is installed by the workflow; you do not need it on the upload PC.
4. The published artifact is **dist/site**, not the entire repository. Pages deployment uses `pages: write` and `id-token: write`; build jobs only need `contents: read`.
5. Open the URL reported by the successful deployment or **Settings > Pages > Visit site**. It should look like `https://YOUR-USERNAME.github.io/sql-preparation-studio/`. The learning path opens directly, without sign-in.

Every push to `main` rebuilds and deploys the site. If the first workflow runs before Pages is configured, complete the Pages setting and rerun it. Do not bypass failed tests. No custom domain or paid service is required for the default github.io URL.

## 5. Verify the Published URL

1. Open the URL in a browser, including a private window. The app should appear without an account dialog.
2. Open a lesson, search for a concept, and run a sample query in the SQL playground.
3. In a normal browser window, mark a topic learned and refresh. It should remain marked when browser storage is available.
4. Open the same URL on a phone. The app should work, but that browser starts with its own local progress.
5. Check the offline ZIP downloads under **Scope & references**.

The app uses URL fragments for study views, so refreshing a lesson link does not require a server-side route or SPA rewrite. Download links are relative to the repository's Pages URL.

## Local Progress

- Learned topics, bookmarks, notes, review schedules, and latest quiz answers stay in that browser when local storage is available.
- Clearing site data, private browsing, a different browser profile, or another device can mean different or missing progress.
- The optional Export/Import controls still transfer progress manually. They do not upload anything to GitHub.
- Reset affects local study state, not your repository or exported files.
- No visitor account, remote progress records, automatic commits, or learner analytics are created by this app. GitHub still serves the site under its own hosting and privacy policies.
- Browser storage is not encrypted account storage. Use a trusted browser profile for personal notes and keep confidential information out of this public study tool.

## Local Preview

Local preview is optional. From the extracted project folder with Node.js 20+ installed:

```powershell
npm ci
npm run build:github
npm test
npm start
```

The server prints its localhost URL, normally http://127.0.0.1:4180. Both `/` and `/hosted/` open the same local-storage app; `/hosted/` previews the generated Pages folder. `npm run build` and `npm run build:github` need no environment variables. The Windows and Android packages also work without this server.

## Troubleshooting

| Symptom | Check |
|---|---|
| Pages returns 404 | Deploy `dist/site`, choose Actions as Pages source, include `.github`, and inspect workflow output |
| No workflow appears | Include `.github/workflows/deploy-pages.yml` at the repository root and use the `main` branch |
| Build cannot find the package | Upload the extracted project contents at the root, without an extra enclosing folder |
| Old sign-in screen still appears | Replace the earlier source with this package, including its workflow and lockfile; wait for a successful deployment and refresh |
| Different progress on a phone | Expected: progress is browser-local; use optional export/import for manual transfer |
| Browser upload skips hidden files | Use GitHub Desktop or Git to preserve the `.github` directory |
| Deployment denied | Check the repository's Pages setting, Actions permissions, and organization policy |

## References

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages