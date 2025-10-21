
(() => {
  const LIMIT = 100000000; // 100,000,000 COP exacto
  const cartKey = 'tds_cart_v1';

  
  const q = sel => document.querySelector(sel);
  const qa = sel => Array.from(document.querySelectorAll(sel));
  const formatCOP = n => n.toLocaleString('es-CO');

 
  const cartBtn = q('#btn-cart');
  const cartModal = q('#cart-modal');
  const closeCartBtn = q('#close-cart');
  const cartCount = q('#cart-count');
  const cartItemsEl = q('#cart-items');
  const cartTotalEl = q('#cart-total');
  const clearCartBtn = q('#clear-cart');
  const checkoutBtn = q('#checkout');
  const searchInput = q('#search');
  const tabs = qa('.tab');
  const productsGrid = q('#products');
  const productEls = qa('.product');


  let cart = loadCart();


  updateCartUI();
  attachProductButtons();
  attachTabs();
  attachSearch();
  q('#year').textContent = new Date().getFullYear();

  
  cartBtn.addEventListener('click', () => openCart(true));
  closeCartBtn.addEventListener('click', () => openCart(false));
  clearCartBtn.addEventListener('click', clearCart);
  checkoutBtn.addEventListener('click', checkoutSimulated);

  function openCart(open=true){
    cartModal.setAttribute('aria-hidden', String(!open));
  }

  
  function loadCart(){
    try{
      const raw = localStorage.getItem(cartKey);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      return [];
    }
  }
  function saveCart(){
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }


  function attachProductButtons(){
    productEls.forEach(prod => {
      const addBtn = prod.querySelector('.btn-add');
      addBtn.addEventListener('click', () => {
        const id = prod.getAttribute('data-id');
        const title = prod.querySelector('.product-title').textContent.trim();
        const priceRaw = prod.getAttribute('data-price') || prod.querySelector('.price').textContent.replace(/\D/g,'');
        const price = Number(priceRaw);
        const qtyInput = prod.querySelector('.qty');
        const qty = Math.max(1, Number(qtyInput.value));
        const img = prod.querySelector('img') ? prod.querySelector('img').src : '';
        addToCart({ id, title, price, qty, img });
      });
    });
  }


  function addToCart(item){
    
    const currentTotal = cart.reduce((s,i) => s + (i.price * i.qty), 0);
    const prospective = currentTotal + (item.price * item.qty);

    if (prospective > LIMIT) {
      alert(`El total de la compra no puede superar COP ${formatCOP(LIMIT)}. Ajusta la cantidad o elige otros productos.`);
      return;
    }

    const exists = cart.find(i => i.id === item.id);
    if (exists){
      exists.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart();
    updateCartUI();
    flashAdded(); 
  }

  function flashAdded(){
    cartBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300 });
  }

 
  function updateCartUI(){
    cartCount.textContent = cart.reduce((s,i) => s + i.qty, 0);
    cartItemsEl.innerHTML = '';
    if (cart.length === 0){
      cartItemsEl.innerHTML = '<p class="muted">Tu carrito está vacío.</p>';
      cartTotalEl.textContent = '0';
      return;
    }

    cart.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item';
      itemRow.innerHTML = `
        <img src="${item.img}" alt="${item.title}">
        <div class="meta">
          <p><strong>${item.title}</strong></p>
          <p class="muted">COP ${formatCOP(item.price)} × ${item.qty} = COP ${formatCOP(item.price * item.qty)}</p>
        </div>
        <div class="controls">
          <input type="number" min="1" value="${item.qty}" data-id="${item.id}" class="cart-qty" style="width:64px;padding:6px;border-radius:6px;background:#0b0b0b;color:#fff;border:1px solid rgba(255,255,255,0.04)">
          <button class="btn btn-ghost btn-remove" data-id="${item.id}">Eliminar</button>
        </div>
      `;
      cartItemsEl.appendChild(itemRow);
    });

    
    qa('.cart-qty').forEach(i => i.addEventListener('change', onCartQtyChange));
    qa('.btn-remove').forEach(b => b.addEventListener('click', onRemoveItem));

    const total = cart.reduce((s,i) => s + (i.price * i.qty), 0);
    cartTotalEl.textContent = formatCOP(total);
  }

  function onCartQtyChange(e){
    const id = e.target.getAttribute('data-id');
    const newQty = Math.max(1, Number(e.target.value));
   
    const otherTotal = cart.reduce((s,i) => i.id === id ? s : s + (i.price * i.qty), 0);
    const item = cart.find(i => i.id === id);
    const prospective = otherTotal + (item.price * newQty);
    if (prospective > LIMIT){
      alert(`No puedes fijar esa cantidad: el total superaría COP ${formatCOP(LIMIT)}.`);
      e.target.value = item.qty;
      return;
    }
    item.qty = newQty;
    saveCart();
    updateCartUI();
  }

  function onRemoveItem(e){
    const id = e.target.getAttribute('data-id');
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
  }

  function clearCart(){
    if (!confirm('¿Vaciar todo el carrito?')) return;
    cart = [];
    saveCart();
    updateCartUI();
  }

  function checkoutSimulated(){
    const total = cart.reduce((s,i) => s + (i.price * i.qty), 0);
    if (cart.length === 0){ alert('Tu carrito está vacío.'); return; }
    if (total > LIMIT){ alert('El total excede el límite permitido.'); return; }

  
    const summary = cart.map(i => `${i.title} x${i.qty} — COP ${formatCOP(i.price * i.qty)}`).join('\n');
    alert(`Compra simulada:\n\n${summary}\n\nTotal: COP ${formatCOP(total)}\n\n(En esta demo no se realiza pago real.)`);
   
    if (confirm('¿Deseas vaciar el carrito después de esta simulación?')) {
      clearCart();
      openCart(false);
    }
  }

  
  function attachTabs(){
    tabs.forEach(t => t.addEventListener('click', e => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.getAttribute('data-tab');
      filterProducts(tab);
    }));
  }

  function filterProducts(tab){
    productEls.forEach(p => {
      const cat = p.getAttribute('data-cat');
      if (tab === 'todos' || tab === cat) p.style.display = '';
      else p.style.display = 'none';
    });
  }

 
  function attachSearch(){
    searchInput.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      productEls.forEach(p => {
        const title = p.querySelector('.product-title').textContent.toLowerCase();
        const cat = p.getAttribute('data-cat').toLowerCase();
        if (!q || title.includes(q) || cat.includes(q)) p.style.display = '';
        else p.style.display = 'none';
      });
    });
  }

  q('#sendMsg').addEventListener('click', () => {
    alert('Mensaje simulado enviado. Usa WhatsApp para contacto real.');
    q('#contactForm').reset();
  });

})();
