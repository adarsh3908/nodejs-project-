# RxDigital Backend

A production-ready Node.js REST API for prescription digitization. This backend translates handwritten prescriptions into digital formats, featuring secure user authentication, validation, and error handling.

## Features

- ✅ **JWT-based Authentication**: Secure token-based authentication with expiration
- ✅ **Password Security**: Bcrypt hashing with configurable encryption rounds
- ✅ **Input Validation**: Express-validator for robust request validation
- ✅ **Error Handling**: Comprehensive error handling with proper HTTP status codes
- ✅ **Database**: MongoDB with Mongoose ODM for data persistence
- ✅ **MVC Architecture**: Clean separation of concerns (Models, Controllers, Routes, Validators)
- ✅ **Middleware Support**: Auth middleware for protected routes
- ✅ **Dynamic Port Detection**: Automatically finds available port if primary is in use
- ✅ **Environment Configuration**: Support for multiple environments via .env

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)

## Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd rxdigital-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env` file in the root directory
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables (see Configuration section)

5. Start the server
   ```bash
   npm start
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rxdigital
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
ENCRYPTION_ROUNDS=10
```

**Environment Variables:**
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment type (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRY`: Token expiration time (e.g., "7d", "24h")
- `ENCRYPTION_ROUNDS`: Bcrypt salt rounds for password hashing

## Architecture

### Design Pattern: MVC (Model-View-Controller)

```
src/
├── models/           # Data models (User schema)
├── controllers/      # Business logic handlers
├── api/
│   ├── routes/       # API endpoints
│   ├── validators/   # Request validation rules
│   └── middlewares/  # Auth & request processing
└── app.js           # Express app initialization

config/              # Configuration files
providers/           # Helper services (Auth, Database)
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | Bcrypt |
| Validation | express-validator |
| Dev Tools | Nodemon |

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, lowercase),
  password: String (required, hashed, excluded from JSON output),
  createdAt: DateTime (auto-generated),
  updatedAt: DateTime (auto-generated)
}
```

**Schema Features:**
- Password is automatically excluded from API responses
- Timestamps track creation and modification
- Email is unique at database level
- Password is hashed using bcrypt before storage

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### User Routes

#### 1. Register User
```http
POST /user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "msg": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-05-22T10:00:00Z",
    "updatedAt": "2026-05-22T10:00:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, non-empty
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters

#### 2. Login User
```http
POST /user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "msg": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

#### 3. Get All Users (Protected)
```http
GET /user
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Success",
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-05-22T10:00:00Z",
      "updatedAt": "2026-05-22T10:00:00Z"
    }
  ]
}
```

**Authorization:** Requires valid JWT token in Authorization header

## Error Handling

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Success |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (invalid/missing token) |
| 422 | Unprocessable entity (validation errors) |
| 500 | Internal server error |

### Error Response Format

```json
{
  "msg": "Descriptive error message",
  "errors": [
    {
      "param": "email",
      "msg": "Invalid email"
    }
  ]
}
```

### Common Error Scenarios

1. **Duplicate Email**: Returns 422 with validation error
2. **Invalid Credentials**: Returns 500 with generic message (prevents user enumeration)
3. **Expired Token**: Returns 401 with "Unauthorized" message
4. **Missing Auth Header**: Returns 401 with "Unauthorized" message

## Running Tests

Run the test suite:
```bash
npm test
```

Tests cover:
- User registration with valid/invalid data
- User login with correct/incorrect credentials
- Protected route access with/without tokens
- Input validation
- Database operations

## Project Structure

```
rxdigital-backend/
├── index.js                 # Application entry point
├── package.json
├── .env                     # Environment variables (add to .gitignore)
├── .env.example             # Example environment variables
├── config/
│   ├── app.js              # App configuration
│   └── database.js         # Database connection
├── providers/
│   ├── AuthProvider.js     # JWT token generation
│   └── DatabaseProvider.js # DB initialization
├── src/
│   ├── app.js              # Express app setup
│   ├── api/
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js      # JWT validation
│   │   │   └── coreMiddleware.js      # CORS, body-parser
│   │   ├── routes/
│   │   │   ├── index.js                # Route aggregation
│   │   │   └── userRoutes.js           # User endpoints
│   │   └── validators/
│   │       └── userValidator.js        # Input validation rules
│   ├── controllers/
│   │   └── userController.js           # Business logic
│   └── models/
│       └── User.js                     # User schema & methods
└── tests/
    ├── user.register.test.js
    ├── user.login.test.js
    └── user.protected.test.js
