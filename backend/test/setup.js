'use strict';

// Set dummy env vars before any module loads — prevents SDKs from throwing
// at instantiation time due to missing keys
process.env.GROQ_API_KEY  = process.env.GROQ_API_KEY  || 'test-dummy-key';
process.env.MONGO_URI     = process.env.MONGO_URI     || 'mongodb://localhost:27017/test';
process.env.JWT_SECRET    = process.env.JWT_SECRET    || 'test-jwt-secret';
process.env.NODE_ENV      = 'test';
