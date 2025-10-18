# RentGuy Tenant Onboarding Guide

This guide provides comprehensive instructions for onboarding new tenants to the RentGuy platform.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Running the Onboarding Wizard](#running-the-onboarding-wizard)
4. [Manual Tenant Addition](#manual-tenant-addition)
5. [Testing New Tenants](#testing-new-tenants)
6. [Troubleshooting](#troubleshooting)
7. [Architecture](#architecture)

---

## Quick Start

To onboard a new tenant in under 1 hour:

```bash
# Navigate to the RentGuy directory
cd /srv/apps/RentGuy-v1

# Run the onboarding wizard
npm run onboard-tenant

# Or use node directly
node scripts/onboard-tenant.js

# Or with ts-node
npx ts-node scripts/onboard-tenant.ts
```

Follow the interactive prompts to complete the onboarding process.

**Estimated time:** 10-15 minutes

---

## Prerequisites

Before running the onboarding wizard, ensure:

1. **Node.js and npm** are installed (v16 or higher)
2. **Python 3** is installed with the backend dependencies
3. **Database is accessible** and migrations are up to date
4. **Backend is running** or at least database connection works
5. **Tenant configuration file exists** at `src/config/tenants.ts`

### Installing Dependencies

```bash
cd /srv/apps/RentGuy-v1
npm install
```

The wizard requires:
- `inquirer` - Interactive CLI prompts
- `chalk` - Colored console output
- `ora` - Loading spinners

---

## Running the Onboarding Wizard

### Step-by-Step Process

The wizard guides you through 8 steps:

#### Step 1: Tenant Identification
- Enter a unique tenant ID (slug format)
- Must be lowercase, alphanumeric with hyphens
- Example: `newclient`, `my-company`, `acme-corp`

#### Step 2: Tenant Details
- Display name (e.g., "New Client Inc.")
- Domain (e.g., "newclient.rentguy.nl")

#### Step 3: Branding
- Primary brand color in hex format (e.g., "#FF6B35")
- Optional logo URL

#### Step 4: Custom Content
- Hero title (shown on homepage)
- Hero subtitle (shown on homepage)
- Login welcome message

#### Step 5: Demo Users
- First demo account email
- Second demo account email
- Shared demo password (minimum 6 characters)

#### Step 6: Review Configuration
- Review all entered information
- Confirm or cancel before applying changes

#### Step 7: Apply Configuration
The wizard automatically:
- ✓ Validates configuration
- ✓ Creates backup of tenant config
- ✓ Adds tenant to configuration file
- ✓ Creates demo users in database

#### Step 8: Testing
Automated tests verify:
- ✓ Configuration file syntax
- ✓ Demo user authentication
- ℹ Domain accessibility (after deployment)

### Example Wizard Session

```
🚀 RentGuy Tenant Onboarding Wizard
===================================

This wizard will guide you through adding a new tenant to RentGuy.
Estimated time: 10-15 minutes

Step 1/8: Tenant Identification
--------------------------------
? Enter tenant ID (slug, lowercase, no spaces): acme

Step 2/8: Tenant Details
-------------------------
? Enter tenant display name: ACME Corporation
? Enter tenant domain (e.g., client.rentguy.nl): acme.rentguy.nl

Step 3/8: Branding
-------------------
? Enter primary brand color (hex, e.g., #FF6B35): #E74C3C
? Enter logo URL (optional, press Enter to skip): https://acme.com/logo.png

Step 4/8: Custom Content
------------------------
? Enter hero title: ACME Operations Dashboard
? Enter hero subtitle: Professional project management for ACME
? Enter login welcome message: Welcome to ACME RentGuy

Step 5/8: Demo Users
--------------------
? Enter demo account 1 email: admin@acme.com
? Enter demo account 2 email: user@acme.com
? Enter demo password: ********

Step 6/8: Review Configuration
------------------------------
Tenant Configuration:
────────────────────────────────────────────────────────────
  ID:              acme
  Name:            ACME Corporation
  Domain:          acme.rentguy.nl
  Primary Color:   #E74C3C
  Logo URL:        https://acme.com/logo.png
  Hero Title:      ACME Operations Dashboard
  Hero Subtitle:   Professional project management for ACME
  Login Welcome:   Welcome to ACME RentGuy
  Demo Account 1:  admin@acme.com
  Demo Account 2:  user@acme.com
────────────────────────────────────────────────────────────
? Does this configuration look correct? Yes

Step 7/8: Apply Configuration
-----------------------------
✓ Configuration validated
✓ Configuration backed up to tenants.backup-2025-10-18T12-30-00-000Z.ts
✓ Tenant configuration added
✓ Demo users created
  ✓ User admin@acme.com created successfully with ID 42
  ✓ User user@acme.com created successfully with ID 43

✓ Configuration applied in 2.3s

Step 8/8: Testing
-----------------
✓ Configuration file syntax valid
✓ Demo users can authenticate
  ✓ Login verified for admin@acme.com with role admin
  ✓ Login verified for user@acme.com with role user

Note: Domain accessibility test requires the application to be deployed.
  Visit https://acme.rentguy.nl after deployment to verify.

🎉 Success! Tenant onboarded in 187s

Next steps:
  1. Deploy frontend:
     VERSION=1.0.14 docker-compose up -d rentguy-frontend
  2. Test at: https://acme.rentguy.nl/login
  3. Demo credentials: admin@acme.com / [password]
                      user@acme.com / [password]
```

---

## Manual Tenant Addition

If you prefer to add a tenant manually without the wizard:

### 1. Edit Configuration File

Open `src/config/tenants.ts` and add a new tenant object:

```typescript
{
  id: 'newclient',
  name: 'New Client',
  domain: 'newclient.rentguy.nl',
  primaryColor: '#3B82F6',
  logoUrl: 'https://example.com/logo.png', // Optional
  customContent: {
    heroTitle: 'New Client Dashboard',
    heroSubtitle: 'Manage your operations efficiently',
    loginWelcome: 'Welcome to New Client RentGuy',
    demoAccount1: 'demo1@newclient.nl',
    demoAccount2: 'demo2@newclient.nl',
  },
}
```

### 2. Create Demo Users

Run the Python script to create users:

```bash
cd /srv/apps/RentGuy-v1/backend

python3 << EOF
from app.core.db import SessionLocal
from app.modules.auth.models import User
from app.modules.auth.security import hash_password

db = SessionLocal()

# Create first demo user
user1 = User(
    email='demo1@newclient.nl',
    password_hash=hash_password('demo123'),
    role='admin'
)
db.add(user1)

# Create second demo user
user2 = User(
    email='demo2@newclient.nl',
    password_hash=hash_password('demo123'),
    role='user'
)
db.add(user2)

db.commit()
db.close()
print('Users created successfully')
EOF
```

### 3. Validate Configuration

```bash
# Run TypeScript compiler to check syntax
npm run typecheck

# Test tenant
./scripts/test-tenant.sh newclient.rentguy.nl demo1@newclient.nl demo123
```

### 4. Deploy

```bash
# Rebuild frontend with new configuration
npm run build

# Restart containers
docker-compose up -d rentguy-frontend
```

---

## Testing New Tenants

### Automated Testing Script

Use the provided test script to validate tenant configuration:

```bash
./scripts/test-tenant.sh <domain> [demo-email] [demo-password]
```

**Example:**

```bash
./scripts/test-tenant.sh acme.rentguy.nl admin@acme.com password123
```

### What the Script Tests

1. **DNS Configuration**
   - Domain resolution
   - IP address lookup

2. **HTTP/HTTPS Accessibility**
   - HTTPS response code
   - HTTP to HTTPS redirects

3. **Tenant Configuration**
   - Configuration file exists
   - Domain present in configuration
   - Tenant ID extraction

4. **Demo User Authentication**
   - User exists in database
   - Password verification
   - Role assignment

5. **Custom Content Validation**
   - Hero title configured
   - Hero subtitle configured
   - Login welcome message configured

6. **Frontend Build Status**
   - Build artifacts exist
   - Last build timestamp

### Manual Testing

After onboarding, manually verify:

1. **Visit the domain** in a browser
   ```
   https://newclient.rentguy.nl/login
   ```

2. **Check branding** appears correctly:
   - Primary color is applied
   - Logo displays (if configured)
   - Custom content shows on login page

3. **Test demo user login**:
   - Try logging in with demo credentials
   - Verify dashboard loads correctly
   - Check user role permissions

4. **Test functionality**:
   - Create a test project
   - Add inventory items
   - Test calendar features

---

## Troubleshooting

### Common Issues

#### Issue: "Tenant ID already exists"

**Cause:** The tenant ID you entered is already in use.

**Solution:** Choose a different, unique tenant ID.

---

#### Issue: "Domain already exists"

**Cause:** The domain is already associated with another tenant.

**Solution:** Use a different subdomain or domain.

---

#### Issue: "Failed to create demo user"

**Cause:** Database connection issue or user already exists.

**Solutions:**
1. Check database is running: `docker-compose ps`
2. Verify backend can connect to database
3. Check if user already exists manually:
   ```bash
   cd /srv/apps/RentGuy-v1/backend
   python3 -c "
   from app.core.db import SessionLocal
   from app.modules.auth.models import User
   db = SessionLocal()
   user = db.query(User).filter(User.email == 'your-email@example.com').first()
   print(f'User exists: {user is not None}')
   db.close()
   "
   ```

---

#### Issue: "Configuration file syntax invalid"

**Cause:** TypeScript syntax error in the configuration file.

**Solutions:**
1. Run `npm run typecheck` to see specific errors
2. Restore from backup:
   ```bash
   cp src/config/tenants.backup-*.ts src/config/tenants.ts
   ```
3. Re-run the wizard

---

#### Issue: "Demo users cannot authenticate"

**Cause:** Password hashing issue or database connection problem.

**Solutions:**
1. Verify user exists in database
2. Check password was hashed correctly
3. Try resetting password manually:
   ```bash
   cd /srv/apps/RentGuy-v1/backend
   python3 << EOF
   from app.core.db import SessionLocal
   from app.modules.auth.models import User
   from app.modules.auth.security import hash_password

   db = SessionLocal()
   user = db.query(User).filter(User.email == 'demo@example.com').first()
   if user:
       user.password_hash = hash_password('newpassword')
       db.commit()
       print('Password reset successfully')
   else:
       print('User not found')
   db.close()
   EOF
   ```

---

#### Issue: "Domain not accessible"

**Cause:** DNS not configured or application not deployed.

**Solutions:**
1. Check DNS configuration:
   ```bash
   host newclient.rentguy.nl
   ```
2. Configure DNS A record to point to your server IP
3. Rebuild and deploy frontend:
   ```bash
   npm run build
   docker-compose up -d rentguy-frontend
   ```
4. Check Traefik routing (if using):
   ```bash
   docker logs traefik
   ```

---

### Getting Help

If you encounter issues not covered here:

1. Check the application logs:
   ```bash
   docker-compose logs -f rentguy-frontend
   docker-compose logs -f rentguy-backend
   ```

2. Verify all services are running:
   ```bash
   docker-compose ps
   ```

3. Review the backup files created during onboarding:
   ```bash
   ls -la src/config/tenants.backup-*.ts
   ```

---

## Architecture

### File Structure

```
/srv/apps/RentGuy-v1/
├── scripts/
│   ├── onboard-tenant.ts          # Main wizard script
│   ├── test-tenant.sh             # Validation script
│   ├── README.md                  # This documentation
│   ├── lib/
│   │   ├── tenantGenerator.ts     # Tenant config utilities
│   │   └── demoUserCreator.ts     # User creation utilities
│   └── templates/
│       └── tenant-config.template.ts  # Config template
├── src/
│   └── config/
│       └── tenants.ts             # Tenant configuration file
└── backend/
    └── app/
        └── modules/
            └── auth/
                ├── models.py      # User model
                └── security.py    # Password hashing

```

### Component Overview

#### onboard-tenant.ts
Main CLI wizard that orchestrates the entire onboarding process. Uses `inquirer` for interactive prompts and coordinates between all other components.

#### tenantGenerator.ts
Handles tenant configuration generation and validation:
- `validateTenantConfig()` - Validates all tenant inputs
- `generateTenantConfig()` - Generates config code from template
- `addTenantToConfig()` - Adds tenant to configuration file
- `backupTenantConfig()` - Creates timestamped backups
- `tenantIdExists()` - Checks for duplicate IDs
- `domainExists()` - Checks for duplicate domains

#### demoUserCreator.ts
Manages demo user creation in the database:
- `createDemoUser()` - Creates a single user
- `createDemoUsers()` - Creates multiple users
- `verifyUserLogin()` - Tests authentication
- `listUsers()` - Lists all users
- `deleteUser()` - Removes a user

#### tenant-config.template.ts
Template with placeholders for generating new tenant configurations. Uses simple string replacement for flexibility.

#### test-tenant.sh
Bash script that runs comprehensive validation tests on a tenant:
- DNS resolution
- HTTP/HTTPS accessibility
- Configuration presence
- User authentication
- Custom content validation
- Build status

### Data Flow

```
User Input (CLI)
      ↓
Validation (tenantGenerator)
      ↓
Configuration Generation (tenantGenerator)
      ↓
File Update (tenants.ts)
      ↓
Database Operations (demoUserCreator)
      ↓
Testing & Verification (test-tenant.sh)
      ↓
Deployment Ready
```

### Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with 12 rounds
2. **Input Validation**: All inputs are validated before processing
3. **Backups**: Configuration backups are created before modifications
4. **Error Handling**: Comprehensive error handling with rollback support
5. **No Secrets in Config**: Passwords are never stored in configuration files

---

## Advanced Usage

### Programmatic API

You can use the libraries programmatically in your own scripts:

```typescript
import {
  validateTenantConfig,
  addTenantToConfig
} from './scripts/lib/tenantGenerator.js'
import { createDemoUsers } from './scripts/lib/demoUserCreator.js'

// Define tenant
const tenant = {
  id: 'api-tenant',
  name: 'API Tenant',
  domain: 'api.rentguy.nl',
  primaryColor: '#00FF00',
  customContent: {
    heroTitle: 'API Dashboard',
    heroSubtitle: 'Automated setup',
    loginWelcome: 'Welcome',
    demoAccount1: 'admin@api.nl',
    demoAccount2: 'user@api.nl',
  },
}

// Validate
const validation = validateTenantConfig(tenant)
if (!validation.valid) {
  console.error('Validation failed:', validation.errors)
  process.exit(1)
}

// Add to config
addTenantToConfig('./src/config/tenants.ts', tenant)

// Create users
createDemoUsers([
  { email: 'admin@api.nl', password: 'secure123', role: 'admin' },
  { email: 'user@api.nl', password: 'secure123', role: 'user' },
])
```

### Bulk Onboarding

For onboarding multiple tenants, create a CSV file and script:

```typescript
import fs from 'fs'
import { parse } from 'csv-parse/sync'

const tenants = parse(fs.readFileSync('tenants.csv'), {
  columns: true,
  skip_empty_lines: true,
})

for (const tenant of tenants) {
  // Process each tenant...
}
```

### Custom Validation Rules

Extend the validation with custom rules:

```typescript
function validateCustomRules(tenant: TenantInput): string[] {
  const errors: string[] = []

  // Example: Enforce domain suffix
  if (!tenant.domain.endsWith('.rentguy.nl')) {
    errors.push('Domain must end with .rentguy.nl')
  }

  // Example: Enforce naming convention
  if (!/^[A-Z]/.test(tenant.name)) {
    errors.push('Tenant name must start with uppercase letter')
  }

  return errors
}
```

---

## Maintenance

### Backup Management

Backups are created automatically with timestamps. To clean up old backups:

```bash
# List backups
ls -la src/config/tenants.backup-*.ts

# Remove backups older than 30 days
find src/config/tenants.backup-*.ts -mtime +30 -delete
```

### Configuration Updates

To update an existing tenant's configuration:

1. Edit `src/config/tenants.ts` manually
2. Run validation: `npm run typecheck`
3. Rebuild: `npm run build`
4. Redeploy: `docker-compose up -d rentguy-frontend`

### User Management

To manage users after onboarding:

```bash
# List all users
cd /srv/apps/RentGuy-v1/backend
python3 << EOF
from app.core.db import SessionLocal
from app.modules.auth.models import User
db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f'{u.id}: {u.email} ({u.role})')
db.close()
EOF

# Update user role
python3 << EOF
from app.core.db import SessionLocal
from app.modules.auth.models import User
db = SessionLocal()
user = db.query(User).filter(User.email == 'user@example.com').first()
if user:
    user.role = 'admin'
    db.commit()
    print('Role updated')
db.close()
EOF
```

---

## Changelog

### Version 1.0.0 (2025-10-18)
- Initial release
- Interactive CLI wizard
- Automated configuration generation
- Demo user creation
- Validation and testing scripts
- Comprehensive documentation

---

## License

This onboarding system is part of the RentGuy platform and follows the same license terms.

---

## Support

For support or questions about tenant onboarding:
1. Review this documentation
2. Check the troubleshooting section
3. Review application logs
4. Contact the development team

---

**Happy Onboarding! 🚀**
