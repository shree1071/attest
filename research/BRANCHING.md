# Client-Approval Git Branching Strategy (2-Branch Model)

This repository follows the **2-Branch Client-Approval Model** optimized for solo developers delivering software to clients with continuous deployment on Vercel.

---

## 1. Branch Topology

```
[feature/xxx] ──┐ (Squash & Merge)
                ▼
           [ staging ] ──────────────► Vercel Preview Deploy (Client Sandbox)
                │
         (Client Sign-off)
                ▼
            [ main ]   ──────────────► Vercel Production Deploy (Live Site)
```

### The 2 Permanent Branches

1. **`main` (Production Branch)**:
   * Always deployable.
   * Linked directly to the production domain: [https://attest-tau-sand.vercel.app](https://attest-tau-sand.vercel.app).
   * Direct commits to `main` are restricted; code only enters `main` via PR from `staging` after formal client sign-off.

2. **`staging` (Client-Approval Sandbox)**:
   * Mirrors production environment.
   * Linked to Vercel preview environments: whenever code is pushed to `staging`, Vercel builds a preview deployment for client testing.
   * Gives the client a zero-risk sandbox to verify features and provide feedback.

---

## 2. Daily Development Workflow

1. **Create Short-Lived Feature Branch**:
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feat/widget-customizer
   ```

2. **Develop & Test Locally**:
   ```bash
   npm test
   npm run build
   ```

3. **Open Pull Request into `staging`**:
   * Open PR: `feat/widget-customizer` → `staging`.
   * GitHub Actions CI automatically runs tests on the PR.
   * Merge with **Squash and Merge** into `staging`.
   * Vercel immediately publishes a preview URL for client testing.

4. **Client Sign-off & Production Promotion**:
   * Client tests changes on the staging URL.
   * Once approved, open PR: `staging` → `main`.
   * Merging into `main` automatically promotes the build to production.

---

## 3. Core Rules for Solo Maintenance

1. **Squash and Merge**: Combine WIP commits into single, descriptive commits so the git log reads like an executive changelog.
2. **Short-Lived Feature Branches**: Merge branches within 24–48 hours to prevent merge conflicts.
3. **No Branch Drift for Research**: Store technical spikes and POC notes inside `/research` rather than unmerged experimental branches.
