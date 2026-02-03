// Configuración global
const config = {
    currency: '$',
    taxRate: 0,
    shippingCosts: {},
    currentUser: null,
    cart: [],
    products: [],
    categories: []
};

// Elementos DOM
const elements = {
    // Header
    menuBtn: document.getElementById('menuBtn'),
    userBtn: document.getElementById('userBtn'),
    cartBtn: document.getElementById('cartBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    cartCount: document.getElementById('cartCount'),
    
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    closeBtn: document.getElementById('closeBtn'),
    overlay: document.getElementById('overlay'),
    userName: document.getElementById('userName'),
    sidebarLoginBtn: document.getElementById('sidebarLoginBtn'),
    categoriesList: document.getElementById('categoriesList'),
    adminSection: document.getElementById('adminSection'),
    
    // Productos
    productsGrid: document.getElementById('productsGrid'),
    noProducts: document.getElementById('noProducts'),
    filters: document.querySelectorAll('.filter-btn'),
    
    // Carrito
    cartPanel: document.getElementById('cartPanel'),
    closeCart: document.getElementById('closeCart'),
    cartItems: document.getElementById('cartItems'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartShipping: document.getElementById('cartShipping'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    clearCartBtn: document.getElementById('clearCartBtn'),
    
    // Modales
    loginModal: document.getElementById('loginModal'),
    closeLoginModal: document.getElementById('closeLoginModal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    
    checkoutModal: document.getElementById('checkoutModal'),
    closeCheckoutModal: document.getElementById('closeCheckoutModal'),
    checkoutForm: document.getElementById('checkoutForm'),
    clientProvince: document.getElementById('clientProvince'),
    shippingCostDisplay: document.getElementById('shippingCostDisplay'),
    summaryItems: document.getElementById('summaryItems'),
    summarySubtotal: document.getElementById('summarySubtotal'),
    summaryShipping: document.getElementById('summaryShipping'),
    summaryTotal: document.getElementById('summaryTotal'),
    
    infoModal: document.getElementById('infoModal'),
    closeInfoModal: document.getElementById('closeInfoModal'),
    infoModalTitle: document.getElementById('infoModalTitle'),
    infoModalContent: document.getElementById('infoModalContent'),
    
    // Promociones
    promoBanner: document.getElementById('promoBanner'),
    promoContent: document.getElementById('promoContent'),
    closePromo: document.getElementById('closePromo'),
    
    // Footer
    footerPhone: document.getElementById('footerPhone'),
    footerEmail: document.getElementById('footerEmail'),
    
    // Notificaciones
    notification: document.getElementById('notification')
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar configuración
        await loadConfig();
        
        // Cargar usuario actual
        await loadCurrentUser();
        
        // Cargar productos
        await loadProducts();
        
        // Cargar categorías
        await loadCategories();
        
        // Cargar carrito
        await loadCart();
        
        // Cargar promociones
        await loadPromotions();
        
        // Cargar envíos
        await loadShipping();
        
        // Cargar enlaces sociales
        await loadSocialLinks();
        
        // Inicializar eventos
        initEvents();
        
        // Actualizar UI
        updateUI();
        
        // Verificar si hay promociones activas
        checkActivePromotions();
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
    }
});

// Cargar configuración
async function loadConfig() {
    try {
        const settings = await db.getSettings();
        config.currency = settings.currency || '$';
        config.taxRate = parseFloat(settings.taxPercentage) || 0;
        config.storePhone = settings.storePhone;
        config.storeEmail = settings.storeEmail;
        config.storeName = settings.storeName;
        
        // Actualizar footer
        if (elements.footerPhone) {
            elements.footerPhone.textContent = `Teléfono: ${config.storePhone}`;
        }
        if (elements.footerEmail) {
            elements.footerEmail.textContent = `Email: ${config.storeEmail}`;
        }
        
        // Cargar imagen de fondo
        if (settings.backgroundImage) {
            setBackgroundImage(settings.backgroundImage);
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// Cargar usuario actual
async function loadCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            config.currentUser = JSON.parse(userData);
            updateUserUI();
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

// Cargar productos
async function loadProducts() {
    try {
        const products = await db.getActiveProducts();
        config.products = products;
        renderProducts(products);
    } catch (error) {
        console.error('Error cargando productos:', error);
        showNotification('Error al cargar productos', 'error');
    }
}

// Cargar categorías
async function loadCategories() {
    try {
        const categories = await db.getAll('categories');
        config.categories = categories;
        renderCategories(categories);
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Cargar carrito
async function loadCart() {
    try {
        const userId = config.currentUser?.id || null;
        const cartItems = await db.getUserCart(userId);
        config.cart = cartItems;
        updateCartCount();
        renderCart();
    } catch (error) {
        console.error('Error cargando carrito:', error);
    }
}

// Cargar promociones
async function loadPromotions() {
    try {
        const promotions = await db.getActivePromotions();
        if (promotions.length > 0) {
            const bannerPromo = promotions.find(p => p.type === 'banner');
            if (bannerPromo) {
                showPromoBanner(bannerPromo);
            }
        }
    } catch (error) {
        console.error('Error cargando promociones:', error);
    }
}

// Cargar costos de envío
async function loadShipping() {
    try {
        const shipping = await db.getAll('shipping');
        config.shippingCosts = {};
        shipping.forEach(province => {
            if (province.status === 'active') {
                config.shippingCosts[province.province] = province.cost;
            }
        });
        renderShippingOptions(shipping);
    } catch (error) {
        console.error('Error cargando envíos:', error);
    }
}

// Cargar enlaces sociales
async function loadSocialLinks() {
    try {
        const links = await db.getAll('socialLinks');
        renderSocialLinks(links);
    } catch (error) {
        console.error('Error cargando enlaces sociales:', error);
    }
}

// Renderizar productos
function renderProducts(products) {
    if (!products || products.length === 0) {
        elements.productsGrid.innerHTML = '';
        elements.noProducts.style.display = 'block';
        return;
    }
    
    elements.noProducts.style.display = 'none';
    
    const productsHTML = products.map(product => createProductCard(product)).join('');
    elements.productsGrid.innerHTML = productsHTML;
    
    // Agregar eventos a los botones de agregar al carrito
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = parseInt(e.target.closest('.product-card').dataset.id);
            await addProductToCart(productId);
        });
    });
}

// Crear tarjeta de producto
function createProductCard(product) {
    const rating = product.rating || 0;
    const stars = getStarsHTML(rating);
    const badge = getProductBadge(product);
    
    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${badge}
            <div class="product-image">
                <img src="${product.image || 'assets/images/default-product.jpg'}" 
                     alt="${product.name}" 
                     onerror="this.src='assets/images/default-product.jpg'">
                <div class="product-overlay">
                    <button class="quick-view-btn" data-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-count">(${product.ratingCount || 0})</span>
                </div>
                
                <div class="product-footer">
                    <div>
                        <div class="product-price">${config.currency}${product.price.toFixed(2)}</div>
                        <div class="product-stock ${product.stock <= 3 ? 'low' : ''}">
                            ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                        </div>
                    </div>
                    <button class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.stock > 0 ? 'Agregar' : 'Agotado'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Obtener badge del producto
function getProductBadge(product) {
    if (product.stock === 0) {
        return '<span class="badge sold-out">Agotado</span>';
    } else if (product.stock <= 3) {
        return '<span class="badge low-stock">Casi Agotado</span>';
    } else if (product.status === 'new') {
        return '<span class="badge new">Nuevo</span>';
    } else if (product.status === 'sale') {
        return '<span class="badge sale">Oferta</span>';
    } else if (product.status === 'back') {
        return '<span class="badge back">De Vuelta</span>';
    }
    return '';
}

// Obtener HTML de estrellas
function getStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// Renderizar categorías
function renderCategories(categories) {
    if (!elements.categoriesList) return;
    
    const categoriesHTML = categories.map(category => `
        <li>
            <a href="#" class="nav-link" data-category="${category.name}">
                <i class="${category.icon || 'fas fa-tag'}"></i>
                ${category.name}
            </a>
        </li>
    `).join('');
    
    elements.categoriesList.innerHTML = categoriesHTML;
}

// Renderizar carrito
async function renderCart() {
    if (!config.cart || config.cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        updateCartTotals(0, 0);
        return;
    }
    
    let subtotal = 0;
    const cartItemsHTML = await Promise.all(config.cart.map(async (item) => {
        const product = await db.get('products', item.productId);
        if (!product) return '';
        
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${product.image || 'assets/images/default-product.jpg'}" 
                         alt="${product.name}"
                         onerror="this.src='assets/images/default-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    <div class="cart-item-price">${config.currency}${product.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn minus" data-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }));
    
    elements.cartItems.innerHTML = cartItemsHTML.join('');
    updateCartTotals(subtotal);
    
    // Agregar eventos a los controles del carrito
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = parseInt(e.target.dataset.id);
            const isPlus = e.target.classList.contains('plus');
            await updateCartItemQuantity(itemId, isPlus);
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = parseInt(e.target.closest('button').dataset.id);
            await removeCartItem(itemId);
        });
    });
}

