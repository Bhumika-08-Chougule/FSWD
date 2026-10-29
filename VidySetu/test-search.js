const http = require('http');

async function testSearch(q) {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/courses?search=' + encodeURIComponent(q), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Query: "${q}" -> count: ${json.count}`);
          if (json.data && json.data.length > 0) {
            console.log('   Matched titles:', json.data.map(d => d.title).join(' | '));
          }
          resolve(json);
        } catch(e) {
          resolve(null);
        }
      });
    });
  });
}

async function run() {
  console.log('Testing Current Search Endpoint:');
  await testSearch('react');
  await testSearch('react node');
  await testSearch('nodejs');
  await testSearch('sarah');
  await testSearch('python data');
  await testSearch('fullstack');
  await testSearch('cloud');
}
run();
