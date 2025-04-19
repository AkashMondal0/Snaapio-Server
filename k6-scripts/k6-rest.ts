import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    high_rps_test: {
      executor: 'constant-arrival-rate',
      rate: 1000, // requests per second
      timeUnit: '1s', // per second
      duration: '1m', // total test duration
      preAllocatedVUs: 1000, // start with this many VUs
      maxVUs: 20000, // scale up to this many VUs if needed
    },
  },
};

export default function () {
  const url = 'http://192.168.31.232:30050/v1/users/akash'; // Replace with your actual endpoint
  const res = http.get(url);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Wait for 1 second before next iteration
}
