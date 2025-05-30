// Cart management functions
class CartManager {
    constructor() {
        this.initializeCart();
        this.updateCartCount();
        this.setupEventListeners();
        this.checkCurrentPage();
    }

    checkCurrentPage() {
        // Get current page path
        const currentPath = window.location.pathname;
        
        // Only keep cart if we're in menu or cart pages
        if (!currentPath.includes('/Menu.html') && !currentPath.includes('/carrito.html')) {
            this.clearCart(false); // false means don't show confirmation
        }
    }

    setupEventListeners() {
        // Add event listener for page unload
        window.addEventListener('beforeunload', (e) => {
            const currentPath = window.location.pathname;
            const targetPath = e.target?.location?.pathname;
            
            // If we're navigating away from menu/cart to a non-menu/cart page, clear the cart
            if ((currentPath.includes('/Menu.html') || currentPath.includes('/carrito.html')) &&
                targetPath && !targetPath.includes('/Menu.html') && !targetPath.includes('/carrito.html')) {
                this.clearCart(false);
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .logo, a');
            if (!target) return;

            // If clicking a link/button that leads away from menu/cart, clear the cart
            const href = target.getAttribute('href');
            if (href && !href.includes('Menu.html') && !href.includes('carrito.html')) {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/Menu.html') || currentPath.includes('/carrito.html')) {
                    this.clearCart(false);
                }
            }

            if (target.classList.contains('logo')) {
                e.preventDefault();
                this.clearCart(false);
                window.location.href = target.href;
                return;
            }

            // Handle quantity decrease
            if (target.classList.contains('decrease')) {
                e.preventDefault();
                const productId = parseInt(target.dataset.productId);
                const selectedOption = target.dataset.option;
                const item = this.getCartItem(productId, selectedOption);
                if (item && item.quantity <= 1) {
                    if (confirm('¿Estás seguro de que deseas eliminar este producto del carrito?')) {
                        this.removeFromCart(productId, selectedOption);
                    }
                } else if (item) {
                    this.updateQuantity(productId, item.quantity - 1, selectedOption);
                }
            }

            // Handle quantity increase
            if (target.classList.contains('increase')) {
                e.preventDefault();
                const productId = parseInt(target.dataset.productId);
                const selectedOption = target.dataset.option;
                const item = this.getCartItem(productId, selectedOption);
                if (item) {
                    this.updateQuantity(productId, item.quantity + 1, selectedOption);
                }
            }

            // Handle "Add to Cart" button
            if (target.classList.contains('add-to-cart')) {
                e.preventDefault();
                try {
                    const productData = JSON.parse(target.dataset.product);
                    if (productData && productData.id) {
                        this.addToCart(productData);
                    }
                } catch (error) {
                    console.error('Error al agregar al carrito:', error);
                }
            }
        });

        // Handle payment form submission
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (confirm('¿Estás seguro de que deseas confirmar tu pedido?')) {
                    const order = await this.confirmOrder();
                    if (order) {
                        this.clearCart(false);
                        window.location.href = `Seguimiento.html?orderId=${order.id}`;
                    }
                }
            });
        }
    }

    initializeCart() {
        if (!localStorage.getItem('cart')) {
            localStorage.setItem('cart', JSON.stringify([]));
        }
    }

    getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error('Error al obtener el carrito:', error);
            return [];
        }
    }

    getCartItem(productId, selectedOption = null) {
        const cart = this.getCart();
        return cart.find(item => item.id === productId && item.selectedOption === selectedOption);
    }

    addToCart(product) {
        if (!product || !product.id) return;

        let cart = this.getCart();
        const existingProduct = cart.find(item => 
            item.id === product.id && 
            item.selectedOption === product.selectedOption
        );
        
        if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 0) + 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                tiempoEstimado: product.tiempo_estimado,
                selectedOption: product.selectedOption || null
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
        this.updateCartDisplay();
        this.showConfirmationMessage('Producto agregado al carrito');
    }

    removeFromCart(productId, selectedOption = null) {
        if (!productId) return;

        let cart = this.getCart();
        cart = cart.filter(item => 
            item.id !== productId || 
            item.selectedOption !== selectedOption
        );
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
        this.updateCartDisplay();
        this.showConfirmationMessage('Producto eliminado del carrito');
    }

    updateQuantity(productId, newQuantity, selectedOption = null) {
        let cart = this.getCart();
        const item = cart.find(item => 
            item.id === productId && 
            item.selectedOption === selectedOption
        );
        
        if (item) {
            item.quantity = Math.max(0, newQuantity);
            if (item.quantity === 0) {
                cart = cart.filter(i => 
                    i.id !== productId || 
                    i.selectedOption !== selectedOption
                );
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            this.updateCartDisplay();
        }
    }

    clearCart(showConfirmation = true) {
        if (!showConfirmation || confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            localStorage.setItem('cart', JSON.stringify([]));
            this.updateCartCount();
            this.updateCartDisplay();
            if (showConfirmation) {
                this.showConfirmationMessage('Carrito vaciado');
            }
        }
    }

    updateCartCount() {
        const cart = this.getCart();
        const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(element => {
            if (element) element.textContent = count;
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
    }

    getTotalTime() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            return total + (parseInt(item.tiempoEstimado) || 0) * item.quantity;
        }, 0);
    }

    showConfirmationMessage(message) {
        if (!message) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'confirmation-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.classList.add('show');
            setTimeout(() => {
                messageElement.classList.remove('show');
                setTimeout(() => {
                    messageElement.remove();
                }, 300);
            }, 2000);
        }, 100);
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const paymentSection = document.getElementById('payment-section');
        
        if (!cartItemsContainer) return;

        const cart = this.getCart();
        
        if (!cart.length) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <span class="material-icons">shopping_cart</span>
                    <p>Tu carrito está vacío</p>
                    <a href="menu.html" class="back-to-menu">Volver al Menú</a>
                </div>
            `;
            if (paymentSection) {
                paymentSection.style.display = 'none';
            }
            return;
        }

        cartItemsContainer.innerHTML = cart.map(item => {
            if (!item || !item.id) return '';
            
            return `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">
                            ${item.name || 'Producto sin nombre'}
                            ${item.selectedOption ? `<span class="selected-option">(${item.selectedOption})</span>` : ''}
                        </div>
                        <div class="cart-item-price">${this.formatCurrency(item.price)}</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease" data-product-id="${item.id}" data-option="${item.selectedOption || ''}">
                            <span class="material-icons">remove</span>
                        </button>
                        <span>${item.quantity || 0}</span>
                        <button class="increase" data-product-id="${item.id}" data-option="${item.selectedOption || ''}">
                            <span class="material-icons">add</span>
                        </button>
                    </div>
                    <div class="cart-item-total">
                        ${this.formatCurrency((item.price || 0) * (item.quantity || 0))}
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        if (paymentSection) {
            paymentSection.style.display = 'block';
        }

        // Update summary
        const subtotal = this.getTotal();
        const iva = subtotal * 0.19;
        const total = subtotal + iva;

        const subtotalElement = document.getElementById('subtotal');
        const ivaElement = document.getElementById('iva');
        const totalElement = document.getElementById('total');

        if (subtotalElement) subtotalElement.textContent = this.formatCurrency(subtotal);
        if (ivaElement) ivaElement.textContent = this.formatCurrency(iva);
        if (totalElement) totalElement.textContent = this.formatCurrency(total);
    }

    async confirmOrder() {
        const cart = this.getCart();
        if (!cart.length) {
            alert('El carrito está vacío');
            return null;
        }

        const metodoPagoElement = document.querySelector('input[name="metodoPago"]:checked');
        if (!metodoPagoElement) {
            alert('Por favor selecciona un método de pago');
            return null;
        }

        const orderId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const order = {
            id: orderId,
            items: cart,
            total: this.getTotal(),
            status: 'confirmado',
            estimatedTime: this.getTotalTime(),
            timestamp: new Date().toISOString(),
            paymentMethod: metodoPagoElement.value
        };

        try {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            return order;
        } catch (error) {
            console.error('Error al confirmar el pedido:', error);
            alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
            return null;
        }
    }

    static getOrderById(orderId) {
        try {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            return orders.find(order => order.id === orderId);
        } catch (error) {
            console.error('Error al buscar el pedido:', error);
            return null;
        }
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Add styles for confirmation message
const style = document.createElement('style');
style.textContent = `
    .confirmation-message {
        position: fixed;
        bottom: -100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2ecc71;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        transition: bottom 0.3s ease-in-out;
        z-index: 1000;
    }
    .confirmation-message.show {
        bottom: 20px;
    }
`;
document.head.appendChild(style); 