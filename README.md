# CampusBites - Campus Cafeteria POS

## Run locally
Open `index.html` in a modern desktop browser, or open the folder in VS Code
and use Live Server. All five HTML pages share `style.css` and **`app.js`**.
No server, database, or npm installation is required.

## Navigation
Welcome (`index.html`) → Menu (`menu.html`) → Cart (`cart.html`) →
Payment (`payment.html`) → Receipt (`receipt.html`) → New Transaction.

## Data storage
The cart and completed receipt use browser `sessionStorage`. Data survives
navigation and refresh in the same browser tab. It is not a database and is
cleared when a new transaction begins (or when the tab session ends).
The existing storage keys (`cafeteriaCart`, `cafeteriaReceipt`) are unchanged.

## Product prices
- Rice (Plain): ₱15.00
- Fried Chicken (1 pc): ₱65.00
- Pork Adobo: ₱60.00
- Vegetable Side Dish: ₱35.00
- Iced Tea (cup): ₱20.00
- Bottled Water: ₱20.00

## Manual acceptance checks
1. Add a product twice, increase/decrease quantity, remove the last item.
2. Confirm the total after every cart change; check navigation and refresh.
3. Try blank, malformed, negative, and insufficient cash payments.
4. Test exact cash and excess cash; check receipt fields, reference, and print.
5. Start a new transaction; confirm cart, payment, and receipt reset.

Product visuals are emoji placeholders and require no downloaded images.
