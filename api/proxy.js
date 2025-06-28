export default async function handler(req, res) {
  // CORS headers - tüm istekleri kabul et
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL parameter gerekli',
        usage: 'api/proxy?url=ENCODED_URL',
        example: 'api/proxy?url=https%3A//www.amazon.com.tr'
      });
    }
    
    // URL decode et
    const targetUrl = decodeURIComponent(url);
    
    console.log('Proxy isteği:', targetUrl);
    
    // Amazon için optimized headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout
    
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: headers,
      signal: controller.signal,
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    // Response body al
    const responseBody = await response.text();
    
    // Response headers ayarla
    const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Success log
    console.log(`✅ Başarılı: ${response.status} - ${targetUrl.substring(0, 100)}`);
    
    return res.status(response.status).send(responseBody);
    
  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    
    // Detaylı hata mesajı
    let errorMessage = 'Proxy isteği başarısız';
    let errorDetails = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout (15 saniye)';
      errorDetails = 'İstek çok uzun sürdü';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network hatası';
      errorDetails = 'Hedef sunucuya erişilemiyor';
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      url: req.query.url ? decodeURIComponent(req.query.url) : 'undefined',
      timestamp: new Date().toISOString(),
      suggestion: 'Farklı bir URL deneyin veya daha sonra tekrar deneyin'
    });
  }
}