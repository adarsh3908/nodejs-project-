/**
 * User Registration Tests
 * Tests the user registration endpoint with various scenarios
 */

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');
const { mongoUri } = require('../config/database');

// Test suite
describe('User Registration', () => {
  // Setup: Connect to test database before all tests
  beforeAll(async () => {
    try {
      await mongoose.connect(mongoUri);
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  });

  // Cleanup: Clear users collection and disconnect after all tests
  afterAll(async () => {
    try {
      await User.deleteMany({});
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  // Test 1: Successful registration
  test('Should register a new user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123',
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.msg).toBe('User created successfully');
  });

  // Test 2: Registration with duplicate email
  test('Should fail registration with duplicate email', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'duplicate@example.com',
      password: 'SecurePassword123',
    };

    // First registration
    await request(app)
      .post('/api/user/register')
      .send(userData);

    // Second registration with same email
    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors[0].msg).toContain('already exists');
  });

  // Test 3: Missing required fields
  test('Should fail registration with missing name field', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123',
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('errors');
  });

  // Test 4: Invalid email format
  test('Should fail registration with invalid email', async () => {
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'SecurePassword123',
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(422);
    expect(response.body.errors[0].msg).toContain('Invalid email');
  });

  // Test 5: Password too short
  test('Should fail registration with password less than 8 characters', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(422);
    expect(response.body.errors[0].msg).toContain('minimum password length');
  });

  // Test 6: Email trimming and lowercase
  test('Should trim and lowercase email on registration', async () => {
    const userData = {
      name: 'Case Test',
      email: '  CaseTest@EXAMPLE.COM  ',
      password: 'SecurePassword123',
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(userData);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('casetest@example.com');
  });
});
