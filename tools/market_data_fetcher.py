import requests
import json
from typing import Dict, Any
from datetime import datetime, timedelta

class MarketDataFetcher:
    def __init__(self):
        self.psx_url = "https://dps.psx.com.pk/market"
        self.sarmaaya_url = "https://sarmaaya.pk/api/market"

    def fetch_market_data(self, index_name: str, timeframe: str) -> Dict[str, Any]:
        """
        Fetch market data including indices and major movements
        
        Args:
            index_name (str): Name of the index (e.g., 'KSE-100', 'KSE-30')
            timeframe (str): Time period for data ('today', 'week', 'month')
            
        Returns:
            Dict containing the requested market data
        """
        try:
            # Fetch from PSX
            psx_data = self._fetch_psx_data(index_name)
            
            # Fetch from Sarmaaya
            sarmaaya_data = self._fetch_sarmaaya_data(index_name)
            
            # Process and combine data
            result = self._process_data(psx_data, sarmaaya_data, timeframe)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def _fetch_psx_data(self, index_name: str) -> Dict[str, Any]:
        """Fetch data from PSX"""
        try:
            response = requests.get(f"{self.psx_url}/index/{index_name}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching PSX data: {str(e)}")

    def _fetch_sarmaaya_data(self, index_name: str) -> Dict[str, Any]:
        """Fetch data from Sarmaaya"""
        try:
            response = requests.get(f"{self.sarmaaya_url}/index/{index_name}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching Sarmaaya data: {str(e)}")

    def _process_data(self, psx_data: Dict[str, Any], sarmaaya_data: Dict[str, Any], timeframe: str) -> Dict[str, Any]:
        """Process and combine data based on timeframe"""
        today = datetime.now()
        
        if timeframe == "today":
            return {
                "current_value": psx_data.get("current_value"),
                "change": psx_data.get("change"),
                "change_percent": psx_data.get("change_percent"),
                "volume": psx_data.get("volume"),
                "value": psx_data.get("value"),
                "high": psx_data.get("high"),
                "low": psx_data.get("low"),
                "open": psx_data.get("open"),
                "previous_close": psx_data.get("previous_close")
            }
        elif timeframe == "week":
            week_ago = today - timedelta(days=7)
            return {
                "current_value": psx_data.get("current_value"),
                "week_high": psx_data.get("week_high"),
                "week_low": psx_data.get("week_low"),
                "week_change": psx_data.get("week_change"),
                "week_change_percent": psx_data.get("week_change_percent")
            }
        else:  # "month"
            month_ago = today - timedelta(days=30)
            return {
                "current_value": psx_data.get("current_value"),
                "month_high": psx_data.get("month_high"),
                "month_low": psx_data.get("month_low"),
                "month_change": psx_data.get("month_change"),
                "month_change_percent": psx_data.get("month_change_percent")
            } 