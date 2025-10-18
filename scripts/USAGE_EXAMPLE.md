# Tenant Onboarding Wizard - Usage Example

This document provides a complete example of onboarding a new tenant using the automated wizard.

## Scenario

**Company:** Tech Innovations BV
**Domain:** techinnovations.rentguy.nl
**Goal:** Set up a new tenant for managing their DJ crew operations

## Step-by-Step Example

### 1. Start the Wizard

```bash
cd /srv/apps/RentGuy-v1
npm run onboard-tenant
```

### 2. Follow the Interactive Prompts

#### Step 1/8: Tenant Identification
```
? Enter tenant ID (slug, lowercase, no spaces): techinnovations
```

✅ **What happens:** The wizard validates that this ID is unique and follows naming conventions (lowercase, alphanumeric with hyphens).

---

#### Step 2/8: Tenant Details
```
? Enter tenant display name: Tech Innovations BV
? Enter tenant domain (e.g., client.rentguy.nl): techinnovations.rentguy.nl
```

✅ **What happens:** The wizard validates the domain format and checks it's not already in use.

---

#### Step 3/8: Branding
```
? Enter primary brand color (hex, e.g., #FF6B35): #9B59B6
? Enter logo URL (optional, press Enter to skip): https://techinnovations.nl/assets/logo.png
```

✅ **What happens:** Color is validated as hex format. Logo URL is validated as a proper URL or can be skipped.

---

#### Step 4/8: Custom Content
```
? Enter hero title: Tech Innovations Operations Hub
? Enter hero subtitle: Streamline your crew management and event planning
? Enter login welcome message: Welcome to Tech Innovations RentGuy
```

✅ **What happens:** All content fields are captured for customization.

---

#### Step 5/8: Demo Users
```
? Enter demo account 1 email: admin@techinnovations.nl
? Enter demo account 2 email: planner@techinnovations.nl
? Enter demo password: ********** (SecurePass2025!)
```

✅ **What happens:** Emails are validated and passwords must be at least 6 characters.

---

#### Step 6/8: Review Configuration
```
Tenant Configuration:
────────────────────────────────────────────────────────────
  ID:              techinnovations
  Name:            Tech Innovations BV
  Domain:          techinnovations.rentguy.nl
  Primary Color:   #9B59B6
  Logo URL:        https://techinnovations.nl/assets/logo.png
  Hero Title:      Tech Innovations Operations Hub
  Hero Subtitle:   Streamline your crew management and event planning
  Login Welcome:   Welcome to Tech Innovations RentGuy
  Demo Account 1:  admin@techinnovations.nl
  Demo Account 2:  planner@techinnovations.nl
────────────────────────────────────────────────────────────

? Does this configuration look correct? Yes
```

✅ **What happens:** You can review everything before applying. Type 'n' to cancel.

---

#### Step 7/8: Apply Configuration
```
✓ Configuration validated
✓ Configuration backed up to tenants.backup-2025-10-18T14-23-15-000Z.ts
✓ Tenant configuration added
✓ Demo users created
  ✓ User admin@techinnovations.nl created successfully with ID 44
  ✓ User planner@techinnovations.nl created successfully with ID 45

✓ Configuration applied in 2.8s
```

✅ **What happens:**
- Configuration is validated against all rules
- A timestamped backup is created
- New tenant is added to `src/config/tenants.ts`
- Demo users are created in the database with bcrypt-hashed passwords

---

#### Step 8/8: Testing
```
✓ Configuration file syntax valid
✓ Demo users can authenticate
  ✓ Login verified for admin@techinnovations.nl with role admin
  ✓ Login verified for planner@techinnovations.nl with role user

Note: Domain accessibility test requires the application to be deployed.
  Visit https://techinnovations.rentguy.nl after deployment to verify.
```

✅ **What happens:**
- TypeScript configuration is validated
- Demo users are tested to ensure they can authenticate
- Informational note about deployment

