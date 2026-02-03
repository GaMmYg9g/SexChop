// Módulo del carrito de compras
const cart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    
    // Inicializar carrito
    async init() {
        await this.loadCart();
        this.setupCartListeners();
        this.updateCartUI();
    },
    
    // Cargar carrito desde IndexedDB
    async loadCart() {
        try {
            const userId = auth.getUser()?.id || null;
            const cartItems = await db.getUserCart(userId);
            this.items = cartItems;
            this.calculateTotals();
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.items = [];
        }
    },
    
    // Calcular totales
    calculateTotals() {
        this.subtotal = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        
        this.shipping = this.calculateShipping();
        this.total = this.subtotal + this.shipping;
    },
    
    // Calcular costo de envío
    calculateShipping(province = null) {
        // Esto se calculará basado en la provincia seleccionada
        // Por ahora, retornamos 0
        return 0;
    },
    
    // Agregar producto al carrito
    async addProduct(productId, quantity = 1) {
        try {
            const product = await db.get('products', productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            
            if (product.stock === 0) {
                throw new Error('Producto agotado');
            }
            
            const userId = auth.getUser()?.id || null;
            const existingItem = this.items.find(item => item.productId === productId);
            
            if (existingItem) {
                // Verificar stock disponible
                if (existingItem.quantity + quantity > product.stock) {
                    throw new Error('No hay suficiente stock disponible');
                }
                
                existingItem.quantity += quantity;
                await db.update('cart', existingItem.id, existingItem);
            } else {
                // Verificar stock disponible
                if (quantity > product.stock) {
                    throw new Error('No hay suficiente stock disponible');
                }
                
                const newItem = await db.addToCart(productId, quantity, userId);
                this.items.push(newItem);
            }
            
            // Actualizar carrito
            await this.loadCart();
            this.updateCartUI();
            this.showNotification(`${product.name} agregado al carrito`, 'success');
            
            // Animación del carrito
            this.animateCartButton();
            
            return true;
            
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            this.showNotification(error.message, 'error');
            return false;
        }
    },
    
    // Actualizar cantidad de un item
    async updateQuantity(itemId, newQuantity) {
        try {
            const item = this.items.find(i => i.id === itemId);
            if (!item) {
                throw new Error('Item no encontrado en el carrito');
            }
            
            if (newQuantity <= 0) {
                await this.removeItem(itemId);
                return;
            }
            
            // Verificar stock disponible
            const product = await db.get('products', item.productId);
            if (newQuantity > product.stock) {
                throw new Error('No hay suficiente stock disponible');
            }
            
            item.quantity = newQuantity;
            await db.update('cart', itemId, item);
            
            await this.loadCart();
            this.updateCartUI();
            
        } catch (error) {
            console.error('Error actualizando cantidad:', error);
            this.showNotification(error.message, 'error');
        }
    },
    
    // Remover item del carrito
    async removeItem(itemId) {
        try {
            await db.delete('cart', itemId);
            this.items = this.items.filter(item => item.id !== itemId);
            
            await this.loadCart();
            this.updateCartUI();
            
            this.showNotification('Producto removido del carrito', 'success');
            
        } catch (error) {
            console.error('Error removiendo item:', error);
            this.showNotification('Error al remover producto', 'error');
        }
    },
    
    // Limpiar carrito
    async clearCart() {
        try {
            const userId = auth.getUser()?.id || null;
            const sessionId = userId ? null : localStorage.getItem('sessionId');
            
            await db.clearCart(userId, sessionId);
            this.items = [];
            
            await this.loadCart();
            this.updateCartUI();
            
            this.showNotification('Carrito vaciado', 'success');
            
        } catch (error) {
            console.error('Error vaciando carrito:', error);
            this.showNotification('Error al vaciar el carrito', 'error');
        }
    },
    
    // Obtener cantidad de items en el carrito
    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    },
    
    // Verificar si el carrito está vacío
    isEmpty() {
        return this.items.length === 0;
    },
    
    // Obtener resumen del carrito para checkout
    async getCheckoutSummary() {
        const itemsWithDetails = await Promise.all(
            this.items.map(async (item) => {
                const product = await db.get('products', item.productId);
                return {
                    productId: item.productId,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    total: product.price * item.quantity,
                    image: product.image
                };
            })
        );
        
        return {
            items: itemsWithDetails,
            subtotal: this.subtotal,
            shipping: this.shipping,
            total: this.total,
            itemCount: this.getItemCount()
        };
    },
    
    // Configurar listeners del carrito
    setupCartListeners() {
        // Botón de carrito
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggleCartPanel());
        }
        
        // Cerrar carrito
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCartPanel());
        }
        
        // Vaciar carrito
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        
        // Checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }
        
        // Agregar eventos a los botones "Agregar al carrito"
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                const productId = parseInt(e.target.closest('.product-card').dataset.id);
                this.addProduct(productId);
            }
        });
    },
    
    // Mostrar/ocultar panel del carrito
    toggleCartPanel() {
        const cartPanel = document.getElementById('cartPanel');
        const overlay = document.getElementById('overlay');
        
        if (cartPanel && overlay) {
            cartPanel.classList.toggle('active');
            overlay.classList.toggle('active');
            
            // Actualizar contenido del carrito al abrir
            if (cartPanel.classList.contains('active')) {
                this.renderCartItems();
            }
        }
    },
    
    // Cerrar panel del carrito
    closeCartPanel() {
        const cartPanel = document.getElementById('cartPanel');
        const overlay = document.getElementById('overlay');
        
        if (cartPanel && overlay) {
            cartPanel.classList.remove('active');
            overlay.classList.remove('active');
        }
    },
    
    // Renderizar items del carrito
    async renderCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;
        
        if (this.isEmpty()) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="#" class="btn-primary" onclick="cart.closeCartPanel()">Seguir comprando</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        for (const item of this.items) {
            const product = await db.get('products', item.productId);
            if (!product) continue;
            
            const itemTotal = product.price * item.quantity;
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${product.image || 'assets/images/default-product.jpg'}" 
                             alt="${product.name}"
                             onerror="this.src='assets/images/default-product.jpg'">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${product.name}</h4>
                        <div class="cart-item-price">$${product.price.toFixed(2)}</div>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button class="quantity-btn minus" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="quantity-btn plus" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="remove-item-btn" onclick="cart.removeItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        cartItemsContainer.innerHTML = html;
        this.updateCartTotals();
    },
    
    // Actualizar totales en la UI
    updateCartTotals() {
        const subtotalEl = document.getElementById('cartSubtotal');
        const shippingEl = document.getElementById('cartShipping');
        const totalEl = document.getElementById('cartTotal');
        
        if (subtotalEl) subtotalEl.textContent = `$${this.subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = `$${this.shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${this.total.toFixed(2)}`;
    },
    
    // Actualizar contador del carrito
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    // Actualizar toda la UI del carrito
    updateCartUI() {
        this.updateCartCount();
        this.updateCartTotals();
    },
    
    // Proceder al checkout
    async proceedToCheckout() {
        if (this.isEmpty()) {
            this.showNotification('Tu carrito está vacío', 'warning');
            return;
        }
        
        // Verificar si requiere login
        const settings = await db.getSettings();
        if (settings.requireLogin === 'true' && !auth.isAuthenticated()) {
            this.showNotification('Debes iniciar sesión para continuar', 'warning');
            auth.showLoginModal();
            return;
        }
        
        // Mostrar modal de checkout
        this.showCheckoutModal();
    },
    
    // Mostrar modal de checkout
    async showCheckoutModal() {
        const modal = document.getElementById('checkoutModal');
        const overlay = document.getElementById('overlay');
        
        if (!modal || !overlay) return;
        
        // Renderizar resumen del checkout
        await this.renderCheckoutSummary();
        
        // Mostrar modal
        modal.classList.add('active');
        overlay.classList.add('active');
        
        // Configurar envío
        this.setupShippingCalculation();
    },
    
    // Renderizar resumen para checkout
    async renderCheckoutSummary() {
        const summaryItems = document.getElementById('summaryItems');
        const summarySubtotal = document.getElementById('summarySubtotal');
        const summaryShipping = document.getElementById('summaryShipping');
        const summaryTotal = document.getElementById('summaryTotal');
        
        if (!summaryItems) return;
        
        const summary = await this.getCheckoutSummary();
        let itemsHTML = '';
        
        for (const item of summary.items) {
            itemsHTML += `
                <div class="summary-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${item.total.toFixed(2)}</span>
                </div>
            `;
        }
        
        summaryItems.innerHTML = itemsHTML;
        
        if (summarySubtotal) summarySubtotal.textContent = `$${summary.subtotal.toFixed(2)}`;
        if (summaryShipping) summaryShipping.textContent = `$${summary.shipping.toFixed(2)}`;
        if (summaryTotal) summaryTotal.textContent = `$${summary.total.toFixed(2)}`;
    },
    
    // Configurar cálculo de envío
    setupShippingCalculation() {
        const provinceSelect = document.getElementById('clientProvince');
        const shippingDisplay = document.getElementById('shippingCostDisplay');
        
        if (!provinceSelect || !shippingDisplay) return;
        
        provinceSelect.addEventListener('change', async (e) => {
            const province = e.target.value;
            const selectedOption = e.target.selectedOptions[0];
            const shippingCost = parseFloat(selectedOption?.dataset.cost) || 0;
            
            // Actualizar costo de envío
            this.shipping = shippingCost;
            this.total = this.subtotal + this.shipping;
            
            // Actualizar displays
            shippingDisplay.textContent = `Costo de envío: $${shippingCost.toFixed(2)}`;
            
            const summaryShipping = document.getElementById('summaryShipping');
            const summaryTotal = document.getElementById('summaryTotal');
            
            if (summaryShipping) summaryShipping.textContent = `$${shippingCost.toFixed(2)}`;
            if (summaryTotal) summaryTotal.textContent = `$${this.total.toFixed(2)}`;
        });
    },
    
    // Procesar checkout
    async processCheckout(checkoutData) {
        try {
            // Obtener resumen del carrito
            const cartSummary = await this.getCheckoutSummary();
            
            // Crear objeto de orden
            const orderData = {
                userId: auth.getUser()?.id || null,
                customerName: checkoutData.name || 'Cliente anónimo',
                customerPhone: checkoutData.phone,
                customerAddress: checkoutData.address,
                customerProvince: checkoutData.province,
                paymentMethod: checkoutData.paymentMethod,
                items: cartSummary.items,
                subtotal: cartSummary.subtotal,
                shippingCost: this.shipping,
                total: cartSummary.total,
                notes: checkoutData.notes || '',
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Crear orden en la base de datos
            const order = await db.createOrder(orderData);
            
            // Enviar pedido por WhatsApp
            await this.sendOrderToWhatsApp(orderData);
            
            // Limpiar carrito
            await this.clearCart();
            
            return order;
            
        } catch (error) {
            console.error('Error procesando checkout:', error);
            throw error;
        }
    },
    
    // Enviar pedido por WhatsApp
    async sendOrderToWhatsApp(orderData) {
        try {
            const settings = await db.getSettings();
            const phoneNumber = settings.storePhone;
            
            if (!phoneNumber) {
                console.error('No hay número de WhatsApp configurado');
                return;
            }
            
            // Formatear mensaje
            let message = settings.whatsappMessage || 'Hola, me interesa comprar los siguientes productos:\n\n';
            
            // Agregar productos
            orderData.items.forEach(item => {
                message += `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}\n`;
            });
            
            message += `\nSubtotal: $${orderData.subtotal.toFixed(2)}`;
            message += `\nEnvío: $${orderData.shippingCost.toFixed(2)}`;
            message += `\nTotal: $${orderData.total.toFixed(2)}`;
            message += `\n\nInformación del cliente:`;
            message += `\nNombre: ${orderData.customerName}`;
            message += `\nTeléfono: ${orderData.customerPhone}`;
            message += `\nDirección: ${orderData.customerAddress}`;
            message += `\nProvincia: ${orderData.customerProvince}`;
            message += `\nMétodo de pago: ${orderData.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}`;
            
            if (orderData.notes) {
                message += `\nNotas: ${orderData.notes}`;
            }
            
            // Codificar mensaje para URL
            const encodedMessage = encodeURIComponent(message);
            
            // Crear URL de WhatsApp
            const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
            
            // Abrir WhatsApp en nueva ventana
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Error enviando pedido por WhatsApp:', error);
        }
    },
    
    // Animación del botón del carrito
    animateCartButton() {
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.classList.add('pulse');
            setTimeout(() => {
                cartBtn.classList.remove('pulse');
            }, 500);
        }
    },
    
    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Usar la función de notificación global si existe
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Implementación básica si no existe
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    // Exportar carrito (para backup)
    exportCart() {
        return {
            items: this.items,
            subtotal: this.subtotal,
            shipping: this.shipping,
            total: this.total,
            exportedAt: new Date().toISOString()
        };
    },
    
    // Importar carrito
    async importCart(cartData) {
        // Limpiar carrito actual
        await this.clearCart();
        
        // Agregar cada item del carrito importado
        for (const item of cartData.items) {
            await this.addProduct(item.productId, item.quantity);
        }
        
        this.showNotification('Carrito importado correctamente', 'success');
    },
    
    // Calcular tiempo estimado de entrega
    calculateDeliveryTime(province) {
        // En una implementación real, esto consultaría la base de datos
        // Por ahora, retornamos un valor fijo
        return '2-3 días hábiles';
    },
    
    // Verificar disponibilidad de productos
    async checkAvailability() {
        const unavailableItems = [];
        
        for (const item of this.items) {
            const product = await db.get('products', item.productId);
            if (!product || product.stock < item.quantity) {
                unavailableItems.push({
                    item,
                    product,
                    available: product ? product.stock : 0
                });
            }
        }
        
        return unavailableItems;
    },
    
    // Actualizar precios si hay cambios
    async updatePrices() {
        let needsUpdate = false;
        
        for (const item of this.items) {
            const product = await db.get('products', item.productId);
            if (product && item.price !== product.price) {
                item.price = product.price;
                needsUpdate = true;
                
                // Actualizar en la base de datos
                await db.update('cart', item.id, item);
            }
        }
        
        if (needsUpdate) {
            await this.loadCart();
            this.updateCartUI();
            this.showNotification('Los precios se han actualizado', 'info');
        }
    }
};

// Inicializar carrito
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cart.init();
    } catch (error) {
        console.error('Error inicializando carrito:', error);
    }
});

// Exportar para uso global
window.cart = cart;

// API del carrito para otros módulos
window.CartAPI = {
    addProduct: cart.addProduct.bind(cart),
    updateQuantity: cart.updateQuantity.bind(cart),
    removeItem: cart.removeItem.bind(cart),
    clearCart: cart.clearCart.bind(cart),
    getItemCount: cart.getItemCount.bind(cart),
    isEmpty: cart.isEmpty.bind(cart),
    getCheckoutSummary: cart.getCheckoutSummary.bind(cart),
    processCheckout: cart.processCheckout.bind(cart),
    exportCart: cart.exportCart.bind(cart),
    importCart: cart.importCart.bind(cart),
    checkAvailability: cart.checkAvailability.bind(cart),
    updatePrices: cart.updatePrices.bind(cart)
};