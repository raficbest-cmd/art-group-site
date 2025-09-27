(async function () {
  const page = document.body.dataset.page;
  const load = async () => (await fetch('data/products.json')).json();
  const fmt = n => n.toLocaleString('ru-RU');
  const byId = s => document.querySelector(s);

  // ---------- CATALOG ----------
  async function initCatalog() {
    const db = await load();
    const state = { brands: new Set(), tech: new Set(), sort: 'popular' };

    const elBrands = byId('#f-brands');
    const elTech = byId('#f-tech');
    const elGrid = byId('#grid');
    const elFound = byId('#found');
    const elSort = byId('#sort');
    const elReset = byId('#reset');

    const brands = [...new Set(db.map(x => x.brand))];
    const techs = [...new Set(db.map(x => x.technology))];

    const mkChip = (txt, onClick) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = txt;
      b.onclick = () => { b.classList.toggle('on'); onClick(b.classList.contains('on')); render(); };
      return b;
    };

    brands.forEach(name => elBrands.append(mkChip(name, on => on ? state.brands.add(name) : state.brands.delete(name))));
    techs.forEach(name => elTech.append(mkChip(name, on => on ? state.tech.add(name) : state.tech.delete(name))));

    elSort.onchange = () => { state.sort = elSort.value; render(); };
    elReset.onclick = () => {
      state.brands.clear(); state.tech.clear();
      elBrands.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
      elTech.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
      elSort.value='popular'; state.sort='popular'; render();
    };

    function minPrice(p){ return Math.min(...p.variants.map(v => v.price)); }
    function sortArr(arr){
      if (state.sort==='popular') return arr.sort((a,b)=>b.popular-a.popular);
      if (state.sort==='price-asc') return arr.sort((a,b)=>minPrice(a)-minPrice(b));
      if (state.sort==='price-desc') return arr.sort((a,b)=>minPrice(b)-minPrice(a));
      return arr;
    }
    function applyFilters(){
      return db.filter(p=>{
        const okBrand = state.brands.size ? state.brands.has(p.brand) : true;
        const okTech  = state.tech.size ? state.tech.has(p.technology) : true;
        return okBrand && okTech;
      });
    }
    function cardHtml(p){
      const price = minPrice(p);
      return `
        <a class="card" href="product.html?id=${encodeURIComponent(p.id)}">
          <div class="card__img"></div>
          <div class="card__body">
            <div class="card__title">${p.brand} · ${p.collection}</div>
            <div class="card__meta">Варианты: цвет/толщина внутри</div>
            <div class="card__price">от <b>${fmt(price)} ₽/м²</b></div>
          </div>
        </a>`;
    }
    function render(){
      const arr = sortArr(applyFilters());
      elFound.textContent = `Найдено: ${arr.length}`;
      elGrid.innerHTML = arr.map(cardHtml).join('');
    }
    render();
  }

  // ---------- PRODUCT ----------
  async function initProduct() {
    const db = await load();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const p = db.find(x => x.id === id) || db[0];

    const elName = byId('#p-name');
    const elSub  = byId('#p-sub');
    const elPrice= byId('#p-price');
    const elCons = byId('#p-cons');
    const elColors = byId('#p-colors');
    const elThk = byId('#p-thk');
    const elArea= byId('#p-area');
    const elPerM2=byId('#p-perm2');
    const elQty = byId('#p-total-qty');
    const elCost= byId('#p-total-cost');

    elName.textContent = `${p.brand} · ${p.collection}`;
    elSub.textContent  = `${p.technology}`;
    elPerM2.value = p.consumption || 36;

    const colors = [...new Map(p.variants.map(v => [v.color, v.hex || '#666'])).entries()]
                   .map(([color,hex])=>({color,hex}));
    const thks = [...new Set(p.variants.map(v => v.thickness))].sort((a,b)=>a-b);

    let sel = { color: colors[0].color, thickness: thks[0] };
    function currentVar(){ return p.variants.find(v => v.color===sel.color && v.thickness===sel.thickness); }
    function priceText(){ const v=currentVar(); return v ? `${fmt(v.price)} ₽/м²` : '—'; }

    function renderColors(){
      elColors.innerHTML='';
      colors.forEach(c=>{
        const b=document.createElement('button');
        b.className='sw'+(c.color===sel.color?' on':'');
        b.style.background=c.hex; b.title=c.color;
        b.onclick=()=>{ sel.color=c.color; renderAll(); };
        elColors.append(b);
      });
    }
    function renderThk(){
      elThk.innerHTML='';
      thks.forEach(t=>{
        const b=document.createElement('button');
        b.className='chip'+(t===sel.thickness?' on':'');
        b.textContent=`${t} мм`;
        b.onclick=()=>{ sel.thickness=t; renderAll(); };
        elThk.append(b);
      });
    }
    function calc(){
      const v=currentVar(); if(!v) return {qty:0,cost:0};
      const area=Math.max(0, Number(elArea.value)||0);
      const perm2=Math.max(1, Number(elPerM2.value)||1);
      const qty=Math.ceil(area*perm2);
      const cost=Math.round(area*v.price);
      return {qty,cost};
    }
    function renderAll(){
      elPrice.textContent=priceText();
      elCons.textContent=`${elPerM2.value} шт/м²`;
      const {qty,cost}=calc();
      elQty.textContent=fmt(qty);
      elCost.textContent=fmt(cost);
      renderColors();
      renderThk();
    }
    elArea.oninput = elPerM2.oninput = renderAll;
    renderAll();
  }

  const pageType = document.body.dataset.page;
  if (pageType === 'catalog') initCatalog();
  if (pageType === 'product') initProduct();
})();
