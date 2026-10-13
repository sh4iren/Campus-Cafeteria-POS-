'use strict';

// Product prices are stored in centavos to avoid floating-point rounding errors.
const PRODUCTS = [
  { id: 'rice', name: 'Rice (Plain)', price: 1500, emoji: '🍚', description: 'Freshly steamed white rice.' },
  { id: 'chicken', name: 'Fried Chicken (1 pc)', price: 6500, emoji: '🍗', description: 'Crispy and golden chicken.' },
  { id: 'adobo', name: 'Pork Adobo', price: 6000, emoji: '🍲', description: 'Savory Filipino comfort food.' },
  { id: 'vegetables', name: 'Vegetable Side Dish', price: 3500, emoji: '🥗', description: 'Fresh and delicious vegetables.' },
  { id: 'tea', name: 'Iced Tea (cup)', price: 2000, emoji: '🥤', description: 'Cool and refreshing iced tea.' },
  { id: 'water', name: 'Bottled Water', price: 2000, emoji: '💧', description: 'Chilled drinking water.' }
];

const CART_KEY = 'cafeteriaCart';
const RECEIPT_KEY = 'cafeteriaReceipt';
const MAX_QUANTITY = 999;

const formatMoney = centavos => '₱' + (centavos / 100).toFixed(2);

// -----------------------------------------------------------------------------
// Cart storage and calculations
// -----------------------------------------------------------------------------
function readCart() {
  try {
    const storedCart = JSON.parse(sessionStorage.getItem(CART_KEY) || '{}');
    if (!storedCart || typeof storedCart !== 'object' || Array.isArray(storedCart)) {
      return {};
    }

    const validCart = {};
    for (const product of PRODUCTS) {
      const quantity = storedCart[product.id];
      if (Number.isSafeInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY) {
        validCart[product.id] = quantity;
      }
    }
    return validCart;
  } catch {
    return {};
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function getCartItems() {
  const cart = readCart();
  return PRODUCTS
    .filter(product => cart[product.id])
    .map(product => ({
      ...product,
      quantity: cart[product.id],
      subtotal: product.price * cart[product.id]
    }));
}

function calculateTotal() {
  return getCartItems().reduce((sum, item) => sum + item.subtotal, 0);
}

function updateCartBadge() {
  const itemCount = getCartItems().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach(element => {
    element.textContent = itemCount;
  });
}

// -----------------------------------------------------------------------------
// Shared messages and transaction state
// -----------------------------------------------------------------------------
function showMessage(text, type = 'success') {
  const messageElement = document.getElementById('message');
  if (!messageElement) return;

  messageElement.textContent = text;
  messageElement.className = 'message ' + type;
  messageElement.hidden = false;
}

function clearMessage() {
  const messageElement = document.getElementById('message');
  if (messageElement) messageElement.hidden = true;
}

function ensureUnpaid() {
  if (sessionStorage.getItem(RECEIPT_KEY)) {
    window.location.href = 'receipt.html';
    return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Menu actions
// -----------------------------------------------------------------------------
function addToCart(productId) {
  if (!ensureUnpaid()) return;

  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) return;

  const cart = readCart();
  if ((cart[productId] || 0) >= MAX_QUANTITY) {
    showMessage('Maximum quantity reached.', 'error');
    return;
  }

  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  showMessage(product.name + ' added to cart!');
}

function renderMenu() {
  const productGrid = document.getElementById('product-grid');
  if (!productGrid) return;

  productGrid.innerHTML = PRODUCTS.map(product => `
    <article class="product-card">
      <div class="product-image" aria-hidden="true">${product.emoji}</div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <strong>${formatMoney(product.price)}</strong>
          <button class="btn btn-primary" data-add="${product.id}">+ Add to Cart</button>
        </div>
      </div>
    </article>
  `).join('');

  productGrid.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) addToCart(addButton.dataset.add);
  });
}

