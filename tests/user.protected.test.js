/**
 * Protected Routes Tests
 * Tests authentication and authorization for protected endpoints
 */

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { mongoUri } = require('../config/database');
const { appKey } = require('../config/app');

describe('Protected Routes - Get All Users', () => {
  let testUser;
  let validToken;

  beforeAll(async () => {
    try {
      await mongoose.connect(mongoUri);

      // Create test users
      testUser = await User.create({
        name: 'Protected Test User',
        email: 'protected@example.com',
        password: 'ValidPassword123',
      });

      // Generate valid token
      validToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        appKey,
        { expiresIn: '7d' }
      );
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

  // Test 1: Access protected route with valid token
  test('Should access protected route with valid token', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Success');
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  // Test 2: Access protected route without token
  test('Should deny access without authentication token', async () => {
    const response = await request(app)
      .get('/api/user');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  // Test 3: Access protected route with invalid token
  test('Should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(response.status).toBe(401);
  });

  // Test 4: Access protected route with expired token
  test('Should deny access with expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      appKey,
      { expiresIn: '0s' } // Expires immediately
    );

    // Wait a moment to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 100));

    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  // Test 5: Returns user data without password field
  test('Should return users without password field', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    const users = response.body.users;
    
    users.forEach(user => {
      expect(user).not.toHaveProperty('password');
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });
  });

  // Test 6: Authorization header with wrong format
  test('Should handle malformed Authorization header', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'InvalidFormat ' + validToken);

    expect(response.status).toBe(401);
  });
});
