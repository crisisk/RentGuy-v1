# RentGuy Deployment Runbook

## 1. Pre-deployment Checklist
- [ ] Verify current branch is `release-candidate`
- [ ] Confirm all automated tests pass
- [ ] Review deployment changelog
- [ ] Check database migration scripts
- [ ] Validate environment configuration
- [ ] Notify infrastructure team

**Estimated Time**: 30 minutes
**Risk Level**: Low

## 2. Staging Deployment Procedure

### 2.1 Database Migrations
bash
# Run database migrations
./migrate --env=staging


### 2.2 Application Deployment
bash
# Deploy application to staging
kubectl apply -f k8s/staging/deployment.yml


**Expected Output**: 
- Successful pod creation
- Zero downtime deployment

**Estimated Time**: 15 minutes
**Risk Level**: Medium

## 3. Production Deployment Procedure

### 3.1 Pre-Deployment Validation
- [ ] Confirm staging deployment successful
- [ ] Review monitoring metrics
- [ ] Validate performance benchmarks

### 3.2 Database Migration
bash
# Run production database migrations
./migrate --env=production --strategy=blue-green


### 3.3 Kubernetes Deployment
bash
# Deploy to production
kubectl apply -f k8s/production/deployment.yml


**Estimated Time**: 20 minutes
**Risk Level**: High

## 4. Rollback Procedure

### 4.1 Immediate Rollback
bash
# Rollback to previous deployment
kubectl rollout undo deployment/rentguy-app


### 4.2 Version-Specific Rollback
bash
# Rollback to specific version
kubectl rollout undo deployment/rentguy-app --to-revision=3


**Estimated Time**: 5-10 minutes
**Risk Level**: Medium

## 5. Smoke Tests

### 5.1 Basic Endpoint Check
bash
# Verify core endpoints
curl https://api.rentguy.com/health
curl https://api.rentguy.com/version


### 5.2 Critical Path Testing
- User registration
- Property listing
- Booking flow

**Expected Outputs**:
- 200 OK status
- Current version number
- Successful transactions

**Estimated Time**: 15 minutes
**Risk Level**: Low

## 6. Troubleshooting Common Issues

### 6.1 Deployment Failures
- Check pod logs
- Verify resource constraints
- Review recent changes

bash
# Check deployment status
kubectl get pods
kubectl describe deployment rentguy-app


### 6.2 Performance Degradation
- Monitor CPU/Memory usage
- Review database query performance
- Check external service integrations

## 7. Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | Jane Smith | 555-123-4567 |
| Backend Engineer | John Doe | 555-987-6543 |
| Infrastructure | Support Team | support@rentguy.com |

## 8. Post-Deployment Monitoring

### 8.1 Metrics to Watch
- Error rates
- Response times
- Database connection pool
- Cache hit/miss ratio

### 8.2 Monitoring Tools
- Datadog
- New Relic
- Prometheus
- ELK Stack

**Monitoring Duration**: 4-6 hours post-deployment
