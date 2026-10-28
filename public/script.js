/**
 * CloudBook Store - Frontend Vanilla JavaScript Client
 * Handles Book catalogue, CRUD operations, Customer Order placement,
 * Order status management, and cancellation using the Fetch API.
 */

// Application State
const state = {
  books: [],
  orders: [],
  categories: new Set(),
  selectedBookForOrder: null,
  activeTab: 'catalogue',
  searchQuery: '',
  categoryFilter: 'all',
  orderStatusFilter: 'all',
};

// DOM Element References
const elements = {
  // Navigation
  navButtons: document.querySelectorAll('.nav-btn'),
  tabCatalogue: document.getElementById('section-catalogue'),
  tabOrders: document.getElementById('section-orders'),
  brandLogo: document.getElementById('brand-logo'),
  orderBadge: document.getElementById('order-badge'),

  // Stats
  statTotalBooks: document.getElementById('stat-total-books'),
  statTotalStock: document.getElementById('stat-total-stock'),
  statTotalOrders: document.getElementById('stat-total-orders'),
  statTotalRevenue: document.getElementById('stat-total-revenue'),

  // Catalogue
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  categoryFilter: document.getElementById('category-filter'),
  booksGrid: document.getElementById('books-grid'),
  booksLoading: document.getElementById('books-loading'),
  booksEmpty: document.getElementById('books-empty'),
  btnEmptyReset: document.getElementById('btn-empty-reset'),
  btnOpenAddBook: document.getElementById('btn-open-add-book'),

  // Orders
  btnRefreshOrders: document.getElementById('btn-refresh-orders'),
  orderStatusPills: document.getElementById('order-status-pills'),
  ordersTableBody: document.getElementById('orders-tbody'),
  ordersLoading: document.getElementById('orders-loading'),
  ordersEmpty: document.getElementById('orders-empty'),
  ordersContainer: document.getElementById('orders-container'),

  // Book Modal
  modalBook: document.getElementById('modal-book'),
  modalBookTitle: document.getElementById('modal-book-title'),
  formBook: document.getElementById('form-book'),
  bookFormId: document.getElementById('book-form-id'),
  bookTitle: document.getElementById('book-title'),
  bookAuthor: document.getElementById('book-author'),
  bookCategory: document.getElementById('book-category'),
  bookPrice: document.getElementById('book-price'),
  bookStock: document.getElementById('book-stock'),
  bookIsbn: document.getElementById('book-isbn'),
  bookDescription: document.getElementById('book-description'),
  btnSaveBook: document.getElementById('btn-save-book'),

  // Order Modal
  modalOrder: document.getElementById('modal-order'),
  formOrder: document.getElementById('form-order'),
  orderBookSelect: document.getElementById('order-book-select'),
  orderBookTitle: document.getElementById('order-book-title'),
  orderBookAuthor: document.getElementById('order-book-author'),
  orderBookPrice: document.getElementById('order-book-price'),
  orderBookStock: document.getElementById('order-book-stock'),
  orderCustomerName: document.getElementById('order-customer-name'),
  orderCustomerEmail: document.getElementById('order-customer-email'),
  orderCustomerAddress: document.getElementById('order-customer-address'),
  orderQuantity: document.getElementById('order-quantity'),
  orderCalculatedTotal: document.getElementById('order-calculated-total'),
  btnQtyMinus: document.getElementById('btn-qty-minus'),
  btnQtyPlus: document.getElementById('btn-qty-plus'),
  btnSubmitOrder: document.getElementById('btn-submit-order'),

  // Confirm Modal
  modalConfirm: document.getElementById('modal-confirm'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  btnConfirmAccept: document.getElementById('btn-confirm-accept'),

  // Toasts
  toastContainer: document.getElementById('toast-container'),
};

// =========================================================
// Notification Utilities (Toasts)
// =========================================================

function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass =
    type === 'success'
      ? 'fa-circle-check'
      : type === 'error'
      ? 'fa-circle-exclamation'
      : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  elements.toastContainer.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => removeToast(toast), 4500);
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.add('toast-hide');
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 250);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =========================================================
// API Layer (Fetch API)
// =========================================================

