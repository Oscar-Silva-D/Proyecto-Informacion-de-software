-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Crear tabla de productos del menú
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    tiempo_estimado INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Crear tabla de opciones de productos
CREATE TABLE IF NOT EXISTS product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    option_name TEXT NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL,
    estimated_time INTEGER NOT NULL,
    start_time DATETIME,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress REAL DEFAULT 0
);

-- Crear tabla de items del pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    selected_options TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Insertar categorías
INSERT INTO categories (id, name) VALUES
    (1, 'Bebidas'),
    (2, 'Entradas'),
    (3, 'Platos Principales'),
    (4, 'Postres');

-- Insertar productos del menú
INSERT INTO menu_items (id, name, description, price, category_id, image_path, tiempo_estimado) VALUES
    (1, 'Café Americano', 'Café negro recién preparado', 2.50, 1, '../media/cafe_americano.jpg', 5),
    (2, 'Cappuccino', 'Espresso con leche espumada', 3.50, 1, '../media/cappuccino.jpg', 7),
    (3, 'Limonada Natural', 'Jugo de limón fresco con agua mineral', 2.00, 1, '../media/limonada_natural.jpg', 5),
    (4, 'Nachos con Queso', 'Tortillas de maíz con queso fundido y jalapeños', 8.50, 2, '../media/nachos_con_queso.jpg', 12),
    (5, 'Alitas BBQ', 'Alitas de pollo en salsa BBQ', 10.00, 2, '../media/alitas_bbq.jpg', 15),
    (6, 'Ensalada César', 'Lechuga romana, crutones, parmesano y aderezo César', 7.50, 2, '../media/ensalada_cesar.jpg', 10),
    (7, 'Hamburguesa Clásica', 'Carne de res, lechuga, tomate, queso y papas fritas', 12.00, 3, '../media/hamburgesa_clasica.jpg', 20),
    (8, 'Pizza Margherita', 'Salsa de tomate, mozzarella y albahaca fresca', 15.00, 3, '../media/pizza_margarita.jpg', 25),
    (9, 'Pasta Alfredo', 'Fettuccine en salsa cremosa con parmesano', 13.50, 3, '../media/pasta_alfredo.jpg', 18),
    (10, 'Tiramisú', 'Postre italiano con café y mascarpone', 6.50, 4, '../media/tiramisu.jpg', 5),
    (11, 'Cheesecake', 'Tarta de queso con salsa de frutos rojos', 7.00, 4, '../media/cheesecake.jpg', 5),
    (12, 'Helado Artesanal', 'Tres bolas de helado con toppings', 5.50, 4, '../media/helado_artesanal.jpg', 3);

-- Insertar opciones de productos
INSERT INTO product_options (menu_item_id, option_name) VALUES
    (1, 'Caliente'),
    (1, 'Frío'),
    (2, 'Caliente'),
    (3, 'Con azúcar'),
    (3, 'Sin azúcar'),
    (4, 'Extra queso'),
    (4, 'Extra jalapeños'),
    (5, 'BBQ'),
    (5, 'Buffalo'),
    (5, 'Honey Mustard'),
    (6, 'Con pollo'),
    (6, 'Sin pollo'),
    (7, 'Término medio'),
    (7, 'Bien cocido'),
    (8, 'Extra queso'),
    (8, 'Sin gluten'),
    (9, 'Con pollo'),
    (9, 'Con camarones'),
    (10, 'Extra café'),
    (11, 'Frutos rojos'),
    (11, 'Chocolate'),
    (12, 'Chocolate'),
    (12, 'Vainilla'),
    (12, 'Fresa'); 