// -----------------------------------------------------------------------------
// Cart actions and display
// -----------------------------------------------------------------------------
function changeQuantity(productId, adjustment) {
  if (!ensureUnpaid()) return;

  const cart = readCart();
  if (!cart[productId]) return;

  const nextQuantity = cart[productId] + adjustment;
  if (nextQuantity > MAX_QUANTITY) {
    showMessage('Maximum quantity reached.', 'error');
    return;
  }

  if (nextQuantity <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = nextQuantity;
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  if (!ensureUnpaid()) return;

  const cart = readCart();
  delete cart[productId];
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  if (!cartContainer) return;

  const items = getCartItems();
  const formattedTotal = formatMoney(calculateTotal());
  document.getElementById('cart-total').textContent = formattedTotal;
  document.getElementById('cart-grand-total').textContent = formattedTotal;
  document.getElementById('proceed-payment').hidden = items.length === 0;

  if (!items.length) {
    cartContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Choose your favorites from the menu.</p>
        <a class="btn btn-primary" href="menu.html">Browse Menu</a>
      </div>
    `;
    return;
  }

  cartContainer.innerHTML = items.map(item => `
    <article class="cart-item">
      <div class="cart-emoji" aria-hidden="true">${item.emoji}</div>
      <div class="cart-description">
        <h3>${item.name}</h3>
        <p>${formatMoney(item.price)} each</p>
        <button class="link-danger" data-remove="${item.id}">Remove</button>
      </div>
      <div class="quantity-control">
        <button aria-label="Decrease ${item.name}" data-change="${item.id}" data-delta="-1">−</button>
        <span>${item.quantity}</span>
        <button aria-label="Increase ${item.name}" data-change="${item.id}" data-delta="1">+</button>
      </div>
      <strong class="cart-subtotal">${formatMoney(item.subtotal)}</strong>
    </article>
  `).join('');
}

function initCart() {
  const cartContainer = document.getElementById('cart-items');
  if (!cartContainer) return;

  cartContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove]');
    const changeButton = event.target.closest('[data-change]');

    if (removeButton) {
      removeFromCart(removeButton.dataset.remove);
    } else if (changeButton) {
      changeQuantity(changeButton.dataset.change, Number(changeButton.dataset.delta));
    }
  });

  renderCart();
}

// -----------------------------------------------------------------------------
// Cash payment
// -----------------------------------------------------------------------------
function parseCashToCentavos(value) {
  const trimmedValue = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) return null;

  const [wholePesos, fractionalPesos = ''] = trimmedValue.split('.');
  const centavos = Number(wholePesos) * 100 + Number(fractionalPesos.padEnd(2, '0'));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

function validatePayment(rawCash) {
  const items = getCartItems();
  if (items.length === 0) {
    return { error: 'Your cart is empty. Add products before payment.' };
  }

  const cash = parseCashToCentavos(rawCash);
  if (cash === null) {
    return { error: 'Please enter a valid payment amount.' };
  }

  const total = calculateTotal();
  if (cash < total) {
    return { error: 'Insufficient payment. Please enter at least ' + formatMoney(total) + '.' };
  }

  return { cash, total, items, change: cash - total };
}

function createReceipt(paymentResult) {
  return {
    reference: 'CAF-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000),
    datetime: new Date().toISOString(),
    items: paymentResult.items.map(({ id, name, price, quantity, subtotal }) => ({
      id, name, price, quantity, subtotal
    })),
    total: paymentResult.total,
    paid: paymentResult.cash,
    change: paymentResult.change
  };
}

function initPayment() {
  const paymentForm = document.getElementById('payment-form');
  if (!paymentForm) return;
  if (!ensureUnpaid()) return;

  document.getElementById('payment-total').textContent = formatMoney(calculateTotal());

  const cashInput = document.getElementById('cash-input');
  const changePreview = document.getElementById('change-preview');
  const submitButton = paymentForm.querySelector('button[type="submit"]');

  if (!getCartItems().length) {
    showMessage('Your cart is empty. Return to the menu first.', 'error');
    submitButton.disabled = true;
  }

  cashInput.addEventListener('input', () => {
    clearMessage();
    const cash = parseCashToCentavos(cashInput.value);
    const total = calculateTotal();
    changePreview.textContent = cash !== null && cash >= total && total > 0
      ? formatMoney(cash - total)
      : '—';
  });

  paymentForm.addEventListener('submit', event => {
    event.preventDefault();
    if (sessionStorage.getItem(RECEIPT_KEY)) return;

    const paymentResult = validatePayment(cashInput.value);
    if (paymentResult.error) {
      showMessage(paymentResult.error, 'error');
      return;
    }

    sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(createReceipt(paymentResult)));
    submitButton.disabled = true;
    cashInput.disabled = true;
    showMessage('Payment successful! Change: ' + formatMoney(paymentResult.change) + '. Opening receipt…');
    setTimeout(() => window.location.href = 'receipt.html', 900);
  });
}

// -----------------------------------------------------------------------------
// Receipt and transaction reset
// -----------------------------------------------------------------------------
function readReceipt() {
  try {
    return JSON.parse(sessionStorage.getItem(RECEIPT_KEY) || 'null');
  } catch {
    return null;
  }
}

function renderReceipt() {
  const receiptContent = document.getElementById('receipt-content');
  if (!receiptContent) return;

  const receipt = readReceipt();
  if (!receipt || !Array.isArray(receipt.items)) {
    receiptContent.innerHTML = `
      <div class="empty-state">
        <h2>No completed transaction</h2>
        <p>Finish a payment to view a receipt.</p>
        <a href="menu.html" class="btn btn-primary">Go to Menu</a>
      </div>
    `;
    document.getElementById('receipt-actions').hidden = true;
    return;
  }

  const transactionDate = new Date(receipt.datetime);
  const receiptLines = receipt.items.map(item => `
    <div class="receipt-row">
      <span>${item.name}<small>${item.quantity} × ${formatMoney(item.price)}</small></span>
      <strong>${formatMoney(item.subtotal)}</strong>
    </div>
  `).join('');

  receiptContent.innerHTML = `
    <div class="receipt-heading">
      <div class="receipt-symbol">✓</div>
      <h2>Payment Successful!</h2>
      <p>Thank you for ordering with us.</p>
    </div>
    <div class="receipt-paper">
      <div class="receipt-brand">
        <h2>Campus Cafeteria</h2>
        <p>Fresh meals, happy campus.</p>
      </div>
      <div class="receipt-meta">
        <span>Transaction</span>
        <strong>${receipt.reference}</strong>
        <span>Date & time</span>
        <strong>${transactionDate.toLocaleString('en-PH')}</strong>
      </div>
      <div class="receipt-lines">
        <div class="receipt-row receipt-label"><span>Item</span><span>Subtotal</span></div>
        ${receiptLines}
      </div>
      <div class="receipt-totals">
        <div><span>Total</span><strong>${formatMoney(receipt.total)}</strong></div>
        <div><span>Cash Paid</span><span>${formatMoney(receipt.paid)}</span></div>
        <div class="change-row"><span>Change</span><strong>${formatMoney(receipt.change)}</strong></div>
      </div>
      <p class="receipt-thanks">Thank you! Please come again.</p>
    </div>
  `;
}

function newTransaction() {
  sessionStorage.removeItem(CART_KEY);
  sessionStorage.removeItem(RECEIPT_KEY);
  window.location.href = 'menu.html';
}

// Every HTML page shares this file; each initializer exits if its page is absent.
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderMenu();
  initCart();
  initPayment();
  renderReceipt();

  document.getElementById('print-receipt')?.addEventListener('click', () => window.print());
  document.getElementById('new-transaction')?.addEventListener('click', newTransaction);
});