const api = {
  async getBooks(search = '', category = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);

    const res = await fetch(`/api/books?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch books');
    return data;
  },

  async getBook(id) {
    const res = await fetch(`/api/books/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch book');
    return data;
  },

  async createBook(bookData) {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || (data.errors ? data.errors.join(', ') : 'Failed to create book'));
    return data;
  },

  async updateBook(id, bookData) {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || (data.errors ? data.errors.join(', ') : 'Failed to update book'));
    return data;
  },

  async deleteBook(id) {
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete book');
    return data;
  },

  async getOrders() {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
    return data;
  },

  async createOrder(orderData) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to place order');
    return data;
  },

  async updateOrderStatus(id, status) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update order status');
    return data;
  },

  async cancelOrder(id) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to cancel order');
    return data;
  },
};

// =========================================================
// Modal Helpers
// =========================================================

function openModal(modal) {
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close modals when clicking backdrop or close buttons
document.querySelectorAll('.modal-close, [data-close]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const modalId = btn.getAttribute('data-close');
    const modal = document.getElementById(modalId) || btn.closest('.modal-backdrop');
    if (modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal(backdrop);
  });
});

let confirmCallback = null;
function showConfirm(title, message, onConfirm) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  confirmCallback = onConfirm;
  openModal(elements.modalConfirm);
}

elements.btnConfirmAccept.addEventListener('click', async () => {
  closeModal(elements.modalConfirm);
  if (confirmCallback) {
    await confirmCallback();
    confirmCallback = null;
  }
});

// =========================================================
// Tab Navigation
// =========================================================

elements.navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    switchTab(tab);
  });
});

elements.brandLogo.addEventListener('click', () => switchTab('catalogue'));

function switchTab(tabName) {
  state.activeTab = tabName;
  elements.navButtons.forEach((b) => {
    if (b.getAttribute('data-tab') === tabName) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  if (tabName === 'catalogue') {
    elements.tabCatalogue.style.display = 'block';
    elements.tabOrders.style.display = 'none';
  } else if (tabName === 'orders') {
    elements.tabCatalogue.style.display = 'none';
    elements.tabOrders.style.display = 'block';
    loadOrders();
  }
}

// =========================================================
// Stats Banner Updates
// =========================================================

function updateStats() {
  const totalBooks = state.books.length;
  const totalStock = state.books.reduce((sum, b) => sum + (b.stock || 0), 0);
  const totalOrders = state.orders.length;
  const totalRevenue = state.orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  elements.statTotalBooks.textContent = totalBooks;
  elements.statTotalStock.textContent = totalStock;
  elements.statTotalOrders.textContent = totalOrders;
  elements.statTotalRevenue.textContent = `$${totalRevenue.toFixed(2)}`;

  if (totalOrders > 0) {
    elements.orderBadge.style.display = 'inline-block';
    elements.orderBadge.textContent = totalOrders;
  } else {
    elements.orderBadge.style.display = 'none';
  }
}

// =========================================================
// Book Catalogue Rendering & Logic
// =========================================================

async function loadBooks() {
  try {
    elements.booksLoading.style.display = 'block';
    elements.booksGrid.style.display = 'none';
    elements.booksEmpty.style.display = 'none';

    const response = await api.getBooks(state.searchQuery, state.categoryFilter);
    state.books = response.data || [];

    // Populate category dropdown options dynamically
    populateCategoryOptions();

    renderBooksGrid();
    updateStats();
  } catch (err) {
    showToast('Error', err.message, 'error');
  } finally {
    elements.booksLoading.style.display = 'none';
  }
}

function populateCategoryOptions() {
  const categories = new Set();
  state.books.forEach((b) => {
    if (b.category) categories.add(b.category);
  });

  const currentSelection = elements.categoryFilter.value;
  elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  Array.from(categories).sort().forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentSelection) opt.selected = true;
    elements.categoryFilter.appendChild(opt);
  });
}

