import os
import sqlite3
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data import seed


class SeedTests(unittest.TestCase):
    def test_random_update_changes_values(self):
        conn = sqlite3.connect('data/supermarket.db')
        try:
            row_before = conn.execute(
                'SELECT current_stock, today_sales, is_fast_moving, is_slow_moving FROM supermarket WHERE product_id = 1'
            ).fetchone()
            seed.random_update(4)
            row_after = conn.execute(
                'SELECT current_stock, today_sales, is_fast_moving, is_slow_moving FROM supermarket WHERE product_id = 1'
            ).fetchone()
            self.assertNotEqual(row_after, row_before)
        finally:
            conn.close()


if __name__ == '__main__':
    unittest.main()
