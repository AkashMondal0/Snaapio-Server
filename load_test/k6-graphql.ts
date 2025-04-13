import http from 'k6/http';
import { check, sleep } from 'k6';
const BearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFrYXNoIiwiaWQiOiJhOWU1MWUwMS0zMjg2LTQ4MjctODhlYS04NDk3NWFiZDgyMmIiLCJlbWFpbCI6ImFrYXNoQGdtYWlsLmNvbSIsIm5hbWUiOiJBa2FzaCBNb25kYWwiLCJiaW8iOiIiLCJ3ZWJzaXRlIjpbXSwicHJvZmlsZVBpY3R1cmUiOiJzcXVhcmUvYTllNTFlMDEtMzI4Ni00ODI3LTg4ZWEtODQ5NzVhYmQ4MjJiXzkxNWEyRHI1TC5qcGciLCJsYXN0U3RhdHVzVXBkYXRlIjoiMjAyNS0wMy0xNFQwNTo1ODo0MS43NTZaIiwiaWF0IjoxNzQ0MzAyNzUwLCJleHAiOjE3NDY4OTQ3NTB9.oIGqIgHaPpOxKFEy0Knx3wUp7oi39_aF0f4YCLKrgg0"
// Define k6 options
export let options = {
  stages: [
    { duration: '30s', target: 300 }, // Ramp-up to 20 users
    { duration: '1m', target: 300 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp-down to 0 users
  ],
  // Output Prometheus metrics
  summaryExport: 'http://prometheus:9090/metrics',
};

export default function () {
  const url = 'http://localhost:5000/graphql';  // Your GraphQL endpoint
  const query = JSON.stringify({
    query: `query FeedTimelineConnection($graphQlPageQuery: GraphQLPageQuery!) {
    feedTimelineConnection(graphQLPageQuery: $graphQlPageQuery) {
      id
      content
      title
      fileUrl {
        width
        height
        square
        square_sm
        blur_square
        original
        original_sm
        blur_original
        type
        id
      }
      createdAt
      updatedAt
      authorId
      commentCount
      likeCount
      is_Liked
      user {
        id
        username
        email
        name
        profilePicture
      }
    }
  }`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BearerToken}`,
    },
    body: JSON.stringify({
      query,
      variables: {
        "graphQlPageQuery": {
          "limit": 100,
          "offset": 0
        }
      },
    }),
  };

  const res = http.post(url, query, params);

  // Check if the request was successful
  check(res, {
    'status is 200': (r) => r.status === 200,
    'is valid JSON': (r) => typeof r.body === 'string' && r.body.indexOf('data') !== -1,
  });

  sleep(1);
}