function renderBooksGrid() {
  elements.booksGrid.innerHTML = '';

  if (state.books.length === 0) {
    elements.booksGrid.style.display = 'none';
    elements.booksEmpty.style.display = 'block';
    return;
  }

  elements.booksEmpty.style.display = 'none';
  elements.booksGrid.style.display = 'grid';

  state.books.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'book-card';

    // Stock status class
    let stockClass = 'stock-in';
    let stockText = `${book.stock} In Stock`;
    let isOutOfStock = false;

    if (book.stock === 0) {
      stockClass = 'stock-out';
      stockText = 'Out of Stock';
      isOutOfStock = true;
    } else if (book.stock < 5) {
      stockClass = 'stock-low';
      stockText = `Low Stock: ${book.stock}`;
    }

    card.innerHTML = `
      <div>
        <div class="book-card-top">
          <span class="category-badge">${escapeHTML(book.category)}</span>
          <span class="stock-badge ${stockClass}">
            <i class="fa-solid ${isOutOfStock ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
            ${stockText}
          </span>
        </div>

        <h3 class="book-title">${escapeHTML(book.title)}</h3>
        <div class="book-author">
          <i class="fa-solid fa-user-pen"></i> ${escapeHTML(book.author)}
        </div>
        <div class="book-isbn">ISBN: ${escapeHTML(book.isbn)}</div>
        <p class="book-desc">${escapeHTML(book.description || 'No description provided.')}</p>
      </div>

      <div class="book-card-bottom">
        <div class="book-price">$${book.price.toFixed(2)}</div>
        <div class="book-actions">
          <button class="btn btn-primary btn-sm btn-order-now" data-id="${book._id}" ${isOutOfStock ? 'disabled title="Out of stock"' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Order
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-book" data-id="${book._id}" title="Edit book details">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-book" data-id="${book._id}" title="Delete book">
            <i class="fa-solid fa-trash text-danger"></i>
          </button>
        </div>
      </div>
    `;

    // Button event listeners
    const btnOrder = card.querySelector('.btn-order-now');
    if (btnOrder) {
      btnOrder.addEventListener('click', () => openOrderModal(book));
    }

    const btnEdit = card.querySelector('.btn-edit-book');
    btnEdit.addEventListener('click', () => openEditBookModal(book));

    const btnDelete = card.querySelector('.btn-delete-book');
    btnDelete.addEventListener('click', () => {
      showConfirm(
        'Delete Book',
        `Are you sure you want to delete "${book.title}"? This cannot be undone.`,
        async () => {
          try {
            await api.deleteBook(book._id);
            showToast('Success', `"${book.title}" was deleted`, 'success');
            await loadBooks();
          } catch (err) {
            showToast('Error', err.message, 'error');
          }
        }
      );
    });

    elements.booksGrid.appendChild(card);
  });
}

// Search debounce
let searchTimer = null;
elements.searchInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  elements.searchClearBtn.style.display = value ? 'block' : 'none';

  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = value;
    loadBooks();
  }, 300);
});

elements.searchClearBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.searchClearBtn.style.display = 'none';
  state.searchQuery = '';
  loadBooks();
});

elements.categoryFilter.addEventListener('change', (e) => {
  state.categoryFilter = e.target.value;
  loadBooks();
});

elements.btnEmptyReset.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.searchClearBtn.style.display = 'none';
  elements.categoryFilter.value = 'all';
  state.searchQuery = '';
  state.categoryFilter = 'all';
  loadBooks();
});

// =========================================================
// Add & Edit Book Form Handling
// =========================================================

elements.btnOpenAddBook.addEventListener('click', () => {
  elements.modalBookTitle.innerHTML = '<i class="fa-solid fa-book-bookmark"></i> Add New Book';
  elements.formBook.reset();
  elements.bookFormId.value = '';
  elements.btnSaveBook.querySelector('.btn-text').textContent = 'Add Book';
  openModal(elements.modalBook);
});

function openEditBookModal(book) {
  elements.modalBookTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Book Details';
  elements.bookFormId.value = book._id;
  elements.bookTitle.value = book.title;
  elements.bookAuthor.value = book.author;
  elements.bookCategory.value = book.category;
  elements.bookPrice.value = book.price;
  elements.bookStock.value = book.stock;
  elements.bookIsbn.value = book.isbn;
  elements.bookDescription.value = book.description || '';
  elements.btnSaveBook.querySelector('.btn-text').textContent = 'Update Book';
  openModal(elements.modalBook);
}

elements.formBook.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = elements.bookFormId.value;
  const bookData = {
    title: elements.bookTitle.value.trim(),
    author: elements.bookAuthor.value.trim(),
    category: elements.bookCategory.value.trim(),
    price: parseFloat(elements.bookPrice.value),
    stock: parseInt(elements.bookStock.value, 10),
    isbn: elements.bookIsbn.value.trim(),
    description: elements.bookDescription.value.trim(),
  };

  // Client-side validations
  if (isNaN(bookData.price) || bookData.price < 0) {
    showToast('Validation Error', 'Price must be a non-negative number', 'error');
    return;
  }
  if (isNaN(bookData.stock) || bookData.stock < 0) {
    showToast('Validation Error', 'Stock must be a non-negative integer', 'error');
    return;
  }

  const btnText = elements.btnSaveBook.querySelector('.btn-text');
  const btnSpinner = elements.btnSaveBook.querySelector('.btn-spinner');

  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    elements.btnSaveBook.disabled = true;

    if (id) {
      await api.updateBook(id, bookData);
      showToast('Book Updated', `"${bookData.title}" was updated successfully`, 'success');
    } else {
      await api.createBook(bookData);
      showToast('Book Added', `"${bookData.title}" was added to catalogue`, 'success');
    }

    closeModal(elements.modalBook);
    await loadBooks();
  } catch (err) {
    showToast('Error', err.message, 'error');
  } finally {
    btnText.style.display = 'inline-block';
    btnSpinner.style.display = 'none';
    elements.btnSaveBook.disabled = false;
  }
});

