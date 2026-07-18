"""
seed.py
-------
Reads supermarket_data.csv and keeps supermarket.db continuously updated.
The CSV is the source of truth. A repeated seed run upserts rows and
preserves primary keys while allowing live product updates for a
real-time dashboard.
"""

import csv
import os
import random
import sqlite3
from datetime import date, datetime, timedelta

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "supermarket_data.csv")
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "supermarket.db")

COLUMNS = [
    ("product_id", "INTEGER PRIMARY KEY"),
    ("sku", "TEXT"),
    ("product_name", "TEXT"),
    ("category", "TEXT"),
    ("brand", "TEXT"),
    ("supplier", "TEXT"),
    ("supplier_email", "TEXT"),
    ("supplier_phone", "TEXT"),
    ("cost_price", "REAL"),
    ("selling_price", "REAL"),
    ("current_stock", "INTEGER"),
    ("minimum_stock", "INTEGER"),
    ("maximum_stock", "INTEGER"),
    ("reorder_level", "INTEGER"),
    ("batch_number", "TEXT"),
    ("manufacturing_date", "TEXT"),
    ("expiry_date", "TEXT"),
    ("warehouse", "TEXT"),
    ("daily_sales", "INTEGER"),
    ("weekly_sales", "INTEGER"),
    ("monthly_sales", "INTEGER"),
    ("yearly_sales", "INTEGER"),
    ("today_sales", "INTEGER"),
    ("today_revenue", "REAL"),
    ("today_profit", "REAL"),
    ("profit_margin", "REAL"),
    ("last_purchase_date", "TEXT"),
    ("last_sale_date", "TEXT"),
    ("customer_rating", "REAL"),
    ("sales_velocity", "REAL"),
    ("is_fast_moving", "INTEGER"),
    ("is_slow_moving", "INTEGER"),
    ("recommended_reorder_qty", "INTEGER"),
    ("recommended_not_to_reorder", "INTEGER"),
    ("supplier_rank", "INTEGER"),
    ("growth_score", "REAL"),
]

INT_COLS = {
    "product_id", "current_stock", "minimum_stock", "maximum_stock", "reorder_level",
    "daily_sales", "weekly_sales", "monthly_sales", "yearly_sales", "today_sales",
    "is_fast_moving", "is_slow_moving", "recommended_reorder_qty",
    "recommended_not_to_reorder", "supplier_rank",
}
FLOAT_COLS = {
    "cost_price", "selling_price", "today_revenue", "today_profit",
    "profit_margin", "customer_rating", "sales_velocity", "growth_score",
}


def _clean_value(col, raw):
    if raw is None:
        return None
    value = raw.strip()
    if value == "":
        return None
    if col in INT_COLS:
        try:
            return int(float(value))
        except ValueError:
            return None
    if col in FLOAT_COLS:
        try:
            return float(value)
        except ValueError:
            return None
    return value


def create_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def create_table(conn):
    columns_sql = ", ".join(f"{name} {ctype}" for name, ctype in COLUMNS)
    conn.execute(f"CREATE TABLE IF NOT EXISTS supermarket ({columns_sql})")
    conn.commit()


