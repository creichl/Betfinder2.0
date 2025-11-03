// middleware/ip-logger.js
// Extrahiert die echte Client-IP-Adresse (auch hinter Reverse Proxy)

function getClientIp(req) {
  // Priorität der IP-Adressen-Quellen (für Reverse Proxy Setup)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  
  // X-Forwarded-For kann mehrere IPs enthalten (Client, Proxy1, Proxy2)
  // Die erste IP ist die echte Client-IP
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // X-Real-IP (von Nginx gesetzt)
  if (realIp) {
    return realIp;
  }
  
  // Cloudflare IP
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback: Socket-IP (wenn kein Proxy)
  return req.socket.remoteAddress || 
         req.connection.remoteAddress || 
         req.ip ||
         'unknown';
}

// Middleware: Fügt clientIp zu jedem Request hinzu
function ipLogger(req, res, next) {
  req.clientIp = getClientIp(req);
  next();
}

module.exports = ipLogger;
