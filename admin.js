// Configuración del panel de administración
const adminConfig = {
    currentAdmin: null,
    stats: {},
    charts: {}
};

// Elementos DOM del admin
const adminElements = {
    // Login
    adminLogin: document.getElementById('adminLogin'),
    adminPanel: document.getElementById('adminPanel'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminPassword: document.getElementById('adminPassword'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    
    // Navegación
    navLinks: document.querySelectorAll('.admin-nav .nav-link'),
    adminSectionTitle: document.getElementById('adminSectionTitle'),
    adminSectionSubtitle: document.getElementById('adminSectionSubtitle'),
    
    // Dashboard
    totalSales: document.getElementById('totalSales'),
    totalOrders: document.getElementById('totalOrders'),
    totalProducts: document.getElementById('totalProducts'),
    totalUsers: document.getElementById('totalUsers'),
    salesChange: document.getElementById('salesChange'),
    ordersChange: document.getElementById('ordersChange'),
    productsChange: document.getElementById('productsChange'),
    usersChange: document.getElementById('usersChange'),
    recentOrdersTable: document.getElementById('recentOrdersTable'),
    topProductsList: document.getElementById('topProductsList'),
    
    // Productos
    productsSection: document.getElementById('productsSection'),
    addProductBtn: document.getElementById('addProductBtn'),
    adminSearchProducts: document.getElementById('adminSearchProducts'),
    adminCategoryFilter: document.getElementById('adminCategoryFilter'),
    adminStatusFilter: document.getElementById('adminStatusFilter'),
    productsTableBody: document.getElementById('productsTableBody'),
    
    // Ventas
    ordersSection: document.getElementById('ordersSection'),
    ordersDateFrom: document.getElementById('ordersDateFrom'),
    ordersDateTo: document.getElementById('ordersDateTo'),
    ordersStatusFilter: document.getElementById('ordersStatusFilter'),
    ordersTableBody: document.getElementById('ordersTableBody'),
    filteredSalesTotal: document.getElementById('filteredSalesTotal'),
    filteredOrdersCount: document.getElementById('filteredOrdersCount'),
    averageOrderValue: document.getElementById('averageOrderValue'),
    totalItemsSold: document.getElementById('totalItemsSold'),
    
    // Inventario
    inventorySection: document.getElementById('inventorySection'),
    lowStockCount: document.getElementById('lowStockCount'),
    outOfStockCount: document.getElementById('outOfStockCount'),
    newProductsCount: document.getElementById('newProductsCount'),
    backInStockCount: document.getElementById('backInStockCount'),
    inventoryTableBody: document.getElementById('inventoryTableBody'),
    
    // Promociones
    promotionsSection: document.getElementById('promotionsSection'),
    addPromoBtn: document.getElementById('addPromoBtn'),
    promotionsGrid: document.getElementById('promotionsGrid'),
    promoFormContainer: document.getElementById('promoFormContainer'),
    
    // Envíos
    shippingSection: document.getElementById('shippingSection'),
    addProvinceBtn: document.getElementById('addProvinceBtn'),
    shippingTableBody: document.getElementById('shippingTableBody'),
    shippingFormContainer: document.getElementById('shippingFormContainer'),
    
    // Configuración
    storeConfigSection: document.getElementById('storeConfigSection'),
    contactConfigForm: document.getElementById('contactConfigForm'),
    appearanceConfigForm: document.getElementById('appearanceConfigForm'),
    purchaseConfigForm: document.getElementById('purchaseConfigForm'),
    
    // Social
    socialSection: document.getElementById('socialSection'),
    addSocialLinkBtn: document.getElementById('addSocialLinkBtn'),
    socialLinksGrid: document.getElementById('socialLinksGrid'),
    socialFormContainer: document.getElementById('socialFormContainer'),
    
    // Usuarios
    usersSection: document.getElementById('usersSection'),
    usersTableBody: document.getElementById('usersTableBody'),
    
    // Modales
    productModal: document.getElementById('productModal'),
    productForm: document.getElementById('productForm'),
    productModalTitle: document.getElementById('productModalTitle'),
    productImagePreview: document.getElementById('productImagePreview'),
    
    // Notificaciones
    adminNotification: document.getElementById('adminNotification')
};

// Inicialización del admin
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar si hay sesión activa
        await checkAdminSession();
        
        // Si no hay sesión, mostrar login
        if (!adminConfig.currentAdmin) {
            showAdminLogin();
            return;
        }
        
        // Mostrar panel principal
        showAdminPanel();
        
        // Cargar datos iniciales
        await loadAdminData();
        
        // Inicializar eventos
        initAdminEvents();
        
        // Actualizar fecha
        updateAdminDate();
        
        console.log('Panel de administración inicializado');
    } catch (error) {
        console.error('Error inicializando admin:', error);
        showAdminNotification('Error al inicializar el panel', 'error');
    }
});

