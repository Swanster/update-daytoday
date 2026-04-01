# 🔒 Security Guidelines

Panduan keamanan untuk aplikasi Daily Activity Infrastructure Engineer.

## 📋 Daftar Isi

- [Security Features](#security-features)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)
- [Known Security Measures](#known-security-measures)
- [Reporting Security Issues](#reporting-security-issues)

---

## Security Features

### ✅ Implemented Security Measures

#### 1. JWT Authentication (Required)

- **JWT_SECRET is mandatory** - Server tidak akan start tanpa JWT_SECRET
- **Minimum 32 characters** - Warning jika secret terlalu pendek
- **No fallback** - Tidak ada default secret untuk production safety

```bash
# Generate secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Login | 5 requests | 1 minute |
| Registration | 3 requests | 1 minute |
| File Upload | 10 requests | 1 minute |

#### 3. Input Sanitization

- **XSS Protection** - Script tags dan event handlers di-remove
- **HTML Entity Decoding** - Prevent encoded XSS attacks
- **Recursive Sanitization** - Objects dan arrays juga di-sanitize

#### 4. File Upload Security

- **File Type Validation** - Hanya images, PDF, Excel, Word yang allowed
- **File Size Limits** - 50MB max per file
- **File Count Limits** - Max 10 files per request
- **Sanitized Filenames** - Remove dangerous characters

#### 5. Security Headers (Helmet)

- `X-XSS-Protection` - XSS filter
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-Download-Options` - Prevent IE from executing downloads
- `Cross-Origin-Resource-Policy` - Controlled cross-origin access

#### 6. CORS Configuration

- Configurable allowed origins
- Credentials support
- Restricted methods and headers

#### 7. Input Validation

- Express-validator untuk semua input
- Type checking
- Length limits
- Format validation

---

## Environment Variables

### Required Variables

```bash
# .env file (server directory)

# CRITICAL: JWT Secret - MUST be set!
JWT_SECRET=your-secure-random-secret-min-32-chars

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/project-tracker

# Server Port
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Security Checklist for .env

- [ ] JWT_SECRET minimum 32 characters
- [ ] JWT_SECRET menggunakan cryptographically secure random generator
- [ ] .env file TIDAK di-commit ke git (sudah ada di .gitignore)
- [ ] Different secrets untuk development, staging, production
- [ ] Rotate secrets setiap 90 days (recommended)

---

## Best Practices

### For Developers

#### 1. Password Security

```javascript
// ✅ DO: Use bcrypt for password hashing
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ DON'T: Store plain text passwords
// ❌ DON'T: Use weak hashing (MD5, SHA1)
```

#### 2. Input Validation

```javascript
// ✅ DO: Validate all inputs
const projectValidation = [
    body('projectName')
        .trim()
        .notEmpty()
        .isLength({ max: 200 })
];

// ❌ DON'T: Trust user input
```

#### 3. Authentication Checks

```javascript
// ✅ DO: Protect routes with auth middleware
router.post('/', auth, async (req, res) => {
    // Protected route
});

// ❌ DON'T: Leave routes unprotected
router.post('/', async (req, res) => {
    // UNPROTECTED!
});
```

#### 4. Error Handling

```javascript
// ✅ DO: Generic error messages
res.status(500).json({ message: 'An error occurred' });

// ❌ DON'T: Expose internal errors
res.status(500).json({ 
    error: error.stack,
    query: query,
    password: process.env.DB_PASSWORD
});
```

#### 5. Logging

```javascript
// ✅ DO: Log security events
await ActivityLog.create({
    action: 'LOGIN',
    entityType: 'USER',
    userId: user._id,
    username: user.username,
    details: `User logged in from IP: ${req.ip}`
});

// ❌ DON'T: Log sensitive data
console.log('Password:', password);
```

### For Administrators

#### 1. User Management

- Review pending user approvals regularly
- Assign minimum required roles
- Delete inactive users
- Monitor activity logs

#### 2. Access Control

| Role | Permissions |
|------|-------------|
| **Superuser** | Full access, user management, system config |
| **Admin** | Manage projects, dailies, WOs, approve users |
| **User** | Create/edit own entries, view data |

#### 3. Regular Security Audits

- [ ] Review activity logs weekly
- [ ] Check for pending users daily
- [ ] Rotate JWT_SECRET every 90 days
- [ ] Update dependencies monthly
- [ ] Review file uploads for suspicious files

---

## Known Security Measures

### What's Protected

✅ **Authentication & Authorization**
- JWT token-based auth
- Role-based access control
- Password hashing with bcrypt
- Token expiration

✅ **Input Security**
- XSS prevention
- SQL injection prevention (MongoDB)
- Input validation
- Sanitization

✅ **Network Security**
- CORS configuration
- Rate limiting
- Security headers
- HTTPS support (configure in production)

✅ **File Security**
- File type validation
- File size limits
- Secure filename generation
- Isolated upload directory

### What Needs Attention

⚠️ **Production Deployment**

Before deploying to production:

1. **Enable HTTPS**
   ```bash
   # Use reverse proxy (nginx) or cloud provider
   # Configure SSL certificates
   ```

2. **Set Secure CORS**
   ```bash
   # Change FRONTEND_URL from * to specific domain
   FRONTEND_URL=https://yourapp.com
   ```

3. **Enable Database Authentication**
   ```bash
   # Use MongoDB Atlas or enable auth on local MongoDB
   MONGODB_URI=mongodb+srv://user:password@cluster/db
   ```

4. **Set Strong JWT_SECRET**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Enable Logging & Monitoring**
   - Set up log aggregation
   - Configure alerts for suspicious activities
   - Monitor rate limit hits

---

## Security Vulnerability Reporting

### How to Report

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. **DO** send a private email to the maintainer
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Time

- Initial response: Within 48 hours
- Status update: Within 1 week
- Fix timeline: Depends on severity

---

## Security Updates

### Version History

| Version | Date | Security Changes |
|---------|------|-----------------|
| 1.0.0 | 2025-01-01 | Initial release |
| 1.1.0 | 2025-01-02 | Added rate limiting, input sanitization, JWT_SECRET required |

### Keeping Secure

1. **Update Regularly**
   ```bash
   cd server
   npm update
   
   cd client
   npm update
   ```

2. **Check for Vulnerabilities**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Monitor Dependencies**
   - Use tools like Dependabot
   - Subscribe to security advisories

---

## Compliance

### Data Protection

- User passwords are hashed (bcrypt)
- JWT tokens expire
- Activity logs track all actions
- No sensitive data in logs

### OWASP Top 10 Coverage

| OWASP Category | Status | Implementation |
|----------------|--------|----------------|
| A01: Broken Access Control | ✅ Protected | Role-based middleware |
| A02: Cryptographic Failures | ✅ Protected | bcrypt, JWT with strong secret |
| A03: Injection | ✅ Protected | MongoDB, input validation |
| A04: Insecure Design | ✅ Protected | Security-by-design approach |
| A05: Security Misconfiguration | ⚠️ Partial | Requires production hardening |
| A06: Vulnerable Components | ⚠️ Partial | Regular updates needed |
| A07: Auth Failures | ✅ Protected | Rate limiting, strong passwords |
| A08: Data Integrity | ✅ Protected | Input validation, sanitization |
| A09: Logging Failures | ✅ Protected | Activity logging implemented |
| A10: SSRF | ✅ Protected | No external URL fetching |

---

## Contact

For security-related questions:

- Email: [Your security contact]
- GitHub: [Your GitHub security policy]

---

**Last Updated:** 2025-01-02  
**Version:** 1.1.0