// Actualizar totales del carrito
function updateCartTotals(subtotal, shippingCost = 0) {
    const shipping = shippingCost || 0;
    const total = subtotal + shipping;
    
    elements.cartSubtotal.textContent = `${config.currency}${subtotal.toFixed(2)}`;
    elements.cartShipping.textContent = `${config.currency}${shipping.toFixed(2)}`;
    elements.cartTotal.textContent = `${config.currency}${total.toFixed(2)}`;
}

// Actualizar contador del carrito
function updateCartCount() {
    const count = config.cart.reduce((total, item) => total + item.quantity, 0);
    elements.cartCount.textContent = count;
    elements.cartCount.style.display = count > 0 ? 'flex' : 'none';
}

// Agregar producto al carrito
async function addProductToCart(productId) {
    try {
        const product = await db.get('products', productId);
        if (!product) {
            showNotification('Producto no encontrado', 'error');
            return;
        }
        
        if (product.stock === 0) {
            showNotification('Producto agotado', 'warning');
            return;
        }
        
        const userId = config.currentUser?.id || null;
        const existingItem = config.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                showNotification('No hay suficiente stock disponible', 'warning');
                return;
            }
            existingItem.quantity += 1;
            await db.update('cart', existingItem.id, existingItem);
        } else {
            const newItem = await db.addToCart(productId, 1, userId);
            config.cart.push(newItem);
        }
        
        await loadCart();
        showNotification(`${product.name} agregado al carrito`, 'success');
        
        // Animación del carrito
        elements.cartBtn.classList.add('pulse');
        setTimeout(() => {
            elements.cartBtn.classList.remove('pulse');
        }, 500);
        
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        showNotification('Error al agregar al carrito', 'error');
    }
}

