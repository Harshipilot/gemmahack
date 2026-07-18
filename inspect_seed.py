import sqlite3
import data.seed as seed

conn = sqlite3.connect('data/supermarket.db')
cur = conn.execute('SELECT product_id, product_name, current_stock, today_sales, sales_velocity, is_fast_moving, is_slow_moving FROM supermarket WHERE product_id = 1')
print('before', cur.fetchone())
seed.refresh_from_csv()
seed.random_update(12)
cur = conn.execute('SELECT product_id, product_name, current_stock, today_sales, sales_velocity, is_fast_moving, is_slow_moving FROM supermarket WHERE product_id = 1')
print('after', cur.fetchone())
conn.close()
