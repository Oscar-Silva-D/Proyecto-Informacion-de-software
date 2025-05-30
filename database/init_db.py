import sqlite3
import os

def init_db():
    # Asegurarse de que el directorio database existe
    if not os.path.exists('database'):
        os.makedirs('database')

    # Conectar a la base de datos (la creará si no existe)
    conn = sqlite3.connect('database/restaurant.db')
    cursor = conn.cursor()

    # Leer y ejecutar el archivo schema.sql
    with open('database/schema.sql', 'r', encoding='utf-8') as sql_file:
        sql_script = sql_file.read()
        cursor.executescript(sql_script)

    # Guardar los cambios y cerrar la conexión
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Base de datos inicializada correctamente.") 