// Actualizar cantidad del item del carrito
async function updateCartItemQuantity(itemId, increase = true) {
    try {
        const item = config.cart.find(i => i.id === itemId);
        if (!item) return;
        
        const product = await db.get('products', item.productId);
        if (!product) return;
        
        let newQuantity = increase ? item.quantity + 1 : item.quantity - 1;
        
        if (newQuantity <= 0) {
            await removeCartItem(itemId);
            return;
        }
        
        if (newQuantity > product.stock) {
            showNotification('No hay suficiente stock disponible', 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        await db.update('cart', itemId, item);
        await loadCart();
        
    } catch (error) {
        console.error('Error actualizando cantidad:', error);
        showNotification('Error al actualizar cantidad', 'error');
    }
}

// Remover item del carrito
async function removeCartItem(itemId) {
    try {
        await db.delete('cart', itemId);
        config.cart = config.cart.filter(item => item.id !== itemId);
        await loadCart();
        showNotification('Producto removido del carrito', 'success');
    } catch (error) {
        console.error('Error removiendo item:', error);
        showNotification('Error al remover producto', 'error');
    }
}

// Renderizar opciones de envío
function renderShippingOptions(shipping) {
    if (!elements.clientProvince) return;
    
    const options = shipping
        .filter(province => province.status === 'active')
        .map(province => `
            <option value="${province.province}" data-cost="${province.cost}">
                ${province.province} (${config.currency}${province.cost.toFixed(2)})
            </option>
        `).join('');
    
    elements.clientProvince.innerHTML = `
        <option value="">Selecciona una provincia</option>
        ${options}
    `;
}

// Renderizar enlaces sociales
function renderSocialLinks(links) {
    const menuLinks = links.filter(link => 
        link.display && link.display.includes('menu')
    );
    
    const footerLinks = links.filter(link => 
        link.display && link.display.includes('footer')
    );
    
    // Agregar al menú
    if (elements.categoriesList) {
        const socialHTML = menuLinks.map(link => `
            <li>
                <a href="${link.url}" class="nav-link" target="_blank">
                    <i class="${link.icon || 'fas fa-share-alt'}"></i>
                    ${link.name || link.platform}
                </a>
            </li>
        `).join('');
        
        elements.categoriesList.insertAdjacentHTML('afterend', socialHTML);
    }
}

// Mostrar banner de promoción
function showPromoBanner(promo) {
    if (!promo || !elements.promoBanner) return;
    
    elements.promoContent.innerHTML = `
        ${promo.image ? `<img src="${promo.image}" alt="${promo.title}" style="max-height: 40px; margin-right: 10px;">` : ''}
        <strong>${promo.title || '¡Promoción!'}</strong>: ${promo.message}
    `;
    
    elements.promoBanner.style.display = 'block';
}

// Establecer imagen de fondo
function setBackgroundImage(imagePath) {
    const bgElement = document.querySelector('body::before');
    if (bgElement) {
        bgElement.style.backgroundImage = `url('${imagePath}')`;
    }
}

// Inicializar eventos
function initEvents() {
    // Menú lateral
    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', () => {
            elements.sidebar.classList.add('active');
            elements.overlay.classList.add('active');
        });
    }
    
    if (elements.closeBtn) {
        elements.closeBtn.addEventListener('click', closeSidebar);
    }
    
    if (elements.overlay) {
        elements.overlay.addEventListener('click', closeSidebar);
    }
    
    // Carrito
    if (elements.cartBtn) {
        elements.cartBtn.addEventListener('click', () => {
            elements.cartPanel.classList.add('active');
            elements.overlay.classList.add('active');
        });
    }
    
    if (elements.closeCart) {
        elements.closeCart.addEventListener('click', closeCart);
    }
    
    // Login
    if (elements.userBtn) {
        elements.userBtn.addEventListener('click', showLoginModal);
    }
    
    if (elements.sidebarLoginBtn) {
        elements.sidebarLoginBtn.addEventListener('click', showLoginModal);
    }
    
    if (elements.closeLoginModal) {
        elements.closeLoginModal.addEventListener('click', closeLoginModal);
    }
    
    // Checkout
    if (elements.checkoutBtn) {
        elements.checkoutBtn.addEventListener('click', showCheckoutModal);
    }
    
    if (elements.closeCheckoutModal) {
        elements.closeCheckoutModal.addEventListener('click', closeCheckoutModal);
    }
    
    if (elements.clearCartBtn) {
        elements.clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Promociones
    if (elements.closePromo) {
        elements.closePromo.addEventListener('click', () => {
            elements.promoBanner.style.display = 'none';
        });
    }
    
    // Filtros
    elements.filters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            const filterValue = e.target.dataset.filter;
            filterProducts(filterValue);
            
            // Actualizar botones activos
            elements.filters.forEach(f => f.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Búsqueda
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', performSearch);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // Navegación por categorías
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link[data-category]')) {
            e.preventDefault();
            const category = e.target.closest('.nav-link').dataset.category;
            filterProductsByCategory(category);
            closeSidebar();
        }
    });
    
    // Cambio de provincia en checkout
    if (elements.clientProvince) {
        elements.clientProvince.addEventListener('change', updateShippingCost);
    }
    
    // Envío de formulario de checkout
    if (elements.checkoutForm) {
        elements.checkoutForm.addEventListener('submit', processCheckout);
    }
    
    // Login y registro
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', processLogin);
    }
    
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', processRegister);
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Información de contacto
    if (document.getElementById('contactInfoBtn')) {
        document.getElementById('contactInfoBtn').addEventListener('click', showContactInfo);
    }
    
    if (document.getElementById('privacyBtn')) {
        document.getElementById('privacyBtn').addEventListener('click', showPrivacyInfo);
    }
    
    if (document.getElementById('socialLinksBtn')) {
        document.getElementById('socialLinksBtn').addEventListener('click', showSocialLinks);
    }
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Funciones de UI
function closeSidebar() {
    elements.sidebar.classList.remove('active');
    elements.overlay.classList.remove('active');
}

