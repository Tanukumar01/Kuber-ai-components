class GoldPriceService {
  constructor() {
    // Hardcoded gold price per gram (in USD) - in production, this would come from a real-time API
    const overridePerGramUsd = process.env.GOLD_PRICE_PER_GRAM_USD ? Number(process.env.GOLD_PRICE_PER_GRAM_USD) : null;
    this.currentGoldPricePerGram = overridePerGramUsd || 65.50; // USD per gram
    this.currentGoldPricePerOunce = Math.round(this.currentGoldPricePerGram * 31.1034768 * 100) / 100; // USD per ounce
    this.lastUpdated = new Date();

    // Currency settings
    this.defaultCurrency = (process.env.DEFAULT_CURRENCY || 'INR').toUpperCase();
    this.usdToInrRate = Number(process.env.EXCHANGE_RATE_USD_INR || 83.0);

    // Live price provider settings (optional)
    this.priceProvider = (process.env.GOLD_PRICE_PROVIDER || '').toLowerCase(); // 'goldapi' | 'metalsapi' | 'metalpriceapi'
    this.goldApiKey = process.env.GOLDAPI_KEY || '';
    this.metalsApiKey = process.env.METALS_API_KEY || '';
    this.metalpriceApiKey = process.env.METALPRICE_API_KEY || '';
  }

  // Internal: convert a USD amount to desired currency
  convertFromUsd(amountUsd, targetCurrency) {
    const currency = (targetCurrency || this.defaultCurrency || 'USD').toUpperCase();
    if (currency === 'USD') {
      return { amount: amountUsd, currency: 'USD' };
    }
    if (currency === 'INR') {
      return { amount: Math.round(amountUsd * this.usdToInrRate * 100) / 100, currency: 'INR' };
    }
    // Fallback: unknown currency -> return USD
    return { amount: amountUsd, currency: 'USD' };
  }

  // Get current gold price per gram
  getCurrentGoldPricePerGram(currency) {
    const converted = this.convertFromUsd(this.currentGoldPricePerGram, currency);
    return {
      price: converted.amount,
      currency: converted.currency,
      unit: 'per gram',
      lastUpdated: this.lastUpdated
    };
  }

  // Get current gold price per ounce
  getCurrentGoldPricePerOunce(currency) {
    const converted = this.convertFromUsd(this.currentGoldPricePerOunce, currency);
    return {
      price: converted.amount,
      currency: converted.currency,
      unit: 'per ounce',
      lastUpdated: this.lastUpdated
    };
  }

  // Calculate total cost for a given amount of gold
  calculateGoldCost(goldAmountInGrams, currency) {
    if (goldAmountInGrams <= 0) {
      throw new Error('Gold amount must be greater than 0');
    }

    const totalCostUsd = goldAmountInGrams * this.currentGoldPricePerGram;
    const converted = this.convertFromUsd(totalCostUsd, currency);
    const pricePerGramConverted = this.convertFromUsd(this.currentGoldPricePerGram, currency);
    
    return {
      goldAmount: goldAmountInGrams,
      goldPricePerGram: pricePerGramConverted.amount,
      totalCost: converted.amount,
      currency: converted.currency,
      calculationDate: new Date()
    };
  }

  // Calculate how much gold can be purchased with a given amount of money
  calculateGoldAmountForMoney(moneyAmount, currency) {
    if (moneyAmount <= 0) {
      throw new Error('Money amount must be greater than 0');
    }
    // Normalize incoming money to USD if provided in INR
    let moneyInUsd = moneyAmount;
    const curr = (currency || this.defaultCurrency || 'USD').toUpperCase();
    if (curr === 'INR') {
      moneyInUsd = moneyAmount / this.usdToInrRate;
    }
    const goldAmount = moneyInUsd / this.currentGoldPricePerGram;
    const pricePerGramOut = this.convertFromUsd(this.currentGoldPricePerGram, curr);
    
    return {
      moneyAmount,
      goldAmount: Math.round(goldAmount * 1000) / 1000, // Round to 3 decimal places (milligrams)
      goldPricePerGram: pricePerGramOut.amount,
      currency: pricePerGramOut.currency,
      calculationDate: new Date()
    };
  }

  // Get gold price history (simulated)
  getGoldPriceHistory(days = 30, currency) {
    const history = [];
    const basePrice = this.currentGoldPricePerGram;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price variation (±5%)
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const price = basePrice * (1 + variation);
      const converted = this.convertFromUsd(price, currency);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(converted.amount * 100) / 100,
        currency: converted.currency
      });
    }
    
    return history;
  }

  // Update gold price (simulated - in production this would fetch from external API)
  async updateGoldPrice(options = {}) {
    try {
      const useLive = options.useLive === true;
      if (useLive) {
        const usdPerOunce = await this.fetchLiveUsdPerOunce();
        if (usdPerOunce && usdPerOunce > 0) {
          this.currentGoldPricePerOunce = Math.round(usdPerOunce * 100) / 100;
          this.currentGoldPricePerGram = Math.round((usdPerOunce / 31.1034768) * 100) / 100;
          this.lastUpdated = new Date();
          return { success: true, source: this.priceProvider || 'live', newPricePerGramUsd: this.currentGoldPricePerGram, lastUpdated: this.lastUpdated };
        }
      }

      // Fallback: simulate if no live provider configured or failed
      await new Promise(resolve => setTimeout(resolve, 100));
      const variation = (Math.random() - 0.5) * 0.04; // ±2%
      this.currentGoldPricePerGram = Math.round(this.currentGoldPricePerGram * (1 + variation) * 100) / 100;
      this.currentGoldPricePerOunce = Math.round(this.currentGoldPricePerGram * 31.1034768 * 100) / 100;
      this.lastUpdated = new Date();
      return { success: true, source: 'simulated', newPricePerGramUsd: this.currentGoldPricePerGram, lastUpdated: this.lastUpdated };
    } catch (error) {
      console.error('Error updating gold price:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch live gold price in USD per troy ounce (XAUUSD)
  async fetchLiveUsdPerOunce() {
    try {
      if (this.priceProvider === 'goldapi' && this.goldApiKey) {
        // Docs: https://www.goldapi.io/api/XAU/USD
        const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: {
            'x-access-token': this.goldApiKey,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error(`goldapi status ${res.status}`);
        const data = await res.json();
        // goldapi returns price in USD per troy ounce in data.price
        const price = Number(data?.price);
        if (price > 0) return price;
      }

      if (this.priceProvider === 'metalsapi' && this.metalsApiKey) {
        // Docs: https://metals-api.com/api/latest?access_key=KEY&base=USD&symbols=XAU
        const url = `https://metals-api.com/api/latest?access_key=${this.metalsApiKey}&base=USD&symbols=XAU`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`metalsapi status ${res.status}`);
        const data = await res.json();
        // rates.XAU = how many XAU for 1 USD → invert to get USD per XAU
        const xauPerUsd = Number(data?.rates?.XAU);
        if (xauPerUsd > 0) {
          const usdPerXau = 1 / xauPerUsd; // USD per troy ounce
          return usdPerXau;
        }
      }

      if (this.priceProvider === 'metalpriceapi' && this.metalpriceApiKey) {
        // Docs: https://metalpriceapi.com — latest with base=USD and currencies=XAU
        const url = `https://api.metalpriceapi.com/v1/latest?api_key=${this.metalpriceApiKey}&base=USD&currencies=XAU`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`metalpriceapi status ${res.status}`);
        const data = await res.json();
        // response.rates.XAU = XAU per USD (like 0.0005). Invert to get USD per XAU (per troy ounce)
        const xauPerUsd = Number(data?.rates?.XAU);
        if (xauPerUsd > 0) {
          const usdPerXau = 1 / xauPerUsd;
          // Also refresh USD→INR if available to improve INR accuracy
          try {
            const fxUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${this.metalpriceApiKey}&base=USD&currencies=INR`;
            const fxRes = await fetch(fxUrl);
            if (fxRes.ok) {
              const fxData = await fxRes.json();
              const usdInr = Number(fxData?.rates?.INR);
              if (usdInr > 0) this.usdToInrRate = usdInr;
            }
          } catch (_) {
            // ignore
          }
          return usdPerXau;
        }
      }
      return null;
    } catch (err) {
      console.error('fetchLiveUsdPerOunce error:', err.message);
      return null;
    }
  }

  // Get gold investment facts
  getGoldInvestmentFacts() {
    return {
      facts: [
        "Gold has been used as a form of currency and store of value for over 5,000 years.",
        "Gold is considered a safe-haven asset during economic uncertainty.",
        "Digital gold offers 24/7 liquidity and no storage concerns.",
        "Gold has historically maintained its purchasing power over long periods.",
        "Gold can provide portfolio diversification benefits.",
        "Digital gold can be purchased in small amounts, making it accessible to all investors.",
        "Gold prices are influenced by factors like inflation, currency fluctuations, and geopolitical events.",
        "Digital gold certificates are backed by physical gold stored in secure vaults."
      ],
      benefits: [
        "Inflation hedge",
        "Portfolio diversification",
        "Safe-haven asset",
        "No storage costs",
        "High liquidity",
        "Accessible investment"
      ]
    };
  }

  // Validate gold amount
  validateGoldAmount(amount) {
    const minAmount = 0.001; // 1 milligram
    const maxAmount = 1000; // 1 kg
    
    if (amount < minAmount) {
      return {
        valid: false,
        error: `Minimum gold amount is ${minAmount} grams`
      };
    }
    
    if (amount > maxAmount) {
      return {
        valid: false,
        error: `Maximum gold amount is ${maxAmount} grams`
      };
    }
    
    return {
      valid: true,
      amount: amount
    };
  }
}

module.exports = new GoldPriceService();
