import requests
import json
from typing import Dict, Any
from datetime import datetime

class CompanyInfoFetcher:
    def __init__(self):
        self.psx_url = "https://dps.psx.com.pk/company"
        self.sarmaaya_url = "https://sarmaaya.pk/api/company"

    def fetch_company_info(self, symbol: str, info_type: str) -> Dict[str, Any]:
        """
        Fetch company information and announcements
        
        Args:
            symbol (str): Stock symbol (e.g., 'UBL', 'HBL')
            info_type (str): Type of information to fetch ('profile', 'announcements', 'financials', 'all')
            
        Returns:
            Dict containing the requested company information
        """
        try:
            # Fetch from PSX
            psx_data = self._fetch_psx_data(symbol)
            
            # Fetch from Sarmaaya
            sarmaaya_data = self._fetch_sarmaaya_data(symbol)
            
            # Process and combine data
            result = self._process_data(psx_data, sarmaaya_data, info_type)
            
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

    def _process_data(self, psx_data: Dict[str, Any], sarmaaya_data: Dict[str, Any], info_type: str) -> Dict[str, Any]:
        """Process and combine data based on info_type"""
        if info_type == "profile":
            return {
                "name": psx_data.get("name"),
                "symbol": psx_data.get("symbol"),
                "sector": psx_data.get("sector"),
                "industry": psx_data.get("industry"),
                "description": psx_data.get("description"),
                "website": psx_data.get("website"),
                "address": psx_data.get("address")
            }
        elif info_type == "announcements":
            return {
                "announcements": psx_data.get("announcements", []),
                "last_updated": datetime.now().isoformat()
            }
        elif info_type == "financials":
            return {
                "market_cap": psx_data.get("market_cap"),
                "pe_ratio": psx_data.get("pe_ratio"),
                "eps": psx_data.get("eps"),
                "dividend_yield": psx_data.get("dividend_yield"),
                "book_value": psx_data.get("book_value"),
                "last_updated": datetime.now().isoformat()
            }
        else:  # "all"
            return {
                "profile": {
                    "name": psx_data.get("name"),
                    "symbol": psx_data.get("symbol"),
                    "sector": psx_data.get("sector"),
                    "industry": psx_data.get("industry"),
                    "description": psx_data.get("description"),
                    "website": psx_data.get("website"),
                    "address": psx_data.get("address")
                },
                "financials": {
                    "market_cap": psx_data.get("market_cap"),
                    "pe_ratio": psx_data.get("pe_ratio"),
                    "eps": psx_data.get("eps"),
                    "dividend_yield": psx_data.get("dividend_yield"),
                    "book_value": psx_data.get("book_value")
                },
                "announcements": psx_data.get("announcements", []),
                "last_updated": datetime.now().isoformat()
            } 