def _read_csv_rows():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Could not find {CSV_PATH}")
    with open(CSV_PATH, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def _build_upsert_sql():
    col_names = [name for name, _ in COLUMNS]
    placeholders = ", ".join(["?"] * len(col_names))
    update_pairs = ", ".join([f"{name}=excluded.{name}" for name in col_names if name != "product_id"])
    return (
        f"INSERT INTO supermarket ({', '.join(col_names)}) VALUES ({placeholders}) "
        f"ON CONFLICT(product_id) DO UPDATE SET {update_pairs}"
    )


def refresh_from_csv():
    conn = create_connection()
    try:
        create_table(conn)
        rows = _read_csv_rows()
        upsert_sql = _build_upsert_sql()
        inserted = 0
        updated = 0
        cur = conn.cursor()
        for raw_row in rows:
            row_data = {}
            for col, _ in COLUMNS:
                row_data[col] = _clean_value(col, raw_row.get(col))
            row_data["is_fast_moving"], row_data["is_slow_moving"] = _derive_movement_flags(row_data)
            values = [row_data.get(col) for col, _ in COLUMNS]
            product_id = values[0]
            existing = conn.execute("SELECT 1 FROM supermarket WHERE product_id = ?", (product_id,)).fetchone()
            cur.execute(upsert_sql, values)
            if existing:
                updated += 1
            else:
                inserted += 1
        conn.commit()
        print(f"CSV refresh complete: {inserted} inserted, {updated} updated")
    finally:
        conn.close()


def _parse_date(raw):
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return None


def _format_date(value):
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    return value


def _derive_movement_flags(product):
    current_stock = product.get("current_stock") or 0
    reorder_level = product.get("reorder_level") or 0
    maximum_stock = product.get("maximum_stock") or 0

    is_fast = 1 if reorder_level and current_stock <= reorder_level * 0.9 else 0
    is_slow = 0
    if maximum_stock:
        slow_threshold = max(reorder_level * 2, int(maximum_stock * 0.6))
        if current_stock >= slow_threshold:
            is_slow = 1
    if is_fast and is_slow:
        is_slow = 0
    return is_fast, is_slow


def _randomize_product(product):
    current_stock = product.get("current_stock") or 0
    cost_price = product.get("cost_price") or 0.0
    selling_price = product.get("selling_price") or cost_price
    reorder_level = product.get("reorder_level") or 0
    today_sales = product.get("today_sales") or 0

    stock_delta = random.randint(-12, 18)
    if random.random() < 0.25:
        stock_delta += random.choice([-20, 20])
    sales_delta = random.randint(0, 12)
    price_delta = round(random.uniform(-0.3, 0.6), 2)

    new_stock = max(0, current_stock + stock_delta)
    new_today_sales = max(0, today_sales + sales_delta)
    new_price = max(0.01, selling_price + price_delta)
    new_today_revenue = round(new_today_sales * new_price, 2)
    new_today_profit = round(new_today_sales * max(0.0, new_price - cost_price), 2)
    new_profit_margin = round((new_today_profit / new_today_revenue * 100), 2) if new_today_revenue else 0.0
    new_sales_velocity = round(max(0.0, (product.get("sales_velocity") or 0) + random.uniform(-0.5, 0.8)), 2)
    new_sales_velocity = min(max(new_sales_velocity, 0.0), 10.0)

    derived_fast, derived_slow = _derive_movement_flags({
        **product,
        "current_stock": new_stock,
        "reorder_level": reorder_level,
        "maximum_stock": product.get("maximum_stock") or 0,
    })

    expiry_date = _parse_date(product.get("expiry_date"))
    if expiry_date and random.random() < 0.25:
        expiry_date = max(date.today(), expiry_date - timedelta(days=random.randint(0, 2)))

    return {
        "current_stock": new_stock,
        "selling_price": new_price,
        "today_sales": new_today_sales,
        "today_revenue": new_today_revenue,
        "today_profit": new_today_profit,
        "profit_margin": new_profit_margin,
        "sales_velocity": new_sales_velocity,
        "is_fast_moving": derived_fast,
        "is_slow_moving": derived_slow,
        "expiry_date": _format_date(expiry_date),
    }


def random_update(update_count=8):
    conn = create_connection()
    try:
        ids = [row[0] for row in conn.execute("SELECT product_id FROM supermarket ORDER BY product_id").fetchall()]
        if not ids:
            return 0
        selected = ids[: min(4, len(ids))]
        remaining_ids = [product_id for product_id in ids if product_id not in selected]
        if len(selected) < update_count and remaining_ids:
            selected.extend(random.sample(remaining_ids, min(update_count - len(selected), len(remaining_ids))))
        if len(selected) > update_count:
            selected = random.sample(selected, update_count)

        for product_id in selected:
            row = conn.execute("SELECT * FROM supermarket WHERE product_id = ?", (product_id,)).fetchone()
            if not row:
                continue
            updated_values = _randomize_product(dict(row))
            assignments = ", ".join([f"{col} = ?" for col in updated_values.keys()])
            conn.execute(
                f"UPDATE supermarket SET {assignments} WHERE product_id = ?",
                [*updated_values.values(), product_id],
            )
        conn.commit()
        return len(selected)
    finally:
        conn.close()


def main():
    refresh_from_csv()
    updated_count = random_update(20)
    print(f"Seeded live movement updates for {updated_count} products")


# =====================================================================
# ANALYTICS LIBRARY
# Every function below reads only from the single `supermarket` table.
# Import these directly into a frontend backend or a chatbot tool layer.
# =====================================================================

def _row_to_dict(row):
    return dict(row) if row is not None else None


def load_products(conn=None, category=None):
    """Return all product rows, optionally filtered by category."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    if category:
        cur = conn.execute("SELECT * FROM supermarket WHERE category = ?", (category,))
    else:
        cur = conn.execute("SELECT * FROM supermarket")
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def load_sales(conn=None):
    """Return sales-relevant fields for every product (for sales views)."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute("""
        SELECT product_id, product_name, category, daily_sales, weekly_sales,
               monthly_sales, yearly_sales, today_sales, today_revenue,
               today_profit, sales_velocity, last_sale_date
        FROM supermarket
    """)
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def load_inventory(conn=None):
    """Return stock-relevant fields for every product (for inventory views)."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute("""
        SELECT product_id, product_name, category, current_stock, minimum_stock,
               maximum_stock, reorder_level, batch_number, manufacturing_date,
               expiry_date, warehouse, is_fast_moving, is_slow_moving
        FROM supermarket
    """)
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def calculate_revenue(conn=None):
    """Total revenue today across all products."""
    own_conn = conn is None
    conn = conn or create_connection()
    cur = conn.execute("SELECT COALESCE(SUM(today_revenue), 0) FROM supermarket")
    total = cur.fetchone()[0]
    if own_conn:
        conn.close()
    return round(total, 2)


def calculate_profit(conn=None):
    """Total profit today across all products."""
    own_conn = conn is None
    conn = conn or create_connection()
    cur = conn.execute("SELECT COALESCE(SUM(today_profit), 0) FROM supermarket")
    total = cur.fetchone()[0]
    if own_conn:
        conn.close()
    return round(total, 2)


def get_today_revenue(conn=None):
    """Alias of calculate_revenue — total revenue booked today."""
    return calculate_revenue(conn)


def get_today_profit(conn=None):
    """Alias of calculate_profit — total profit booked today."""
    return calculate_profit(conn)


def calculate_sales_velocity(product_id, conn=None):
    """Units sold per unit currently in stock, per day, for one product."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT sales_velocity FROM supermarket WHERE product_id = ?", (product_id,)
    ).fetchone()
    if own_conn:
        conn.close()
    return row["sales_velocity"] if row else None