// Verificar sesión de administrador
async function checkAdminSession() {
    try {
        const adminData = localStorage.getItem('adminSession');
        if (adminData) {
            const session = JSON.parse(adminData);
            const adminUser = await db.query('users', 'email', session.email);
            
            if (adminUser && adminUser.role === 'admin') {
                adminConfig.currentAdmin = adminUser;
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

// Mostrar login de admin
function showAdminLogin() {
    adminElements.adminLogin.style.display = 'flex';
    adminElements.adminPanel.style.display = 'none';
}

// Mostrar panel principal
function showAdminPanel() {
    adminElements.adminLogin.style.display = 'none';
    adminElements.adminPanel.style.display = 'flex';
}

// Cargar datos del admin
async function loadAdminData() {
    try {
        // Cargar estadísticas
        await loadDashboardStats();
        
        // Cargar productos
        await loadAdminProducts();
        
        // Cargar categorías para filtros
        await loadCategoryFilters();
        
        // Cargar ventas
        await loadOrders();
        
        // Cargar inventario
        await loadInventory();
        
        // Cargar promociones
        await loadAdminPromotions();
        
        // Cargar envíos
        await loadAdminShipping();
        
        // Cargar configuración
        await loadStoreConfig();
        
        // Cargar enlaces sociales
        await loadAdminSocialLinks();
        
        // Cargar usuarios
        await loadAdminUsers();
        
    } catch (error) {
        console.error('Error cargando datos del admin:', error);
        showAdminNotification('Error al cargar datos', 'error');
    }
}

// Cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        const stats = await db.getDashboardStats();
        adminConfig.stats = stats;
        
        // Actualizar UI
        adminElements.totalSales.textContent = `$${stats.totalSales.toFixed(2)}`;
        adminElements.totalOrders.textContent = stats.totalOrders;
        adminElements.totalProducts.textContent = stats.activeProducts;
        adminElements.totalUsers.textContent = stats.totalUsers;
        
        // Calcular cambios (simulados por ahora)
        adminElements.salesChange.textContent = '+12%';
        adminElements.ordersChange.textContent = '+8%';
        adminElements.productsChange.textContent = '+5%';
        adminElements.usersChange.textContent = '+3%';
        
        // Cargar pedidos recientes
        await loadRecentOrders();
        
        // Cargar productos más vendidos
        await loadTopProducts();
        
        // Inicializar gráficos
        initCharts();
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar pedidos recientes
async function loadRecentOrders() {
    try {
        const orders = await db.getRecentOrders(10);
        const tbody = adminElements.recentOrdersTable.querySelector('tbody');
        
        if (!tbody) return;
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No hay pedidos recientes</td>
                </tr>
            `;
            return;
        }
        
        const ordersHTML = orders.map(order => `
            <tr>
                <td>${order.orderNumber || order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.items?.length || 0} productos</td>
                <td>$${order.total?.toFixed(2) || '0.00'}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            </tr>
        `).join('');
        
        tbody.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('Error cargando pedidos recientes:', error);
    }
}

// Cargar productos más vendidos
async function loadTopProducts() {
    try {
        const products = await db.getTopProducts(5);
        
        if (!products || products.length === 0) {
            adminElements.topProductsList.innerHTML = `
                <div class="no-data">
                    <p>No hay datos de ventas</p>
                </div>
            `;
            return;
        }
        
        const productsHTML = products.map((product, index) => `
            <div class="top-product-item">
                <div class="top-product-rank top-${index + 1}">${index + 1}</div>
                <div class="top-product-info">
                    <div class="top-product-name">${product.name}</div>
                    <div class="top-product-stats">
                        <span>Vendidos: ${product.soldCount || 0}</span>
                        <span>Stock: ${product.stock}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        adminElements.topProductsList.innerHTML = productsHTML;
        
    } catch (error) {
        console.error('Error cargando productos más vendidos:', error);
    }
}

// Inicializar gráficos
function initCharts() {
    try {
        // Gráfico de ventas
        const salesCtx = document.getElementById('salesChart');
        if (salesCtx) {
            initSalesChart(salesCtx);
        }
    } catch (error) {
        console.error('Error inicializando gráficos:', error);
    }
}

// Gráfico de ventas
async function initSalesChart(ctx) {
    try {
        const salesData = await db.getSalesByDate(7);
        const dates = Object.keys(salesData).sort();
        const amounts = dates.map(date => salesData[date]);
        
        adminConfig.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => formatShortDate(date)),
                datasets: [{
                    label: 'Ventas ($)',
                    data: amounts,
                    borderColor: '#673ab7',
                    backgroundColor: 'rgba(103, 58, 183, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creando gráfico de ventas:', error);
    }
}

// Cargar productos para admin
async function loadAdminProducts(filters = {}) {
    try {
        let products = await db.getAll('products');
        
        // Aplicar filtros
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }
        
        if (filters.status) {
            products = products.filter(p => p.status === filters.status);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        renderAdminProducts(products);
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAdminNotification('Error al cargar productos', 'error');
    }
}

// Renderizar productos en tabla admin
function renderAdminProducts(products) {
    if (!products || products.length === 0) {
        adminElements.productsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No hay productos</td>
            </tr>
        `;
        return;
    }
    
    const productsHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${product.image || 'assets/images/default-product.jpg'}" 
                     alt="${product.name}"
                     class="product-thumb"
                     onerror="this.src='assets/images/default-product.jpg'">
            </td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge status-${product.status || 'active'}">
                    ${getProductStatusText(product)}
                </span>
            </td>
            <td>${product.soldCount || 0}</td>
            <td>
                <button class="btn-small btn-outline edit-product" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-outline delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    adminElements.productsTableBody.innerHTML = productsHTML;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('button').dataset.id);
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('button').dataset.id);
            deleteProduct(productId);
        });
    });
}

// Obtener texto del estado del producto
function getProductStatusText(product) {
    if (product.stock === 0) return 'Agotado';
    if (product.stock <= 3) return 'Stock Bajo';
    if (product.status === 'new') return 'Nuevo';
    if (product.status === 'sale') return 'Oferta';
    if (product.status === 'back') return 'De Vuelta';
    return 'Activo';
}

// Cargar filtros de categorías
async function loadCategoryFilters() {
    try {
        const categories = await db.getAll('categories');
        
        const options = categories.map(category => `
            <option value="${category.name}">${category.name}</option>
        `).join('');
        
        if (adminElements.adminCategoryFilter) {
            adminElements.adminCategoryFilter.innerHTML = `
                <option value="">Todas las categorías</option>
                ${options}
            `;
        }
        
        // También para el formulario de producto
        const productCategorySelect = document.getElementById('productCategory');
        if (productCategorySelect) {
            productCategorySelect.innerHTML = `
                <option value="">Selecciona una categoría</option>
                ${options}
            `;
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Cargar ventas
async function loadOrders(filters = {}) {
    try {
        let orders = await db.getAll('orders');
        
        // Aplicar filtros de fecha
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            orders = orders.filter(order => new Date(order.createdAt) >= fromDate);
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            orders = orders.filter(order => new Date(order.createdAt) <= toDate);
        }
        
        if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
        }
        
        // Ordenar por fecha más reciente
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderOrders(orders);
        updateOrdersSummary(orders);
        
    } catch (error) {
        console.error('Error cargando ventas:', error);
        showAdminNotification('Error al cargar ventas', 'error');
    }
}

// Renderizar ventas
function renderOrders(orders) {
    if (!orders || orders.length === 0) {
        adminElements.ordersTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No hay pedidos</td>
            </tr>
        `;
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <tr>
            <td>${order.orderNumber || order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.items?.length || 0} productos</td>
            <td>${order.items?.reduce((total, item) => total + item.quantity, 0) || 0}</td>
            <td>$${order.total?.toFixed(2) || '0.00'}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${getOrderStatusText(order.status)}
                </span>
            </td>
            <td>
                <button class="btn-small btn-outline view-order" data-id="${order.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-small btn-outline update-status" data-id="${order.id}">
                    <i class="fas fa-sync"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    adminElements.ordersTableBody.innerHTML = ordersHTML;
}

// Obtener texto del estado del pedido
function getOrderStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

// Actualizar resumen de ventas
function updateOrdersSummary(orders) {
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalItems = orders.reduce((sum, order) => 
        sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0);
    const averageOrder = orders.length > 0 ? totalSales / orders.length : 0;
    
    adminElements.filteredSalesTotal.textContent = `$${totalSales.toFixed(2)}`;
    adminElements.filteredOrdersCount.textContent = orders.length;
    adminElements.averageOrderValue.textContent = `$${averageOrder.toFixed(2)}`;
    adminElements.totalItemsSold.textContent = totalItems;
}

// Cargar inventario
async function loadInventory() {
    try {
        const products = await db.getAll('products');
        
        // Calcular contadores
        const lowStock = products.filter(p => p.stock <= 3 && p.stock > 0).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const newProducts = products.filter(p => p.status === 'new').length;
        const backInStock = products.filter(p => p.status === 'back').length;
        
        // Actualizar contadores
        adminElements.lowStockCount.textContent = `${lowStock} productos`;
        adminElements.outOfStockCount.textContent = `${outOfStock} productos`;
        adminElements.newProductsCount.textContent = `${newProducts} productos`;
        adminElements.backInStockCount.textContent = `${backInStock} productos`;
        
        // Renderizar tabla de inventario
        renderInventoryTable(products);
        
    } catch (error) {
        console.error('Error cargando inventario:', error);
    }
}

// Renderizar tabla de inventario
function renderInventoryTable(products) {
    if (!products || products.length === 0) {
        adminElements.inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No hay productos</td>
            </tr>
        `;
        return;
    }
    
    const inventoryHTML = products.map(product => `
        <tr>
            <td>
                <div class="inventory-product">
                    <img src="${product.image || 'assets/images/default-product.jpg'}" 
                         alt="${product.name}"
                         class="product-thumb"
                         onerror="this.src='assets/images/default-product.jpg'">
                    <span>${product.name}</span>
                </div>
            </td>
            <td>${product.stock}</td>
            <td>${product.minStock || 3}</td>
            <td>
                <span class="status-badge status-${getInventoryStatus(product)}">
                    ${getInventoryStatusText(product)}
                </span>
            </td>
            <td>${product.lastSale ? formatDate(product.lastSale) : 'Nunca'}</td>
            <td>
                <button class="btn-small btn-outline update-stock" data-id="${product.id}">
                    <i class="fas fa-edit"></i> Stock
                </button>
            </td>
        </tr>
    `).join('');
    
    adminElements.inventoryTableBody.innerHTML = inventoryHTML;
}

// Obtener estado del inventario
function getInventoryStatus(product) {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= (product.minStock || 3)) return 'low-stock';
    if (product.status === 'new') return 'new';
    if (product.status === 'back') return 'back-in-stock';
    return 'active';
}

function getInventoryStatusText(product) {
    if (product.stock === 0) return 'Agotado';
    if (product.stock <= (product.minStock || 3)) return 'Stock Bajo';
    if (product.status === 'new') return 'Nuevo';
    if (product.status === 'back') return 'De Vuelta';
    return 'Normal';
}

// Cargar promociones para admin
async function loadAdminPromotions() {
    try {
        const promotions = await db.getAll('promotions');
        renderAdminPromotions(promotions);
    } catch (error) {
        console.error('Error cargando promociones:', error);
    }
}

// Renderizar promociones
function renderAdminPromotions(promotions) {
    if (!promotions || promotions.length === 0) {
        adminElements.promotionsGrid.innerHTML = `
            <div class="no-promotions">
                <i class="fas fa-bullhorn"></i>
                <p>No hay promociones activas</p>
            </div>
        `;
        return;
    }
    
    const promotionsHTML = promotions.map(promo => `
        <div class="promo-card" data-id="${promo.id}">
            <div class="promo-card-header">
                ${promo.image ? `<img src="${promo.image}" alt="${promo.title}">` : ''}
            </div>
            <div class="promo-card-body">
                <h4 class="promo-card-title">${promo.title || 'Sin título'}</h4>
                <div class="promo-card-dates">
                    ${formatDate(promo.startDate)} - ${formatDate(promo.endDate)}
                </div>
                <p class="promo-card-message">${promo.message}</p>
                <div class="promo-card-actions">
                    <button class="btn-small btn-outline edit-promo" data-id="${promo.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-outline delete-promo" data-id="${promo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    adminElements.promotionsGrid.innerHTML = promotionsHTML;
}

// Cargar envíos para admin
async function loadAdminShipping() {
    try {
        const shipping = await db.getAll('shipping');
        renderAdminShipping(shipping);
    } catch (error) {
        console.error('Error cargando envíos:', error);
    }
}

// Renderizar envíos
function renderAdminShipping(shipping) {
    if (!shipping || shipping.length === 0) {
        adminElements.shippingTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay provincias configuradas</td>
            </tr>
        `;
        return;
    }
    
    const shippingHTML = shipping.map(province => `
        <tr>
            <td>${province.province}</td>
            <td>$${province.cost.toFixed(2)}</td>
            <td>${province.deliveryTime} días</td>
            <td>
                <span class="status-badge status-${province.status}">
                    ${province.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-small btn-outline edit-shipping" data-id="${province.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-outline delete-shipping" data-id="${province.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    adminElements.shippingTableBody.innerHTML = shippingHTML;
}

// Cargar configuración de la tienda
async function loadStoreConfig() {
    try {
        const settings = await db.getSettings();
        
        // Configuración de contacto
        if (adminElements.contactConfigForm) {
            document.getElementById('storePhone').value = settings.storePhone || '';
            document.getElementById('storeEmail').value = settings.storeEmail || '';
            document.getElementById('storeAddress').value = settings.storeAddress || '';
        }
        
        // Apariencia
        if (adminElements.appearanceConfigForm) {
            document.getElementById('storeName').value = settings.storeName || 'Sensual Shop';
            document.getElementById('storeLogo').value = settings.storeLogo || '';
            document.getElementById('currency').value = settings.currency || 'USD';
            
            // Seleccionar color de tema
            const themeColor = settings.themeColor || '#ff4081';
            document.querySelectorAll('.color-option').forEach(option => {
                if (option.dataset.color === themeColor) {
                    option.classList.add('active');
                }
            });
        }
        
        // Configuración de compras
        if (adminElements.purchaseConfigForm) {
            document.getElementById('requireLogin').checked = settings.requireLogin === 'true';
            document.getElementById('allowRatings').checked = settings.allowRatings !== 'false';
            document.getElementById('showStock').checked = settings.showStock !== 'false';
            document.getElementById('taxPercentage').value = settings.taxPercentage || 0;
        }
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// Cargar enlaces sociales para admin
async function loadAdminSocialLinks() {
    try {
        const links = await db.getAll('socialLinks');
        renderAdminSocialLinks(links);
    } catch (error) {
        console.error('Error cargando enlaces sociales:', error);
    }
}

// Renderizar enlaces sociales
function renderAdminSocialLinks(links) {
    if (!links || links.length === 0) {
        adminElements.socialLinksGrid.innerHTML = `
            <div class="no-social-links">
                <i class="fas fa-share-alt"></i>
                <p>No hay enlaces sociales configurados</p>
            </div>
        `;
        return;
    }
    
    const linksHTML = links.map(link => `
        <div class="social-card" data-id="${link.id}">
            <div class="social-icon">
                <i class="${link.icon || 'fas fa-share-alt'}"></i>
            </div>
            <div class="social-info">
                <div class="social-name">${link.name || link.platform}</div>
                <div class="social-url">${link.url}</div>
            </div>
            <div class="social-card-actions">
                <button class="btn-small btn-outline edit-social" data-id="${link.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-outline delete-social" data-id="${link.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    adminElements.socialLinksGrid.innerHTML = linksHTML;
}

// Cargar usuarios para admin
async function loadAdminUsers() {
    try {
        const users = await db.getAll('users');
        
        // Calcular estadísticas
        const totalUsers = users.length;
        const activeUsers = users.filter(u => {
            if (!u.lastLogin) return false;
            const lastLogin = new Date(u.lastLogin);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastLogin > thirtyDaysAgo;
        }).length;
        
        const newUsersToday = users.filter(u => {
            const created = new Date(u.createdAt);
            const today = new Date();
            return created.toDateString() === today.toDateString();
        }).length;
        
        // Actualizar estadísticas
        document.getElementById('totalUsersCount').textContent = totalUsers;
        document.getElementById('activeUsersCount').textContent = activeUsers;
        document.getElementById('newUsersToday').textContent = newUsersToday;
        
        // Renderizar tabla de usuarios
        renderAdminUsers(users);
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Renderizar usuarios
function renderAdminUsers(users) {
    if (!users || users.length === 0) {
        adminElements.usersTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No hay usuarios registrados</td>
            </tr>
        `;
        return;
    }
    
    const usersHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}</td>
            <td>${user.ordersCount || 0}</td>
            <td>$${user.totalSpent?.toFixed(2) || '0.00'}</td>
            <td>
                <span class="status-badge status-${user.role === 'admin' ? 'admin' : 'user'}">
                    ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>
                <button class="btn-small btn-outline view-user" data-id="${user.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    adminElements.usersTableBody.innerHTML = usersHTML;
}

// Inicializar eventos del admin
function initAdminEvents() {
    // Login de admin
    if (adminElements.adminLoginForm) {
        adminElements.adminLoginForm.addEventListener('submit', processAdminLogin);
    }
    
    // Logout
    if (adminElements.adminLogoutBtn) {
        adminElements.adminLogoutBtn.addEventListener('click', processAdminLogout);
    }
    
    // Navegación
    adminElements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('a').dataset.section;
            switchAdminSection(section);
        });
    });
    
    // Productos
    if (adminElements.addProductBtn) {
        adminElements.addProductBtn.addEventListener('click', () => {
            showProductModal();
        });
    }
    
    if (adminElements.adminSearchProducts) {
        adminElements.adminSearchProducts.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            loadAdminProducts({ search: searchTerm });
        });
    }
    
    if (adminElements.adminCategoryFilter) {
        adminElements.adminCategoryFilter.addEventListener('change', (e) => {
            const category = e.target.value;
            loadAdminProducts({ category: category || '' });
        });
    }
    
    if (adminElements.adminStatusFilter) {
        adminElements.adminStatusFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            loadAdminProducts({ status: status || '' });
        });
    }
    
    // Ventas
    if (adminElements.ordersDateFrom && adminElements.ordersDateTo) {
        const today = new Date().toISOString().split('T')[0];
        adminElements.ordersDateFrom.value = today;
        adminElements.ordersDateTo.value = today;
        
        adminElements.ordersDateFrom.addEventListener('change', updateOrdersFilter);
        adminElements.ordersDateTo.addEventListener('change', updateOrdersFilter);
    }
    
    if (adminElements.ordersStatusFilter) {
        adminElements.ordersStatusFilter.addEventListener('change', updateOrdersFilter);
    }
    
    if (document.getElementById('applyDateFilter')) {
        document.getElementById('applyDateFilter').addEventListener('click', updateOrdersFilter);
    }
    
    if (document.getElementById('resetDateFilter')) {
        document.getElementById('resetDateFilter').addEventListener('click', resetOrdersFilter);
    }
    
    // Promociones
    if (adminElements.addPromoBtn) {
        adminElements.addPromoBtn.addEventListener('click', () => {
            showPromoForm();
        });
    }
    
    // Envíos
    if (adminElements.addProvinceBtn) {
        adminElements.addProvinceBtn.addEventListener('click', () => {
            showShippingForm();
        });
    }
    
    // Configuración
    if (adminElements.contactConfigForm) {
        adminElements.contactConfigForm.addEventListener('submit', saveContactConfig);
    }
    
    if (adminElements.appearanceConfigForm) {
        adminElements.appearanceConfigForm.addEventListener('submit', saveAppearanceConfig);
    }
    
    if (adminElements.purchaseConfigForm) {
        adminElements.purchaseConfigForm.addEventListener('submit', savePurchaseConfig);
    }
    
    // Social
    if (adminElements.addSocialLinkBtn) {
        adminElements.addSocialLinkBtn.addEventListener('click', () => {
            showSocialForm();
        });
    }
    
    // Modales
    if (document.getElementById('closeProductModal')) {
        document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    }
    
    if (document.getElementById('cancelProductBtn')) {
        document.getElementById('cancelProductBtn').addEventListener('click', closeProductModal);
    }
    
    // Subida de imágenes
    setupImageUpload();
}

// Procesar login de admin
async function processAdminLogin(e) {
    e.preventDefault();
    
    const password = adminElements.adminPassword.value;
    
    if (password === 'admin999') {
        // Crear sesión de admin
        const session = {
            email: 'admin@sensualshop.com',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('adminSession', JSON.stringify(session));
        
        // Obtener datos del admin desde la base de datos
        const adminUser = await db.query('users', 'email', 'admin@sensualshop.com');
        if (!adminUser) {
            // Crear usuario admin si no existe
            await db.add('users', {
                name: 'Administrador',
                email: 'admin@sensualshop.com',
                password: 'admin999',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
        }
        
        adminConfig.currentAdmin = adminUser || { name: 'Administrador', role: 'admin' };
        
        showAdminPanel();
        await loadAdminData();
        showAdminNotification('Sesión iniciada correctamente', 'success');
        
    } else {
        showAdminNotification('Contraseña incorrecta', 'error');
        adminElements.adminPassword.value = '';
        adminElements.adminPassword.focus();
    }
}

// Procesar logout de admin
function processAdminLogout() {
    localStorage.removeItem('adminSession');
    adminConfig.currentAdmin = null;
    showAdminLogin();
    showAdminNotification('Sesión cerrada correctamente', 'success');
}

// Cambiar sección del admin
function switchAdminSection(section) {
    // Actualizar navegación
    adminElements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });
    
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar título
    updateSectionTitle(section);
}

// Actualizar título de sección
function updateSectionTitle(section) {
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Gestión de Productos',
        'orders': 'Ventas y Pedidos',
        'inventory': 'Control de Inventario',
        'promotions': 'Promociones y Anuncios',
        'shipping': 'Configuración de Envíos',
        'store-config': 'Configuración de Tienda',
        'social': 'Redes Sociales y Enlaces',
        'users': 'Usuarios Registrados'
    };
    
    const subtitles = {
        'dashboard': 'Resumen y estadísticas',
        'products': 'Agrega, edita o elimina productos',
        'orders': 'Gestiona pedidos y ventas',
        'inventory': 'Controla el stock de productos',
        'promotions': 'Crea promociones para la tienda',
        'shipping': 'Configura costos de envío por provincia',
        'store-config': 'Personaliza la tienda',
        'social': 'Administra enlaces sociales',
        'users': 'Gestiona usuarios registrados'
    };
    
    adminElements.adminSectionTitle.textContent = titles[section] || 'Panel';
    adminElements.adminSectionSubtitle.textContent = subtitles[section] || '';
}

// Actualizar fecha en el admin
function updateAdminDate() {
    const dateElement = document.getElementById('adminDate');
    if (dateElement) {
        const now = new Date();
        dateElement.textContent = formatDate(now);
    }
}

// Mostrar modal de producto
async function showProductModal(productId = null) {
    const modal = adminElements.productModal;
    const form = adminElements.productForm;
    
    if (productId) {
        // Modo edición
        adminElements.productModalTitle.textContent = 'Editar Producto';
        
        try {
            const product = await db.get('products', productId);
            if (product) {
                form.dataset.id = productId;
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productMinStock').value = product.minStock || 3;
                document.getElementById('productStatus').value = product.status || 'active';
                document.getElementById('productTags').value = product.tags || '';
                document.getElementById('productFeatured').checked = product.featured || false;
                
                // Mostrar imagen previa si existe
                if (product.image) {
                    adminElements.productImagePreview.innerHTML = `
                        <img src="${product.image}" alt="Vista previa">
                    `;
                    adminElements.productImagePreview.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            showAdminNotification('Error al cargar producto', 'error');
            return;
        }
    } else {
        // Modo creación
        adminElements.productModalTitle.textContent = 'Agregar Producto';
        form.reset();
        form.dataset.id = '';
        adminElements.productImagePreview.style.display = 'none';
        adminElements.productImagePreview.innerHTML = '';
    }
    
    modal.classList.add('active');
}

// Cerrar modal de producto
function closeProductModal() {
    adminElements.productModal.classList.remove('active');
}

// Configurar subida de imágenes
function setupImageUpload() {
    const imageUploadArea = document.getElementById('imageUploadArea');
    const productImageInput = document.getElementById('productImage');
    
    if (imageUploadArea && productImageInput) {
        // Click en el área de subida
        imageUploadArea.addEventListener('click', () => {
            productImageInput.click();
        });
        
        // Cambio en el input de archivo
        productImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                previewProductImage(file);
            }
        });
        
        // Arrastrar y soltar
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.style.backgroundColor = 'rgba(103, 58, 183, 0.1)';
        });
        
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.style.backgroundColor = '';
        });
        
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.style.backgroundColor = '';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                productImageInput.files = e.dataTransfer.files;
                previewProductImage(file);
            }
        });
    }
}

// Previsualizar imagen de producto
function previewProductImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        adminElements.productImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Vista previa">
        `;
        adminElements.productImagePreview.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric'
    });
}

// Mostrar notificación en admin
function showAdminNotification(message, type = 'info') {
    const notification = adminElements.adminNotification;
    
    notification.textContent = message;
    notification.className = 'admin-notification show';
    
    // Colores según tipo
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #4caf50, #8bc34a)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ff9800, #ff5722)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #673ab7, #3f51b5)';
    }
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Exportar funciones globales
window.switchAdminSection = switchAdminSection;
window.showAdminNotification = showAdminNotification;
window.closeProductModal = closeProductModal;