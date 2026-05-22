/**
 * User Login Tests
 * Tests the user login endpoint and authentication flow
 */

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');
const { mongoUri } = require('../config/database');

describe('User Login', () => {
  let testUser;

  beforeAll(async () => {
    try {
      await mongoose.connect(mongoUri);

      // Create a test user for login tests
      testUser = await User.create({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'ValidPassword123',
      });
    } catch (error) {
      console.error('Setup failed:', error);
    }
  });

  afterAll(async () => {
    try {
      await User.deleteMany({});
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  // Test 1: Successful login
  test('Should login with valid credentials', async () => {
    const credentials = {
      email: 'login@example.com',
      password: 'ValidPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.msg).toBe('Login successful');
    expect(response.body.user.email).toBe(credentials.email);
    expect(response.body.user).not.toHaveProperty('password');
  });

  // Test 2: Login with wrong password
  test('Should fail login with incorrect password', async () => {
    const credentials = {
      email: 'login@example.com',
      password: 'WrongPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(401);
    expect(response.body.msg).toContain('Invalid');
  });

  // Test 3: Login with non-existent email
  test('Should fail login with non-existent email', async () => {
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'ValidPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(401);
  });

  // Test 4: Missing email field
  test('Should fail login with missing email', async () => {
    const credentials = {
      password: 'ValidPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('errors');
  });

  // Test 5: Missing password field
  test('Should fail login with missing password', async () => {
    const credentials = {
      email: 'login@example.com',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(422);
  });

  // Test 6: Invalid email format
  test('Should fail login with invalid email format', async () => {
    const credentials = {
      email: 'invalid-email',
      password: 'ValidPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(422);
  });

  // Test 7: Returns valid JWT token
  test('Should return valid JWT token on login', async () => {
    const credentials = {
      email: 'login@example.com',
      password: 'ValidPassword123',
    };

    const response = await request(app)
      .post('/api/user/login')
      .send(credentials);

    expect(response.status).toBe(200);
    const token = response.body.token;
    
    // Token should have JWT format (3 parts separated by dots)
    expect(token.split('.').length).toBe(3);
  });
});