def calculate_reorder_quantity(product_id, conn=None):
    """How much to reorder to bring a product back up to maximum_stock."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT current_stock, maximum_stock FROM supermarket WHERE product_id = ?",
        (product_id,),
    ).fetchone()
    if own_conn:
        conn.close()
    if not row:
        return None
    return max(0, row["maximum_stock"] - row["current_stock"])


def dashboard_summary(conn=None):
    """KPI banner data: net profit margin, total net loss impact, counts."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row

    revenue = calculate_revenue(conn)
    profit = calculate_profit(conn)
    net_profit_margin = round((profit / revenue * 100), 2) if revenue else 0.0

    slow_moving = conn.execute(
        "SELECT COALESCE(SUM(current_stock * cost_price), 0) FROM supermarket WHERE is_slow_moving = 1"
    ).fetchone()[0]
    total_inventory_value = conn.execute(
        "SELECT COALESCE(SUM(current_stock * cost_price), 0) FROM supermarket"
    ).fetchone()[0]
    total_net_loss_impact = round(
        (slow_moving / total_inventory_value * 100) if total_inventory_value else 0.0, 2
    )

    fast_count = conn.execute(
        "SELECT COUNT(*) FROM supermarket WHERE is_fast_moving = 1"
    ).fetchone()[0]
    slow_count = conn.execute(
        "SELECT COUNT(*) FROM supermarket WHERE is_slow_moving = 1"
    ).fetchone()[0]
    total_products = conn.execute("SELECT COUNT(*) FROM supermarket").fetchone()[0]

    summary = {
        "net_profit_margin_pct": net_profit_margin,
        "total_net_loss_impact_pct": -total_net_loss_impact,
        "today_revenue": revenue,
        "today_profit": profit,
        "total_products": total_products,
        "fast_moving_count": fast_count,
        "slow_moving_count": slow_count,
    }
    if own_conn:
        conn.close()
    return summary


