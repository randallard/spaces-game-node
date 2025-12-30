# Email Integration Plan

## Overview
Add automated email sending for challenge/round links to eliminate the need to manually copy/paste URLs between players.

## Architecture

### Deployment Strategy
- **Frontend**: GitHub Pages (current setup)
- **Backend API**: Vercel Serverless Functions (email sending only)
- **Email Service**: Resend (free tier: 3,000 emails/month)

### Why This Architecture?
1. **Separation of Concerns**: Static frontend stays on GitHub Pages, dynamic API on Vercel
2. **Free Tiers**: Both GitHub Pages and Vercel are free for this use case
3. **Scalability**: Serverless scales automatically
4. **Security**: API keys stay server-side, not exposed in client code

## Deployment Options

### Option A: Manual Deployment (Simpler)
- Deploy frontend to GitHub Pages via existing workflow
- Deploy API to Vercel manually via Vercel CLI
- Two separate deployments

**Pros:**
- Simple to set up
- Clear separation
- Each can be deployed independently

**Cons:**
- Two manual steps
- Could forget to deploy API changes

### Option B: GitHub Actions to Vercel (Automated)
- Deploy frontend to GitHub Pages via existing workflow
- Deploy API to Vercel from GitHub Actions using Vercel CLI

**Pros:**
- Single git push triggers both deployments
- Fully automated
- Version sync between frontend and API

**Cons:**
- More complex setup
- Need to store Vercel credentials in GitHub secrets

### Option C: Vercel for Everything (Simplest)
- Deploy entire app (frontend + API) to Vercel
- Vercel serves static files + serverless functions
- Stop using GitHub Pages

**Pros:**
- Single deployment
- Simplest workflow
- Vercel auto-deploys on git push
- Preview deployments for PRs

**Cons:**
- Move away from GitHub Pages
- Vercel free tier bandwidth limits (100 GB/month - likely fine)

## Recommended Approach: Option B

Deploy API to Vercel from GitHub Actions while keeping frontend on GitHub Pages.

### Implementation Steps

#### 1. Project Structure
```
spaces-game-node/
├── src/                    # Frontend (deployed to GitHub Pages)
├── api/                    # Vercel serverless functions
│   └── send-email.ts       # Email sending endpoint
├── .github/
│   └── workflows/
│       ├── deploy.yml      # Existing GitHub Pages deployment
│       └── deploy-api.yml  # New: Deploy API to Vercel
└── vercel.json             # Vercel configuration
```

#### 2. Vercel Configuration (`vercel.json`)
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@latest"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### 3. GitHub Actions Workflow (`.github/workflows/deploy-api.yml`)
```yaml
name: Deploy API to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - 'vercel.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy to Vercel
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

#### 4. Required GitHub Secrets
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `RESEND_API_KEY`: Resend email API key (used by Vercel function)

#### 5. API Endpoint (`api/send-email.ts`)
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, challengeUrl, senderName } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Spaces Game <noreply@yourdomain.com>',
      to: [to],
      subject: subject,
      html: `
        <h2>You've been challenged to a game!</h2>
        <p>${senderName} has challenged you to a game of Spaces!</p>
        <p><a href="${challengeUrl}">Click here to view the challenge</a></p>
        <p>Or copy this link: ${challengeUrl}</p>
      `,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
```

#### 6. Frontend Changes

**Update Opponent Type** (`src/types/opponent.ts`):
```typescript
export type Opponent = {
  id: string;
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
  hasCompletedGame?: boolean;
  email?: string; // NEW: Optional email address
};
```

**Create Email Utility** (`src/utils/email-helpers.ts`):
```typescript
export async function sendChallengeEmail(
  recipientEmail: string,
  challengeUrl: string,
  senderName: string
): Promise<boolean> {
  try {
    const response = await fetch('https://your-vercel-api.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `${senderName} challenged you to a game!`,
        challengeUrl,
        senderName,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
```

**Update OpponentManager UI**:
- Add email input field when creating/editing human opponents
- Show "Send via Email" button on ShareChallenge component
- Auto-send if opponent has email on file

#### 7. Local Development with Mailpit

For local testing, we can use Vercel CLI to run the functions locally and point to mailpit:

**Install Vercel CLI**:
```bash
pnpm add -D vercel
```

**Run locally**:
```bash
vercel dev
```

