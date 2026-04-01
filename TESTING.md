# 🧪 Testing Guide

Panduan lengkap untuk menjalankan automated tests pada aplikasi Daily Activity Infrastructure Engineer.

## 📋 Daftar Isi

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Options](#test-options)
- [Test Coverage](#test-coverage)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Sebelum menjalankan tests, pastikan Anda telah menginstall:

- **Node.js** >= 18.x
- **MongoDB** (recommended) ATAU gunakan MongoDB in-memory (lebih lambat)
- **npm** atau **yarn**

### MongoDB Setup (Recommended - Faster)

Untuk testing yang lebih cepat, install MongoDB locally:

**Ubuntu/Debian:**
```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

**Docker (Alternative):**
```bash
docker run -d --name mongodb-test -p 27017:27017 mongo:7.0
```

---

## Installation

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

Dependencies yang akan diinstall untuk testing:
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `mongodb-memory-server` - In-memory MongoDB untuk testing (optional)
- `bcryptjs` - Password hashing

### 2. Install Frontend Dependencies (Coming Soon)

```bash
cd client
npm install
```

---

## Running Tests

### Option 1: With Local MongoDB (Recommended - Faster)

```bash
cd server

# Make sure MongoDB is running
sudo systemctl start mongod  # Linux
# or
brew services start mongodb-community  # macOS

# Run tests
npm test
```

### Option 2: With MongoDB In-Memory (No MongoDB Required - Slower)

```bash
cd server

# Run tests with in-memory MongoDB
TEST_DB=memory npm test
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode (Auto-reload on changes)

```bash
npm run test:watch
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

Coverage report akan tersimpan di `server/coverage/`.

### Run Specific Test File

```bash
npm test -- auth.test.js
npm test -- projects.test.js
npm test -- workOrders.test.js
npm test -- dailies.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- -t "Authentication"
npm test -- -t "should create"
```

---

## Test Structure

### Backend Test Files

```
server/tests/
├── setup.js              # Test setup & teardown (MongoDB in-memory)
├── auth.test.js          # Authentication & authorization tests
├── projects.test.js      # Project CRUD & operations tests
├── workOrders.test.js    # Work Order CRUD & operations tests
└── dailies.test.js       # Daily Activity CRUD & operations tests
```

### Test Coverage

| Test File | Test Cases | Coverage Area |
|-----------|-----------|---------------|
| `auth.test.js` | 18 | Register, Login, Token Validation, Password Change |
| `projects.test.js` | 25 | CRUD, Carry Forward, Batch Update, Reports |
| `workOrders.test.js` | 20 | CRUD, Batch Update, Reports |
| `dailies.test.js` | 20 | CRUD, Batch Update, Reports |

**Total: 83 automated test cases**

---

## Writing New Tests

### Test Template

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Model = require('../models/YourModel');

describe('📝 Your Feature Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Setup: Get test user and token
    testUser = await getTestUser();
    authToken = await getAuthToken();
  });

  describe('POST /api/your-endpoint', () => {
    beforeEach(async () => {
      // Cleanup before each test
      await Model.deleteMany({});
    });

    it('should do something', async () => {
      const testData = {
        field: 'value'
      };

      const response = await request(app)
        .post('/api/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.field).toBe('value');
    });

    it('should reject invalid data', async () => {
      const testData = {
        // Missing required field
      };

      const response = await request(app)
        .post('/api/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });
});
```

### Best Practices

1. **Gunakan `beforeEach` untuk cleanup** - Pastikan setiap test dimulai dengan state yang bersih
2. **Test satu hal per test case** - Jangan test multiple behaviors dalam satu `it()`
3. **Gunakan descriptive names** - Nama test harus menjelaskan apa yang di-test
4. **Test edge cases** - Invalid input, missing fields, unauthorized access
5. **Gunakan helper functions** - `getTestUser()`, `getAuthToken()` sudah tersedia global

---

## Troubleshooting

### Common Issues

#### 1. "MongoDB connection error"

**Solusi:** Test menggunakan MongoDB in-memory, tidak perlu MongoDB running.

```bash
# Pastikan mongodb-memory-server terinstall
npm install --save-dev mongodb-memory-server
```

#### 2. "JWT_SECRET not set"

**Solusi:** Test setup sudah set JWT_SECRET otomatis, tapi jika ada error:

```bash
# Set environment variable manually
export JWT_SECRET=test-secret-key
npm test
```

#### 3. "Test timeout"

Tests di-set timeout 30 detik. Jika masih timeout:

```javascript
// Increase timeout untuk specific test
it('should do something slow', async () => {
  // ... test code
}, 60000); // 60 seconds
```

#### 4. "Handles not closed"

Jika ada warning tentang open handles:

```bash
# Jest akan force exit setelah tests selesai
npm test -- --forceExit
```

#### 5. Tests pass locally but fail in CI

**Solusi:** Pastikan tidak ada dependency pada:
- External APIs
- File system paths yang hardcoded
- Environment variables yang tidak di-set di test setup

---

## Test Environment Variables

Environment variables untuk testing di-set otomatis di `tests/setup.js`:

```javascript
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-1234567890';
```

Jika perlu override:

```bash
# Create .env.test file
JWT_SECRET=your-test-secret
MONGODB_URI=mongodb://localhost:27017/test-db
```

---

## Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd server
          npm ci

      - name: Run tests
        run: |
          cd server
          npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./server/coverage
```

---

## Performance Tips

### Speed Up Tests

1. **Parallel Execution**

```bash
# Run tests in parallel (Jest default)
npm test
```

2. **Shard Tests**

```bash
# Run subset of tests
npm test -- --shard=1/3
npm test -- --shard=2/3
npm test -- --shard=3/3
```

3. **Skip Expensive Setup**

```javascript
// Reuse database connection across test files
// Sudah di-handle di setup.js
```

---

## Future Enhancements

### Planned Test Additions

- [ ] Frontend component tests (React Testing Library)
- [ ] E2E tests (Playwright/Cypress)
- [ ] API integration tests
- [ ] Performance tests
- [ ] Security tests (OWASP Top 10)

### Coverage Goals

- [ ] Backend: 80%+ coverage
- [ ] Frontend: 60%+ coverage
- [ ] Critical paths: 100% coverage

---

## Support

Jika ada pertanyaan atau masalah:

1. Check dokumentasi ini
2. Lihat contoh test yang sudah ada di `server/tests/`
3. Baca [Jest Documentation](https://jestjs.io/docs/getting-started)
4. Baca [Supertest Documentation](https://github.com/ladjs/supertest)

---

**Happy Testing! 🎉**
