import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 1000000 }, // Ramp-up to 1,000,000 users over 1 minute
    { duration: '5m', target: 1000000 }, // Stay at 1,000,000 users for 5 minutes
    { duration: '1m', target: 0 },       // Ramp-down to 0 users over 1 minute
  ],
};

export default function () {
  const url = 'https://snaapio-backend.skysolo.tech/v1/users/akash'; // Replace with your actual endpoint
  const res = http.get(url);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Wait for 1 second before next iteration
}
