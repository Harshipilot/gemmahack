from backend.db import create_connection
from data import seed
from datetime import datetime


def _with_connection(func, *args, **kwargs):
    conn = create_connection()
    try:
        return func(*args, conn=conn, **kwargs)
    finally:
        conn.close()


def get_products(category=None):
    return _with_connection(seed.load_products, category=category)


def get_fast_moving(limit=10):
    return _with_connection(seed.fast_moving_products, limit=limit)


def get_slow_moving(limit=10):
    return _with_connection(seed.slow_moving_products, limit=limit)


def get_top_selling(limit=10):
    rows = _with_connection(seed.load_sales)
    rows.sort(key=lambda row: row.get("today_revenue") or 0, reverse=True)
    return rows[:limit]


def get_low_stock(limit=10):
    return _with_connection(seed.fast_moving_products, limit=limit)


def get_overstock(limit=10):
    return _with_connection(seed.slow_moving_products, limit=limit)


def get_sales_popularity():
    rows = _with_connection(seed.load_sales)
    week = {day: 0 for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
    month = {month: 0 for month in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
    for row in rows:
        date_str = row.get("last_sale_date")
        if not date_str:
            continue
        try:
            sale_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue
        quantity = row.get("today_sales") or 0
        week[sale_date.strftime("%a")] += quantity
        month[sale_date.strftime("%b")] += quantity
    return {"week": week, "month": month}


def get_analytics_payload():
    return {
        "fast_moving": get_fast_moving(8),
        "slow_moving": get_slow_moving(8),
        "popularity": get_sales_popularity(),
        "summary": dashboard_summary(),
    }


def search_chat_context(query):
    query_text = query.strip().lower()
    if not query_text:
        return None

    if "fast moving" in query_text or "fast-moving" in query_text:
        rows = _with_connection(seed.fast_moving_products, limit=10)
        return {
            "query": query,
            "answer": "Here are the top fast moving products.",
            "results": rows,
        }

    if "low stock" in query_text or "reorder" in query_text:
        rows = get_low_stock(10)
        return {
            "query": query,
            "answer": "These items are currently low stock and may need reorder attention.",
            "results": rows,
        }

    if "expire" in query_text or "expiry" in query_text:
        expiring = _with_connection(seed.expiry_alerts)
        results = []
        for bucket in expiring.values():
            results.extend(bucket[:5])
        return {
            "query": query,
            "answer": "I found inventory items expiring soon.",
            "results": results,
        }

    if "top selling" in query_text or "best selling" in query_text:
        rows = get_top_selling(10)
        return {
            "query": query,
            "answer": "These products are the top selling items today.",
            "results": rows,
        }

    if "overstock" in query_text or "excess" in query_text:
        rows = get_overstock(10)
        return {
            "query": query,
            "answer": "These items are overstocked and should not be reordered.",
            "results": rows,
        }

    inventory = get_products()
    hits = [item for item in inventory if query_text in (item.get("product_name") or "").lower() or query_text in (item.get("category") or "").lower()]
    if hits:
        return {
            "query": query,
            "answer": f"Found {len(hits)} matching inventory items.",
            "results": hits[:10],
        }

    return {
        "query": query,
        "answer": "I could not find a direct match. Try asking about fast moving products, low stock, or expiry alerts.",
        "results": [],
    }


def get_today_revenue():
    return _with_connection(seed.get_today_revenue)


def get_today_profit():
    return _with_connection(seed.get_today_profit)


def dashboard_summary():
    return _with_connection(seed.dashboard_summary)


def expiry_alerts():
    buckets = _with_connection(seed.expiry_alerts)
    return {str(key): value for key, value in buckets.items()}