function closeCart() {
    elements.cartPanel.classList.remove('active');
    elements.overlay.classList.remove('active');
}

function showLoginModal() {
    elements.loginModal.classList.add('active');
    elements.overlay.classList.add('active');
    switchTab('login');
}

function closeLoginModal() {
    elements.loginModal.classList.remove('active');
    elements.overlay.classList.remove('active');
}

function showCheckoutModal() {
    if (config.cart.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }
    
    renderCheckoutSummary();
    elements.checkoutModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function closeCheckoutModal() {
    elements.checkoutModal.classList.remove('active');
    elements.overlay.classList.remove('active');
}

function closeAllModals() {
    closeLoginModal();
    closeCheckoutModal();
    if (elements.infoModal) {
        elements.infoModal.classList.remove('active');
    }
    elements.overlay.classList.remove('active');
}

function switchTab(tabName) {
    // Actualizar botones de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar contenido del tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}Form`) {
            content.classList.add('active');
        }
    });
}

// Filtrar productos
function filterProducts(filter) {
    let filteredProducts = [...config.products];
    
    switch(filter) {
        case 'new':
            filteredProducts = filteredProducts.filter(p => p.status === 'new');
            break;
        case 'sale':
            filteredProducts = filteredProducts.filter(p => p.status === 'sale');
            break;
        case 'back':
            filteredProducts = filteredProducts.filter(p => p.status === 'back');
            break;
        case 'low':
            filteredProducts = filteredProducts.filter(p => p.stock <= 3 && p.stock > 0);
            break;
    }
    
    renderProducts(filteredProducts);
}

