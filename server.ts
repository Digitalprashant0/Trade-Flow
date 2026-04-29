import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import yahooFinance from "yahoo-finance2";

const yahoo = new (yahooFinance as any)();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for fetching multiple stock prices
  app.get("/api/quotes", async (req, res) => {
    try {
      const symbolsStr = req.query.symbols as string;
      if (!symbolsStr) {
        return res.status(400).json({ error: "Symbols are required" });
      }

      const symbols = symbolsStr.split(",").map(s => {
        const symbol = s.trim().toUpperCase();
        // If it doesn't have a suffix, assume .NS (NSE)
        return symbol.includes(".") ? symbol : `${symbol}.NS`;
      });

      const results = await yahoo.quote(symbols) as any;
      
      const formatted = Array.isArray(results) ? results.map((quote: any) => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        displayName: quote.shortName || quote.symbol
      })) : [{
        symbol: results.symbol,
        price: results.regularMarketPrice,
        change: results.regularMarketChange,
        changePercent: results.regularMarketChangePercent,
        displayName: results.shortName || results.symbol
      }];

      res.json(formatted);
    } catch (err: any) {
      console.error("Yahoo Finance Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for a single stock price
  app.get("/api/price/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const cleanSymbol = symbol.toUpperCase().includes(".") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
      
      const quote = await yahoo.quote(cleanSymbol) as any;
      
      res.json({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        displayName: quote.shortName || quote.symbol
      });
    } catch (err: any) {
      console.error("Yahoo Finance Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
