const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware para manejar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './media/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Database connection
const db = new sqlite3.Database('./database/restaurant.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// API Endpoints

// Get all categories
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM categories ORDER BY name';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get all menu items with their categories and options
app.get('/api/menu', (req, res) => {
    const query = `
        SELECT 
            m.id,
            m.name,
            m.description,
            m.price,
            m.category_id,
            m.image_path,
            m.tiempo_estimado,
            c.name as category_name,
            GROUP_CONCAT(po.option_name) as options
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        LEFT JOIN product_options po ON m.id = po.menu_item_id
        GROUP BY m.id
        ORDER BY m.category_id, m.id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Process the rows to format options as arrays
        const menu = rows.map(item => ({
            ...item,
            options: item.options ? item.options.split(',') : []
        }));

        res.json(menu);
    });
});

// Get menu items by category
app.get('/api/menu/category/:categoryId', (req, res) => {
    const query = `
        SELECT 
            m.*,
            GROUP_CONCAT(po.option_name) as options
        FROM menu_items m
        LEFT JOIN product_options po ON m.id = po.menu_item_id
        WHERE m.category_id = ?
        GROUP BY m.id
    `;

    db.all(query, [req.params.categoryId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create new order
app.post('/api/orders', (req, res) => {
    const { items, total, payment_method } = req.body;
    
    // Calculate total estimated time (sum of time * quantity for each item)
    const estimated_time = items.reduce((total, item) => {
        return total + (item.tiempo_estimado || 0) * item.quantity;
    }, 0);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `INSERT INTO orders (status, total, payment_method, estimated_time, progress)
             VALUES (?, ?, ?, ?, ?)`,
            ['pending', total, payment_method, estimated_time, 0],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }

                const orderId = this.lastID;
                let completed = 0;
                const total = items.length;

                // Insert order items
                items.forEach(item => {
                    db.run(
                        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_options)
                         VALUES (?, ?, ?, ?, ?)`,
                        [orderId, item.id, item.quantity, item.price, item.selectedOptions.join(',')],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            completed++;
                            if (completed === total) {
                                db.run('COMMIT');
                                res.json({
                                    orderId,
                                    message: 'Order created successfully',
                                    estimated_time: estimated_time
                                });
                            }
                        }
                    );
                });
            }
        );
    });
});

// Get order status
app.get('/api/orders/:orderId', (req, res) => {
    const query = `
        SELECT o.*, 
               GROUP_CONCAT(
                   json_object(
                       'id', oi.id,
                       'menu_item_id', oi.menu_item_id,
                       'quantity', oi.quantity,
                       'price', oi.price,
                       'selected_options', oi.selected_options
                   )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ?
        GROUP BY o.id
    `;

    db.get(query, [req.params.orderId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        
        // Parse the items string into an array of objects
        row.items = row.items ? JSON.parse(`[${row.items}]`) : [];
        res.json(row);
    });
});

// Get all orders with pagination
app.get('/api/orders', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
        SELECT 
            o.*,
            COUNT(*) OVER() as total_count,
            GROUP_CONCAT(
                json_object(
                    'id', oi.id,
                    'menu_item_id', oi.menu_item_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'selected_options', oi.selected_options,
                    'item_name', mi.name
                )
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        GROUP BY o.id
        ORDER BY o.timestamp DESC
        LIMIT ? OFFSET ?
    `;

    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const total = rows.length > 0 ? rows[0].total_count : 0;
        const totalPages = Math.ceil(total / limit);
        
        // Process the rows to format items as arrays
        const orders = rows.map(row => ({
            ...row,
            items: row.items ? JSON.parse(`[${row.items}]`) : []
        }));
        
        res.json({
            orders,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_items: total,
                items_per_page: limit
            }
        });
    });
});

// Update order status
app.put('/api/orders/:orderId/status', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }

    const query = `
        UPDATE orders 
        SET status = ?,
            start_time = CASE 
                WHEN ? = 'preparing' AND start_time IS NULL THEN CURRENT_TIMESTAMP
                ELSE start_time
            END
        WHERE id = ?
    `;

    db.run(query, [status, status, req.params.orderId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json({ message: 'Order status updated successfully' });
    });
});

// Update order progress
app.put('/api/orders/:orderId/progress', (req, res) => {
    const { progress } = req.body;
    
    if (progress < 0 || progress > 100) {
        res.status(400).json({ error: 'Progress must be between 0 and 100' });
        return;
    }

    const query = `
        UPDATE orders 
        SET progress = ?,
            status = CASE 
                WHEN ? = 100 THEN 'ready'
                ELSE status
            END
        WHERE id = ?
    `;

    db.run(query, [progress, progress, req.params.orderId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json({ 
            message: 'Order progress updated successfully',
            progress: progress,
            status: progress === 100 ? 'ready' : null
        });
    });
});

// Get order statistics
app.get('/api/orders/stats', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
            COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
            AVG(CASE WHEN status = 'delivered' THEN 
                (strftime('%s', COALESCE(modified_at, datetime('now'))) - 
                 strftime('%s', timestamp)) 
            END) as avg_preparation_time,
            SUM(total) as total_sales
        FROM orders
        WHERE date(timestamp) = date('now')
    `;

    db.get(query, [], (err, stats) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(stats);
    });
});

