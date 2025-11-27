# OpenID Connect auth

Use some react library for login with several providers
Possible providers to test will be Google, Yandex, GitHub

Add current user avatar or icon to the top right - when clicked it should show user name/email - whatever it is in token and a Logout option.

## Technology Choices

**Backend:**
- `@fastify/oauth2` - Provider-agnostic OAuth2/OIDC plugin for Fastify
- `@fastify/jwt` - For creating/validating JWTs after OAuth success

**Frontend:**
- `shadcn/ui` - UI components (Button, Avatar, DropdownMenu) for login page and user menu
- `react-icons` - Provider logos/icons

**Configuration:**
- All provider config in environment variables
- Dynamic provider registration (no hardcoded providers in app code)
- Backend exposes `/api/auth/providers` endpoint
- Frontend dynamically renders login buttons based on enabled providers

## E2E Testing Strategy

**No real OAuth providers in tests:**
- E2E tests generate JWT directly using `jsonwebtoken` package
- Inject token into localStorage via Playwright
- Backend validates with same `JWT_SECRET` (shared between test and backend in test mode)
- Reusable step: `Given I am logged in as "user@example.com"`
- No special test routes needed - tests simulate "app reload with existing token" scenario
