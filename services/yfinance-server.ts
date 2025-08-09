// npx nodemon --watch services --ext ts --exec "node --loader ts-node/esm" services/yfinance-server.ts
import express from 'express';
import yahooFinance from 'yahoo-finance2';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: '*'
  methods: ['GET', 'POST'],
}));

app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

app.get('/api/yfinance', async (req, res) => {
  try {
    const { ticker, start, end } = req.query;
    if (!ticker || !start || !end) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const results = await yahooFinance.historical(ticker as string, {
      period1: start as string,
      period2: end as string,
      interval: '1d',
      includeAdjustedClose: true
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Yahoo Finance data' });
  }
});

app.listen(3001, "0.0.0.0", () => {
  console.log('Server running on 🚀');
});
