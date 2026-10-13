// Prices are stored as whole centavos to keep calculations exact.
const products = [
  { id: 1, name: "Rice (Plain)", price: 1500 },
  { id: 2, name: "Fried Chicken (1 pc)", price: 6500 },
  { id: 3, name: "Pork Adobo", price: 6000 },
  { id: 4, name: "Vegetable Side Dish", price: 3500 },
  { id: 5, name: "Iced Tea (cup)", price: 2000 },
  { id: 6, name: "Bottled Water", price: 2000 }
];

let cart = [];
let completedTransaction = null;
let transactionCounter = 0;

const productList = document.getElementById("product-list");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const orderTotal = document.getElementById("order-total");
const cashInput = document.getElementById("cash-input");
const paymentMessage = document.getElementById("payment-message");
const payButton = document.getElementById("pay-button");
const receiptSection = document.getElementById("receipt-section");
const receiptContent = document.getElementById("receipt-content");
const newTransactionButton = document.getElementById("new-transaction-button");

function formatMoney(centavos) {
  return `₱${(centavos / 100).toFixed(2)}`;
}

function createElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function displayProducts() {
  productList.replaceChildren();
  products.forEach(product => {
    const card = createElement("article", "", "product-card");
    card.append(
      createElement("h3", product.name),
      createElement("p", formatMoney(product.price), "price")
    );
    const addButton = createElement("button", "Add to Cart", "button button-primary");
    addButton.type = "button";
    addButton.addEventListener("click", () => addToCart(product.id));
    card.append(addButton);
    productList.append(card);
  });
}

function addToCart(productId) {
  if (completedTransaction) return;
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  renderCart();
}

function increaseQuantity(productId) {
  addToCart(productId);
}

function decreaseQuantity(productId) {
  if (completedTransaction) return;
  const item = cart.find(entry => entry.productId === productId);
  if (!item) return;
  if (item.quantity === 1) {
    removeFromCart(productId);
    return;
  }
  item.quantity -= 1;
  renderCart();
}

function removeFromCart(productId) {
  if (completedTransaction) return;
  cart = cart.filter(item => item.productId !== productId);
  renderCart();
}

function calculateSubtotal(item) {
  const product = products.find(entry => entry.id === item.productId);
  return product.price * item.quantity;
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + calculateSubtotal(item), 0);
}

function renderCart() {
  cartItems.replaceChildren();
  if (cart.length === 0) {
    cartItems.append(createElement("p", "Your cart is empty. Add an item to begin.", "empty-cart"));
  }
  cart.forEach(item => {
    const product = products.find(entry => entry.id === item.productId);
    const row = createElement("div", "", "cart-item");
    const details = createElement("div");
    details.append(
      createElement("h3", product.name),
      createElement("p", `${formatMoney(product.price)} each • Subtotal: ${formatMoney(calculateSubtotal(item))}`)
    );
    const actions = createElement("div", "", "cart-actions");
    const decrease = createElement("button", "−", "quantity-button");
    decrease.type = "button";
    decrease.setAttribute("aria-label", `Decrease ${product.name}`);
    decrease.addEventListener("click", () => decreaseQuantity(product.id));
    const quantity = createElement("span", String(item.quantity), "quantity");
    const increase = createElement("button", "+", "quantity-button");
    increase.type = "button";
    increase.setAttribute("aria-label", `Increase ${product.name}`);
    increase.addEventListener("click", () => increaseQuantity(product.id));
    const remove = createElement("button", "Remove", "remove-button");
    remove.type = "button";
    remove.addEventListener("click", () => removeFromCart(product.id));
    actions.append(decrease, quantity, increase, remove);
    row.append(details, actions);
    cartItems.append(row);
  });
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
  orderTotal.textContent = formatMoney(calculateTotal());
  if (!completedTransaction) showMessage("", "");
}

function showMessage(text, kind) {
  paymentMessage.textContent = text;
  paymentMessage.className = `message ${kind}`;
}

// Convert a cash string to centavos. Invalid input returns null.
function parseCashToCentavos(rawValue) {
  const value = rawValue.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fractional = ""] = value.split(".");
  const centavos = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

function validatePayment() {
  const total = calculateTotal();
  if (cart.length === 0) {
    return { valid: false, message: "Cannot process payment. Your cart is empty." };
  }
  const amountPaid = parseCashToCentavos(cashInput.value);
  if (amountPaid === null) {
    return { valid: false, message: "Please enter a valid payment amount." };
  }
  if (amountPaid < total) {
    return { valid: false, message: `Insufficient payment. Please enter at least ${formatMoney(total)}.` };
  }
  return { valid: true, amountPaid, total };
}

function processPayment() {
  if (completedTransaction) return;
  const result = validatePayment();
  if (!result.valid) {
    showMessage(result.message, "error");
    return;
  }
  transactionCounter += 1;
  completedTransaction = {
    reference: `CAF-${Date.now()}-${String(transactionCounter).padStart(3, "0")}`,
    dateTime: new Date().toLocaleString("en-PH"),
    items: cart.map(item => {
      const product = products.find(entry => entry.id === item.productId);
      return { name: product.name, price: product.price, quantity: item.quantity, subtotal: calculateSubtotal(item) };
    }),
    total: result.total,
    amountPaid: result.amountPaid,
    change: result.amountPaid - result.total
  };
  showMessage(`Payment successful! Change: ${formatMoney(completedTransaction.change)}`, "success");
  payButton.disabled = true;
  cashInput.disabled = true;
  productList.querySelectorAll("button").forEach(button => button.disabled = true);
  cartItems.querySelectorAll("button").forEach(button => button.disabled = true);
  generateReceipt(completedTransaction);
}

function generateReceipt(transaction) {
  receiptContent.replaceChildren();
  const header = createElement("div", "", "receipt-header");
  header.append(
    createElement("h4", "CAMPUS CAFETERIA"),
    createElement("p", `Reference: ${transaction.reference}`),
    createElement("p", `Date: ${transaction.dateTime}`)
  );
  receiptContent.append(header, document.createElement("hr"));
  transaction.items.forEach(item => {
    const line = createElement("div", "", "receipt-line");
    line.append(
      createElement("span", `${item.name} × ${item.quantity} @ ${formatMoney(item.price)}`),
      createElement("span", formatMoney(item.subtotal))
    );
    receiptContent.append(line);
  });
  receiptContent.append(document.createElement("hr"));
  [
    ["Total", transaction.total],
    ["Amount Paid", transaction.amountPaid],
    ["Change", transaction.change]
  ].forEach(([label, value]) => {
    const line = createElement("div", "", "receipt-total");
    line.append(createElement("span", label), createElement("span", formatMoney(value)));
    receiptContent.append(line);
  });
  receiptContent.append(createElement("p", "Payment confirmed. Thank you!", "receipt-footer"));
  receiptSection.hidden = false;
}

function newTransaction() {
  cart = [];
  completedTransaction = null;
  cashInput.value = "";
  cashInput.disabled = false;
  payButton.disabled = false;
  receiptSection.hidden = true;
  receiptContent.replaceChildren();
  productList.querySelectorAll("button").forEach(button => button.disabled = false);
  renderCart();
  cashInput.focus();
}

payButton.addEventListener("click", processPayment);
newTransactionButton.addEventListener("click", newTransaction);
cashInput.addEventListener("input", () => {
  if (!completedTransaction) showMessage("", "");
});
displayProducts();
renderCart();
