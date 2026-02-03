// Módulo de autenticación
const auth = {
    currentUser: null,
    isAdmin: false,
    
    // Inicializar autenticación
    async init() {
        await this.loadSession();
        this.setupAuthListeners();
    },
    
    // Cargar sesión del usuario
    async loadSession() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.isAdmin = this.currentUser.role === 'admin';
                
                // Verificar si el usuario aún existe en la base de datos
                const userExists = await db.get('users', this.currentUser.id);
                if (!userExists) {
                    this.logout();
                    return;
                }
                
                // Actualizar último acceso
                this.updateLastAccess();
            }
        } catch (error) {
            console.error('Error cargando sesión:', error);
            this.logout();
        }
    },
    
    // Guardar sesión
    saveSession(user) {
        this.currentUser = user;
        this.isAdmin = user.role === 'admin';
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentUserId', user.id);
    },
    
    // Actualizar último acceso
    async updateLastAccess() {
        if (!this.currentUser) return;
        
        try {
            this.currentUser.lastLogin = new Date().toISOString();
            await db.update('users', this.currentUser.id, this.currentUser);
            this.saveSession(this.currentUser);
        } catch (error) {
            console.error('Error actualizando último acceso:', error);
        }
    },
    
    // Login
    async login(email, password) {
        try {
            const user = await db.query('users', 'email', email);
            
            if (!user || user.password !== password) {
                throw new Error('Credenciales incorrectas');
            }
            
            // Actualizar último login
            user.lastLogin = new Date().toISOString();
            await db.update('users', user.id, user);
            
            // Guardar sesión
            this.saveSession(user);
            
            // Migrar carrito de invitado si existe
            await this.migrateGuestCart(user.id);
            
            return user;
            
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    },
    
    // Registro
    async register(userData) {
        try {
            // Verificar si el email ya existe
            const existingUser = await db.query('users', 'email', userData.email);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            // Crear nuevo usuario
            const newUser = {
                ...userData,
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            const createdUser = await db.add('users', newUser);
            
            // Guardar sesión
            this.saveSession(createdUser);
            
            // Migrar carrito de invitado si existe
            await this.migrateGuestCart(createdUser.id);
            
            return createdUser;
            
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    },
    
    // Logout
    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserId');
        
        // Generar nueva sesión para invitado
        const sessionId = generateSessionId();
        localStorage.setItem('sessionId', sessionId);
    },
    
    // Migrar carrito de invitado
    async migrateGuestCart(userId) {
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
    },
    
    // Verificar autenticación
    isAuthenticated() {
        return this.currentUser !== null;
    },
    
    // Obtener usuario actual
    getUser() {
        return this.currentUser;
    },
    
    // Actualizar perfil
    async updateProfile(userData) {
        if (!this.currentUser) {
            throw new Error('No hay usuario autenticado');
        }
        
        try {
            const updatedUser = {
                ...this.currentUser,
                ...userData,
                updatedAt: new Date().toISOString()
            };
            
            await db.update('users', this.currentUser.id, updatedUser);
            this.saveSession(updatedUser);
            
            return updatedUser;
            
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            throw error;
        }
    },
    
    // Cambiar contraseña
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('No hay usuario autenticado');
        }
        
        try {
            // Verificar contraseña actual
            const user = await db.get('users', this.currentUser.id);
            if (user.password !== currentPassword) {
                throw new Error('Contraseña actual incorrecta');
            }
            
            // Actualizar contraseña
            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            
            await db.update('users', this.currentUser.id, user);
            this.saveSession(user);
            
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            throw error;
        }
    },
    
    // Recuperar contraseña (simulado)
    async recoverPassword(email) {
        try {
            const user = await db.query('users', 'email', email);
            if (!user) {
                throw new Error('No existe una cuenta con ese email');
            }
            
            // En un caso real, aquí se enviaría un email con un enlace de recuperación
            // Por ahora, solo simulamos el proceso
            console.log(`Enlace de recuperación enviado a: ${email}`);
            
            return true;
            
        } catch (error) {
            console.error('Error recuperando contraseña:', error);
            throw error;
        }
    },
    
    // Configurar listeners de autenticación
    setupAuthListeners() {
        // Verificar autenticación en cada carga de página
        document.addEventListener('DOMContentLoaded', () => {
            this.updateAuthUI();
        });
        
        // Escuchar cambios en el almacenamiento local (para múltiples pestañas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                this.loadSession();
                this.updateAuthUI();
            }
        });
    },
    
    // Actualizar UI según estado de autenticación
    updateAuthUI() {
        const userElements = document.querySelectorAll('[data-auth]');
        
        userElements.forEach(element => {
            const authType = element.dataset.auth;
            
            switch(authType) {
                case 'show-if-authenticated':
                    element.style.display = this.isAuthenticated() ? '' : 'none';
                    break;
                    
                case 'show-if-not-authenticated':
                    element.style.display = this.isAuthenticated() ? 'none' : '';
                    break;
                    
                case 'show-if-admin':
                    element.style.display = this.isAdmin ? '' : 'none';
                    break;
                    
                case 'user-name':
                    if (this.isAuthenticated()) {
                        element.textContent = this.currentUser.name;
                    }
                    break;
                    
                case 'user-email':
                    if (this.isAuthenticated()) {
                        element.textContent = this.currentUser.email;
                    }
                    break;
                    
                case 'user-role':
                    if (this.isAuthenticated()) {
                        element.textContent = this.currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
                    }
                    break;
            }
        });
        
        // Actualizar enlaces de login/logout
        const loginButtons = document.querySelectorAll('[data-action="login"]');
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        
        if (this.isAuthenticated()) {
            loginButtons.forEach(btn => btn.style.display = 'none');
            logoutButtons.forEach(btn => btn.style.display = '');
        } else {
            loginButtons.forEach(btn => btn.style.display = '');
            logoutButtons.forEach(btn => btn.style.display = 'none');
        }
    },
    
    // Verificar permisos
    hasPermission(permission) {
        if (!this.isAuthenticated()) return false;
        
        const permissions = {
            'user': ['view_products', 'add_to_cart', 'place_orders', 'rate_products'],
            'admin': ['view_products', 'add_to_cart', 'place_orders', 'rate_products', 
                     'manage_products', 'manage_orders', 'manage_users', 'manage_settings']
        };
        
        const userPermissions = permissions[this.currentUser.role] || permissions.user;
        return userPermissions.includes(permission);
    },
    
    // Middleware para proteger rutas
    requireAuth(redirectUrl = 'login.html') {
        return (req, res, next) => {
            if (!this.isAuthenticated()) {
                window.location.href = redirectUrl;
                return;
            }
            next();
        };
    },
    
    // Middleware para requerir rol de admin
    requireAdmin(redirectUrl = 'index.html') {
        return (req, res, next) => {
            if (!this.isAdmin) {
                window.location.href = redirectUrl;
                return;
            }
            next();
        };
    }
};

// Funciones auxiliares
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Validaciones
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateUserData(userData) {
    const errors = [];
    
    if (!userData.name || userData.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!validateEmail(userData.email)) {
        errors.push('El email no es válido');
    }
    
    if (!validatePassword(userData.password)) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return errors;
}

// Inicializar módulo de autenticación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await auth.init();
    } catch (error) {
        console.error('Error inicializando autenticación:', error);
    }
});

// Exportar para uso global
window.auth = auth;

// API de autenticación para otros módulos
window.AuthAPI = {
    login: auth.login.bind(auth),
    register: auth.register.bind(auth),
    logout: auth.logout.bind(auth),
    isAuthenticated: auth.isAuthenticated.bind(auth),
    getUser: auth.getUser.bind(auth),
    hasPermission: auth.hasPermission.bind(auth),
    updateProfile: auth.updateProfile.bind(auth),
    changePassword: auth.changePassword.bind(auth),
    recoverPassword: auth.recoverPassword.bind(auth)
};