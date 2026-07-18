from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.analytics import (
    dashboard_summary,
    expiry_alerts,
    get_analytics_payload,
    get_low_stock,
    get_overstock,
    get_products,
    get_top_selling,
    search_chat_context,
)

router = APIRouter()


class DashboardSummaryResponse(BaseModel):
    net_profit_margin_pct: float
    total_net_loss_impact_pct: float
    today_revenue: float
    today_profit: float
    total_products: int
    fast_moving_count: int
    slow_moving_count: int


class ProductRow(BaseModel):
    product_id: int
    product_name: str
    category: Optional[str] = None
    current_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    recommended_reorder_qty: Optional[int] = None
    maximum_stock: Optional[int] = None
    expiry_date: Optional[str] = None
    today_revenue: Optional[float] = None
    today_profit: Optional[float] = None
    sales_velocity: Optional[float] = None
    is_fast_moving: Optional[int] = None
    is_slow_moving: Optional[int] = None
    pct_of_required_stock: Optional[float] = None
    pct_of_needed_stock: Optional[float] = None


class AnalyticsResponse(BaseModel):
    fast_moving: List[ProductRow]
    slow_moving: List[ProductRow]
    popularity: Dict[str, Dict[str, int]]
    summary: DashboardSummaryResponse


class ChatContextResponse(BaseModel):
    query: str
    answer: str
    results: List[ProductRow] = []


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard():
    return dashboard_summary()


@router.get("/products", response_model=List[ProductRow])
def get_products_route():
    return get_products()


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    return get_analytics_payload()


@router.get("/top-selling", response_model=List[ProductRow])
def get_top_selling_route():
    return get_top_selling()


@router.get("/low-stock", response_model=List[ProductRow])
def get_low_stock_route():
    return get_low_stock()


@router.get("/overstock", response_model=List[ProductRow])
def get_overstock_route():
    return get_overstock()


@router.get("/expiring", response_model=Dict[str, List[ProductRow]])
def get_expiring():
    return expiry_alerts()


@router.get("/chat/context", response_model=ChatContextResponse)
def get_chat_context(q: str = Query(..., min_length=1)):
    response = search_chat_context(q)
    if response is None:
        raise HTTPException(status_code=404, detail="No context found")
    return response
