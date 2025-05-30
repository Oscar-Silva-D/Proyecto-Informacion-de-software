// Variables globales
let menuData = [];
let categories = [];

// Función para cargar los datos del menú desde la API
async function loadMenuData() {
    try {
        const response = await fetch('http://localhost:3000/api/menu');
        const data = await response.json();
        
        // Procesar los datos
        menuData = data;
        
        // Extraer categorías únicas usando un objeto temporal
        const categoryMap = {};
        data.forEach(item => {
            if (!categoryMap[item.category_id]) {
                categoryMap[item.category_id] = {
                    id: item.category_id,
                    name: item.category_name
                };
            }
        });
        categories = Object.values(categoryMap);
        
        // Ordenar categorías por ID
        categories.sort((a, b) => a.id - b.id);
        
        // Generar la interfaz
        generateCategoryNav();
        generateProductCards();
    } catch (error) {
        console.error('Error loading menu data:', error);
    }
}

// Function to generate category navigation
function generateCategoryNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    nav.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category.name;
        button.addEventListener('click', () => scrollToCategory(category.id));
        nav.appendChild(button);
    });
}

// Function to scroll to category
function scrollToCategory(categoryId) {
    const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (categoryElement) {
        categoryElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to create a product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const hasOptions = product.options && product.options.length > 0;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image_path}" alt="${product.name}">
        </div>
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-time">Tiempo estimado: ${product.tiempo_estimado} min</div>
            ${hasOptions ? `
                <div class="product-options">
                    <select class="option-select" data-product-id="${product.id}">
                        <option value="">Seleccionar opción</option>
                        ${product.options.map(option => 
                            `<option value="${option}">${option}</option>`
                        ).join('')}
                    </select>
                </div>
            ` : ''}
            <button class="add-to-cart" data-product='${JSON.stringify(product)}' ${hasOptions ? 'disabled' : ''}>
                <span class="material-icons">add_shopping_cart</span>
                Agregar al Carrito
            </button>
        </div>
    `;
    
    if (hasOptions) {
        const select = card.querySelector('.option-select');
        select.addEventListener('change', (e) => {
            const button = card.querySelector('.add-to-cart');
            const selectedOption = e.target.value;
            button.disabled = !selectedOption;
            
            if (selectedOption) {
                const productData = JSON.parse(button.dataset.product);
                productData.selectedOption = selectedOption;
                button.dataset.product = JSON.stringify(productData);
            }
        });
    }
    
    return card;
}

// Function to generate product cards
function generateProductCards() {
    const menuSection = document.querySelector('.menu-section');
    if (!menuSection) return;
    menuSection.innerHTML = '';
    
    categories.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.setAttribute('data-category-id', category.id);
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category.name;
        categorySection.appendChild(categoryTitle);
        
        const productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        
        const categoryProducts = menuData.filter(product => product.category_id === category.id);
        categoryProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
        });
        
        categorySection.appendChild(productsContainer);
        menuSection.appendChild(categorySection);
    });
}

// Initialize the menu when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadMenuData();
}); 