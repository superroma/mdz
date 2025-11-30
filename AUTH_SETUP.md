# Authentication Setup Guide

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
4. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: `MDZ` (or your app name)
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `userinfo.email` and `userinfo.profile`
   - Test users: Add your email for testing

5. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `MDZ Local Development`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (frontend dev)
     - `http://localhost:3001` (backend dev)
     - `http://localhost:3202` (frontend E2E)
     - `http://localhost:3201` (backend E2E)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (dev)
     - `http://localhost:3201/api/auth/google/callback` (E2E tests)

6. Click **Create** and copy your:
   - Client ID
   - Client Secret

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Google credentials:

```bash
JWT_SECRET=your-random-secret-key-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
# BACKEND_URL and FRONTEND_URL are auto-detected
```

### 3. Test the Login Flow

1. Start the app: `npm run dev` (from root)
2. Visit `http://localhost:5173/login`
3. You should see "Continue with Google" button
4. Click it to test the OAuth flow

**Note:** E2E tests run on different ports (`3201` for backend, `3202` for frontend) to avoid conflicts with your dev environment. You'll need to add these callback URLs to Google Console for E2E tests:
- `http://localhost:3201/api/auth/google/callback`

## Optional: GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - Application name: `MDZ Local`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. Click **Register application**
5. Copy your Client ID
6. Generate a new client secret and copy it

**Note:** Add these callback URLs for both dev and E2E testing:
- Dev: `http://localhost:3001/api/auth/github/callback`
- E2E: `http://localhost:3201/api/auth/github/callback`

### 2. Add to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Optional: Yandex OAuth Setup

### 1. Create Yandex OAuth App

1. Go to [Yandex OAuth](https://oauth.yandex.com/)
2. Create new application
3. Set callback URLs:
   - Dev: `http://localhost:3001/api/auth/yandex/callback`
   - E2E: `http://localhost:3201/api/auth/yandex/callback`
4. Copy Client ID and Secret

### 2. Add to .env

```bash
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
```

## Production Deployment

For production, just set a strong JWT secret:

```bash
JWT_SECRET=strong-random-secret-generate-with-openssl
# BACKEND_URL and FRONTEND_URL are auto-detected from request headers
```

Update the callback URLs in Google Cloud Console to match your domain:
- `https://your-domain.com/api/auth/google/callback`

## Troubleshooting

### "No authentication providers configured"

This means no `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` environment variables are set. Check:
- `.env` file exists in project root
- Variables are loaded correctly
- Backend restarted after adding variables

### OAuth redirect fails

Check:
1. Callback URL in Google Console matches exactly: `http://localhost:3001/api/auth/google/callback`
2. Backend is running on `http://localhost:3001`
3. Backend and Frontend URLs are auto-detected (defaults to localhost:3001 and origin header)

### "Unauthorized" after login

Check `JWT_SECRET` is the same across all environments.
