import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 300 }, // Ramp-up to 20 users
    { duration: '1m', target: 300 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp-down to 0 users
  ],
};

export default function () {
  const url = 'http://localhost:5000/v1/app'; // Replace with your actual endpoint
  const res = http.get(url);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Wait for 1 second before next iteration
}
