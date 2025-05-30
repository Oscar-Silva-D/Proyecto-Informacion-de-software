import sqlite3
import datetime

# Conectar a la base de datos
conn = sqlite3.connect('database/restaurant.db')
cursor = conn.cursor()

# Limpiar las tablas de pedidos anteriores
cursor.execute("DELETE FROM order_items")
cursor.execute("DELETE FROM orders")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='orders' OR name='order_items'")

# Crear el primer pedido (Café y Pizza)
cursor.execute("""
    INSERT INTO orders (status, total, payment_method, estimated_time, progress, timestamp)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
""", ('pending', 23.50, 'tarjeta', 42, 0))

order1_id = cursor.lastrowid

# Items del primer pedido:
# 2 Café Americano (id: 1, precio: 2.50, tiempo: 5 min)
# 1 Cappuccino (id: 2, precio: 3.50, tiempo: 7 min)
# 1 Pizza Margherita (id: 8, precio: 15.00, tiempo: 25 min)
order1_items = [
    (order1_id, 1, 2, 2.50, ''),  # 2 Café Americano
    (order1_id, 2, 1, 3.50, ''),  # 1 Cappuccino
    (order1_id, 8, 1, 15.00, '')  # 1 Pizza Margherita
]

cursor.executemany("""
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_options)
    VALUES (?, ?, ?, ?, ?)
""", order1_items)

# Crear el segundo pedido (Bebidas y Postres)
cursor.execute("""
    INSERT INTO orders (status, total, payment_method, estimated_time, progress, timestamp)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
""", ('pending', 33.50, 'pse', 50, 0))

order2_id = cursor.lastrowid

# Items del segundo pedido:
# 3 Limonada Natural (id: 3, precio: 2.00, tiempo: 5 min)
# 2 Alitas BBQ (id: 5, precio: 10.00, tiempo: 15 min)
# 1 Cheesecake (id: 11, precio: 7.00, tiempo: 5 min)
order2_items = [
    (order2_id, 3, 3, 2.00, ''),   # 3 Limonada Natural
    (order2_id, 5, 2, 10.00, ''),  # 2 Alitas BBQ
    (order2_id, 11, 1, 7.00, '')   # 1 Cheesecake
]

cursor.executemany("""
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_options)
    VALUES (?, ?, ?, ?, ?)
""", order2_items)

# Guardar los cambios
conn.commit()
conn.close()

print("Pedidos de prueba creados correctamente") 