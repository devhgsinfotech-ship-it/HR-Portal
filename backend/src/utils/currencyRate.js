// backend/src/utils/currencyRate.js
// Live currency rate fetcher using free open exchange rate APIs with caching and offline fallback.

let cachedRate = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
const FALLBACK_USD_TO_INR = 84.0;

/**
 * Fetch the latest USD to INR exchange rate.
 * Returns the rate (e.g., 84.2 means 1 USD = 84.2 INR).
 */
async function getUsdToInrRate() {
  const now = Date.now();
  if (cachedRate && (now - lastFetchedTime < CACHE_TTL_MS)) {
    return cachedRate;
  }

  // 1. Try Primary Free API (open.er-api.com)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.INR && typeof data.rates.INR === 'number' && data.rates.INR > 0) {
        cachedRate = Math.round(data.rates.INR * 100) / 100;
        lastFetchedTime = now;
        console.log(`[CurrencyRate] Fetched live USD->INR rate: ${cachedRate}`);
        return cachedRate;
      }
    }
  } catch (err) {
    console.warn('[CurrencyRate] Primary API failed, trying backup API...', err.message);
  }

  // 2. Try Backup Free API (api.exchangerate-api.com)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.INR && typeof data.rates.INR === 'number' && data.rates.INR > 0) {
        cachedRate = Math.round(data.rates.INR * 100) / 100;
        lastFetchedTime = now;
        console.log(`[CurrencyRate] Fetched live backup USD->INR rate: ${cachedRate}`);
        return cachedRate;
      }
    }
  } catch (err) {
    console.warn('[CurrencyRate] Backup API failed, falling back to default...', err.message);
  }

  // 3. Fallback
  if (!cachedRate) {
    cachedRate = FALLBACK_USD_TO_INR;
  }
  return cachedRate;
}

/**
 * Convert an amount from INR to USD based on the exchange rate.
 * Example: 1999 INR / 84.0 = ~23.80 USD
 */
function convertInrToUsd(amountInInr, rate = FALLBACK_USD_TO_INR) {
  if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) return 0;
  if (rate <= 0) rate = FALLBACK_USD_TO_INR;
  return Math.round((Number(amountInInr) / rate) * 100) / 100;
}

/**
 * Convert an amount from USD to INR based on the exchange rate.
 */
function convertUsdToInr(amountInUsd, rate = FALLBACK_USD_TO_INR) {
  if (amountInUsd === null || amountInUsd === undefined || isNaN(amountInUsd)) return 0;
  if (rate <= 0) rate = FALLBACK_USD_TO_INR;
  return Math.round(Number(amountInUsd) * rate * 100) / 100;
}

module.exports = {
  getUsdToInrRate,
  convertInrToUsd,
  convertUsdToInr,
  FALLBACK_USD_TO_INR
};
