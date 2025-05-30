import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('database/restaurant.db')
cursor = conn.cursor()

# Crear un segundo pedido
cursor.execute("""
    INSERT INTO orders (status, total, payment_method, estimated_time, progress)
    VALUES (?, ?, ?, ?, ?)
""", ('pending', 33.50, 'pse', 50, 0))

order_id = cursor.lastrowid

# Items del pedido:
# 3 Limonada Natural (id: 3, precio: 2.00)
# 2 Alitas BBQ (id: 5, precio: 10.00)
# 1 Cheesecake (id: 11, precio: 7.00)

order_items = [
    (order_id, 3, 3, 2.00, ''),   # 3 Limonada Natural
    (order_id, 5, 2, 10.00, ''),  # 2 Alitas BBQ
    (order_id, 11, 1, 7.00, '')   # 1 Cheesecake
]

cursor.executemany("""
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_options)
    VALUES (?, ?, ?, ?, ?)
""", order_items)

# Guardar los cambios
conn.commit()
conn.close()

print("Segundo pedido de prueba creado correctamente") 