#!/bin/bash

###############################################################################
# RentGuy Tenant Validation Script
#
# Tests that a tenant is properly configured and accessible.
# Validates DNS configuration, domain accessibility, demo users, and content.
#
# Usage: ./scripts/test-tenant.sh <tenant-domain> <demo-email> <demo-password>
# Example: ./scripts/test-tenant.sh newclient.rentguy.nl demo@newclient.nl password123
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
  local status=$1
  local message=$2

  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $message"
    ((PASSED++))
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $message"
    ((FAILED++))
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
    ((WARNINGS++))
  else
    echo -e "${BLUE}ℹ${NC} $message"
  fi
}

# Function to print section header
print_section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Parse arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <tenant-domain> [demo-email] [demo-password]"
  echo "Example: $0 newclient.rentguy.nl demo@newclient.nl password123"
  exit 1
fi

DOMAIN=$1
DEMO_EMAIL=${2:-""}
DEMO_PASSWORD=${3:-""}

print_section "RentGuy Tenant Validation Report"
echo "Domain: $DOMAIN"
echo "Date: $(date)"
echo ""

###############################################################################
# Test 1: DNS Configuration
###############################################################################
print_section "Test 1: DNS Configuration"

# Check if domain resolves
if host "$DOMAIN" > /dev/null 2>&1; then
  IP=$(host "$DOMAIN" | grep "has address" | awk '{print $4}' | head -n1)
  print_result "PASS" "Domain resolves to IP: $IP"
else
  print_result "FAIL" "Domain does not resolve"
fi

###############################################################################
# Test 2: HTTP/HTTPS Accessibility
###############################################################################
print_section "Test 2: HTTP/HTTPS Accessibility"

# Test HTTPS connection
if command -v curl > /dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k "https://$DOMAIN" --max-time 10 || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    print_result "PASS" "HTTPS responds with HTTP 200"
  elif [ "$HTTP_CODE" = "000" ]; then
    print_result "FAIL" "Cannot connect to https://$DOMAIN (connection timeout or refused)"
  else
    print_result "WARN" "HTTPS responds with HTTP $HTTP_CODE"
  fi

  # Check if redirects work
  REDIRECT=$(curl -s -I -k "http://$DOMAIN" --max-time 10 | grep -i "location:" | awk '{print $2}' | tr -d '\r')
  if [[ "$REDIRECT" == *"https://"* ]]; then
    print_result "PASS" "HTTP redirects to HTTPS"
  else
    print_result "WARN" "No HTTP to HTTPS redirect detected"
  fi
else
  print_result "WARN" "curl not available, skipping HTTP tests"
fi

###############################################################################
# Test 3: Tenant Configuration
###############################################################################
print_section "Test 3: Tenant Configuration"

CONFIG_FILE="/srv/apps/RentGuy-v1/src/config/tenants.ts"

if [ -f "$CONFIG_FILE" ]; then
  print_result "PASS" "Tenant configuration file exists"

  # Check if domain is in configuration
  if grep -q "domain: '$DOMAIN'" "$CONFIG_FILE"; then
    print_result "PASS" "Domain found in tenant configuration"

    # Extract tenant ID
    TENANT_ID=$(grep -B 5 "domain: '$DOMAIN'" "$CONFIG_FILE" | grep "id:" | sed "s/.*id: '\(.*\)'.*/\1/" | head -n1)
    if [ -n "$TENANT_ID" ]; then
      print_result "PASS" "Tenant ID: $TENANT_ID"
    fi
  else
    print_result "FAIL" "Domain not found in tenant configuration"
  fi
else
  print_result "FAIL" "Tenant configuration file not found"
fi

