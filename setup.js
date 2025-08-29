const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Gold Investment API Setup Script\n');

// Check if Node.js is installed
function checkNodeVersion() {
  try {
    const version = process.version;
    console.log(`✅ Node.js version: ${version}`);
    
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    if (majorVersion < 14) {
      console.log('❌ Node.js version 14 or higher is required');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Node.js is not installed');
    process.exit(1);
  }
}

// Check if package.json exists
function checkPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found. Please run this script from the project root directory.');
    process.exit(1);
  }
  console.log('✅ package.json found');
}

// Install dependencies
function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('\n📝 Creating .env file from template...');
      try {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created from template');
        console.log('⚠️  Please edit .env file with your configuration:');
        console.log('   - MongoDB connection string');
        console.log('   - OpenRouter API key');
        console.log('   - JWT secret key');
      } catch (error) {
        console.log('❌ Failed to create .env file');
        process.exit(1);
      }
    } else {
      console.log('❌ env.example file not found');
      process.exit(1);
    }
  } else {
    console.log('✅ .env file already exists');
  }
}

// Check MongoDB connection
async function checkMongoDB() {
  console.log('\n🗄️  Checking MongoDB connection...');
  try {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    dotenv.config();
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gold_investment_db';
    console.log(`   Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB connection failed');
    console.log('   Please ensure MongoDB is running and accessible');
    console.log('   You can use MongoDB Atlas (cloud) or local MongoDB');
    console.log('   Update MONGODB_URI in your .env file');
  }
}

// Check OpenRouter API key
function checkOpenRouterKey() {
  console.log('\n🤖 Checking OpenRouter API key...');
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey || openRouterKey === 'your_openrouter_api_key_here') {
    console.log('❌ OpenRouter API key not configured');
    console.log('   Please get an API key from: https://openrouter.ai/keys');
    console.log('   Add it to your .env file as OPENROUTER_API_KEY=your_key_here');
  } else {
    console.log('✅ OpenRouter API key configured');
  }
}

// Create directories if they don't exist
function createDirectories() {
  console.log('\n📁 Creating necessary directories...');
  const dirs = ['logs', 'uploads'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  });
}

// Main setup function
async function setup() {
  try {
    checkNodeVersion();
    checkPackageJson();
    installDependencies();
    checkEnvFile();
    createDirectories();
    
    // Load environment variables for checks
    require('dotenv').config();
    
    await checkMongoDB();
    checkOpenRouterKey();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Edit .env file with your configuration');
    console.log('2. Start MongoDB (if using local instance)');
    console.log('3. Run: npm run dev (for development)');
    console.log('4. Run: npm start (for production)');
    console.log('5. Test the API: node test-api.js');
    console.log('\n📚 For more information, see README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = { setup };
