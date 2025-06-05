// Import k6 modules for HTTP requests, checks, and sleep
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configure load test options
export const options = {
  vus: 50, // Number of virtual users
  duration: '60s', // 60 seconds to allow complete iterations
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete in <500ms
    http_req_failed: ['rate<0.01'], // Error rate should be <1%
    checks: ['rate>0.99'] // 99% of checks (status 200) should pass
  }
};

// Main test function
export default function () {
  // Test health endpoint
  let res = http.get('http://localhost:3000/health', { timeout: '5s' });
  check(res, {
    'health status is 200': (r) => r.status === 200,
    'health response is correct': (r) => r.json('status') === 'API Gateway is running'
  });

  // Test API endpoint with sample POST request
  res = http.post('http://localhost:3000/api/user-service/users', JSON.stringify({
    userId: 1,
    action: 'read'
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '5s' // Set 5-second timeout for POST request
  });
  check(res, {
    'POST status is 200': (r) => r.status === 200,
    'POST response has message': (r) => r.json('message') === 'User created'
  });

  sleep(1); // Simulate user think time
}