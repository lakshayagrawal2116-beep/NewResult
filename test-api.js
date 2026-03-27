const http = require('http');

const data = JSON.stringify({
  rollno: '2020CSE001',
  name: 'John Doe',
  department: 'CSE',
  semesters: [
    {
      semesterNumber: 1,
      sgpa: 8.5,
      credits: 20,
      failedCourses: []
    },
    {
      semesterNumber: 2,
      sgpa: 9.0,
      credits: 22,
      failedCourses: []
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/results',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`POST STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    // Test GET req
    http.get('http://localhost:5000/api/results/2020CSE001', (getRes) => {
        console.log(`GET STATUS: ${getRes.statusCode}`);
        let getBody = '';
        getRes.on('data', d => getBody += d);
        getRes.on('end', () => console.log(`GET BODY: ${getBody}`));
    });
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