function filterProductsByCategory(category) {
    if (category === 'all') {
        renderProducts(config.products);
        return;
    }
    
    const filteredProducts = config.products.filter(p => p.category === category);
    renderProducts(filteredProducts);
}

// Búsqueda
async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) {
        renderProducts(config.products);
        return;
    }
    
    try {
        const results = await db.searchProducts(query);
        renderProducts(results);
    } catch (error) {
        console.error('Error buscando productos:', error);
        showNotification('Error al buscar productos', 'error');
    }
}

// Actualizar UI
function updateUI() {
    updateUserUI();
    updateCartCount();
}

function updateUserUI() {
    if (!elements.userName) return;
    
    if (config.currentUser) {
        elements.userName.textContent = config.currentUser.name;
        elements.sidebarLoginBtn.textContent = 'Cerrar Sesión';
        elements.sidebarLoginBtn.onclick = logoutUser;
        
        // Mostrar sección de admin si es administrador
        if (config.currentUser.role === 'admin') {
            elements.adminSection.style.display = 'block';
        }
    } else {
        elements.userName.textContent = 'Invitado';
        elements.sidebarLoginBtn.textContent = 'Iniciar Sesión';
        elements.sidebarLoginBtn.onclick = showLoginModal;
        elements.adminSection.style.display = 'none';
    }
}

// Procesar login
async function processLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const user = await db.query('users', 'email', email);
        
        if (!user || user.password !== password) {
            showNotification('Email o contraseña incorrectos', 'error');
            return;
        }
        
        // Actualizar último login
        user.lastLogin = new Date().toISOString();
        await db.update('users', user.id, user);
        
        // Guardar sesión
        config.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentUserId', user.id);
        
        // Migrar carrito de invitado a usuario
        await migrateGuestCart(user.id);
        
        // Actualizar UI
        updateUI();
        await loadCart();
        
        // Cerrar modal y mostrar notificación
        closeLoginModal();
        showNotification(`¡Bienvenido ${user.name}!`, 'success');
        
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('Error al iniciar sesión', 'error');
    }
}