def fast_moving_products(limit=5, conn=None):
    """TOP N products that are running low against their reorder threshold."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT product_id, product_name, category, current_stock, reorder_level,
               recommended_reorder_qty,
               ROUND(100.0 * CASE WHEN NULLIF(current_stock, 0) / NULLIF(reorder_level, 0) > 1.0 THEN 1.0 ELSE NULLIF(current_stock, 0) / NULLIF(reorder_level, 0) END, 1) AS pct_of_required_stock
        FROM supermarket
        WHERE is_fast_moving = 1 AND reorder_level > 0
        ORDER BY pct_of_required_stock DESC
        LIMIT ?
        """,
        (limit,),
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def slow_moving_products(limit=5, conn=None):
    """TOP N overstocked/excess products — do not reorder."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT product_id, product_name, category, current_stock, maximum_stock, reorder_level,
               ROUND(100.0 * CASE WHEN NULLIF(current_stock, 0) / NULLIF(maximum_stock, 0) > 1.0 THEN 1.0 ELSE NULLIF(current_stock, 0) / NULLIF(maximum_stock, 0) END, 1) AS pct_of_needed_stock
        FROM supermarket
        WHERE is_slow_moving = 1 AND maximum_stock > 0
        ORDER BY pct_of_needed_stock DESC
        LIMIT ?
        """,
        (limit,),
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def recommend_reorder(conn=None):
    """All products recommended for reorder, with suggested quantity."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT product_id, product_name, category, current_stock, reorder_level,
               recommended_reorder_qty, supplier, supplier_email, supplier_phone
        FROM supermarket
        WHERE is_fast_moving = 1 AND recommended_reorder_qty > 0
        ORDER BY recommended_reorder_qty DESC
        """
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def recommend_not_to_reorder(conn=None):
    """All products that are overstocked and should NOT be reordered."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT product_id, product_name, category, current_stock, maximum_stock
        FROM supermarket
        WHERE recommended_not_to_reorder = 1
        ORDER BY current_stock DESC
        """
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def supplier_recommendation(conn=None):
    """Ranks suppliers by average supplier_rank (1 = best) and avg rating."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT supplier, supplier_email, supplier_phone,
               ROUND(AVG(supplier_rank), 2) AS avg_rank,
               ROUND(AVG(customer_rating), 2) AS avg_product_rating,
               COUNT(*) AS products_supplied
        FROM supermarket
        GROUP BY supplier
        ORDER BY avg_rank ASC
        """
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def growth_opportunities(limit=10, conn=None):
    """Products with the highest growth_score — best candidates to push/promote."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        """
        SELECT product_id, product_name, category, growth_score, sales_velocity,
               customer_rating
        FROM supermarket
        ORDER BY growth_score DESC
        LIMIT ?
        """,
        (limit,),
    )
    result = [dict(r) for r in cur.fetchall()]
    if own_conn:
        conn.close()
    return result


def expiry_alerts(conn=None):
    """Buckets products into 3 / 7 / 14 / 30-day critical-expiry windows,
    matching the dashboard's Critical Expiry Alerts cards."""
    own_conn = conn is None
    conn = conn or create_connection()
    conn.row_factory = sqlite3.Row
    today = date.today()
    cur = conn.execute("SELECT * FROM supermarket WHERE expiry_date IS NOT NULL")
    buckets = {
        "1 month": [],
        "2 months": [],
        "3 months": [],
        "4 months": [],
    }
    limits = [30, 60, 90, 120]
    for row in cur.fetchall():
        row = dict(row)
        try:
            exp = datetime.strptime(row["expiry_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            continue
        days_left = (exp - today).days
        if days_left < 0:
            continue
        row["days_to_expiry"] = days_left
        for label, limit in zip(buckets.keys(), limits):
            if days_left <= limit:
                buckets[label].append(row)
                break
    if own_conn:
        conn.close()
    return buckets


if __name__ == "__main__":
    main()
