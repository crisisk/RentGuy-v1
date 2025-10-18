#!/bin/bash
# RentGuy Enterprise Platform - Keycloak Configuration
# This script creates the RentGuy realm, client, and roles in Keycloak

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RentGuy Keycloak Configuration ===${NC}"

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak.sevensa.nl}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"
REALM_NAME="rentguy"
CLIENT_ID="rentguy-backend"
FRONTEND_CLIENT_ID="rentguy-app"

# Check if admin password is set
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    echo -e "${RED}Error: KEYCLOAK_ADMIN_PASSWORD must be set${NC}"
    echo "Export it first:"
    echo "  export KEYCLOAK_ADMIN_PASSWORD=your_admin_password"
    exit 1
fi

# Check if kcadm.sh is available (Keycloak CLI)
if ! command -v kcadm.sh &> /dev/null; then
    echo -e "${YELLOW}Keycloak CLI not found. Please install Keycloak admin CLI${NC}"
    echo "Or run this script on the Keycloak server"
    exit 1
fi

echo -e "${YELLOW}Logging in to Keycloak...${NC}"
kcadm.sh config credentials \
    --server "$KEYCLOAK_URL" \
    --realm master \
    --user "$KEYCLOAK_ADMIN_USER" \
    --password "$KEYCLOAK_ADMIN_PASSWORD"

echo -e "${GREEN}[1/7] Creating RentGuy realm...${NC}"
kcadm.sh create realms \
    -s realm="$REALM_NAME" \
    -s enabled=true \
    -s displayName="RentGuy Enterprise Platform" \
    -s registrationAllowed=false \
    -s resetPasswordAllowed=true \
    -s rememberMe=true \
    -s loginWithEmailAllowed=true \
    -s duplicateEmailsAllowed=false \
    -s sslRequired=EXTERNAL \
    2>/dev/null || echo -e "${YELLOW}Realm already exists${NC}"

echo -e "${GREEN}[2/7] Creating backend client (rentguy-backend)...${NC}"
BACKEND_CLIENT_UUID=$(kcadm.sh create clients -r "$REALM_NAME" \
    -s clientId="$CLIENT_ID" \
    -s enabled=true \
    -s clientAuthenticatorType=client-secret \
    -s secret="$(openssl rand -hex 32)" \
    -s protocol=openid-connect \
    -s publicClient=false \
    -s serviceAccountsEnabled=true \
    -s authorizationServicesEnabled=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=true \
    -s 'redirectUris=["https://rentguy.sevensa.nl/*"]' \
    -s 'webOrigins=["https://rentguy.sevensa.nl"]' \
    -i 2>/dev/null || kcadm.sh get clients -r "$REALM_NAME" -q clientId="$CLIENT_ID" --fields id --format csv --noquotes)

echo -e "${GREEN}[3/7] Creating frontend client (rentguy-app)...${NC}"
FRONTEND_CLIENT_UUID=$(kcadm.sh create clients -r "$REALM_NAME" \
    -s clientId="$FRONTEND_CLIENT_ID" \
    -s enabled=true \
    -s protocol=openid-connect \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s implicitFlowEnabled=false \
    -s directAccessGrantsEnabled=true \
    -s 'redirectUris=["https://rentguy.sevensa.nl/*"]' \
    -s 'webOrigins=["https://rentguy.sevensa.nl"]' \
    -s 'attributes.pkce.code.challenge.method=S256' \
    -i 2>/dev/null || kcadm.sh get clients -r "$REALM_NAME" -q clientId="$FRONTEND_CLIENT_ID" --fields id --format csv --noquotes)

echo -e "${GREEN}[4/7] Creating realm roles...${NC}"
# Admin role
kcadm.sh create roles -r "$REALM_NAME" \
    -s name=admin \
    -s 'description=Administrator with full access' \
    2>/dev/null || echo -e "${YELLOW}Role 'admin' already exists${NC}"

# Manager role
kcadm.sh create roles -r "$REALM_NAME" \
    -s name=manager \
    -s 'description=Manager with project and crew management access' \
    2>/dev/null || echo -e "${YELLOW}Role 'manager' already exists${NC}"

# Crew role
kcadm.sh create roles -r "$REALM_NAME" \
    -s name=crew \
    -s 'description=Crew member with limited access' \
    2>/dev/null || echo -e "${YELLOW}Role 'crew' already exists${NC}"

# Customer role
kcadm.sh create roles -r "$REALM_NAME" \
    -s name=customer \
    -s 'description=Customer with portal access' \
    2>/dev/null || echo -e "${YELLOW}Role 'customer' already exists${NC}"

echo -e "${GREEN}[5/7] Creating client scopes...${NC}"
# Create rentguy scope
SCOPE_UUID=$(kcadm.sh create client-scopes -r "$REALM_NAME" \
    -s name=rentguy \
    -s protocol=openid-connect \
    -s 'attributes.include.in.token.scope=true' \
    -s 'attributes.display.on.consent.screen=true' \
    -i 2>/dev/null || kcadm.sh get client-scopes -r "$REALM_NAME" -q name=rentguy --fields id --format csv --noquotes)

# Add scope to clients
kcadm.sh update clients/"$BACKEND_CLIENT_UUID"/default-client-scopes/"$SCOPE_UUID" -r "$REALM_NAME" 2>/dev/null || true
kcadm.sh update clients/"$FRONTEND_CLIENT_UUID"/default-client-scopes/"$SCOPE_UUID" -r "$REALM_NAME" 2>/dev/null || true

echo -e "${GREEN}[6/7] Configuring token settings...${NC}"
kcadm.sh update realms/"$REALM_NAME" \
    -s accessTokenLifespan=3600 \
    -s ssoSessionIdleTimeout=7200 \
    -s ssoSessionMaxLifespan=86400 \
    -s offlineSessionIdleTimeout=2592000

echo -e "${GREEN}[7/7] Retrieving client secret...${NC}"
CLIENT_SECRET=$(kcadm.sh get clients/"$BACKEND_CLIENT_UUID"/client-secret -r "$REALM_NAME" --fields value --format csv --noquotes)

echo -e "${GREEN}=== Keycloak configuration complete ===${NC}"
echo ""
echo -e "${YELLOW}Backend Client Secret:${NC}"
echo "$CLIENT_SECRET"
echo ""
echo -e "${YELLOW}Store this secret in OpenBao:${NC}"
echo "openbao kv put secret/rentguy/keycloak client_secret=\"$CLIENT_SECRET\""
echo ""
echo -e "${YELLOW}Update your .env.production file:${NC}"
echo "KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET"

