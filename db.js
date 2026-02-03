// Configuración de IndexedDB
const DB_NAME = 'sensualShopDB';
const DB_VERSION = 3;

// Schemas de la base de datos
const DB_SCHEMA = {
    users: {
        keyPath: 'id',
        indexes: [
            { name: 'email', keyPath: 'email', unique: true },
            { name: 'role', keyPath: 'role' },
            { name: 'createdAt', keyPath: 'createdAt' }
        ]
    },
    products: {
        keyPath: 'id',
        indexes: [
            { name: 'category', keyPath: 'category' },
            { name: 'status', keyPath: 'status' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'stock', keyPath: 'stock' },
            { name: 'featured', keyPath: 'featured' },
            { name: 'price', keyPath: 'price' }
        ]
    },
    categories: {
        keyPath: 'id',
        indexes: [
            { name: 'name', keyPath: 'name', unique: true }
        ]
    },
    orders: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId' },
            { name: 'status', keyPath: 'status' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'total', keyPath: 'total' }
        ]
    },
    cart: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId' },
            { name: 'productId', keyPath: 'productId' },
            { name: 'sessionId', keyPath: 'sessionId' }
        ]
    },
    promotions: {
        keyPath: 'id',
        indexes: [
            { name: 'type', keyPath: 'type' },
            { name: 'active', keyPath: 'active' },
            { name: 'startDate', keyPath: 'startDate' },
            { name: 'endDate', keyPath: 'endDate' }
        ]
    },
    settings: {
        keyPath: 'key'
    },
    shipping: {
        keyPath: 'id',
        indexes: [
            { name: 'province', keyPath: 'province', unique: true },
            { name: 'status', keyPath: 'status' }
        ]
    },
    socialLinks: {
        keyPath: 'id',
        indexes: [
            { name: 'platform', keyPath: 'platform' },
            { name: 'display', keyPath: 'display' }
        ]
    },
    ratings: {
        keyPath: 'id',
        indexes: [
            { name: 'productId', keyPath: 'productId' },
            { name: 'userId', keyPath: 'userId' },
            { name: 'rating', keyPath: 'rating' }
        ]
    }
};

// Clase para manejar IndexedDB
class Database {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                // Crear object stores si no existen
                for (const [storeName, schema] of Object.entries(DB_SCHEMA)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, {
                            keyPath: schema.keyPath,
                            autoIncrement: true
                        });

