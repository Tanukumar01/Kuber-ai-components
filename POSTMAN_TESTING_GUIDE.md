# 🚀 Postman Testing Guide for Gold Investment API

This guide will help you test all API endpoints using Postman for the Gold Investment API with OpenRouter integration.

## 📋 Prerequisites

1. **Install Postman**: Download and install Postman from [postman.com](https://www.postman.com/downloads/)
2. **Start the API Server**: Make sure your API is running on `http://localhost:3000`
3. **Configure Environment**: Set up your `.env` file with OpenRouter API key
4. **Import Collection**: Import the provided `postman-collection.json` file

## 🔧 Setup Instructions

### Step 1: Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select the `postman-collection.json` file
4. The collection will be imported with all endpoints organized

### Step 2: Configure Variables

The collection uses these variables:
- `baseUrl`: `http://localhost:3000`
- `userEmail`: `test@example.com`
- `userPassword`: `testpassword123`
- `authToken`: (auto-populated after login)

### Step 3: Start Your API Server

```bash
# Start the server
npm run dev

# Or if using production
npm start
```

## 🧪 Testing Flow

### 1. Health Check
**Endpoint**: `GET /health`

**Purpose**: Verify the API is running

**Expected Response**:
```json
{
  "status": "OK",
  "message": "Gold Investment API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. User Management

#### 2.1 Register User
**Endpoint**: `POST /api/user/register`

**Request Body**:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+1234567890",
  "password": "testpassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "USER_1234567890_abc123",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890",
      "walletBalance": 0,
      "totalGoldPurchased": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2.2 Login User
**Endpoint**: `POST /api/user/login`

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "testpassword123"
}
```

**Note**: The Postman collection automatically saves the token for subsequent requests.

### 3. AI Model Management

#### 3.1 Get Available Models
**Endpoint**: `GET /api/ai-models/available`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "key": "claude35Sonnet",
        "modelId": "anthropic/claude-3.5-sonnet",
        "description": "Claude 3.5 Sonnet - Balanced performance and cost",
        "maxTokens": 500,
        "temperature": 0.3
      }
    ],
    "total": 12
  }
}
```

#### 3.2 Switch AI Models
**Endpoint**: `POST /api/ai-models/switch`

**Request Body**:
```json
{
  "modelKey": "gpt4o"
}
```

**Available Model Keys**:
- `claude35Sonnet` - Claude 3.5 Sonnet (default)
- `gpt4o` - GPT-4o
- `claude35Haiku` - Claude 3.5 Haiku (cost-effective)
- `geminiPro` - Google Gemini Pro
- `llama370b` - Llama 3.1 70B

### 4. Gold Question Analysis

#### 4.1 Analyze Question
**Endpoint**: `POST /api/gold-question/analyze`

**Request Body**:
```json
{
  "question": "What is the current gold price and should I invest in digital gold?",
  "userEmail": "test@example.com"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "question": "What is the current gold price and should I invest in digital gold?",
    "analysis": {
      "isGoldRelated": true,
      "confidence": 0.95,
      "reasoning": "Question directly asks about gold price and investment"
    },
    "response": {
      "message": "The current gold price is $65.50 per gram...",
      "suggestedAction": "PURCHASE_GOLD",
      "goldPrice": {
        "price": 65.50,
        "currency": "USD",
        "unit": "per gram"
      }
    }
  }
}
```

#### 4.2 Get Gold Price
**Endpoint**: `GET /api/gold-question/price`

#### 4.3 Calculate Gold Cost
**Endpoint**: `POST /api/gold-question/calculate`

**Request Body**:
```json
{
  "goldAmount": 10.5
}
```

### 5. Digital Gold Purchase

#### 5.1 Complete Purchase (One-step)
**Endpoint**: `POST /api/gold-purchase/purchase`

**Request Body**:
```json
{
  "userEmail": "test@example.com",
  "goldAmount": 5.0,
  "paymentMethod": "WALLET",
  "notes": "Test purchase from Postman"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Digital gold purchase completed successfully!",
  "data": {
    "transactionId": "TXN_1234567890_abc123",
    "status": "COMPLETED",
    "purchaseDetails": {
      "goldAmount": 5.0,
      "goldPrice": 65.50,
      "totalAmount": 327.50,
      "certificateNumber": "DGC_1234567890_xyz789",
      "issueDate": "2024-01-15T10:30:00.000Z",
      "validityDate": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

#### 5.2 Step-by-step Purchase Flow

**Step 1: Initiate Purchase**
```json
POST /api/gold-purchase/initiate
{
  "userEmail": "test@example.com",
  "goldAmount": 3.0,
  "paymentMethod": "WALLET"
}
```

**Step 2: Process Payment**
```json
POST /api/gold-purchase/process-payment
{
  "transactionId": "TXN_ID_FROM_STEP_1",
  "paymentDetails": {
    "method": "WALLET",
    "amount": 196.50
  }
}
```

**Step 3: Complete Purchase**
```json
POST /api/gold-purchase/complete
{
  "transactionId": "TXN_ID_FROM_STEP_1"
}
```

### 6. Test Different Question Types

Test these questions to see how the AI responds:

1. **Gold Related**: "What is the current gold price?"
2. **Investment Question**: "Should I invest in stocks or gold?"
3. **Non-Gold Question**: "What's the weather like today?"
4. **Cryptocurrency**: "Tell me about Bitcoin investment"

## 🔄 Testing Workflow

### Recommended Testing Sequence:

1. **Health Check** → Verify API is running
2. **Get Available Models** → See available AI models
3. **Register User** → Create test user account
4. **Login User** → Get authentication token
5. **Get Current Model** → Check default AI model
6. **Analyze Gold Question** → Test AI analysis
7. **Switch to GPT-4** → Change AI model
8. **Analyze Same Question** → Compare responses
9. **Complete Purchase** → Test gold purchase flow
10. **Get Transaction History** → Verify purchase was recorded

## 🎯 Advanced Testing Scenarios

### Scenario 1: Model Comparison
1. Switch to different AI models
2. Ask the same question to each model
3. Compare response quality and speed

### Scenario 2: Error Handling
1. Test with invalid API keys
2. Test with malformed requests
3. Test with missing required fields

### Scenario 3: Performance Testing
1. Test with high-volume requests
2. Monitor response times
3. Check for rate limiting

## 📊 Expected Response Codes

- **200**: Success
- **201**: Created (User registration)
- **400**: Bad Request (Invalid input)
- **401**: Unauthorized (Invalid token)
- **404**: Not Found
- **500**: Internal Server Error

## 🔍 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Ensure API server is running on port 3000
   - Check if MongoDB is connected

2. **401 Unauthorized**
   - Verify OpenRouter API key is set in `.env`
   - Check if token is valid

3. **500 Internal Server Error**
   - Check server logs for detailed error
   - Verify all environment variables are set

4. **Model Switching Not Working**
   - Ensure OpenRouter API key is valid
   - Check if model name is correct

## 📝 Tips for Effective Testing

1. **Use Collection Variables**: The collection automatically manages tokens and user data
2. **Test in Sequence**: Follow the recommended testing sequence
3. **Compare Responses**: Test the same question with different AI models
4. **Monitor Logs**: Keep an eye on server console for detailed error messages
5. **Save Responses**: Use Postman's save response feature to compare results

## 🚀 Quick Start Commands

```bash
# Start the server
npm run dev

# Test with curl (alternative to Postman)
curl -X GET http://localhost:3000/health

# Test question analysis
curl -X POST http://localhost:3000/api/gold-question/analyze \
  -H "Content-Type: application/json" \
  -d '{"question": "What is gold price?", "userEmail": "test@example.com"}'
```

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [MongoDB Connection Guide](https://docs.mongodb.com/manual/installation/)

---

**Happy Testing! 🎉**

This guide covers all the essential endpoints and testing scenarios for your Gold Investment API. The Postman collection makes it easy to test systematically and compare results across different AI models.