###############################################################################
# Test 4: Demo Users (if credentials provided)
###############################################################################
if [ -n "$DEMO_EMAIL" ] && [ -n "$DEMO_PASSWORD" ]; then
  print_section "Test 4: Demo User Authentication"

  # Check if user exists in database
  BACKEND_DIR="/srv/apps/RentGuy-v1/backend"

  if [ -d "$BACKEND_DIR" ]; then
    # Test user login via Python script
    USER_CHECK=$(cd "$BACKEND_DIR" && python3 << EOF
import sys
sys.path.insert(0, '$BACKEND_DIR')
try:
    from app.core.db import SessionLocal
    from app.modules.auth.models import User
    from app.modules.auth.security import verify_password

    db = SessionLocal()
    user = db.query(User).filter(User.email == '$DEMO_EMAIL').first()

    if not user:
        print('USER_NOT_FOUND')
    elif verify_password('$DEMO_PASSWORD', user.password_hash):
        print('LOGIN_SUCCESS')
    else:
        print('INVALID_PASSWORD')

    db.close()
except Exception as e:
    print(f'ERROR:{str(e)}')
EOF
)

    if echo "$USER_CHECK" | grep -q "LOGIN_SUCCESS"; then
      print_result "PASS" "Demo user can authenticate: $DEMO_EMAIL"
    elif echo "$USER_CHECK" | grep -q "USER_NOT_FOUND"; then
      print_result "FAIL" "Demo user not found: $DEMO_EMAIL"
    elif echo "$USER_CHECK" | grep -q "INVALID_PASSWORD"; then
      print_result "FAIL" "Demo user password is incorrect: $DEMO_EMAIL"
    else
      print_result "WARN" "Could not verify demo user: $USER_CHECK"
    fi
  else
    print_result "WARN" "Backend directory not found, skipping user tests"
  fi
else
  print_section "Test 4: Demo User Authentication"
  print_result "INFO" "No demo credentials provided, skipping authentication tests"
fi

###############################################################################
# Test 5: Custom Content Validation
###############################################################################
print_section "Test 5: Custom Content Validation"

if [ -f "$CONFIG_FILE" ] && grep -q "domain: '$DOMAIN'" "$CONFIG_FILE"; then
  # Check if custom content fields are present
  CONTENT_SECTION=$(sed -n "/domain: '$DOMAIN'/,/^  },/p" "$CONFIG_FILE")

  if echo "$CONTENT_SECTION" | grep -q "heroTitle:"; then
    print_result "PASS" "Hero title configured"
  else
    print_result "FAIL" "Hero title missing"
  fi

  if echo "$CONTENT_SECTION" | grep -q "heroSubtitle:"; then
    print_result "PASS" "Hero subtitle configured"
  else
    print_result "FAIL" "Hero subtitle missing"
  fi

  if echo "$CONTENT_SECTION" | grep -q "loginWelcome:"; then
    print_result "PASS" "Login welcome message configured"
  else
    print_result "FAIL" "Login welcome message missing"
  fi
else
  print_result "WARN" "Cannot validate custom content (tenant not found)"
fi

###############################################################################
# Test 6: Frontend Build Status
###############################################################################
print_section "Test 6: Frontend Build Status"

DIST_DIR="/srv/apps/RentGuy-v1/dist"

if [ -d "$DIST_DIR" ]; then
  if [ -f "$DIST_DIR/index.html" ]; then
    print_result "PASS" "Frontend build exists"

    BUILD_DATE=$(stat -c %y "$DIST_DIR/index.html" 2>/dev/null || stat -f "%Sm" "$DIST_DIR/index.html" 2>/dev/null || echo "unknown")
    print_result "INFO" "Last build: $BUILD_DATE"
  else
    print_result "WARN" "Frontend build incomplete (no index.html)"
  fi
else
  print_result "WARN" "Frontend not built (run npm run build)"
fi

###############################################################################
# Test Summary
###############################################################################
print_section "Test Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
elif [ $FAILED -lt 3 ]; then
  echo -e "${YELLOW}⚠ Some tests failed, but tenant may be functional${NC}"
  exit 0
else
  echo -e "${RED}✗ Multiple tests failed, please review configuration${NC}"
  exit 1
fi