// Procesar registro
async function processRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    // Validaciones
    if (password !== confirm) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        // Verificar si el email ya existe
        const existingUser = await db.query('users', 'email', email);
        if (existingUser) {
            showNotification('Este email ya está registrado', 'error');
            return;
        }
        
        // Crear nuevo usuario
        const newUser = {
            name,
            email,
            password,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        const createdUser = await db.add('users', newUser);
        
        // Guardar sesión
        config.currentUser = createdUser;
        localStorage.setItem('currentUser', JSON.stringify(createdUser));
        localStorage.setItem('currentUserId', createdUser.id);
        
        // Migrar carrito de invitado a usuario
        await migrateGuestCart(createdUser.id);
        
        // Actualizar UI
        updateUI();
        await loadCart();
        
        // Cerrar modal y mostrar notificación
        closeLoginModal();
        showNotification('¡Cuenta creada exitosamente!', 'success');
        
    } catch (error) {
        console.error('Error en registro:', error);
        showNotification('Error al crear la cuenta', 'error');
    }
}

// Migrar carrito de invitado a usuario
async function migrateGuestCart(userId) {
    try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) return;
        
        const guestCart = await db.queryAll('cart', 'sessionId', sessionId);
        
        for (const item of guestCart) {
            // Verificar si el usuario ya tiene este producto en el carrito
            const existing = await db.queryAll('cart', 'userId', userId)
                .then(items => items.find(i => i.productId === item.productId));
            
            if (existing) {
                // Combinar cantidades
                existing.quantity += item.quantity;
                await db.update('cart', existing.id, existing);
                await db.delete('cart', item.id);
            } else {
                // Transferir item al usuario
                item.userId = userId;
                item.sessionId = null;
                await db.update('cart', item.id, item);
            }
        }
        
        localStorage.removeItem('sessionId');
        
    } catch (error) {
        console.error('Error migrando carrito:', error);
    }
}

// Cerrar sesión
async function logoutUser() {
    config.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    
    // Generar nueva sesión para invitado
    const sessionId = db.generateSessionId();
    localStorage.setItem('sessionId', sessionId);
    
    // Actualizar UI y recargar carrito
    updateUI();
    await loadCart();
    
    closeSidebar();
    showNotification('Sesión cerrada correctamente', 'success');
}

// Limpiar carrito
async function clearCart() {
    try {
        const userId = config.currentUser?.id || null;
        const sessionId = userId ? null : localStorage.getItem('sessionId');
        
        await db.clearCart(userId, sessionId);
        config.cart = [];
        
        await loadCart();
        closeCart();
        showNotification('Carrito vaciado', 'success');
        
    } catch (error) {
        console.error('Error vaciando carrito:', error);
        showNotification('Error al vaciar el carrito', 'error');
    }
}