---

### 3. Success Summary

```
═══════════════════════════════════════════════════════════
🎉 Success! Tenant onboarded in 187s

═══════════════════════════════════════════════════════════

Next steps:
  1. Deploy frontend:
     VERSION=1.0.14 docker-compose up -d rentguy-frontend
  2. Test at: https://techinnovations.rentguy.nl/login
  3. Demo credentials: admin@techinnovations.nl / SecurePass2025!
                      planner@techinnovations.nl / SecurePass2025!
```

---

## What Was Created

### 1. Tenant Configuration (src/config/tenants.ts)

A new tenant entry was added:

```typescript
{
  id: 'techinnovations',
  name: 'Tech Innovations BV',
  domain: 'techinnovations.rentguy.nl',
  primaryColor: '#9B59B6',
  logoUrl: 'https://techinnovations.nl/assets/logo.png',
  customContent: {
    heroTitle: 'Tech Innovations Operations Hub',
    heroSubtitle: 'Streamline your crew management and event planning',
    loginWelcome: 'Welcome to Tech Innovations RentGuy',
    demoAccount1: 'admin@techinnovations.nl',
    demoAccount2: 'planner@techinnovations.nl',
  },
}
```

### 2. Backup File

A backup of the original configuration was created:
- `src/config/tenants.backup-2025-10-18T14-23-15-000Z.ts`

### 3. Demo Users in Database

Two users were created in the `auth_users` table:

| ID | Email | Role | Password Hash |
|----|-------|------|---------------|
| 44 | admin@techinnovations.nl | admin | $2b$12$... (bcrypt) |
| 45 | planner@techinnovations.nl | user | $2b$12$... (bcrypt) |

---

## Post-Onboarding: Deployment

### Configure DNS

Add an A record for the subdomain:

```
techinnovations.rentguy.nl  →  YOUR_SERVER_IP
```

### Rebuild Frontend

The tenant configuration is compiled into the frontend build:

```bash
cd /srv/apps/RentGuy-v1
npm run build
```

### Deploy

```bash
docker-compose up -d rentguy-frontend
```

### Verify with Test Script

```bash
npm run test-tenant techinnovations.rentguy.nl admin@techinnovations.nl SecurePass2025!
```

Expected output:
```
═══════════════════════════════════════════════════════════
Test 1: DNS Configuration
═══════════════════════════════════════════════════════════
✓ Domain resolves to IP: 192.168.1.100

═══════════════════════════════════════════════════════════
Test 2: HTTP/HTTPS Accessibility
═══════════════════════════════════════════════════════════
✓ HTTPS responds with HTTP 200
✓ HTTP redirects to HTTPS

═══════════════════════════════════════════════════════════
Test 3: Tenant Configuration
═══════════════════════════════════════════════════════════
✓ Tenant configuration file exists
✓ Domain found in tenant configuration
✓ Tenant ID: techinnovations

═══════════════════════════════════════════════════════════
Test 4: Demo User Authentication
═══════════════════════════════════════════════════════════
✓ Demo user can authenticate: admin@techinnovations.nl

═══════════════════════════════════════════════════════════
Test 5: Custom Content Validation
═══════════════════════════════════════════════════════════
✓ Hero title configured
✓ Hero subtitle configured
✓ Login welcome message configured

═══════════════════════════════════════════════════════════
Test 6: Frontend Build Status
═══════════════════════════════════════════════════════════
✓ Frontend build exists

═══════════════════════════════════════════════════════════
Test Summary
═══════════════════════════════════════════════════════════

Passed:   12
Failed:   0
Warnings: 0

✓ All tests passed!
```

---

## Manual Testing

### 1. Visit the Login Page

Open your browser and navigate to:
```
https://techinnovations.rentguy.nl/login
```

### 2. Verify Branding

