import untypedFiatUnit from './fiatUnits.json';

export const FiatUnitSource = {
  Coinbase: 'Coinbase',
  CoinDesk: 'CoinDesk',
  CoinGecko: 'CoinGecko',
  Yadio: 'Yadio',
  YadioConvert: 'YadioConvert',
  Exir: 'Exir',
  wazirx: 'wazirx',
  Bitstamp: 'Bitstamp',
  BNR: 'BNR',
} as const;

const RateExtractors = {
  Coinbase: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.coinbase.com/v2/prices/BTC-${ticker.toUpperCase()}/buy`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.data?.amount;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },
  CoinDesk: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.coindesk.com/v1/bpi/currentprice/${ticker}.json`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.bpi?.[ticker]?.rate_float;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },
  CoinGecko: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${ticker.toLowerCase()}`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    const rate = json?.bitcoin?.[ticker] || json?.bitcoin?.[ticker.toLowerCase()];
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },
  Bitstamp: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://www.bitstamp.net/api/v2/ticker/btc${ticker.toLowerCase()}`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate from Bitstamp for ${ticker}: ${e.message}`);
    }

    if (Array.isArray(json)) {
      throw new Error(`Unsupported ticker for Bitstamp: ${ticker}`);
    }

    let rate = +json?.last;
    if (!rate) throw new Error(`Could not update rate from Bitstamp for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate from Bitstamp for ${ticker}: data is wrong`);
    return rate;
  },
  BNR: async (): Promise<number> => {
    try {
      const response = await fetch('https://www.bnr.ro/nbrfxrates.xml');
      const xmlData = await response.text();

      // Fetching USD to RON rate
      const pattern = /<Rate currency="USD">([\d.]+)<\/Rate>/;
      const matches = xmlData.match(pattern);

      if (matches && matches[1]) {
        const usdToRonRate = parseFloat(matches[1]);
        if (!isNaN(usdToRonRate) && usdToRonRate > 0) {
          // Fetch BTC to USD rate using CoinGecko extractor
          const btcToUsdRate = await RateExtractors.CoinGecko('USD');

          // Convert BTC to RON using the USD to RON exchange rate
          return btcToUsdRate * usdToRonRate;
        }
      }
      throw new Error('Could not find a valid exchange rate for USD to RON');
    } catch (error: any) {
      throw new Error(`Could not fetch RON exchange rate: ${error.message}`);
    }
  },
  Yadio: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.yadio.io/json/${ticker}`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.[ticker]?.price;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },

  YadioConvert: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.yadio.io/convert/1/BTC/${ticker}`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.rate;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },

  Exir: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch('https://api.exir.io/v1/ticker?symbol=btc-irt');
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.last;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },

  wazirx: async (ticker: string): Promise<number> => {
    let json;
    try {
      const res = await fetch(`https://api.wazirx.com/api/v2/tickers/btcinr`);
      json = await res.json();
    } catch (e: any) {
      throw new Error(`Could not update rate for ${ticker}: ${e.message}`);
    }
    let rate = json?.ticker?.buy;
    if (!rate) throw new Error(`Could not update rate for ${ticker}: data is wrong`);

    rate = Number(rate);
    if (!(rate >= 0)) throw new Error(`Could not update rate for ${ticker}: data is wrong`);
    return rate;
  },
} as const;

type FiatUnit = {
  [key: string]: {
    endPointKey: string;
    symbol: string;
    locale: string;
    source: 'CoinDesk' | 'Yadio' | 'Exir' | 'wazirx' | 'Bitstamp';
  };
};
export const FiatUnit = untypedFiatUnit as FiatUnit;

export async function getFiatRate(ticker: string): Promise<number> {
  return await RateExtractors[FiatUnit[ticker].source](ticker);
}
