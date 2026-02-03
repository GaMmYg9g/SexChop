// Módulo de gestión de productos
const products = {
    allProducts: [],
    filteredProducts: [],
    currentCategory: 'all',
    currentFilter: 'all',
    searchQuery: '',
    
    // Inicializar productos
    async init() {
        await this.loadProducts();
        await this.loadCategories();
        this.setupProductListeners();
        this.renderProducts();
        this.renderCategories();
    },
    
    // Cargar productos desde IndexedDB
    async loadProducts() {
        try {
            this.allProducts = await db.getActiveProducts();
            this.filteredProducts = [...this.allProducts];
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.allProducts = [];
            this.filteredProducts = [];
        }
    },
    
    // Cargar categorías
    async loadCategories() {
        try {
            this.categories = await db.getAll('categories');
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.categories = [];
        }
    },
    
    // Configurar listeners de productos
    setupProductListeners() {
        // Filtros
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
            });
        });
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.applySearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applySearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.applySearch());
        }
        
        // Categorías en el menú
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link[data-category]')) {
                e.preventDefault();
                const category = e.target.closest('.nav-link').dataset.category;
                this.applyCategoryFilter(category);
            }
        });
        
        // Vista rápida
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-view-btn')) {
                e.preventDefault();
                const productId = parseInt(e.target.closest('.quick-view-btn').dataset.id);
                this.showQuickView(productId);
            }
        });
    },
    
    // Aplicar filtro
    applyFilter(filter) {
        this.currentFilter = filter;
        this.updateFilteredProducts();
        this.renderProducts();
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
    },
    
    // Aplicar filtro por categoría
    applyCategoryFilter(category) {
        this.currentCategory = category;
        this.updateFilteredProducts();
        this.renderProducts();
    },
    
    // Aplicar búsqueda
    applySearch() {
        this.updateFilteredProducts();
        this.renderProducts();
    },
    
    // Actualizar productos filtrados
    updateFilteredProducts() {
        let filtered = [...this.allProducts];
        
        // Filtrar por categoría
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(product => 
                product.category === this.currentCategory
            );
        }
        
        // Filtrar por tipo
        if (this.currentFilter !== 'all') {
            switch(this.currentFilter) {
                case 'new':
                    filtered = filtered.filter(product => product.status === 'new');
                    break;
                case 'sale':
                    filtered = filtered.filter(product => product.status === 'sale');
                    break;
                case 'low':
                    filtered = filtered.filter(product => 
                        product.stock <= 3 && product.stock > 0
                    );
                    break;
                case 'back':
                    filtered = filtered.filter(product => product.status === 'back');
                    break;
            }
        }
        
        // Filtrar por búsqueda
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.tags?.toLowerCase().includes(query)
            );
        }
        
        this.filteredProducts = filtered;
    },
    
    // Renderizar productos
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (!productsGrid) return;
        
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = '';
            if (noProducts) {
                noProducts.style.display = 'block';
            }
            return;
        }
        
        if (noProducts) {
            noProducts.style.display = 'none';
        }
        
        const productsHTML = this.filteredProducts.map(product => 
            this.createProductCard(product)
        ).join('');
        
        productsGrid.innerHTML = productsHTML;
        
        // Agregar eventos a los botones de agregar al carrito
        this.setupAddToCartButtons();
    },
    
    // Crear tarjeta de producto
    createProductCard(product) {
        const rating = product.averageRating || product.rating || 0;
        const stars = this.getStarsHTML(rating);
        const badge = this.getProductBadge(product);
        const isOutOfStock = product.stock === 0;
        
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
                            <div class="product-price">$${product.price.toFixed(2)}</div>
                            <div class="product-stock ${product.stock <= 3 ? 'low' : ''}">
                                ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                            </div>
                        </div>
                        <button class="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''} data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i>
                            ${isOutOfStock ? 'Agotado' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Obtener badge del producto
    getProductBadge(product) {
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
    },
    
    // Obtener HTML de estrellas
    getStarsHTML(rating) {
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
    },
    
    // Renderizar categorías en el menú
    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList || !this.categories) return;
        
        const categoriesHTML = this.categories.map(category => `
            <li>
                <a href="#" class="nav-link" data-category="${category.name}">
                    <i class="${category.icon || 'fas fa-tag'}"></i>
                    ${category.name}
                </a>
            </li>
        `).join('');
        
        categoriesList.innerHTML = categoriesHTML;
    },
    
    // Configurar botones de agregar al carrito
    setupAddToCartButtons() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = parseInt(e.target.closest('button').dataset.id);
                await this.addToCart(productId);
            });
        });
    },
    
    // Agregar producto al carrito
    async addToCart(productId) {
        try {
            const success = await CartAPI.addProduct(productId);
            if (success) {
                this.showProductAddedAnimation(productId);
            }
        } catch (error) {
            console.error('Error agregando al carrito:', error);
        }
    },
    
    // Mostrar animación de producto agregado
    showProductAddedAnimation(productId) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;
        
        const addButton = productCard.querySelector('.add-to-cart-btn');
        if (!addButton) return;
        
        // Animación temporal
        addButton.innerHTML = '<i class="fas fa-check"></i> Agregado';
        addButton.classList.add('added');
        
        setTimeout(() => {
            addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar';
            addButton.classList.remove('added');
        }, 2000);
    },
    
    // Mostrar vista rápida del producto
    async showQuickView(productId) {
        try {
            const product = await db.get('products', productId);
            if (!product) return;
            
            const rating = await db.getProductAverageRating(productId);
            const stars = this.getStarsHTML(rating);
            
            const modalHTML = `
                <div class="quick-view-modal">
                    <div class="quick-view-content">
                        <button class="close-quick-view"><i class="fas fa-times"></i></button>
                        
                        <div class="quick-view-grid">
                            <div class="quick-view-image">
                                <img src="${product.image || 'assets/images/default-product.jpg'}" 
                                     alt="${product.name}"
                                     onerror="this.src='assets/images/default-product.jpg'">
                            </div>
                            
                            <div class="quick-view-details">
                                <div class="product-category">${product.category}</div>
                                <h2>${product.name}</h2>
                                
                                <div class="product-rating large">
                                    <div class="stars">${stars}</div>
                                    <span class="rating-count">(${product.ratingCount || 0} calificaciones)</span>
                                </div>
                                
                                <div class="product-price large">$${product.price.toFixed(2)}</div>
                                
                                <div class="product-stock ${product.stock <= 3 ? 'low' : ''}">
                                    <i class="fas fa-box"></i>
                                    ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                                </div>
                                
                                <div class="product-description full">
                                    ${product.description}
                                </div>
                                
                                ${product.tags ? `
                                <div class="product-tags">
                                    <strong>Etiquetas:</strong>
                                    ${product.tags.split(',').map(tag => 
                                        `<span class="tag">${tag.trim()}</span>`
                                    ).join('')}
                                </div>
                                ` : ''}
                                
                                <div class="quick-view-actions">
                                    <button class="add-to-cart-btn large" ${product.stock === 0 ? 'disabled' : ''} 
                                            data-id="${product.id}">
                                        <i class="fas fa-cart-plus"></i>
                                        ${product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                                    </button>
                                    
                                    <button class="btn-outline share-product" data-id="${product.id}">
                                        <i class="fas fa-share-alt"></i> Compartir
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        ${this.showProductReviews(productId)}
                    </div>
                </div>
            `;
            
            // Crear y mostrar modal
            const modalContainer = document.createElement('div');
            modalContainer.id = 'quickViewModal';
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Configurar eventos
            this.setupQuickViewEvents(productId);
            
        } catch (error) {
            console.error('Error mostrando vista rápida:', error);
        }
    },
    
    // Mostrar reseñas del producto
    async showProductReviews(productId) {
        try {
            const ratings = await db.queryAll('ratings', 'productId', productId);
            if (ratings.length === 0) return '';
            
            const reviewsHTML = ratings.map(rating => `
                <div class="product-review">
                    <div class="review-header">
                        <div class="review-stars">
                            ${this.getStarsHTML(rating.rating)}
                        </div>
                        <div class="review-date">${this.formatDate(rating.createdAt)}</div>
                    </div>
                    ${rating.comment ? `
                    <div class="review-comment">
                        ${rating.comment}
                    </div>
                    ` : ''}
                </div>
            `).join('');
            
            return `
                <div class="product-reviews">
                    <h3>Reseñas (${ratings.length})</h3>
                    <div class="reviews-list">
                        ${reviewsHTML}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando reseñas:', error);
            return '';
        }
    },
    
    // Configurar eventos de vista rápida
    setupQuickViewEvents(productId) {
        const modal = document.getElementById('quickViewModal');
        const closeBtn = modal.querySelector('.close-quick-view');
        const addToCartBtn = modal.querySelector('.add-to-cart-btn');
        const shareBtn = modal.querySelector('.share-product');
        
        // Cerrar modal
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal) {
                modal.remove();
            }
        });
        
        // Agregar al carrito
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', async () => {
                await this.addToCart(productId);
                modal.remove();
            });
        }
        
        // Compartir producto
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareProduct(productId);
            });
        }
    },
    
    // Compartir producto
    async shareProduct(productId) {
        try {
            const product = await db.get('products', productId);
            if (!product) return;
            
            const shareData = {
                title: product.name,
                text: `Mira este producto: ${product.name} - $${product.price.toFixed(2)}`,
                url: window.location.href + `?product=${productId}`
            };
            
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback para navegadores que no soportan Web Share API
                const textArea = document.createElement('textarea');
                textArea.value = `${shareData.text}\n${shareData.url}`;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showNotification('Enlace copiado al portapapeles', 'success');
            }
        } catch (error) {
            console.error('Error compartiendo producto:', error);
        }
    },
    
    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Usar la función de notificación global si existe
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    // Obtener productos por categoría
    getProductsByCategory(category) {
        return this.allProducts.filter(product => product.category === category);
    },
    
    // Obtener productos destacados
    getFeaturedProducts() {
        return this.allProducts.filter(product => product.featured);
    },
    
    // Obtener nuevos productos
    getNewProducts() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return this.allProducts.filter(product => {
            const created = new Date(product.createdAt);
            return created > oneWeekAgo;
        });
    },
    
    // Obtener productos con stock bajo
    getLowStockProducts() {
        return this.allProducts.filter(product => 
            product.stock <= 3 && product.stock > 0
        );
    },
    
    // Obtener productos agotados
    getOutOfStockProducts() {
        return this.allProducts.filter(product => product.stock === 0);
    },
    
    // Obtener productos de vuelta en stock
    getBackInStockProducts() {
        return this.allProducts.filter(product => product.status === 'back');
    },
    
    // Buscar productos
    searchProducts(query) {
        const searchTerm = query.toLowerCase();
        return this.allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.tags?.toLowerCase().includes(searchTerm)
        );
    },
    
    // Ordenar productos
    sortProducts(products, sortBy = 'name', order = 'asc') {
        const sorted = [...products];
        
        sorted.sort((a, b) => {
            let comparison = 0;
            
            switch(sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'stock':
                    comparison = a.stock - b.stock;
                    break;
                case 'rating':
                    comparison = (a.averageRating || 0) - (b.averageRating || 0);
                    break;
                case 'date':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
            }
            
            return order === 'asc' ? comparison : -comparison;
        });
        
        return sorted;
    },
    
    // Actualizar producto
    async updateProduct(productId, updates) {
        try {
            const product = await db.get('products', productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            
            const updatedProduct = { ...product, ...updates };
            await db.update('products', productId, updatedProduct);
            
            // Recargar productos
            await this.loadProducts();
            this.updateFilteredProducts();
            this.renderProducts();
            
            return updatedProduct;
            
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    },
    
    // Calificar producto
    async rateProduct(productId, rating, comment = '', userId = null) {
        try {
            if (!userId) {
                const user = auth.getUser();
                if (!user) {
                    throw new Error('Debes iniciar sesión para calificar productos');
                }
                userId = user.id;
            }
            
            if (rating < 1 || rating > 10) {
                throw new Error('La calificación debe estar entre 1 y 10');
            }
            
            // Convertir rating de 1-10 a 1-5 estrellas
            const starRating = rating / 2;
            
            await db.addProductRating(productId, userId, starRating, comment);
            
            // Actualizar rating promedio del producto
            const averageRating = await db.getProductAverageRating(productId);
            await this.updateProduct(productId, { 
                averageRating,
                ratingCount: await db.queryAll('ratings', 'productId', productId).then(r => r.length)
            });
            
            return true;
            
        } catch (error) {
            console.error('Error calificando producto:', error);
            throw error;
        }
    },
    
    // Obtener productos relacionados
    async getRelatedProducts(productId, limit = 4) {
        try {
            const product = await db.get('products', productId);
            if (!product) return [];
            
            const related = this.allProducts.filter(p => 
                p.id !== productId && 
                (p.category === product.category || 
                 p.tags?.split(',').some(tag => 
                    product.tags?.split(',').includes(tag.trim())
                 ))
            );
            
            return related.slice(0, limit);
            
        } catch (error) {
            console.error('Error obteniendo productos relacionados:', error);
            return [];
        }
    },
    
    // Generar slug para producto
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    },
    
    // Validar datos del producto
    validateProductData(productData) {
        const errors = [];
        
        if (!productData.name || productData.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres');
        }
        
        if (!productData.category) {
            errors.push('La categoría es requerida');
        }
        
        if (!productData.price || productData.price <= 0) {
            errors.push('El precio debe ser mayor a 0');
        }
        
        if (productData.stock === undefined || productData.stock < 0) {
            errors.push('El stock no puede ser negativo');
        }
        
        return errors;
    },
    
    // Crear producto
    async createProduct(productData) {
        try {
            // Validar datos
            const errors = this.validateProductData(productData);
            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }
            
            // Crear slug
            const slug = this.generateSlug(productData.name);
            
            // Preparar datos del producto
            const newProduct = {
                ...productData,
                slug,
                averageRating: 0,
                ratingCount: 0,
                soldCount: 0,
                featured: productData.featured || false,
                status: productData.status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Guardar en la base de datos
            const createdProduct = await db.add('products', newProduct);
            
            // Recargar productos
            await this.loadProducts();
            this.updateFilteredProducts();
            this.renderProducts();
            
            return createdProduct;
            
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    },
    
    // Eliminar producto
    async deleteProduct(productId) {
        try {
            // Verificar si el producto tiene ventas
            const product = await db.get('products', productId);
            if (product.soldCount > 0) {
                throw new Error('No se puede eliminar un producto con ventas registradas');
            }
            
            // Eliminar producto
            await db.delete('products', productId);
            
            // Eliminar ratings asociados
            const ratings = await db.queryAll('ratings', 'productId', productId);
            for (const rating of ratings) {
                await db.delete('ratings', rating.id);
            }
            
            // Recargar productos
            await this.loadProducts();
            this.updateFilteredProducts();
            this.renderProducts();
            
            return true;
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }
};

// Inicializar productos
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await products.init();
    } catch (error) {
        console.error('Error inicializando productos:', error);
    }
});

// Exportar para uso global
window.products = products;

// API de productos para otros módulos
window.ProductsAPI = {
    loadProducts: products.loadProducts.bind(products),
    getProductsByCategory: products.getProductsByCategory.bind(products),
    getFeaturedProducts: products.getFeaturedProducts.bind(products),
    getNewProducts: products.getNewProducts.bind(products),
    searchProducts: products.searchProducts.bind(products),
    sortProducts: products.sortProducts.bind(products),
    updateProduct: products.updateProduct.bind(products),
    rateProduct: products.rateProduct.bind(products),
    createProduct: products.createProduct.bind(products),
    deleteProduct: products.deleteProduct.bind(products),
    getRelatedProducts: products.getRelatedProducts.bind(products)
};