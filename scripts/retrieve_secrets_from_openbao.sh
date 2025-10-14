#!/bin/bash
# RentGuy Enterprise Platform - OpenBao Secrets Retrieval
# This script retrieves all secrets from OpenBao and creates the .env.production file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RentGuy OpenBao Secrets Retrieval ===${NC}"

# Check if OPENBAO_ADDR and OPENBAO_TOKEN are set
if [ -z "$OPENBAO_ADDR" ] || [ -z "$OPENBAO_TOKEN" ]; then
    echo -e "${RED}Error: OPENBAO_ADDR and OPENBAO_TOKEN must be set${NC}"
    echo "Export them first:"
    echo "  export OPENBAO_ADDR=https://openbao.sevensa.nl"
    echo "  export OPENBAO_TOKEN=your_token_here"
    exit 1
fi

# Check if openbao CLI is installed
if ! command -v openbao &> /dev/null; then
    echo -e "${YELLOW}OpenBao CLI not found. Installing...${NC}"
    # Install openbao CLI (adjust for your system)
    wget -q https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
    unzip -q vault_1.15.0_linux_amd64.zip
    sudo mv vault /usr/local/bin/openbao
    rm vault_1.15.0_linux_amd64.zip
    echo -e "${GREEN}OpenBao CLI installed${NC}"
fi

# Create .env.production file
ENV_FILE=".env.production"
echo -e "${YELLOW}Creating $ENV_FILE...${NC}"

# Copy template
cp .env.production.template $ENV_FILE

# Function to retrieve secret from OpenBao
get_secret() {
    local path=$1
    local field=$2
    openbao kv get -field="$field" "$path" 2>/dev/null || echo ""
}

echo -e "${YELLOW}Retrieving secrets from OpenBao...${NC}"

# Database secrets
echo -e "${GREEN}[1/8] Database credentials...${NC}"
POSTGRES_PASSWORD=$(get_secret "secret/rentguy/database" "password")
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Warning: Database password not found in OpenBao${NC}"
    POSTGRES_PASSWORD="CHANGE_ME"
fi
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" $ENV_FILE

# Redis secrets
echo -e "${GREEN}[2/8] Redis credentials...${NC}"
REDIS_PASSWORD=$(get_secret "secret/rentguy/redis" "password")
if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${RED}Warning: Redis password not found in OpenBao${NC}"
    REDIS_PASSWORD="CHANGE_ME"
fi
sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|" $ENV_FILE

# JWT secrets
echo -e "${GREEN}[3/8] JWT secret key...${NC}"
JWT_SECRET_KEY=$(get_secret "secret/rentguy/jwt" "secret_key")
if [ -z "$JWT_SECRET_KEY" ]; then
    echo -e "${YELLOW}Generating new JWT secret key...${NC}"
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    # Store it back in OpenBao
    openbao kv put secret/rentguy/jwt secret_key="$JWT_SECRET_KEY" 2>/dev/null || true
fi
sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET_KEY|" $ENV_FILE

# Keycloak secrets
echo -e "${GREEN}[4/8] Keycloak credentials...${NC}"
KEYCLOAK_CLIENT_SECRET=$(get_secret "secret/rentguy/keycloak" "client_secret")
if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
    echo -e "${RED}Warning: Keycloak client secret not found in OpenBao${NC}"
    KEYCLOAK_CLIENT_SECRET="CHANGE_ME"
fi
sed -i "s|KEYCLOAK_CLIENT_SECRET=.*|KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET|" $ENV_FILE

# SMTP secrets
echo -e "${GREEN}[5/8] SMTP credentials...${NC}"
SMTP_USER=$(get_secret "secret/rentguy/smtp" "user")
SMTP_PASSWORD=$(get_secret "secret/rentguy/smtp" "password")
if [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASSWORD" ]; then
    echo -e "${RED}Warning: SMTP credentials not found in OpenBao${NC}"
    SMTP_USER="CHANGE_ME"
    SMTP_PASSWORD="CHANGE_ME"
fi
sed -i "s|SMTP_USER=.*|SMTP_USER=$SMTP_USER|" $ENV_FILE
sed -i "s|SMTP_PASSWORD=.*|SMTP_PASSWORD=$SMTP_PASSWORD|" $ENV_FILE

# Mollie API key
echo -e "${GREEN}[6/8] Mollie API key...${NC}"
MOLLIE_API_KEY=$(get_secret "secret/rentguy/mollie" "api_key")
if [ -z "$MOLLIE_API_KEY" ]; then
    echo -e "${RED}Warning: Mollie API key not found in OpenBao${NC}"
    MOLLIE_API_KEY="CHANGE_ME"
fi
sed -i "s|MOLLIE_API_KEY=.*|MOLLIE_API_KEY=$MOLLIE_API_KEY|" $ENV_FILE

# Sub-Renting secrets
echo -e "${GREEN}[7/8] Sub-Renting credentials...${NC}"
SUBRENTING_API_KEY=$(get_secret "secret/rentguy/subrenting" "api_key")
SUBRENTING_WEBHOOK_SECRET=$(get_secret "secret/rentguy/subrenting" "webhook_secret")
if [ -z "$SUBRENTING_API_KEY" ]; then
    echo -e "${YELLOW}Generating new Sub-Renting API key...${NC}"
    SUBRENTING_API_KEY=$(openssl rand -hex 16)
    openbao kv put secret/rentguy/subrenting api_key="$SUBRENTING_API_KEY" 2>/dev/null || true
fi
if [ -z "$SUBRENTING_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}Generating new Sub-Renting webhook secret...${NC}"
    SUBRENTING_WEBHOOK_SECRET=$(openssl rand -hex 32)
    openbao kv patch secret/rentguy/subrenting webhook_secret="$SUBRENTING_WEBHOOK_SECRET" 2>/dev/null || true
fi
sed -i "s|SUBRENTING_API_KEY=.*|SUBRENTING_API_KEY=$SUBRENTING_API_KEY|" $ENV_FILE
sed -i "s|SUBRENTING_WEBHOOK_SECRET=.*|SUBRENTING_WEBHOOK_SECRET=$SUBRENTING_WEBHOOK_SECRET|" $ENV_FILE

# OpenBao token (use current token)
echo -e "${GREEN}[8/8] OpenBao configuration...${NC}"
sed -i "s|OPENBAO_TOKEN=.*|OPENBAO_TOKEN=$OPENBAO_TOKEN|" $ENV_FILE

echo -e "${GREEN}=== Secrets retrieval complete ===${NC}"
echo -e "${YELLOW}Environment file created: $ENV_FILE${NC}"
echo ""
echo -e "${YELLOW}Please review the file and update any CHANGE_ME values:${NC}"
grep "CHANGE_ME" $ENV_FILE || echo -e "${GREEN}All secrets retrieved successfully!${NC}"

