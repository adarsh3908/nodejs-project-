# RxDigital Backend - Architecture Guide

## Overview

RxDigital Backend is a secure, scalable Node.js REST API built with Express.js and MongoDB. This document outlines the architecture, design patterns, data models, and error handling strategies.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Patterns](#design-patterns)
3. [Project Structure](#project-structure)
4. [Data Models](#data-models)
5. [Request/Response Flow](#requestresponse-flow)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)
8. [Future Enhancements](#future-enhancements)

## Architecture Overview

### High-Level View

```
┌─────────────────────────────────────────────────┐
│              Client Application                 │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/REST
                  ▼
┌─────────────────────────────────────────────────┐
│            Express Server (Port 3000)            │
├─────────────────────────────────────────────────┤
│ Core Middleware (CORS, body-parser)             │
│ Authentication Middleware (JWT validation)      │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────┐
        ▼                    ▼              ▼
   ┌────────────┐    ┌──────────────┐   ┌─────────┐
   │   Routes   │    │  Validators  │   │Middleware
   │ (Handlers) │    │ (Input Check)│   │(Auth)   │
   └────┬───────┘    └──────────────┘   └─────────┘
        │
        ▼
   ┌──────────────┐
   │ Controllers  │ (Business Logic)
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │   Models     │ (Database Schema)
   └────┬─────────┘
        │
        ▼
   ┌──────────────────────────────────┐
   │  MongoDB (Data Persistence)      │
   └──────────────────────────────────┘
```

## Design Patterns

### 1. MVC (Model-View-Controller)

The application follows the MVC pattern for clean separation of concerns:

- **Model**: `src/models/User.js` - Defines database schema and document methods
- **View**: JSON responses to clients (handled by Express)
- **Controller**: `src/controllers/userController.js` - Implements business logic

### 2. Middleware Pattern

Middleware functions process requests before they reach controllers:

```
Request → Core Middleware → Auth Middleware → Route Handler → Controller → Response
```

### 3. Provider Pattern

Helper services encapsulate specific functionality:

- **AuthProvider**: JWT token generation and validation
- **DatabaseProvider**: MongoDB connection and initialization

### 4. Validator Pattern

Validation rules are centralized and reusable:

```javascript
// validators/userValidator.js
const registerValidator = [
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
];

// Use in routes
router.post("/register", registerValidator, controller.register);
```

## Project Structure

```
rxdigital-backend/
│
├── index.js                    # Entry point, starts server
│
├── config/
│   ├── app.js                 # App configuration (port, JWT secret)
│   └── database.js            # Database connection URL
│
├── providers/
│   ├── AuthProvider.js        # JWT token operations
│   └── DatabaseProvider.js    # MongoDB connection
│
├── src/
│   ├── app.js                 # Express app initialization
│   │
│   ├── api/
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js   # JWT validation
│   │   │   └── coreMiddleware.js   # CORS, body-parser
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js            # Route aggregation
│   │   │   └── userRoutes.js       # User endpoints (/user/register, /user/login, /user)
│   │   │
│   │   └── validators/
│   │       └── userValidator.js    # Input validation rules
│   │
│   ├── controllers/
│   │   └── userController.js       # User business logic
│   │
│   └── models/
│       └── User.js                 # User schema & methods
│
├── tests/
│   ├── user.register.test.js       # Registration tests
│   ├── user.login.test.js          # Login tests
│   └── user.protected.test.js      # Auth & protected routes tests
│
├── .env.example                # Example environment variables
├── .env.test                   # Test environment variables
├── jest.config.js              # Jest test configuration
├── package.json                # Dependencies
└── README.md                   # Documentation
```

## Data Models

### User Model

**File:** `src/models/User.js`

```javascript
{
  _id: ObjectId,              // MongoDB auto-generated ID
  name: String,               // User's full name
  email: String,              // Unique email address
  password: String,           // Bcrypt-hashed password
  createdAt: DateTime,        // Auto-generated timestamp
  updatedAt: DateTime         // Auto-updated timestamp
}
```

**Key Features:**

1. **Password Security**
   - Stored as bcrypt hash (never in plain text)
   - Automatically hashed on save via pre-save hook
   - Excluded from JSON responses automatically

2. **Email Constraints**
   - Required and unique at database level
   - Automatically trimmed and lowercased
   - Validated format with express-validator

3. **Timestamps**
   - `createdAt`: Set when document is created
   - `updatedAt`: Automatically updated on modifications

4. **Instance Methods**
   - `login(password)`: Compares provided password with stored hash

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86...",
  "createdAt": "2026-05-22T10:30:00.000Z",
  "updatedAt": "2026-05-22T10:30:00.000Z"
}
```

## Request/Response Flow

### 1. User Registration Flow

```
POST /api/user/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
          ▼
    Register Validator
    - Validates name is not empty
    - Validates email format
    - Checks email uniqueness in DB
    - Validates password length ≥ 8
          ▼
    User Controller (register)
    - Creates new User document
    - Mongoose pre-save hook hashes password
    - Generates JWT token
    - Returns token + user data
          ▼
HTTP 200
{
  "msg": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. User Login Flow

```
POST /api/user/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
          ▼
    Login Validator
    - Validates email format
    - Validates password length ≥ 8
          ▼
    User Controller (login)
    - Finds user by email
    - Compares provided password with hash
    - If match: Generates JWT token
    - Returns token + user data
          ▼
HTTP 200
{
  "msg": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 3. Protected Route Flow

```
GET /api/user
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
          ▼
    Auth Middleware
    - Extracts token from Authorization header
    - Verifies JWT signature
    - Checks token expiration
    - Attaches user data to request
          ▼
    User Controller (index)
    - Fetches all users from database
    - Excludes password field
    - Returns users list
          ▼
HTTP 200
{
  "message": "Success",
  "users": [ {...}, {...} ]
}
```

## Error Handling

### Error Response Strategy

**Validation Errors (400, 422):**
```json
{
  "errors": [
    {
      "param": "email",
      "msg": "Invalid email"
    }
  ]
}
```

**Authentication Errors (401):**
```json
{
  "error": "Unauthorized"
}
```

**Server Errors (500):**
```json
{
  "msg": "Something went wrong!"
}
```

### HTTP Status Codes

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Malformed request syntax |
| 401 | Unauthorized | Invalid/missing authentication |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios & Handling

#### 1. Duplicate Email on Registration

**Client Request:**
```json
{
  "name": "Duplicate User",
  "email": "existing@example.com",
  "password": "SecurePass123"
}
```

**Error Flow:**
1. Validator runs custom check: `body("email").custom(async (value) => { ... })`
2. Database query finds existing user with that email
3. Validator rejects with error message
4. Express-validator middleware catches error

**Response (422):**
```json
{
  "errors": [
    {
      "param": "email",
      "msg": "User with this email already exists!"
    }
  ]
}
```

#### 2. Invalid Password on Login

**Client Request:**
```json
{
  "email": "john@example.com",
  "password": "WrongPassword123"
}
```

**Error Flow:**
1. User found in database
2. Bcrypt comparison: `bcrypt.compare(input, hash)` returns `false`
3. Controller returns 401 error

**Response (401):**
```json
{
  "msg": "Invalid credentials"
}
```

#### 3. Missing/Expired Token on Protected Route

**Request:**
```
GET /api/user
```

**Error Flow (No Token):**
1. Auth middleware checks `req.headers.authorization`
2. Header is undefined/missing
3. Middleware returns 401

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error Flow (Expired Token):**
1. Auth middleware extracts token from header
2. JWT verification checks `exp` claim
3. Current time > token expiration time
4. Middleware returns 401

#### 4. Server Error on Database Operation

**Scenario:** MongoDB connection lost during user registration

**Error Flow:**
1. Controller calls `User.create()`
2. Database operation fails
3. Catch block in controller catches error
4. Error logged to console
5. Generic 500 response returned

**Response (500):**
```json
{
  "msg": "Something went wrong!"
}
```

**Note:** Generic error message prevents information leakage to clients

### Error Handling Best Practices Implemented

1. **Validation-First**: Validate before processing
2. **Explicit Status Codes**: Use correct HTTP status codes
3. **Security**: Don't expose internal error details in responses
4. **Logging**: Log errors to console for debugging
5. **User Feedback**: Return clear, actionable error messages

## Security Considerations

### 1. Password Security

- **Bcrypt Hashing**: Passwords hashed with configurable salt rounds (default: 10)
- **Pre-save Hook**: Automatic hashing before storage
- **Excluded from API**: Password never included in JSON responses

```javascript
const userSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
    select: false // Exclude from default queries
  }
  // ...
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password; // Remove from JSON output
      return ret;
    }
  }
});
```

### 2. JWT Authentication

- **Token-Based**: Uses JWT instead of sessions
- **Signature Verification**: Tokens signed with secret key
- **Expiration**: Tokens expire after configured duration (default: 7 days)
- **Bearer Scheme**: Standard HTTP Authorization header

### 3. Input Validation

- **Server-Side**: All inputs validated before processing
- **Email Validation**: Format check + uniqueness constraint
- **Password Requirements**: Minimum 8 characters enforced
- **SQL Injection Prevention**: Mongoose handles escaping

### 4. CORS Protection

- **Configured in Middleware**: Prevents unauthorized cross-origin requests
- **Whitelist Approach**: Only allows configured origins

## Future Enhancements

### Near-Term
1. **Refresh Token Logic**: Implement refresh token rotation
2. **Rate Limiting**: Add rate limiting to prevent brute force
3. **Prescription Upload**: Add endpoint for prescription image uploads
4. **Prescription Processing**: Integrate OCR/ML for handwriting recognition
5. **User Profiles**: Extended user information (doctor/pharmacy details)

### Medium-Term
1. **Email Verification**: Confirm email addresses on signup
2. **Password Reset**: Implement forgot password flow
3. **Two-Factor Authentication**: Add 2FA support
4. **Audit Logging**: Log all API operations for compliance
5. **Pagination**: Implement pagination for large datasets

### Long-Term
1. **GraphQL API**: Alternative to REST
2. **Microservices**: Split into multiple services
3. **Caching Layer**: Redis caching for performance
4. **Advanced Search**: Full-text search on prescriptions
5. **Mobile App**: Native iOS/Android applications

---

**Last Updated:** May 22, 2026  
**Maintainer:** Your Name  
**Version:** 1.0.0