// Renderizar resumen de checkout
async function renderCheckoutSummary() {
    let subtotal = 0;
    const itemsHTML = await Promise.all(config.cart.map(async (item) => {
        const product = await db.get('products', item.productId);
        if (!product) return '';
        
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="summary-item">
                <span>${product.name} x${item.quantity}</span>
                <span>${config.currency}${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }));
    
    elements.summaryItems.innerHTML = itemsHTML.join('');
    elements.summarySubtotal.textContent = `${config.currency}${subtotal.toFixed(2)}`;
    
    // Actualizar costo de envío si ya hay una provincia seleccionada
    const selectedProvince = elements.clientProvince.value;
    if (selectedProvince) {
        updateShippingCost();
    }
}

// Actualizar costo de envío
function updateShippingCost() {
    const selectedOption = elements.clientProvince.selectedOptions[0];
    if (!selectedOption || !selectedOption.value) {
        elements.shippingCostDisplay.textContent = 'Costo de envío: $0.00';
        elements.summaryShipping.textContent = `${config.currency}0.00`;
        elements.summaryTotal.textContent = `${config.currency}${calculateTotal()}`;
        return;
    }
    
    const cost = parseFloat(selectedOption.dataset.cost) || 0;
    elements.shippingCostDisplay.textContent = `Costo de envío: ${config.currency}${cost.toFixed(2)}`;
    elements.summaryShipping.textContent = `${config.currency}${cost.toFixed(2)}`;
    elements.summaryTotal.textContent = `${config.currency}${calculateTotal(cost)}`;
}

// Calcular total
function calculateTotal(shippingCost = 0) {
    const subtotal = config.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    return (subtotal + shippingCost).toFixed(2);
}

// Procesar checkout
async function processCheckout(e) {
    e.preventDefault();
    
    // Validaciones básicas
    const phone = document.getElementById('clientPhone').value;
    const address = document.getElementById('clientAddress').value;
    const province = elements.clientProvince.value;
    
    if (!phone || !address || !province) {
        showNotification('Por favor completa todos los campos requeridos', 'warning');
        return;
    }
    
    try {
        // Obtener información del pedido
        const orderItems = await Promise.all(config.cart.map(async (item) => {
            const product = await db.get('products', item.productId);
            return {
                productId: item.productId,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                total: product.price * item.quantity
            };
        }));
        
        const subtotal = orderItems.reduce((total, item) => total + item.total, 0);
        const shippingCost = parseFloat(elements.clientProvince.selectedOptions[0].dataset.cost) || 0;
        const total = subtotal + shippingCost;
        
        // Crear objeto de orden
        const orderData = {
            userId: config.currentUser?.id || null,
            customerName: document.getElementById('clientName').value || 'Cliente anónimo',
            customerPhone: phone,
            customerAddress: address,
            customerProvince: province,
            paymentMethod: document.querySelector('input[name="payment"]:checked').value,
            items: orderItems,
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
            notes: document.getElementById('clientNotes')?.value || ''
        };
        
        // Crear orden en la base de datos
        const order = await db.createOrder(orderData);
        
        // Enviar pedido por WhatsApp
        await sendOrderToWhatsApp(orderData);
        
        // Mostrar confirmación
        closeCheckoutModal();
        showNotification('¡Pedido realizado con éxito!', 'success');
        
        // Limpiar formulario
        e.target.reset();
        
        // Redirigir o mostrar resumen
        setTimeout(() => {
            showNotification('Se ha enviado tu pedido al vendedor por WhatsApp', 'info');
        }, 1000);
        
    } catch (error) {
        console.error('Error procesando pedido:', error);
        showNotification('Error al procesar el pedido', 'error');
    }
}

// Enviar pedido por WhatsApp
async function sendOrderToWhatsApp(orderData) {
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
            message += `• ${item.name} x${item.quantity} - ${config.currency}${item.total.toFixed(2)}\n`;
        });
        
        message += `\nSubtotal: ${config.currency}${orderData.subtotal.toFixed(2)}`;
        message += `\nEnvío: ${config.currency}${orderData.shippingCost.toFixed(2)}`;
        message += `\nTotal: ${config.currency}${orderData.total.toFixed(2)}`;
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
}

// Mostrar información de contacto
async function showContactInfo(e) {
    if (e) e.preventDefault();
    
    const settings = await db.getSettings();
    
    elements.infoModalTitle.textContent = 'Información de Contacto';
    elements.infoModalContent.innerHTML = `
        <div class="contact-info">
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <div>
                    <h4>Teléfono / WhatsApp</h4>
                    <p>${settings.storePhone || 'No configurado'}</p>
                </div>
            </div>
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <div>
                    <h4>Email</h4>
                    <p>${settings.storeEmail || 'No configurado'}</p>
                </div>
            </div>
            ${settings.storeAddress ? `
            <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <h4>Dirección</h4>
                    <p>${settings.storeAddress}</p>
                </div>
            </div>
            ` : ''}
            <div class="contact-item">
                <i class="fas fa-clock"></i>
                <div>
                    <h4>Horario de Atención</h4>
                    <p>Lunes a Viernes: 9:00 AM - 7:00 PM</p>
                    <p>Sábados: 10:00 AM - 5:00 PM</p>
                </div>
            </div>
        </div>
    `;
    
    elements.infoModal.classList.add('active');
    elements.overlay.classList.add('active');
}

