export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const testData = {
    status: 'OK',
    message: 'CORS Proxy çalışıyor',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.url,
    proxy_endpoint: '/api/proxy?url=YOUR_ENCODED_URL',
    example_usage: '/api/proxy?url=https%3A//httpbin.org/json'
  };
  
  res.status(200).json(testData);
}