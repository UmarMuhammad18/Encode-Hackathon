const CONFIG = {
  maxPurchaseAmount: 500,
  maxDailySpend: 2000,
  rateLimit: { windowMs: 60000, maxRequests: 10 },
  bannedCards: ['counterfeit', 'proxy', 'fake', 'reprint'],
  requireConfirmation: ['sell_card', 'delete_all_cards'],
  injectionPatterns: [
    /ignore previous instructions/i,
    /system:\s*.*/i,
    /you are now.*/i,
    /bypass security/i,
    /forget all instructions/i
  ],
  sensitivePatterns: [
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    /password|secret|api[_-]?key|token/i
  ]
};

class CivicGuard {
  constructor() {
    this.rateLimits = new Map();
    this.dailySpend = new Map();
    this.auditLog = [];
  }

  async validateInput(userId, input, context = {}) {
    let sanitized = input;
    const warnings = [];

    for (const pattern of CONFIG.injectionPatterns) {
      if (pattern.test(input)) {
        warnings.push(`Potential injection blocked`);
        sanitized = sanitized.replace(pattern, '[REDACTED]');
        await this.logSecurityEvent(userId, 'injection_attempt', { pattern: pattern.source });
      }
    }

    for (const pattern of CONFIG.sensitivePatterns) {
      if (pattern.test(sanitized)) {
        warnings.push(`Sensitive data redacted`);
        sanitized = sanitized.replace(pattern, '[REDACTED]');
        await this.logSecurityEvent(userId, 'sensitive_data_redacted', { pattern: pattern.source });
      }
    }

    const rateCheck = await this.checkRateLimit(userId, 'input');
    if (!rateCheck.allowed) warnings.push(rateCheck.reason);

    return {
      isValid: warnings.length === 0 || !warnings.some(w => w.includes('blocked')),
      sanitized,
      warnings,
      rateLimited: !rateCheck.allowed
    };
  }

  async validateOutput(userId, output, context = {}) {
    let sanitized = output;
    const warnings = [];

    for (const pattern of CONFIG.sensitivePatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
        warnings.push('Sensitive data redacted from output');
      }
    }

    return { isValid: true, sanitized, warnings };
  }

  async validateToolCall(userId, toolCall) {
    // Simplified for now
    return { allowed: true, requiresConfirmation: false };
  }

  async checkRateLimit(userId, action) {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const requests = this.rateLimits.get(key) || [];
    const recent = requests.filter(t => now - t < CONFIG.rateLimit.windowMs);

    if (recent.length >= CONFIG.rateLimit.maxRequests) {
      return { allowed: false, reason: 'Rate limit exceeded. Please wait a moment.' };
    }

    recent.push(now);
    this.rateLimits.set(key, recent);
    return { allowed: true };
  }

  async logSecurityEvent(userId, eventType, details) {
    const entry = { timestamp: new Date().toISOString(), userId, eventType, details };
    this.auditLog.push(entry);
    console.log('[CIVIC]', JSON.stringify(entry));
    if (this.auditLog.length > 1000) this.auditLog.shift();
  }

  getAuditLog(userId) {
    return this.auditLog.filter(e => e.userId === userId);
  }
}

let instance = null;
function getCivicGuard() {
  if (!instance) instance = new CivicGuard();
  return instance;
}

module.exports = { CivicGuard, getCivicGuard };