Check that you see:
- ✓ Custom welcome message: "Welcome to Tech Innovations RentGuy"
- ✓ Primary color (#9B59B6 - purple) applied to buttons/highlights
- ✓ Logo (if configured)

### 3. Test Login

Use the demo credentials:
- **Email:** admin@techinnovations.nl
- **Password:** SecurePass2025!

### 4. Verify Dashboard Access

After login, you should:
- ✓ See the dashboard with custom hero title
- ✓ Have access to all features based on role
- ✓ See tenant-specific branding throughout

---

## Time Breakdown

| Step | Time | Description |
|------|------|-------------|
| 1 | 1 min | Start wizard and enter tenant ID |
| 2 | 1 min | Enter tenant details |
| 3 | 30 sec | Configure branding |
| 4 | 1 min | Enter custom content |
| 5 | 1 min | Set up demo users |
| 6 | 30 sec | Review configuration |
| 7 | 3 sec | Apply configuration (automated) |
| 8 | 2 sec | Run tests (automated) |
| **Total** | **5 min** | **Interactive wizard time** |
| 9 | 2 min | Configure DNS (manual) |
| 10 | 3 min | Build frontend (automated) |
| 11 | 1 min | Deploy containers (automated) |
| 12 | 2 min | Run validation tests (automated) |
| **Grand Total** | **13 min** | **Complete onboarding** |

✅ **Goal achieved:** Onboarding completed in under 15 minutes!

---

## Common Variations

### Variation 1: No Logo

If you don't have a logo ready, just press Enter when asked:

```
? Enter logo URL (optional, press Enter to skip): [Enter]
```

The configuration will be created without a `logoUrl` field.

---

### Variation 2: Multiple Demo Users

The wizard creates 2 demo users by default. To add more users after onboarding:

```bash
cd /srv/apps/RentGuy-v1/backend

python3 << EOF
from app.core.db import SessionLocal
from app.modules.auth.models import User
from app.modules.auth.security import hash_password

db = SessionLocal()
user = User(
    email='manager@techinnovations.nl',
    password_hash=hash_password('SecurePass2025!'),
    role='manager'
)
db.add(user)
db.commit()
print(f'User created with ID {user.id}')
db.close()
EOF
```

---

### Variation 3: Updating Tenant Configuration

To update an existing tenant's branding or content:

1. Edit `src/config/tenants.ts` manually
2. Find the tenant by ID: `techinnovations`
3. Update the desired fields
4. Rebuild: `npm run build`
5. Redeploy: `docker-compose up -d rentguy-frontend`

---

## Troubleshooting This Example

### Issue: "Tenant ID already exists"

**Solution:** Choose a different ID like `techinnovations-nl` or `tech-innovations`

---

### Issue: "Domain already exists"

**Solution:** Use a different subdomain like `tech.rentguy.nl` or `ti.rentguy.nl`

---

### Issue: "User creation failed"

**Check database connection:**
```bash
docker-compose ps | grep postgres
```

**Verify backend can connect:**
```bash
cd /srv/apps/RentGuy-v1/backend
python3 -c "from app.core.db import database_ready; print(database_ready())"
```

---

## Key Takeaways

✅ **Automated Process:** Most steps are automated after you provide input
✅ **Validation:** All inputs are validated before being applied
✅ **Backups:** Configuration backups are created automatically
✅ **Testing:** Built-in tests verify the setup works
✅ **Fast:** Complete onboarding in 10-15 minutes
✅ **Safe:** Can be cancelled at any time before step 7
✅ **Repeatable:** Use for every new tenant consistently

---

## Next Steps

After successful onboarding:

1. **Customize further** by editing `src/config/tenants.ts`
2. **Add more users** via the backend API or database scripts
3. **Configure features** specific to this tenant
4. **Set up monitoring** for the new tenant's domain
5. **Train users** on the platform with the demo accounts

---

**Ready to onboard your first tenant? Run `npm run onboard-tenant` to get started!**
