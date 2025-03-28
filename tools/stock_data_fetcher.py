import requests
import json
from typing import Dict, Any

class StockDataFetcher:
    def __init__(self):
        self.psx_url = "https://dps.psx.com.pk/stock"
        self.sarmaaya_url = "https://sarmaaya.pk/api/stock"

    def fetch_stock_data(self, symbol: str, data_type: str) -> Dict[str, Any]:
        """
        Fetch stock data from PSX and Sarmaaya
        
        Args:
            symbol (str): Stock symbol (e.g., 'UBL', 'HBL')
            data_type (str): Type of data to fetch ('price', 'volume', 'all')
            
        Returns:
            Dict containing the requested stock data
        """
        try:
            # Fetch from PSX
            psx_data = self._fetch_psx_data(symbol)
            
            # Fetch from Sarmaaya
            sarmaaya_data = self._fetch_sarmaaya_data(symbol)
            
            # Combine and process data based on data_type
            result = self._process_data(psx_data, sarmaaya_data, data_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def _fetch_psx_data(self, symbol: str) -> Dict[str, Any]:
        """Fetch data from PSX"""
        try:
            response = requests.get(f"{self.psx_url}/{symbol}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching PSX data: {str(e)}")

    def _fetch_sarmaaya_data(self, symbol: str) -> Dict[str, Any]:
        """Fetch data from Sarmaaya"""
        try:
            response = requests.get(f"{self.sarmaaya_url}/{symbol}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching Sarmaaya data: {str(e)}")

    def _process_data(self, psx_data: Dict[str, Any], sarmaaya_data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """Process and combine data based on requested type"""
        if data_type == "price":
            return {
                "current_price": psx_data.get("current_price"),
                "change": psx_data.get("change"),
                "change_percent": psx_data.get("change_percent")
            }
        elif data_type == "volume":
            return {
                "volume": psx_data.get("volume"),
                "value": psx_data.get("value")
            }
        else:  # "all"
            return {
                "current_price": psx_data.get("current_price"),
                "change": psx_data.get("change"),
                "change_percent": psx_data.get("change_percent"),
                "volume": psx_data.get("volume"),
                "value": psx_data.get("value"),
                "high": psx_data.get("high"),
                "low": psx_data.get("low"),
                "open": psx_data.get("open"),
                "previous_close": psx_data.get("previous_close")
            } 