```

## Contributing

1. Create a feature branch: `git checkout -b feature/prescription-upload`
2. Commit changes: `git commit -m "Add prescription upload"`
3. Push to branch: `git push origin feature/prescription-upload`
4. Open a Pull Request

## License

ISC

   ```bash
   npm install
   ```

## [Configuration](#configuration)

1. Rename/copy [.env.example](.env.example) to '.env'
2. Configure **JWT_TOKEN_SECRET=**
3. Run the project
   `bash
    npm run start
    `
   This is how **.env.example** looks like:

```env
PORT=5000
API_PREFIX='/api/v1'

JWT_TOKEN_SECRET=
SESSION_TIMEOUT="1h"

# DATABASE
MONGODB_URI='mongodb://localhost:27017/your_database'
```

## [Features](#features)

- **NoSQL database**: [MongoDB](https://www.mongodb.com/) object data modeling using [Mongoose](https://mongoosejs.com/)
- **Authentication and authorization**: using [JWT](https://jwt.io/) (access and refresh token)
- **Validation**: request data validation using [Express Validator](https://github.com/express-validator/express-validator)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv)
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)

## [Usage](#usage)

### 1. Create the Model:

Create a dedicated model file 'modelName.js' in [models](src/models) directory. You can simply copy the existing [User.js](src/models/User.js) to save time.

### 2. Define the Route:

- Establish a new route file 'modelNameRoutes.js' in [routes](src/api/routes) directory. This file will handle incoming requests related to your model.

- Incorporate the newly created route into the master routing file, [/src/routes/index.js](/src/routes/index.js). 

- Example: 
    ```js
    const modelNameRoutes = require('../api/routes/modelNameRoutes');
    router.use('/modelName', modelNameRoutes);
    ```

### 4. Make a Validator:

If you need a validator in create 'modelNameValidator.js' in [Validators](/src/api/validators) directory. This validator will enforce data validation rules for your model. You can use [userValidator.js](src/api/validators/userValidator.js) as reference.

Usage Example: (in your 'modelNameRoutes.js' file)
```js
const { registerValidator, loginValidator } = require("../validators/userValidator");
router.post("/register", registerValidator, userController.register);
```

### 6. Make a Controller:

Make a controller file 'modelNameController.js' in [controllers](/src/controllers) directory. This file will contain the logic to process incoming requests and interact with the model. you can use [userController.js](src/controllers/userController.js) as reference.

## [Project Structure](#project-structure)

```js
nodejs-starter
├─ confg
│   ├─ app.js
│   └─ database.js
├─ providers
│   ├─ AuthProvider.js
│   └─ DatabaseProvider.js
├─ src
│   ├─ api
│   │   ├─ middlewares
│   │   │   ├─ authMiddleware.js
│   │   │   └─ coreMiddleware.js
│   │   ├─ routes
│   │   │   ├─ index.js
│   │   │   └─ userRoutes.js
│   │   └─ validators
│   │       └─ userValidator.js
│   ├─ controllers
│   │   └─ userController.js
│   ├─ models
│   │   └─ User.js
│   └─ app.js
├─ .env.example
├─ .gitignore
├─ index.js
├─ LICENSE
├─ package-lock.json
├─ package.json
└─ README.md
```

## [API Endpoints](#api-endpoints)

You can use [api.postman_collection.json](api.postman_collection.json) as a API reference. List of available routes:


- **User Auth Routes**:

    - Register - POST /:PREFIX:/user
    - Login - POST /:PREFIX:/user/login
    - Logout - POST /:PREFIX:/user/logout

- **Other User Routes**:
    - Get All Users - GET /:PREFIX:/user

NOTE: PREFIX is defined in .env file. default is '/api/v1'.

## [Contribution](#contribution)

Your contributions are invaluable, not just to me but to everyone seeking to benefit from this resource. I deeply appreciate your time and effort in making this project better.

If you have ideas, improvements, or bug fixes, don't hesitate to contribute. Every contribution, big or small, makes a significant impact.

How to Contribute:
1. Fork the repository.
2. Create a new branch for your changes.
3. Make your improvements, additions, or fixes.
4. Commit and push your changes to your fork.
5. Submit a pull request.

Your contributions help build a vibrant and collaborative community. Thank you for being part of it! 🙌

  **THANK YOU!**