// =========================================================
// Customer Order Placement Handling
// =========================================================

function openOrderModal(selectedBook) {
  // Populate the book selector
  elements.orderBookSelect.innerHTML = '';
  state.books.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b._id;
    opt.textContent = `${b.title} - $${b.price.toFixed(2)} (Stock: ${b.stock})`;
    if (selectedBook && b._id === selectedBook._id) {
      opt.selected = true;
    }
    if (b.stock <= 0) {
      opt.disabled = true;
    }
    elements.orderBookSelect.appendChild(opt);
  });

  updateSelectedBookForOrder(selectedBook || state.books.find((b) => b.stock > 0));
  elements.orderQuantity.value = 1;
  recalculateOrderTotal();

  openModal(elements.modalOrder);
}

function updateSelectedBookForOrder(book) {
  state.selectedBookForOrder = book;
  if (!book) return;

  elements.orderBookTitle.textContent = book.title;
  elements.orderBookAuthor.textContent = `By ${book.author}`;
  elements.orderBookPrice.textContent = `$${book.price.toFixed(2)}`;
  elements.orderBookStock.textContent = `Available Stock: ${book.stock}`;
  elements.orderQuantity.max = book.stock;
}

elements.orderBookSelect.addEventListener('change', (e) => {
  const chosen = state.books.find((b) => b._id === e.target.value);
  updateSelectedBookForOrder(chosen);
  recalculateOrderTotal();
});

function recalculateOrderTotal() {
  const book = state.selectedBookForOrder;
  if (!book) return;

  let qty = parseInt(elements.orderQuantity.value, 10);
  if (isNaN(qty) || qty < 1) qty = 1;
  if (qty > book.stock) qty = book.stock;

  elements.orderQuantity.value = qty;
  const total = (book.price * qty).toFixed(2);
  elements.orderCalculatedTotal.textContent = `$${total}`;
}

elements.btnQtyMinus.addEventListener('click', () => {
  let qty = parseInt(elements.orderQuantity.value, 10) || 1;
  if (qty > 1) {
    elements.orderQuantity.value = qty - 1;
    recalculateOrderTotal();
  }
});

elements.btnQtyPlus.addEventListener('click', () => {
  let qty = parseInt(elements.orderQuantity.value, 10) || 1;
  const max = state.selectedBookForOrder ? state.selectedBookForOrder.stock : 999;
  if (qty < max) {
    elements.orderQuantity.value = qty + 1;
    recalculateOrderTotal();
  } else {
    showToast('Stock Limit', `Cannot exceed available stock of ${max}`, 'info');
  }
});

elements.orderQuantity.addEventListener('input', recalculateOrderTotal);

elements.formOrder.addEventListener('submit', async (e) => {
  e.preventDefault();

  const book = state.selectedBookForOrder;
  if (!book) {
    showToast('Error', 'Please select a book to order', 'error');
    return;
  }

  const qty = parseInt(elements.orderQuantity.value, 10);
  if (qty > book.stock) {
    showToast('Insufficient Stock', `Requested ${qty}, but only ${book.stock} are available`, 'error');
    return;
  }

  const orderPayload = {
    customer: {
      name: elements.orderCustomerName.value.trim(),
      email: elements.orderCustomerEmail.value.trim(),
      address: elements.orderCustomerAddress.value.trim(),
    },
    items: [
      {
        book: book._id,
        quantity: qty,
      },
    ],
  };

  const btnText = elements.btnSubmitOrder.querySelector('.btn-text');
  const btnSpinner = elements.btnSubmitOrder.querySelector('.btn-spinner');

  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    elements.btnSubmitOrder.disabled = true;

    const response = await api.createOrder(orderPayload);
    showToast('Order Placed!', `Order #${response.data._id.slice(-6).toUpperCase()} placed successfully`, 'success');

    closeModal(elements.modalOrder);
    elements.formOrder.reset();

    // Reload books to reflect newly decremented inventory
    await loadBooks();
    await loadOrders();
  } catch (err) {
    showToast('Order Failed', err.message, 'error');
  } finally {
    btnText.style.display = 'inline-block';
    btnSpinner.style.display = 'none';
    elements.btnSubmitOrder.disabled = false;
  }
});

