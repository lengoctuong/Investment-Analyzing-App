// run file: node --loader ts-node/esm test.ts
import yahooFinance from 'yahoo-finance2';

async function fetchGasHistory(from: string, to: string) {
  try {
    const symbol = '^VNINDEX.VN';
    const result = await yahooFinance.historical(symbol, {
      period1: from,   // ví dụ '2025-06-01'
      // period2: to,     // ví dụ '2025-07-31'
      interval: '1d',  // dữ liệu theo ngày
      includeAdjustedClose: true
    });
    console.log(`Lịch sử giá từ ${from} đến ${to}:`);
    for (const row of result) {
      console.log(`${row.date.toISOString().slice(0,10)}: close=${row.close}, adjClose=${row.adjClose}, volume=${row.volume}`);
    }
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu:', err);
  }
}

// Ví dụ gọi hàm
fetchGasHistory('2025-07-01', '2025-07-31');