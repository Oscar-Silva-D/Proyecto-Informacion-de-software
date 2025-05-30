import sqlite3

def query_beverages():
    # Conectar a la base de datos
    conn = sqlite3.connect('database/restaurant.db')
    cursor = conn.cursor()

    # Consultar bebidas (categoría 1)
    cursor.execute('''
        SELECT m.name, m.description, m.price, m.tiempo_estimado, m.image_path, GROUP_CONCAT(po.option_name) as options
        FROM menu_items m
        LEFT JOIN product_options po ON m.id = po.menu_item_id
        WHERE m.category_id = 1
        GROUP BY m.id
    ''')

    # Obtener y mostrar los resultados
    beverages = cursor.fetchall()
    print("\n=== BEBIDAS ===\n")
    for beverage in beverages:
        name, description, price, tiempo, image_path, options = beverage
        print(f"Nombre: {name}")
        print(f"Descripción: {description}")
        print(f"Precio: ${price:.2f}")
        print(f"Tiempo estimado: {tiempo} minutos")
        print(f"Ruta de imagen: {image_path}")
        print(f"Opciones disponibles: {options}")
        print("-" * 50)

    # Cerrar la conexión
    conn.close()

if __name__ == '__main__':
    query_beverages() 