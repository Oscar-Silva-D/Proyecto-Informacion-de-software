class OrderTracker {
    constructor() {
        this.statuses = ['confirmado', 'preparacion', 'listo', 'entregado'];
        this.statusMessages = {
            'confirmado': 'Pedido confirmado y en cola',
            'preparacion': 'Tu pedido está siendo preparado',
            'listo': 'Pedido listo para entrega',
            'entregado': '¡Pedido entregado!'
        };
        this.statusPercentages = {
            'confirmado': 25,
            'preparacion': 50,
            'listo': 75,
            'entregado': 100
        };
        this.progressInterval = null;
        this.currentOrderId = null;
    }

    cleanup() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.currentOrderId = null;
    }

    getOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return orders.find(order => order.id === orderId);
    }

    calculateTotalEstimatedTime(items) {
        return items.reduce((total, item) => {
            // Asumimos que el tiempo estimado viene en el item, si no, usamos un valor por defecto
            return total + (item.tiempoEstimado || 15) * item.quantity;
        }, 0);
    }

    updateOrderStatus(orderId, newStatus, progressPercentage = null) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(order => order.id === orderId);
        
        if (order) {
            order.status = newStatus;
            if (progressPercentage !== null) {
                order.progress = progressPercentage;
            }
            localStorage.setItem('orders', JSON.stringify(orders));
            this.updateTrackingDisplay(order);
        }
    }

    calculateTimeBasedProgress(startTime, estimatedTime) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
        const totalTimeInSeconds = estimatedTime * 60; // Convert minutes to seconds
        const progress = Math.min((elapsedTime / totalTimeInSeconds) * 100, 100);
        return progress;
    }

    updateTrackingDisplay(order) {
        const progressBar = document.getElementById('order-progress');
        const statusText = document.getElementById('order-status');
        const timeRemaining = document.getElementById('time-remaining');
        const orderInfo = document.getElementById('order-info');
        
        if (progressBar && statusText) {
            // Update progress bar
            const progress = order.progress || this.statusPercentages[order.status];
            progressBar.style.width = `${progress}%`;
            
            // Update status text
            statusText.textContent = this.statusMessages[order.status];

            // Calculate and update time remaining
            if (timeRemaining && order.startTime && order.estimatedTime) {
                const currentTime = Date.now();
                const elapsedSeconds = (currentTime - order.startTime) / 1000;
                const totalSeconds = order.estimatedTime * 60;
                const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
                timeRemaining.textContent = `Tiempo restante: ${this.formatTimeRemaining(remainingSeconds)}`;
            }

            // Update status steps
            const statusSteps = document.querySelectorAll('.status-step');
            const currentStatusIndex = this.statuses.indexOf(order.status);
            statusSteps.forEach((step, index) => {
                if (index <= currentStatusIndex) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
        }
    }

    simulateOrderProgress(orderId) {
        // If we're already tracking a different order, clean up first
        if (this.currentOrderId && this.currentOrderId !== orderId) {
            this.cleanup();
        }

        const order = this.getOrder(orderId);
        if (!order) return;

        this.currentOrderId = orderId;

        // Set initial time if not set
        if (!order.startTime) {
            order.startTime = Date.now();
            // Calculate total estimated time if not set
            if (!order.estimatedTime) {
                order.estimatedTime = this.calculateTotalEstimatedTime(order.items);
            }
            // Update order in localStorage
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderIndex = orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex] = order;
                localStorage.setItem('orders', JSON.stringify(orders));
            }
        }

        // Clear any existing interval
        this.cleanup();

        // Update progress every second
        this.progressInterval = setInterval(() => {
            const progress = this.calculateTimeBasedProgress(order.startTime, order.estimatedTime);
            const currentStatus = Math.min(
                Math.floor((progress / 100) * this.statuses.length),
                this.statuses.length - 1
            );

            // Update order status and progress
            this.updateOrderStatus(orderId, this.statuses[currentStatus], progress);

            // Check if order is complete
            if (progress >= 100) {
                this.updateOrderStatus(orderId, 'entregado', 100);
                this.cleanup();
            }
        }, 1000); // Update every second
    }

    formatTimeRemaining(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize order tracker
const orderTracker = new OrderTracker(); 