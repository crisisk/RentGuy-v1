import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = 'https://onboarding.mr-dj.nl';

export default function () {
  // Simulate user journey through the onboarding process
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/step/company-details`],
    ['GET', `${BASE_URL}/step/equipment-catalog`],
    ['GET', `${BASE_URL}/step/service-packages`],
    ['GET', `${BASE_URL}/step/pricing-setup`],
    ['GET', `${BASE_URL}/step/payment-methods`],
    ['GET', `${BASE_URL}/step/crew-management`],
    ['GET', `${BASE_URL}/step/delivery-setup`],
    ['GET', `${BASE_URL}/step/branding`],
    ['GET', `${BASE_URL}/step/legal-agreements`],
    ['GET', `${BASE_URL}/step/final-review`],
    ['GET', `${BASE_URL}/step/completion`],
  ]);

  responses.forEach(res => {
    check(res, {
      'is status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

