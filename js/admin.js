// Variables globales
let menuItems = [];
let categories = [];
let currentEditingId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

async function initializeAdmin() {
    try {
        await loadData();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showError('Error al inicializar el panel. Detalles: ' + error.message);
    }
}

function setupEventListeners() {
    // Botones principales
    document.getElementById('add-item-btn').addEventListener('click', () => openItemModal());
    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal());

    // Cerrar modales
    document.querySelectorAll('.close, .modal').forEach(element => {
        element.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModals();
            }
        });
    });

    // Botones de cancelar
    document.querySelectorAll('.modal .admin-btn').forEach(button => {
        if (button.textContent.trim() === 'Cancelar') {
            button.addEventListener('click', closeModals);
        }
    });

    // Formularios
    document.getElementById('item-form').addEventListener('submit', handleItemSubmit);
    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);

    // Búsqueda
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Opciones de producto
    document.getElementById('add-option').addEventListener('click', addOptionInput);
    document.getElementById('item-image').addEventListener('change', handleImagePreview);
}

// Funciones de carga de datos
async function loadData() {
    try {
        console.log('Iniciando carga de datos...');
        
        // Cargar categorías
        console.log('Cargando categorías...');
        const categoriesResponse = await fetch('http://localhost:3000/api/categories');
        if (!categoriesResponse.ok) {
            throw new Error(`Error al cargar categorías: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
        }
        categories = await categoriesResponse.json();
        console.log('Categorías cargadas:', categories);
        
        // Cargar items del menú
        console.log('Cargando items del menú...');
        const menuResponse = await fetch('http://localhost:3000/api/menu');
        if (!menuResponse.ok) {
            throw new Error(`Error al cargar menú: ${menuResponse.status} ${menuResponse.statusText}`);
        }
        menuItems = await menuResponse.json();
        console.log('Items del menú cargados:', menuItems);
        
        // Actualizar la interfaz
        updateUI();
        updateCategorySelect();
        console.log('Interfaz actualizada');
        
    } catch (error) {
        console.error('Error detallado al cargar datos:', error);
        throw new Error(`Error al cargar datos: ${error.message}`);
    }
}

function updateUI() {
    try {
        console.log('Actualizando UI...');
        updateCategoriesList();
        updateMenuItemsList();
        console.log('UI actualizada correctamente');
    } catch (error) {
        console.error('Error al actualizar UI:', error);
        showError('Error al actualizar la interfaz: ' + error.message);
    }
}

function updateCategoriesList() {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) {
        console.error('No se encontró el elemento categories-list');
        return;
    }
    
    if (!Array.isArray(categories)) {
        console.error('categories no es un array:', categories);
        return;
    }
    
    categoriesList.innerHTML = categories.map(category => `
        <div class="category-item">
            <span>${category.name}</span>
            <div class="category-actions">
                <button class="admin-btn" onclick="editCategory(${category.id})">
                    <span class="material-icons">edit</span>
                </button>
                <button class="admin-btn danger" onclick="deleteCategory(${category.id})">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

function updateMenuItemsList(filteredItems = null) {
    const itemsList = document.getElementById('menu-items-list');
    if (!itemsList) {
        console.error('No se encontró el elemento menu-items-list');
        return;
    }
    
    const items = filteredItems || menuItems;
    if (!Array.isArray(items)) {
        console.error('items no es un array:', items);
        return;
    }
    
    itemsList.innerHTML = items.map(item => `
        <div class="menu-item-card">
            <img src="${item.image_path || '../media/default-food.png'}" alt="${item.name}" class="menu-item-image" onerror="this.src='../media/default-food.png'">
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="menu-item-price">$${item.price.toFixed(2)}</div>
                <div>Categoría: ${getCategoryName(item.category_id)}</div>
                <div>Tiempo: ${item.tiempo_estimado} min</div>
                ${item.options ? `<div>Opciones: ${item.options.join(', ')}</div>` : ''}
            </div>
            <div class="menu-item-actions">
                <button class="admin-btn" onclick="editItem(${item.id})">
                    <span class="material-icons">edit</span>
                </button>
                <button class="admin-btn danger" onclick="deleteItem(${item.id})">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

function updateCategorySelect() {
    const select = document.getElementById('item-category');
    if (!select) {
        console.error('No se encontró el elemento item-category');
        return;
    }
    
    if (!Array.isArray(categories)) {
        console.error('categories no es un array:', categories);
        return;
    }
    
    select.innerHTML = categories.map(category =>
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
}

// Funciones de modales
function openItemModal(item = null) {
    const modal = document.getElementById('item-modal');
    const form = document.getElementById('item-form');
    const title = document.getElementById('modal-title');

    currentEditingId = item ? item.id : null;
    title.textContent = item ? 'Editar Item' : 'Agregar Item';

    if (item) {
        form.elements['item-name'].value = item.name;
        form.elements['item-description'].value = item.description;
        form.elements['item-price'].value = item.price;
        form.elements['item-category'].value = item.category_id;
        form.elements['item-time'].value = item.tiempo_estimado;
        
        // Cargar opciones
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        if (item.options && item.options.length) {
            item.options.forEach(option => addOptionInput(option));
        }
    } else {
        form.reset();
        document.getElementById('options-container').innerHTML = '';
        document.getElementById('image-preview').innerHTML = '';
    }

    modal.style.display = 'block';
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const title = document.getElementById('category-modal-title');

    currentEditingId = category ? category.id : null;
    title.textContent = category ? 'Editar Categoría' : 'Agregar Categoría';

    if (category) {
        form.elements['category-name'].value = category.name;
    } else {
        form.reset();
    }

    modal.style.display = 'block';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    currentEditingId = null;
}

// Funciones de manejo de formularios
async function handleItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', e.target.elements['item-name'].value);
    formData.append('description', e.target.elements['item-description'].value);
    formData.append('price', e.target.elements['item-price'].value);
    formData.append('category_id', e.target.elements['item-category'].value);
    formData.append('tiempo_estimado', e.target.elements['item-time'].value);
    
    const imageFile = e.target.elements['item-image'].files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    // Recopilar opciones
    const options = [];
    document.querySelectorAll('#options-container input').forEach(input => {
        if (input.value.trim()) {
            options.push(input.value.trim());
        }
    });
    formData.append('options', JSON.stringify(options));

    try {
        const url = currentEditingId 
            ? `http://localhost:3000/api/menu/${currentEditingId}`
            : 'http://localhost:3000/api/menu';
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            body: formData
        });

        if (!response.ok) throw new Error('Error al guardar el item');

        await loadData();
        closeModals();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el item');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryData = {
        name: e.target.elements['category-name'].value.trim()
    };

    if (!categoryData.name) {
        showError('El nombre de la categoría es requerido');
        return;
    }

    try {
        const url = currentEditingId 
            ? `http://localhost:3000/api/categories/${currentEditingId}`
            : 'http://localhost:3000/api/categories';
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar la categoría');
        }

        await loadData();
        closeModals();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al guardar la categoría');
    }
}

// Funciones de edición y eliminación
function editItem(id) {
    const item = menuItems.find(item => item.id === id);
    if (item) openItemModal(item);
}

function editCategory(id) {
    const category = categories.find(cat => cat.id === id);
    if (category) openCategoryModal(category);
}

async function deleteItem(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este item?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/menu/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar el item');

        await loadData();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el item');
    }
}

async function deleteCategory(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar la categoría');

        await loadData();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar la categoría');
    }
}

// Funciones auxiliares
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );
    updateMenuItemsList(filteredItems);
}

function addOptionInput(value = '') {
    const container = document.getElementById('options-container');
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input';
    optionDiv.innerHTML = `
        <input type="text" placeholder="Nueva opción" value="${value}">
        <button type="button" class="remove-option" onclick="removeOption(this)">
            <span class="material-icons">remove_circle</span>
        </button>
    `;
    container.appendChild(optionDiv);
}

function removeOption(button) {
    button.closest('.option-input').remove();
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('image-preview').innerHTML = `
            <img src="${e.target.result}" alt="Preview">
        `;
    };
    reader.readAsDataURL(file);
}

function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #e74c3c;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        z-index: 2000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
} 