// Delete order (soft delete)
app.delete('/api/orders/:orderId', (req, res) => {
    const query = `
        UPDATE orders 
        SET status = 'cancelled',
            modified_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status != 'delivered'
    `;

    db.run(query, [req.params.orderId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Order not found or already delivered' });
            return;
        }
        res.json({ message: 'Order cancelled successfully' });
    });
});

// Endpoints para el panel de administración

// Get categories
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM categories ORDER BY id';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add category
app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO categories (name) VALUES (?)';
    
    db.run(query, [name], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            name
        });
    });
});

// Update category
app.put('/api/categories/:id', (req, res) => {
    const { name } = req.body;
    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    
    db.run(query, [name, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: req.params.id,
            name
        });
    });
});

// Delete category
app.delete('/api/categories/:id', (req, res) => {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Primero eliminar las opciones de los productos de esta categoría
        db.run('DELETE FROM product_options WHERE menu_item_id IN (SELECT id FROM menu_items WHERE category_id = ?)',
            [req.params.id],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Luego eliminar los productos de esta categoría
                db.run('DELETE FROM menu_items WHERE category_id = ?',
                    [req.params.id],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        // Finalmente eliminar la categoría
                        db.run('DELETE FROM categories WHERE id = ?',
                            [req.params.id],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    res.status(500).json({ error: err.message });
                                    return;
                                }
                                
                                db.run('COMMIT');
                                res.json({ message: 'Categoría eliminada correctamente' });
                            }
                        );
                    }
                );
            }
        );
    });
});

// Add menu item
app.post('/api/menu', upload.single('image'), (req, res) => {
    const { name, description, price, category_id, tiempo_estimado, options } = req.body;
    const image_path = req.file ? '../media/' + req.file.filename : null;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
            `INSERT INTO menu_items (name, description, price, category_id, image_path, tiempo_estimado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, price, category_id, image_path, tiempo_estimado],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                const menuItemId = this.lastID;
                const parsedOptions = JSON.parse(options || '[]');
                
                if (parsedOptions.length === 0) {
                    db.run('COMMIT');
                    res.json({
                        id: menuItemId,
                        name,
                        description,
                        price,
                        category_id,
                        image_path,
                        tiempo_estimado,
                        options: []
                    });
                    return;
                }
                
                const optionsValues = parsedOptions.map(option => 
                    `(${menuItemId}, '${option}')`
                ).join(',');
                
                db.run(
                    `INSERT INTO product_options (menu_item_id, option_name) VALUES ${optionsValues}`,
                    [],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        db.run('COMMIT');
                        res.json({
                            id: menuItemId,
                            name,
                            description,
                            price,
                            category_id,
                            image_path,
                            tiempo_estimado,
                            options: parsedOptions
                        });
                    }
                );
            }
        );
    });
});

// Update menu item
app.put('/api/menu/:id', upload.single('image'), (req, res) => {
    const { name, description, price, category_id, tiempo_estimado, options } = req.body;
    const image_path = req.file ? '../media/' + req.file.filename : null;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let updateQuery = `
            UPDATE menu_items 
            SET name = ?, 
                description = ?, 
                price = ?, 
                category_id = ?, 
                tiempo_estimado = ?
        `;
        let params = [name, description, price, category_id, tiempo_estimado];
        
        if (image_path) {
            updateQuery += ', image_path = ?';
            params.push(image_path);
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(req.params.id);
        
        db.run(updateQuery, params, (err) => {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Actualizar opciones
            db.run('DELETE FROM product_options WHERE menu_item_id = ?',
                [req.params.id],
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    const parsedOptions = JSON.parse(options || '[]');
                    
                    if (parsedOptions.length === 0) {
                        db.run('COMMIT');
                        res.json({
                            id: parseInt(req.params.id),
                            name,
                            description,
                            price,
                            category_id,
                            image_path: image_path || req.body.current_image,
                            tiempo_estimado,
                            options: []
                        });
                        return;
                    }
                    
                    const optionsValues = parsedOptions.map(option => 
                        `(${req.params.id}, '${option}')`
                    ).join(',');
                    
                    db.run(
                        `INSERT INTO product_options (menu_item_id, option_name) VALUES ${optionsValues}`,
                        [],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            
                            db.run('COMMIT');
                            res.json({
                                id: parseInt(req.params.id),
                                name,
                                description,
                                price,
                                category_id,
                                image_path: image_path || req.body.current_image,
                                tiempo_estimado,
                                options: parsedOptions
                            });
                        }
                    );
                }
            );
        });
    });
});

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Primero eliminar las opciones del producto
        db.run('DELETE FROM product_options WHERE menu_item_id = ?',
            [req.params.id],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Luego eliminar el producto
                db.run('DELETE FROM menu_items WHERE id = ?',
                    [req.params.id],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        db.run('COMMIT');
                        res.json({ message: 'Item eliminado correctamente' });
                    }
                );
            }
        );
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 