**Mailpit Setup** (Docker):
```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

**Environment Variables** (`.env.local`):
```
RESEND_API_KEY=re_test_key_for_local_development
SMTP_HOST=localhost
SMTP_PORT=1025
USE_MAILPIT=true
```

#### 8. Testing Strategy

1. **Local Testing**:
   - Run `vercel dev` to start local API server
   - Run `pnpm dev` to start frontend
   - Use mailpit to capture emails
   - Verify emails are sent and contain correct links

2. **Production Testing**:
   - Deploy to Vercel
   - Test with real email address
   - Verify CORS works from GitHub Pages domain
   - Test challenge flow end-to-end

## Migration Path

### Phase 1: Local Development with Mailpit

**Goal**: Build and verify all components locally before any deployment.

**Prerequisites**:
- Docker installed (for mailpit)
- Node.js 20+ installed
- pnpm installed

**Steps**:

1. **Set up Mailpit locally**
   ```bash
   # Start mailpit container
   docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit

   # Verify it's running
   # Open http://localhost:8025 in browser to see mailpit web UI
   ```

2. **Install dependencies**
   ```bash
   # Install Vercel CLI for local development
   pnpm add -D vercel

   # Install dependencies for API
   pnpm add -D @vercel/node
   pnpm add nodemailer
   pnpm add -D @types/nodemailer
   ```

3. **Create API structure**
   ```bash
   mkdir -p api
   touch api/send-email.ts
   touch vercel.json
   ```

4. **Implement local email endpoint** (`api/send-email.ts`)
   - Use nodemailer for local development (points to mailpit on localhost:1025)
   - Use environment variable to detect local vs production
   - When `USE_MAILPIT=true`, use nodemailer
   - When in production (Vercel), use Resend

5. **Create local environment file** (`.env.local`)
   ```
   USE_MAILPIT=true
   SMTP_HOST=localhost
   SMTP_PORT=1025
   # Optional: Add Resend key if you want to test real emails locally
   # RESEND_API_KEY=re_xxxxx
   ```

6. **Update Opponent type**
   - Add `email?: string` field to Opponent type
   - Update schema validation
   - Write tests for new field

7. **Add email input UI**
   - Update OpponentManager to include optional email field
   - Validate email format
   - Store in localStorage with opponent data

8. **Create email utility** (`src/utils/email-helpers.ts`)
   - Function to send challenge emails
   - Environment-aware API URL (localhost for dev, Vercel for prod)
   - Error handling and retry logic

9. **Update ShareChallenge component**
   - Add "Send via Email" button
   - Show success/error messages
   - Keep manual copy option as fallback

10. **Run and test locally**
    ```bash
    # Terminal 1: Run API server locally
    vercel dev --listen 3001

    # Terminal 2: Run frontend
    pnpm dev

    # Frontend runs on http://localhost:5173
    # API runs on http://localhost:3001
    ```

11. **Verify local flow**
    - [ ] Create opponent with email address
    - [ ] Start a game against that opponent
    - [ ] Generate challenge link
    - [ ] Click "Send via Email"
    - [ ] Check mailpit UI (http://localhost:8025) for email
    - [ ] Verify email contains correct challenge URL
    - [ ] Click link in email to verify it works

**Success Criteria for Phase 1**:
- ✅ Mailpit receives emails when "Send via Email" is clicked
- ✅ Emails contain valid challenge URLs
- ✅ No errors in console
- ✅ Email field saves/loads correctly from localStorage
- ✅ All existing tests still pass
- ✅ New tests added for email functionality

---

### Phase 2: Manual Deployment to Vercel

**Goal**: Deploy API to Vercel from dev box and verify integration with local frontend.

**Prerequisites**:
- Phase 1 completed and verified
- Vercel account created
- Resend account created (free tier)

**Steps**:

1. **Create Vercel account**
   - Sign up at https://vercel.com
   - Connect GitHub account (optional for manual deployment)

2. **Create Resend account**
   - Sign up at https://resend.com
   - Get API key from dashboard
   - Verify a domain OR use Resend's test domain (onboarding@resend.dev)

3. **Install Vercel CLI globally**
   ```bash
   npm install -g vercel
   ```

4. **Login to Vercel CLI**
   ```bash
   vercel login
   ```

5. **Configure Vercel project**
   ```bash
   # From project root, initialize Vercel project
   vercel
   # Follow prompts:
   # - Set up and deploy? N (not yet)
   # - Which scope? (select your account)
   # - Link to existing project? N
   # - Project name? spaces-game-api
   # - Directory? ./
   # - Override settings? N
   ```

6. **Add environment variables to Vercel**
   ```bash
   # Add Resend API key
   vercel env add RESEND_API_KEY
   # When prompted, enter your Resend API key
   # Select: Production, Preview, Development
   ```

7. **Update API endpoint for production**
   - Modify `api/send-email.ts` to use Resend when not in local mode
   - Ensure CORS allows localhost during testing

8. **Deploy API to Vercel**
   ```bash
   # Deploy to production
   vercel --prod

   # Vercel will output a URL like: https://spaces-game-api.vercel.app
   # Save this URL!
   ```

9. **Update frontend to use Vercel API**
   - Update `src/utils/email-helpers.ts`
   - Change API URL based on environment:
     ```typescript
     const API_URL = import.meta.env.DEV
       ? 'http://localhost:3001'
       : 'https://spaces-game-api.vercel.app';
     ```

10. **Test local frontend with deployed API**
    ```bash
    # Run frontend locally
    pnpm dev

    # Test email sending - it should now use Vercel API
    ```

11. **Verify integration**
    - [ ] Local frontend can call Vercel API
    - [ ] CORS works correctly
    - [ ] Email sends to real email address (check your inbox)
    - [ ] Error handling works (try invalid email)
    - [ ] Rate limiting doesn't interfere with testing

12. **Update CORS for production**
    - Update `api/send-email.ts` CORS settings
    - Allow both localhost AND your GitHub Pages domain:
      ```typescript
      const allowedOrigins = [
        'http://localhost:5173',
        'https://yourusername.github.io'
      ];
      ```

**Success Criteria for Phase 2**:
- ✅ API deployed to Vercel successfully
- ✅ Local frontend can send emails via Vercel API
- ✅ Real emails received in inbox (not mailpit)
- ✅ CORS configured for both local and production domains
- ✅ Environment variables working in Vercel
- ✅ Error handling tested and working

---

### Phase 3: GitHub Actions Deployment

**Goal**: Automate API deployment from GitHub Actions.

**Prerequisites**:
- Phase 2 completed and verified
- API working on Vercel when deployed manually

**Steps**:

1. **Get Vercel credentials**
   ```bash
   # Get Vercel token
   # Go to https://vercel.com/account/tokens
   # Create new token named "GitHub Actions"
   # Save the token (you'll only see it once!)
   ```

2. **Get Vercel project IDs**
   ```bash
   # From project root
   cat .vercel/project.json

   # You'll see:
   # {
   #   "orgId": "team_xxxxx",
   #   "projectId": "prj_xxxxx"
   # }
   ```

3. **Add GitHub secrets**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Token from step 1
     - `VERCEL_ORG_ID`: orgId from step 2
     - `VERCEL_PROJECT_ID`: projectId from step 2
     - `RESEND_API_KEY`: Your Resend API key

4. **Create GitHub Actions workflow**
   ```bash
   mkdir -p .github/workflows
   touch .github/workflows/deploy-api.yml
   ```

5. **Implement workflow** (`.github/workflows/deploy-api.yml`)
   ```yaml
   name: Deploy API to Vercel

   on:
     push:
       branches: [main]
       paths:
         - 'api/**'
         - 'vercel.json'
         - '.github/workflows/deploy-api.yml'

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Install Vercel CLI
           run: npm install --global vercel@latest

         - name: Pull Vercel Environment Information
           run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
           env:
             VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
             VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

         - name: Build Project Artifacts
           run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
           env:
             VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
             VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

         - name: Deploy Project Artifacts to Vercel
           run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
           env:
             VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
             VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
   ```

6. **Test automated deployment**
   ```bash
   # Make a small change to api/send-email.ts (e.g., add a comment)
   git add api/send-email.ts
   git commit -m "test: trigger API deployment"
   git push origin main

   # Watch GitHub Actions tab in repo
   # Verify deployment succeeds
   ```

7. **Verify deployed changes**
   - [ ] GitHub Action completes successfully
   - [ ] Vercel shows new deployment
   - [ ] API still works from local frontend
   - [ ] Email sending still works

**Success Criteria for Phase 3**:
- ✅ GitHub Action runs on API changes
- ✅ Deployment succeeds automatically
- ✅ No manual deployment needed
- ✅ Secrets properly configured
- ✅ API continues working after automated deployment

---

### Phase 4: Full Integration

**Goal**: Complete UI integration and polish the feature.

**Steps**:

1. **Update ShareChallenge component**
   - Add "Send via Email" button (if opponent has email)
   - Show loading state while sending
   - Show success message with email address
   - Show error message if send fails
   - Keep copy URL button as fallback

2. **Add email to opponent creation flow**
   - OpponentManager: Add optional email field
   - Validate email format
   - Show helper text: "Optional: Enter email to automatically send challenge links"

3. **Add email to opponent editing**
   - Allow editing opponent email from opponent management screen
   - Update validation

4. **Email templates**
   - Create nice HTML email template
   - Include game logo/branding
   - Clear call-to-action button
   - Fallback plain text version

5. **Error handling**
   - Network errors: Show message, keep URL visible
   - Invalid email: Validate before sending
   - Rate limiting: Show friendly message
   - Failed send: Offer to retry

6. **User preferences** (optional, future enhancement)
   - Add setting: "Automatically send challenge links via email"
   - Add setting: "Send me email notifications for round completions"

7. **Testing**
   - [ ] Test with valid email
   - [ ] Test with invalid email
   - [ ] Test with opponent without email (button shouldn't show)
   - [ ] Test error handling
   - [ ] Test on mobile layout
   - [ ] Cross-browser testing

8. **Deploy frontend to GitHub Pages**
   ```bash
   git add .
   git commit -m "feat: add email integration for challenge links"
   git push origin main

   # GitHub Pages will auto-deploy
   ```

9. **End-to-end verification**
   - [ ] Create opponent with email on production site
   - [ ] Send challenge via email
   - [ ] Receive email in inbox
   - [ ] Click link in email
   - [ ] Challenge loads correctly
   - [ ] Complete full game flow

**Success Criteria for Phase 4**:
- ✅ Email integration works end-to-end on production
- ✅ UI is polished and user-friendly
- ✅ Error handling covers edge cases
- ✅ Email templates look professional
- ✅ Feature is documented
- ✅ Tests provide good coverage

## Questions to Resolve

1. **Domain for Sending Emails**:
   - Use Resend's test domain for now?
   - Or set up custom domain (e.g., `game.yourdomain.com`)?

2. **Email Templates**:
   - Plain text vs HTML?
   - Should we create React Email templates for better styling?

3. **Privacy**:
   - Where to store opponent emails? (Currently in localStorage - is this acceptable?)
   - Add privacy notice about email usage?

4. **Rate Limiting**:
   - Should we add rate limiting to prevent abuse?
   - Vercel has built-in rate limiting, but should we add application-level?

5. **Error Handling**:
   - What happens if email fails to send?
   - Show error message? Still show URL to copy manually?

## Costs (All Free Tiers)

- **Vercel**: Free (100 GB bandwidth, unlimited functions)
- **Resend**: Free (3,000 emails/month, 100/day)
- **GitHub Pages**: Free (1 GB storage, 100 GB bandwidth/month)
- **Mailpit** (local): Free (Docker container)

**Total Monthly Cost**: $0

## Alternative: Simplify with Vercel-Only Deployment

If GitHub Pages becomes a limitation, we could simplify by deploying everything to Vercel:

**Benefits**:
- Single deployment target
- Auto-deploy on push to main
- Preview deployments for PRs
- Simpler architecture
- Built-in environment variables
- Better DX

**Tradeoffs**:
- Move away from GitHub Pages
- Slight vendor lock-in (though easy to migrate)

## Decision: Holding for Discord Integration

**Date**: 2025-12-29

After exploring options, we've decided to **prioritize Discord integration** over email integration. Discord offers:
- Better user experience for gamers
- Completely free (no service costs)
- More interactive features (buttons, embeds, real-time)
- Stronger community building potential
- OAuth provides single sign-on benefits

Email integration may be revisited later as a secondary notification channel, but Discord will be our primary focus.

**See**: [Discord Integration Plan](./DISCORD_INTEGRATION_PLAN.md) for full details on Discord OAuth and bot implementation.

---

## Next Steps (If Returning to Email Later)

1. Discuss and finalize deployment approach
2. Set up Vercel and Resend accounts
3. Implement API endpoint
4. Test locally with mailpit
5. Deploy and test end-to-end
