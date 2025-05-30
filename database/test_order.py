import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('database/restaurant.db')
cursor = conn.cursor()

# Crear un nuevo pedido
cursor.execute("""
    INSERT INTO orders (status, total, payment_method, estimated_time, progress)
    VALUES (?, ?, ?, ?, ?)
""", ('pending', 23.50, 'tarjeta', 42, 0))

order_id = cursor.lastrowid

# Items del pedido:
# 2 Café Americano (id: 1, precio: 2.50)
# 1 Cappuccino (id: 2, precio: 3.50)
# 1 Pizza Margherita (id: 8, precio: 15.00)

order_items = [
    (order_id, 1, 2, 2.50, ''),  # 2 Café Americano
    (order_id, 2, 1, 3.50, ''),  # 1 Cappuccino
    (order_id, 8, 1, 15.00, '')  # 1 Pizza Margherita
]

cursor.executemany("""
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_options)
    VALUES (?, ?, ?, ?, ?)
""", order_items)

# Guardar los cambios
conn.commit()
conn.close()

print("Pedido de prueba creado correctamente") 