// =========================================================
// Orders Page & Management
// =========================================================

async function loadOrders() {
  try {
    elements.ordersLoading.style.display = 'block';
    elements.ordersContainer.style.display = 'none';
    elements.ordersEmpty.style.display = 'none';

    const response = await api.getOrders();
    state.orders = response.data || [];

    renderOrdersTable();
    updateStats();
  } catch (err) {
    showToast('Error', err.message, 'error');
  } finally {
    elements.ordersLoading.style.display = 'none';
  }
}

elements.btnRefreshOrders.addEventListener('click', loadOrders);

elements.orderStatusPills.querySelectorAll('.pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    elements.orderStatusPills.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    state.orderStatusFilter = pill.getAttribute('data-status');
    renderOrdersTable();
  });
});

function renderOrdersTable() {
  elements.ordersTableBody.innerHTML = '';

  let filtered = state.orders;
  if (state.orderStatusFilter !== 'all') {
    filtered = filtered.filter((o) => o.status === state.orderStatusFilter);
  }

  if (filtered.length === 0) {
    elements.ordersContainer.style.display = 'none';
    elements.ordersEmpty.style.display = 'block';
    return;
  }

  elements.ordersEmpty.style.display = 'none';
  elements.ordersContainer.style.display = 'block';

  filtered.forEach((order) => {
    const tr = document.createElement('tr');

    const statusLower = order.status.toLowerCase();
    const canCancel = order.status === 'Pending' || order.status === 'Processing';

    // Format items
    const itemsHtml = (order.items || [])
      .map((item) => {
        return `<div class="order-item-chip">
          <strong>${escapeHTML(item.title)}</strong> &times; ${item.quantity} ($${item.unitPrice.toFixed(2)})
        </div>`;
      })
      .join('');

    const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    tr.innerHTML = `
      <td>
        <span class="order-id-badge" title="${order._id}">#${order._id.slice(-6).toUpperCase()}</span>
      </td>
      <td>
        <div class="customer-info">
          <span class="customer-name">${escapeHTML(order.customer.name)}</span>
          <span class="customer-email">${escapeHTML(order.customer.email)}</span>
          <span class="customer-addr" title="${escapeHTML(order.customer.address)}">${escapeHTML(order.customer.address)}</span>
        </div>
      </td>
      <td>
        <div class="order-items-list">${itemsHtml}</div>
      </td>
      <td>
        <strong>$${order.totalAmount.toFixed(2)}</strong>
      </td>
      <td>
        <span style="font-size:0.85rem; color:var(--text-muted);">${formattedDate}</span>
      </td>
      <td>
        <span class="status-badge status-${statusLower}">
          ${order.status}
        </span>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <select class="status-select" data-id="${order._id}">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          ${
            canCancel
              ? `<button class="btn btn-danger btn-sm btn-cancel-order" data-id="${order._id}" title="Cancel order and restore stock">
                  <i class="fa-solid fa-ban"></i> Cancel
                </button>`
              : ''
          }
        </div>
      </td>
    `;

    // Status change listener
    const statusSelect = tr.querySelector('.status-select');
    statusSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        await api.updateOrderStatus(order._id, newStatus);
        showToast('Status Updated', `Order #${order._id.slice(-6).toUpperCase()} is now ${newStatus}`, 'success');
        await loadBooks(); // refresh stock in case of cancellation
        await loadOrders();
      } catch (err) {
        showToast('Error', err.message, 'error');
        statusSelect.value = order.status; // revert UI
      }
    });

    // Cancel order button listener
    const btnCancel = tr.querySelector('.btn-cancel-order');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        showConfirm(
          'Cancel Order',
          `Cancel order #${order._id.slice(-6).toUpperCase()} and restore inventory stock?`,
          async () => {
            try {
              await api.cancelOrder(order._id);
              showToast('Order Cancelled', 'Order was marked as Cancelled and stock restored', 'success');
              await loadBooks();
              await loadOrders();
            } catch (err) {
              showToast('Error', err.message, 'error');
            }
          }
        );
      });
    }

    elements.ordersTableBody.appendChild(tr);
  });
}

// =========================================================
// Initialization
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  loadOrders();
});
