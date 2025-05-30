import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('database/restaurant.db')
cursor = conn.cursor()

# Limpiar las tablas de pedidos
cursor.execute("DELETE FROM order_items")
cursor.execute("DELETE FROM orders")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='orders' OR name='order_items'")

# Guardar los cambios
conn.commit()
conn.close()

print("Tablas de pedidos limpiadas correctamente") 