// Mostrar política de privacidad
function showPrivacyInfo(e) {
    if (e) e.preventDefault();
    
    elements.infoModalTitle.textContent = 'Política de Privacidad';
    elements.infoModalContent.innerHTML = `
        <div class="privacy-policy">
            <h3>Protección de Datos Personales</h3>
            <p>En Sensual Shop respetamos tu privacidad y nos comprometemos a proteger tus datos personales.</p>
            
            <h4>Información que recopilamos:</h4>
            <ul>
                <li>Nombre y datos de contacto</li>
                <li>Dirección de envío</li>
                <li>Información de pedidos</li>
                <li>Preferencias de compra (opcional)</li>
            </ul>
            
            <h4>Uso de la información:</h4>
            <ul>
                <li>Procesar tus pedidos</li>
                <li>Gestionar envíos</li>
                <li>Mejorar nuestros servicios</li>
                <li>Enviar promociones (solo con tu consentimiento)</li>
            </ul>
            
            <h4>Seguridad:</h4>
            <p>Tus datos están protegidos con medidas de seguridad adecuadas y solo se comparten con proveedores necesarios para el envío.</p>
            
            <h4>Tus derechos:</h4>
            <p>Tienes derecho a acceder, rectificar y eliminar tus datos personales. Contacta con nosotros para ejercer estos derechos.</p>
            
            <p class="policy-date">Última actualización: ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    elements.infoModal.classList.add('active');
    elements.overlay.classList.add('active');
}

// Mostrar enlaces sociales
async function showSocialLinks(e) {
    if (e) e.preventDefault();
    
    try {
        const links = await db.getAll('socialLinks');
        const contactLinks = links.filter(link => 
            link.display && link.display.includes('contact')
        );
        
        elements.infoModalTitle.textContent = 'Nuestras Redes Sociales';
        
        if (contactLinks.length === 0) {
            elements.infoModalContent.innerHTML = `
                <div class="no-social-links">
                    <i class="fas fa-share-alt"></i>
                    <p>No hay enlaces sociales configurados</p>
                </div>
            `;
        } else {
            const linksHTML = contactLinks.map(link => `
                <a href="${link.url}" class="social-link-card" target="_blank">
                    <div class="social-icon">
                        <i class="${link.icon || 'fas fa-share-alt'}"></i>
                    </div>
                    <div class="social-info">
                        <h4>${link.name || link.platform}</h4>
                        <p>${link.url}</p>
                    </div>
                    <i class="fas fa-external-link-alt"></i>
                </a>
            `).join('');
            
            elements.infoModalContent.innerHTML = `
                <div class="social-links-modal">
                    ${linksHTML}
                </div>
            `;
        }
        
        elements.infoModal.classList.add('active');
        elements.overlay.classList.add('active');
        
    } catch (error) {
        console.error('Error cargando enlaces sociales:', error);
        showNotification('Error al cargar enlaces sociales', 'error');
    }
}

// Verificar promociones activas
function checkActivePromotions() {
    // Verificar si hay promociones guardadas localmente
    const savedPromo = localStorage.getItem('currentPromo');
    if (savedPromo) {
        const promo = JSON.parse(savedPromo);
        const now = new Date();
        const endDate = new Date(promo.endDate);
        
        if (now <= endDate) {
            showPromoBanner(promo);
        } else {
            localStorage.removeItem('currentPromo');
        }
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = elements.notification;
    
    notification.textContent = message;
    notification.className = 'notification show';
    
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
            notification.style.background = 'linear-gradient(135deg, var(--primary-color), var(--accent-color))';
    }
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Verificar si el usuario es administrador
function isAdmin() {
    return config.currentUser && config.currentUser.role === 'admin';
}

// Cargar productos con filtros
async function loadProductsWithFilters(filters = {}) {
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
        
        if (filters.minPrice !== undefined) {
            products = products.filter(p => p.price >= filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
            products = products.filter(p => p.price <= filters.maxPrice);
        }
        
        if (filters.featured !== undefined) {
            products = products.filter(p => p.featured === filters.featured);
        }
        
        config.products = products;
        renderProducts(products);
        
    } catch (error) {
        console.error('Error cargando productos con filtros:', error);
        showNotification('Error al cargar productos', 'error');
    }
}

// Actualizar vista cuando hay cambios en la base de datos
function setupDatabaseListeners() {
    // Esta función se llamaría cuando hay cambios en IndexedDB
    // En una implementación real, usaríamos eventos o polling
    
    // Por ahora, recargamos periódicamente
    setInterval(async () => {
        try {
            await loadProducts();
            await loadCart();
        } catch (error) {
            console.error('Error en actualización periódica:', error);
        }
    }, 30000); // Cada 30 segundos
}

// Iniciar listeners de la base de datos
setupDatabaseListeners();

// Exportar funciones para uso global
window.closeSidebar = closeSidebar;
window.closeCart = closeCart;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showNotification = showNotification;
window.isAdmin = isAdmin;