/**
 * PII Masking Utility
 * Workplan Line 624: PII masking in logs
 * 
 * Masks Personally Identifiable Information (PII) in logs for privacy compliance
 */

/**
 * Mask email address
 * Example: john.doe@example.com -> j***@example.com
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '***' + localPart[localPart.length - 1]
    : '***';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number
 * Example: +91-9876543210 -> +91-***3210
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove non-digit characters for processing
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 4) return '***';
  
  // Show last 4 digits only
  const lastFour = digitsOnly.slice(-4);
  const prefix = phone.slice(0, phone.length - digitsOnly.length + (digitsOnly.length > 10 ? 3 : 0));
  
  return `${prefix}***${lastFour}`;
}

/**
 * Mask roll number
 * Example: 22BD1A0501 -> 22***501
 */
function maskRollNumber(rollNumber) {
  if (!rollNumber || typeof rollNumber !== 'string') return rollNumber;
  
  if (rollNumber.length < 6) return '***';
  
  return rollNumber.slice(0, 2) + '***' + rollNumber.slice(-3);
}

/**
 * Mask name
 * Example: John Doe Smith -> J*** D*** S***
 */
function maskName(name) {
  if (!name || typeof name !== 'string') return name;
  
  return name.split(' ')
    .map(part => part.length > 0 ? part[0] + '***' : '')
    .join(' ');
}

/**
 * Mask IP address
 * Example: 192.168.1.100 -> 192.168.*.***
 */
function maskIP(ip) {
  if (!ip || typeof ip !== 'string') return ip;
  
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  
  return `${parts[0]}.${parts[1]}.*.***`;
}

/**
 * Mask credit card number
 * Example: 4532-1234-5678-9010 -> ****-****-****-9010
 */
function maskCreditCard(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return cardNumber;
  
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  if (digitsOnly.length < 4) return '***';
  
  return '****-****-****-' + digitsOnly.slice(-4);
}

/**
 * Detect and mask PII in strings
 * Automatically detects common PII patterns and masks them
 */
function autoMaskPII(text) {
  if (!text || typeof text !== 'string') return text;
  
  let masked = text;
  
  // Mask email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  masked = masked.replace(emailRegex, (match) => maskEmail(match));
  
  // Mask phone numbers (various formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  masked = masked.replace(phoneRegex, (match) => maskPhone(match));
  
  // Mask roll numbers (KMIT format)
  const rollNumberRegex = /\b\d{2}[Bb][Dd][A-Za-z0-9]{6}\b/g;
  masked = masked.replace(rollNumberRegex, (match) => maskRollNumber(match));
  
  // Mask credit card numbers
  const creditCardRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  masked = masked.replace(creditCardRegex, (match) => maskCreditCard(match));
  
  return masked;
}

/**
 * Mask PII in objects (recursively)
 * Useful for logging request/response objects
 */
function maskObjectPII(obj, sensitiveFields = ['email', 'phone', 'rollNumber', 'password', 'token', 'ip']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => maskObjectPII(item, sensitiveFields));
  }
  
  const masked = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));
    
    if (isSensitive && typeof value === 'string') {
      // Mask based on field type
      if (lowerKey.includes('email')) {
        masked[key] = maskEmail(value);
      } else if (lowerKey.includes('phone')) {
        masked[key] = maskPhone(value);
      } else if (lowerKey.includes('rollnumber')) {
        masked[key] = maskRollNumber(value);
      } else if (lowerKey.includes('ip')) {
        masked[key] = maskIP(value);
      } else if (lowerKey.includes('password') || lowerKey.includes('token')) {
        masked[key] = '***REDACTED***';
      } else {
        masked[key] = autoMaskPII(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively mask nested objects
      masked[key] = maskObjectPII(value, sensitiveFields);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Create a logger wrapper that auto-masks PII
 * Usage: const logger = createPIILogger(console);
 *        logger.log('User email: user@example.com'); // Will be masked
 */
function createPIILogger(baseLogger = console) {
  return {
    log: (...args) => baseLogger.log(...args.map(arg => 
      typeof arg === 'string' ? autoMaskPII(arg) : maskObjectPII(arg)
    )),
    error: (...args) => baseLogger.error(...args.map(arg => 
      typeof arg === 'string' ? autoMaskPII(arg) : maskObjectPII(arg)
    )),
    warn: (...args) => baseLogger.warn(...args.map(arg => 
      typeof arg === 'string' ? autoMaskPII(arg) : maskObjectPII(arg)
    )),
    info: (...args) => baseLogger.info(...args.map(arg => 
      typeof arg === 'string' ? autoMaskPII(arg) : maskObjectPII(arg)
    )),
    debug: (...args) => baseLogger.debug(...args.map(arg => 
      typeof arg === 'string' ? autoMaskPII(arg) : maskObjectPII(arg)
    ))
  };
}

module.exports = {
  maskEmail,
  maskPhone,
  maskRollNumber,
  maskName,
  maskIP,
  maskCreditCard,
  autoMaskPII,
  maskObjectPII,
  createPIILogger
};
