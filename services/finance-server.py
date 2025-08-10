from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import pandas as pd
from datetime import datetime, timedelta

import yfinance as yf
from vnstock import Quote, Fund

# Giả sử bạn đã import hoặc định nghĩa sẵn Quote, Fund, filter_df_by_date_range ở đây
# from your_module import Quote, Fund, filter_df_by_date_range

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi domain, hoặc list domain cụ thể
    allow_methods=["*"],
    allow_headers=["*"],
)

def filter_df_by_date_range(df, start_date, end_date=None):
    """
    Lọc DataFrame theo khoảng thời gian.
    - df: DataFrame chứa cột 'timestamp' kiểu datetime
    - start_date, end_date: chuỗi ngày theo định dạng 'dd-mm-yyyy'
    
    Trả về DataFrame đã lọc theo thời gian.
    """
    if start_date:
        start = pd.to_datetime(start_date, dayfirst=True)
    else:
        start = df["timestamp"].min()

    if end_date:
        end = pd.to_datetime(end_date, dayfirst=True)
    else:
        end = df["timestamp"].max()
    
    # Lọc dữ liệu
    return df[(df["timestamp"] >= start) & (df["timestamp"] <= end)].copy()

def read_vnstock(ticker, is_fund=False, source='VCI', start=None, end=None):
    # Hàm bạn đã cho
    if not is_fund:
        quote = Quote(symbol=ticker, source=source)
        if start is None:
            start = "01-01-2020"
        if end is None:
            end = pd.to_datetime("today").strftime('%d-%m-%Y')
        start = pd.to_datetime(start, dayfirst=True).strftime('%Y-%m-%d')
        end = pd.to_datetime(end, dayfirst=True).strftime('%Y-%m-%d')
        return quote.history(start=start, end=end)[['time', 'close']].rename(columns={'time': 'timestamp', 'close': 'value'})
    else:
        fund_nav = Fund().details.nav_report(ticker)
        fund_nav = fund_nav.rename(columns={'date': 'timestamp', 'nav_per_unit': 'value'})
        fund_nav['timestamp'] = pd.to_datetime(fund_nav['timestamp'], format='%Y-%m-%d')
        df_fund = filter_df_by_date_range(fund_nav, start, (datetime.strptime(end, "%d-%m-%Y") + timedelta(days=1)).strftime("%d-%m-%Y"))
        df_fund['value'] = df_fund['value'].shift(-1)
        return df_fund[:-1]

def read_yfinance(ticker="BTC-USD", start=None, end=None):
    res = yf.download(
        ticker, 
        start=datetime.strptime(start if start else "01-01-2020", "%d-%m-%Y").strftime("%Y-%m-%d"), 
        end=datetime.strptime(end, "%d-%m-%Y").strftime("%Y-%m-%d") if end else pd.to_datetime("today").strftime('%Y-%m-%d'),
        interval="1d", 
        progress=False
    )

    df = res[['Close']].reset_index()
    df.columns = ['timestamp', 'value']
    return df

@app.get("/api/vnstock")
def api_vnstock(
    ticker: str = Query(..., description="Ticker symbol"),
    is_fund: Optional[bool] = Query(False, description="Is fund data"),
    source: Optional[str] = Query('VCI', description="Data source"),
    start: Optional[str] = Query(None, description="Start date (dd-mm-yyyy)"),
    end: Optional[str] = Query(None, description="End date (dd-mm-yyyy)")
):
    try:
        df = read_vnstock(ticker, is_fund, source, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Convert dataframe 'timestamp' datetime thành string ISO format để trả JSON được
    df = df.copy()
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S')

    # Trả về list dict JSON
    return df.to_dict(orient='records')

@app.get("/api/yfinance")
def api_yfinance(
    ticker: str = Query(..., description="Ticker symbol, ví dụ: BTC-USD, AAPL"),
    start: str = Query(None, description="Start date (dd-mm-yyyy)"),
    end: str = Query(None, description="End date (dd-mm-yyyy)")
):
    try:
        df = read_yfinance(ticker, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Chuyển datetime thành ISO string
    df = df.copy()
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S')

    # Trả về dạng JSON list
    return df.to_dict(orient='records')