                        // Crear índices
                        if (schema.indexes) {
                            schema.indexes.forEach(index => {
                                store.createIndex(index.name, index.keyPath, {
                                    unique: index.unique || false
                                });
                            });
                        }
                    }
                }

                // Migración de datos si es necesario
                if (oldVersion < 2) {
                    this.migrateToV2(db);
                }

                if (oldVersion < 3) {
                    this.migrateToV3(db);
                }
            };
        });
    }

    migrateToV2(db) {
        // Migración para agregar datos iniciales
        const defaultCategories = [
            { id: 1, name: 'Juguetes Eróticos', description: 'Variedad de juguetes para adultos', icon: 'fas fa-gamepad' },
            { id: 2, name: 'Lencería', description: 'Ropa interior sexy y provocativa', icon: 'fas fa-tshirt' },
            { id: 3, name: 'Lubricantes', description: 'Lubricantes y geles íntimos', icon: 'fas fa-oil-can' },
            { id: 4, name: 'Aceites y Masajes', description: 'Productos para masajes sensuales', icon: 'fas fa-spa' },
            { id: 5, name: 'Fantasías', description: 'Disfraces y accesorios eróticos', icon: 'fas fa-mask' },
            { id: 6, name: 'Juegos de Pareja', description: 'Juegos para aumentar la pasión', icon: 'fas fa-heart' }
        ];

        const defaultSettings = [
            { key: 'storePhone', value: '+1234567890' },
            { key: 'storeEmail', value: 'info@sensualshop.com' },
            { key: 'storeName', value: 'Sensual Shop' },
            { key: 'currency', value: 'USD' },
            { key: 'taxPercentage', value: 0 },
            { key: 'requireLogin', value: false },
            { key: 'allowRatings', value: true },
            { key: 'showStock', value: true },
            { key: 'themeColor', value: '#ff4081' },
            { key: 'backgroundImage', value: 'assets/images/background.jpg' },
            { key: 'whatsappMessage', value: 'Hola, me interesa comprar los siguientes productos:' }
        ];

        const defaultShipping = [
            { id: 1, province: 'Santo Domingo', cost: 5.00, deliveryTime: 1, status: 'active' },
            { id: 2, province: 'Distrito Nacional', cost: 5.00, deliveryTime: 1, status: 'active' },
            { id: 3, province: 'Santiago', cost: 8.00, deliveryTime: 2, status: 'active' },
            { id: 4, province: 'La Vega', cost: 10.00, deliveryTime: 2, status: 'active' },
            { id: 5, province: 'San Cristóbal', cost: 7.00, deliveryTime: 2, status: 'active' }
        ];

        // Insertar datos por defecto
        const categoriesStore = db.transaction('categories', 'readwrite').objectStore('categories');
        defaultCategories.forEach(category => {
            categoriesStore.put(category);
        });

        const settingsStore = db.transaction('settings', 'readwrite').objectStore('settings');
        defaultSettings.forEach(setting => {
            settingsStore.put(setting);
        });

        const shippingStore = db.transaction('shipping', 'readwrite').objectStore('shipping');
        defaultShipping.forEach(shipping => {
            shippingStore.put(shipping);
        });
    }

    migrateToV3(db) {
        // Agregar usuario administrador por defecto
        const adminUser = {
            id: 1,
            name: 'Administrador',
            email: 'admin@sensualshop.com',
            password: 'admin999',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        const usersStore = db.transaction('users', 'readwrite').objectStore('users');
        usersStore.put(adminUser);
    }

    // Métodos CRUD genéricos
    async add(storeName, data) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = (event) => {
                resolve({ id: event.target.result, ...data });
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async get(storeName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async getAll(storeName, indexName = null, range = null) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = indexName ? store.index(indexName) : store;
            const request = range ? target.getAll(range) : target.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async update(storeName, key, data) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id: key });

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async delete(storeName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = (event) => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async count(storeName) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async query(storeName, indexName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(key);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async queryAll(storeName, indexName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(key);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Métodos específicos para la aplicación
    async getCurrentUser() {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) return null;
        return await this.get('users', parseInt(userId));
    }

    async getProductsByCategory(category) {
        return await this.queryAll('products', 'category', category);
    }

    async getActiveProducts() {
        const products = await this.getAll('products');
        return products.filter(p => p.status !== 'inactive' && p.stock > 0);
    }

    async getFeaturedProducts() {
        const products = await this.getAll('products');
        return products.filter(p => p.featured === true && p.status === 'active');
    }

    async getNewProducts() {
        const products = await this.getAll('products');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return products.filter(p => {
            const created = new Date(p.createdAt);
            return created > oneWeekAgo && p.status === 'active';
        });
    }

    async getLowStockProducts() {
        const products = await this.getAll('products');
        return products.filter(p => p.stock <= 3 && p.stock > 0);
    }

    async getOutOfStockProducts() {
        const products = await this.getAll('products');
        return products.filter(p => p.stock === 0);
    }

    async getBackInStockProducts() {
        const products = await this.getAll('products');
        const recentlyRestocked = products.filter(p => {
            if (!p.lastRestocked) return false;
            const restocked = new Date(p.lastRestocked);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return restocked > oneWeekAgo && p.stock > 0 && p.previousStock === 0;
        });
        return recentlyRestocked;
    }

    async getUserCart(userId = null) {
        let cartItems;
        if (userId) {
            cartItems = await this.queryAll('cart', 'userId', userId);
        } else {
            const sessionId = localStorage.getItem('sessionId') || this.generateSessionId();
            localStorage.setItem('sessionId', sessionId);
            cartItems = await this.queryAll('cart', 'sessionId', sessionId);
        }
        return cartItems;
    }

    async addToCart(productId, quantity = 1, userId = null) {
        const sessionId = userId ? null : (localStorage.getItem('sessionId') || this.generateSessionId());
        if (!sessionId && !userId) {
            localStorage.setItem('sessionId', sessionId);
        }

        const cartItem = {
            productId,
            quantity,
            addedAt: new Date().toISOString(),
            userId: userId || null,
            sessionId: sessionId || null
        };

        return await this.add('cart', cartItem);
    }

    async updateCartItem(itemId, quantity) {
        const item = await this.get('cart', itemId);
        if (!item) return null;

        if (quantity <= 0) {
            return await this.delete('cart', itemId);
        }

        item.quantity = quantity;
        return await this.update('cart', itemId, item);
    }

    async clearCart(userId = null, sessionId = null) {
        let cartItems;
        if (userId) {
            cartItems = await this.queryAll('cart', 'userId', userId);
        } else if (sessionId) {
            cartItems = await this.queryAll('cart', 'sessionId', sessionId);
        } else {
            cartItems = await this.getAll('cart');
        }

        const promises = cartItems.map(item => this.delete('cart', item.id));
        await Promise.all(promises);
        return true;
    }

    async createOrder(orderData) {
        const order = {
            ...orderData,
            createdAt: new Date().toISOString(),
            orderNumber: this.generateOrderNumber(),
            status: 'pending'
        };

        // Reducir stock de productos
        for (const item of order.items) {
            const product = await this.get('products', item.productId);
            if (product) {
                product.stock -= item.quantity;
                product.soldCount = (product.soldCount || 0) + item.quantity;
                await this.update('products', product.id, product);
            }
        }

        // Limpiar carrito
        if (order.userId) {
            await this.clearCart(order.userId);
        } else {
            const sessionId = localStorage.getItem('sessionId');
            if (sessionId) {
                await this.clearCart(null, sessionId);
            }
        }

        return await this.add('orders', order);
    }

    async getSettings() {
        const settings = await this.getAll('settings');
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        return settingsObj;
    }

    async updateSetting(key, value) {
        const existing = await this.query('settings', 'key', key);
        if (existing) {
            return await this.update('settings', existing.id, { key, value });
        } else {
            return await this.add('settings', { key, value });
        }
    }

    async getActivePromotions() {
        const now = new Date().toISOString();
        const promotions = await this.getAll('promotions');
        return promotions.filter(promo => 
            promo.active === true && 
            promo.startDate <= now && 
            promo.endDate >= now
        );
    }

    async addProductRating(productId, userId, rating, comment = '') {
        const existing = await this.queryAll('ratings', 'productId', productId)
            .then(ratings => ratings.find(r => r.userId === userId));

        if (existing) {
            // Actualizar rating existente
            return await this.update('ratings', existing.id, {
                productId,
                userId,
                rating,
                comment,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Crear nuevo rating
            return await this.add('ratings', {
                productId,
                userId,
                rating,
                comment,
                createdAt: new Date().toISOString()
            });
        }
    }

    async getProductAverageRating(productId) {
        const ratings = await this.queryAll('ratings', 'productId', productId);
        if (ratings.length === 0) return 0;
        
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return sum / ratings.length;
    }

    async searchProducts(query) {
        const products = await this.getAll('products');
        const searchTerm = query.toLowerCase();
        
        return products.filter(product => {
            return (
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.tags?.toLowerCase().includes(searchTerm)
            );
        });
    }

    // Métodos de utilidad
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `ORD-${year}${month}${day}-${random}`;
    }

    async getDashboardStats() {
        const [
            totalProducts,
            activeProducts,
            totalOrders,
            totalUsers,
            todayOrders,
            totalSales,
            lowStockCount,
            outOfStockCount
        ] = await Promise.all([
            this.count('products'),
            this.getActiveProducts().then(p => p.length),
            this.count('orders'),
            this.count('users'),
            this.getTodayOrders().then(o => o.length),
            this.getTotalSales(),
            this.getLowStockProducts().then(p => p.length),
            this.getOutOfStockProducts().then(p => p.length)
        ]);

        return {
            totalProducts,
            activeProducts,
            totalOrders,
            totalUsers,
            todayOrders,
            totalSales,
            lowStockCount,
            outOfStockCount
        };
    }

    async getTodayOrders() {
        const orders = await this.getAll('orders');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= today;
        });
    }

    async getTotalSales() {
        const orders = await this.getAll('orders');
        return orders.reduce((total, order) => total + order.total, 0);
    }

    async getRecentOrders(limit = 10) {
        const orders = await this.getAll('orders');
        return orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    async getTopProducts(limit = 5) {
        const products = await this.getAll('products');
        return products
            .filter(p => p.soldCount > 0)
            .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
            .slice(0, limit);
    }

    async getSalesByDate(days = 7) {
        const orders = await this.getAll('orders');
        const salesByDate = {};
        const today = new Date();
        
        // Inicializar los últimos días
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            salesByDate[dateKey] = 0;
        }
        
        // Sumar ventas por fecha
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const dateKey = orderDate.toISOString().split('T')[0];
            const compareDate = new Date(dateKey);
            const daysAgo = Math.floor((today - compareDate) / (1000 * 60 * 60 * 24));
            
            if (daysAgo < days && daysAgo >= 0) {
                salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.total;
            }
        });
        
        return salesByDate;
    }
}

// Instancia global de la base de datos
const db = new Database();

// Exportar para usar en otros archivos
window.db = db;

// Inicializar datos por defecto al cargar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.initPromise;
        
        // Verificar si existe el usuario administrador
        const adminUser = await db.query('users', 'email', 'admin@sensualshop.com');
        if (!adminUser) {
            // Crear usuario administrador por defecto
            await db.add('users', {
                name: 'Administrador',
                email: 'admin@sensualshop.com',
                password: 'admin999',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
        }
        
        // Verificar configuraciones básicas
        const settings = await db.getSettings();
        if (!settings.storePhone) {
            await db.updateSetting('storePhone', '+1234567890');
        }
        if (!settings.whatsappMessage) {
            await db.updateSetting('whatsappMessage', 'Hola, me interesa comprar los siguientes productos:');
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
});