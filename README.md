# Gold Investment API System

A comprehensive Node.js API system for gold investment question detection and digital gold purchase management. The system uses LLM (OpenRouter) to identify gold-related questions and provides a complete digital gold purchase flow.

## Live Deployment

Base URL: `https://kuber-ai-components-git-main-tanukumar01s-projects.vercel.app`

Quick links:
- Health: `https://kuber-ai-components-git-main-tanukumar01s-projects.vercel.app/health`
- Analyze question: `POST https://kuber-ai-components-git-main-tanukumar01s-projects.vercel.app/api/gold-question/analyze`
- Purchase (one-step): `POST https://kuber-ai-components-git-main-tanukumar01s-projects.vercel.app/api/gold-purchase/purchase`

## Features

### 🧠 AI-Powered Question Detection
- Uses OpenRouter with Claude 3.5 Sonnet to analyze user questions
- Identifies gold investment related queries with confidence scoring
- Provides intelligent responses and suggests digital gold purchase
- Fallback keyword-based analysis when LLM is unavailable
- **Model Management**: Easy switching between different AI models (Claude, GPT-4, Gemini, etc.)

### 💰 Gold Pricing (INR, Units, Live Providers, Retail Markup)

The pricing endpoints support:
- Currency conversion (default INR)
- India-style quoting per 10 grams
- Optional live providers (GoldAPI, MetalsAPI, MetalpriceAPI)
- Optional retail markup to approximate Indian city retail prices

Query params (for pricing endpoints):
- `currency=INR|USD` (default `INR`)
- `unit=gram|ten_gram|ounce|tola` (default `gram`)
- `refresh=true` → force live refresh from provider
- `basis=spot|retail` (default `spot`)
- `markupPercent=NUMBER` → apply retail markup percent (overrides default)

Environment variables:
- `DEFAULT_CURRENCY=INR`
- `EXCHANGE_RATE_USD_INR=83`
- `GOLD_PRICE_PROVIDER=goldapi|metalsapi|metalpriceapi` (empty → simulated)
- `GOLDAPI_KEY` / `METALS_API_KEY` / `METALPRICE_API_KEY`
- `GOLD_PRICE_PER_GRAM_USD` (optional boot-time override)
- `PRICE_MARKUP_PERCENT=12` (default retail markup when `basis=retail`)

### 💰 Digital Gold Purchase System
- Complete purchase flow with transaction management
- Digital gold certificate generation
- Multiple payment method support
- User portfolio tracking

### 👤 User Management
- User registration and authentication
- JWT-based security
- Wallet management
- Investment portfolio tracking

### 📊 Analytics & Logging
- Question analysis logs for insights
- Transaction history
- User behavior tracking

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI/LLM**: OpenRouter with Claude 3.5 Sonnet (supports multiple models)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- OpenRouter API key (get one at https://openrouter.ai/keys)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gold-investment-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/gold_investment_db
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Deploy to Vercel

1. Ensure `vercel.json` exists (included).
2. Push to GitHub (done) and import the repo in Vercel.
3. In Vercel Project Settings → Environment Variables, add:
   - `MONGODB_URI`
   - `OPENROUTER_API_KEY`
   - `JWT_SECRET`
   - `DEFAULT_CURRENCY`, `EXCHANGE_RATE_USD_INR`
   - optional: `GOLD_PRICE_PROVIDER`, `METALPRICE_API_KEY`, etc.
4. Set Framework preset: “Other”. Build command: none. Output: auto.
5. Deploy. Your API will be available at `https://<your-app>.vercel.app` with routes:
   - `/health`
   - `/api/gold-question/*`, `/api/gold-purchase/*`, `/api/user/*`, `/api/ai-models/*`

## API Endpoints

### Health Check
```
GET /health
```

### Gold Question Analysis

#### Analyze User Question
```
POST /api/gold-question/analyze
```
**Request Body:**
```json
{
  "question": "What is the current gold price?",
  "userEmail": "user@example.com",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is the current gold price?",
    "analysis": {
      "isGoldRelated": true,
      "confidence": 0.95,
      "reasoning": "Question directly asks about gold price"
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

#### Get Gold Price
```
GET /api/gold-question/price
```
Optional query parameters:
- `currency=INR|USD`
- `unit=gram|ten_gram|ounce|tola`
- `refresh=true`
- `basis=spot|retail`
- `markupPercent=NUMBER`

#### Calculate Gold Cost
```
POST /api/gold-question/calculate
```
**Request Body:**
```json
{ "goldAmount": 10.5, "currency": "INR" }
```

Or by budget:
```json
{ "moneyAmount": 25000, "currency": "INR" }
```
### Digital Gold Purchase

#### Complete Purchase (One-step)
```
POST /api/gold-purchase/purchase
```
**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "goldAmount": 5.0,
  "paymentMethod": "WALLET",
  "notes": "Monthly investment"
}
```

**Response:**
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

#### Step-by-step Purchase Flow
1. **Initiate Purchase**
   ```
   POST /api/gold-purchase/initiate
   ```

2. **Process Payment**
   ```
   POST /api/gold-purchase/process-payment
   ```

3. **Complete Purchase**
   ```
   POST /api/gold-purchase/complete
   ```

#### Get Transaction History
```
GET /api/gold-purchase/transactions?userEmail=user@example.com
```

### User Management

#### Register User
```
POST /api/user/register
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword123"
}
```

#### Login User
```
POST /api/user/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get User Profile
```
GET /api/user/profile?userEmail=john@example.com
```

#### Get User Portfolio
```
GET /api/user/portfolio?userId=user_id_here
```

### AI Model Management

#### Get Available Models
```
GET /api/ai-models/available
```

#### Get Current Model
```
GET /api/ai-models/current
```

#### Switch Model
```
POST /api/ai-models/switch
```
**Request Body:**
```json
{
  "modelKey": "claude35Sonnet"
}
```

#### Get Recommended Models
```
GET /api/ai-models/recommended
```

#### Get Model Pricing
```
GET /api/ai-models/pricing
```

## Database Schema

### User Collection
```javascript
{
  userId: String (unique),
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  walletBalance: Number,
  totalGoldPurchased: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### GoldTransaction Collection
```javascript
{
  transactionId: String (unique),
  userId: ObjectId (ref: User),
  userEmail: String,
  transactionType: String (PURCHASE/SALE/REFUND),
  goldAmount: Number,
  goldPrice: Number,
  totalAmount: Number,
  paymentMethod: String,
  paymentStatus: String,
  transactionStatus: String,
  digitalGoldCertificate: {
    certificateNumber: String,
    issueDate: Date,
    validityDate: Date
  },
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### QuestionLog Collection
```javascript
{
  logId: String (unique),
  userId: ObjectId (ref: User),
  userEmail: String,
  userQuestion: String,
  isGoldRelated: Boolean,
  confidence: Number,
  aiResponse: String,
  suggestedAction: String,
  processingTime: Number,
  createdAt: Date
}
```

## Usage Examples

### 1. Question Analysis Flow
```javascript
// 1. User asks a question
const question = "Should I invest in gold now?";

// 2. Send to analysis API
const response = await fetch('/api/gold-question/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: question,
    userEmail: 'user@example.com'
  })
});

const result = await response.json();

// 3. If gold-related, suggest purchase
if (result.data.analysis.isGoldRelated) {
  console.log('Gold-related question detected!');
  console.log('AI Response:', result.data.response.message);
  // Show purchase options to user
}
```

### 2. Digital Gold Purchase Flow
```javascript
// 1. User decides to purchase
const purchaseData = {
  userEmail: 'user@example.com',
  goldAmount: 10.0, // 10 grams
  paymentMethod: 'WALLET'
};

// 2. Complete purchase
const purchaseResponse = await fetch('/api/gold-purchase/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(purchaseData)
});

const purchaseResult = await purchaseResponse.json();

// 3. Show success message
if (purchaseResult.success) {
  console.log('Purchase successful!');
  console.log('Certificate:', purchaseResult.data.purchaseDetails.certificateNumber);
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- MongoDB injection protection
- CORS enabled

## Monitoring & Analytics

- Question analysis logs for AI performance tracking
- Transaction analytics for business insights
- User behavior patterns
- API performance metrics

## Future Enhancements

- Real-time gold price integration
- Payment gateway integration (Stripe, PayPal)
- Email notifications
- Mobile app support
- Advanced analytics dashboard
- Multi-currency support
- Gold price alerts
- Advanced AI model selection based on question complexity
- Model performance analytics and cost optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team or create an issue in the repository.
