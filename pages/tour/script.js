"use strict";

/* Telegram */
const tg = window.Telegram?.WebApp; tg?.ready?.(); tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;
if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) tg.swipeBehavior.disableVertical();

/* i18n */
const I18N = {
  ru: {
    title:"Экскурсии", heading:"Экскурсии",
    setup_filter:"Настроить фильтр", rent_date_tour:"Дата экскурсии",
    from:"От:", find:"Найти", choose_type_tour:"Выберите тип экскурсии",
    order_details:"Детали заказа", tour_title:"Экскурсия",
    rent_date_colon:"Дата:", total:"Итого:", per_person:"за человека",
    name:"Имя", phone:"Номер телефона", comments:"Комментарии",
    agree_with:"Я согласен с", rental_rules_btn:"правилами аренды",
    book:"Забронировать", success_title:"Заявка принята!",
    success_text:"Менеджер свяжется с вами в течение 15 минут",
    ok:"Ок", filtering:"Фильтрация", price_from:"Цена от", price_to:"Цена до",
    ph_name:"Ваше имя", ph_phone:"Ваш номер телефона", ph_comment:"Ваш комментарий",
    ph_price_from:"От", ph_price_to:"До",
    nav_home:"Главная", nav_cars:"Авто", nav_realty:"Недвижимость", nav_moto:"Мото", nav_tours:"Экскурсии",
    msg_pick_date:"Пожалуйста, выберите дату экскурсии",
    msg_no_tours:"Нет доступных экскурсий на выбранную дату",
    loading:"Загрузка...", sending:"Отправка...",
    day1:"день", day2:"дня", day5:"дней", deposit:"Депозит",
    promo_title:"Введите промокод для скидки",
    apply_promo:"Применить",
    promo_hint:"Скидка применяется к цене экскурсии",
  },
  en: {
    title:"Tours", heading:"Tours",
    setup_filter:"Filter", rent_date_tour:"Tour date",
    from:"From:", find:"Search", choose_type_tour:"Choose tour type",
    order_details:"Order details", tour_title:"Tour",
    rent_date_colon:"Date:", total:"Total:", per_person:"per person",
    name:"Name", phone:"Phone number", comments:"Comments",
    agree_with:"I agree with", rental_rules_btn:"rental rules",
    book:"Book", success_title:"Request submitted!",
    success_text:"Our manager will contact you within 15 minutes",
    ok:"OK", filtering:"Filters", price_from:"Price from", price_to:"Price to",
    ph_name:"Your name", ph_phone:"Your phone number", ph_comment:"Your comment",
    ph_price_from:"From", ph_price_to:"To",
    nav_home:"Home", nav_cars:"Cars", nav_realty:"Realty", nav_moto:"Moto", nav_tours:"Tours",
    msg_pick_date:"Please select a tour date",
    msg_no_tours:"No tours available for the selected date",
    loading:"Loading...", sending:"Sending...",
    day1:"day", day2:"days", day5:"days", deposit:"Deposit",
    promo_title:"Enter a promo code",
    apply_promo:"Apply",
    promo_hint:"Discount is applied to tour price",
  }
};

const langSelect = document.getElementById("langSelect");
let LANG = localStorage.getItem("rent_lang")
  || (navigator.language?.startsWith("en") ? "en" : "ru");
langSelect.value = LANG;

function t(k){ return I18N[LANG][k] ?? k; }
function applyI18n(){
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
}
langSelect.addEventListener("change", ()=>{
  LANG = langSelect.value; localStorage.setItem("rent_lang", LANG);
  applyI18n(); renderCategories(); applyFilters();
});
applyI18n();

/* DOM */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const startInput = document.getElementById("start-date");
const showBtn    = document.querySelector(".show");

/* modals & elements */
const bookingModal = document.getElementById("bookingModal");
const bookingClose = bookingModal?.querySelector(".close");
const bookingForm  = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

const modalSlider = bookingModal?.querySelector(".card-slider .slides");
const modalTitle = bookingModal?.querySelector(".tour-title");
const modalDesc  = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

const promoInput = document.getElementById("promoCode");
const promoBtn   = document.getElementById("applyPromo");
const promoMsg   = document.getElementById("promoMessage");

/* Filter UI */
const filterBtn   = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
const filterForm  = document.getElementById("filterForm");

/* Helpers */
const dayMs = 86400000;
const toLocalDate = (iso) => new Date(`${iso}T00:00:00`);
const fmt = (d) => d.toLocaleDateString(LANG==="en"?"en-GB":"ru-RU",{day:"2-digit",month:"short"});
const money = (n) => `${Number(n||0).toLocaleString(LANG==="en"?"en-GB":"ru-RU")} ฿`;
function decline(n){
  if (LANG==="en") return n===1?t("day1"):t("day2");
  if (n%10===1 && n%100!==11) return t("day1");
  if ([2,3,4].includes(n%10) && ![12,13,14].includes(n%100)) return t("day2");
  return t("day5");
}
const pad = (x)=>String(x).padStart(2,"0");

/* Lock past dates */
(function(){
  if (!startInput) return;
  const today = new Date();
  const min = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  startInput.min = min;
  startInput.addEventListener("input", ()=>{ if (startInput.value < min) startInput.value = min; });
})();

/* API */
const API = "https://rentareabackend.pythonanywhere.com/api/excursions";

/* State */
let allTours = [], allCategories = [], allBookings = [];
let selectedStart = null, selectedCategory = null, currentTour = null;
let priceFrom = null, priceTo = null;
let appliedPromo = null; // {code, discountAbs}

/* statuses that block availability */
const BLOCK = new Set(["active","pending","confirmed"]);

/* Fetchers */
async function fetchCategories(){
  const r = await fetch(`${API}/categories/`);
  const j = await r.json();
  allCategories = j?.results || [];
  const allLabel = LANG==="en"?"All":"Все";
  if (!allCategories.some(c => (c.title||"").trim().toLowerCase()===allLabel.toLowerCase())){
    allCategories.unshift({ title: allLabel, icon: "../../images/sliders.svg" });
  }
}
async function fetchTours(){
  const r = await fetch(`${API}/excursions/`);
  const j = await r.json();
  const city = localStorage.getItem("selectedCity");
  const list = j?.results || [];
  allTours = (!city || city==="Все" || city==="All") ? list : list.filter(t => t.city?.name === city);
}
async function fetchBookings(){
  try{
    const r = await fetch(`${API}/bookings/`);
    const j = await r.json();
    allBookings = (j?.results || []).filter(b => BLOCK.has(String(b.status).toLowerCase()));
  } catch(e){
    console.warn("bookings error", e);
    allBookings = [];
  }
}

/* Init */
(async function init(){
  await Promise.all([fetchCategories(), fetchTours()]);
  renderCategories();
  cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_date")}</p>`;
})();

/* Categories */
function renderCategories(){
  if (!allCategories.length){ categoriesContainer.innerHTML = "<p>—</p>"; return; }
  categoriesContainer.innerHTML = allCategories.map(c => `
    <div class="category" data-category="${c.title}">
      <img src="${c.icon}" alt="${c.title}">
      <p>${c.title}</p>
    </div>
  `).join("");
  const els = document.querySelectorAll(".category");
  els.forEach(el => el.addEventListener("click", ()=>{
    els.forEach(x=>x.classList.remove("active"));
    el.classList.add("active");
    selectedCategory = el.dataset.category;
    applyFilters();
  }));
  const allLabel = LANG==="en"?"All":"Все";
  const allEl = Array.from(els).find(e=>e.dataset.category===allLabel);
  (allEl || els[0])?.classList.add("active");
  selectedCategory = allEl ? allLabel : els[0]?.dataset.category;
}

/* Show */
showBtn?.addEventListener("click", async ()=>{
  selectedStart = startInput.value || null;
  if (!selectedStart){ alert(t("msg_pick_date")); return; }
  const old = showBtn.textContent; showBtn.disabled = true; showBtn.textContent = t("loading");
  await fetchBookings(); applyFilters();
  showBtn.disabled = false; showBtn.textContent = old;
});

/* Filter UI */
filterBtn?.addEventListener("click", ()=>{
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});
filterClose?.addEventListener("click", ()=>{
  filterModal.style.display = "none";
  document.body.style.overflow = "";
});
filterModal?.addEventListener("click", (e)=>{
  if (e.target === filterModal){
    filterModal.style.display = "none";
    document.body.style.overflow = "";
  }
});
filterForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const pf = Number(document.getElementById("priceFrom").value);
  const pt = Number(document.getElementById("priceTo").value);
  priceFrom = Number.isNaN(pf) ? null : pf;
  priceTo   = Number.isNaN(pt) ? null : pt;
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* Apply filters */
function applyFilters(){
  if (!selectedStart){
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_date")}</p>`;
    return;
  }
  let list = allTours.slice();

  const allLabel = LANG==="en"?"All":"Все";
  if (selectedCategory && selectedCategory !== allLabel){
    list = list.filter(t => t.category_title === selectedCategory);
  }

  // by availability — excursion has conflict if there's a booking matching the same date (>= start)
  const s = toLocalDate(selectedStart);
  list = list.map(t=>{
    const conflicts = (allBookings||[]).filter(b => b.excursion === t.id);
    const hasConflict = conflicts.some(b => toLocalDate(b.start_date) <= s && toLocalDate(b.end_date ?? b.start_date) >= s);
    return { ...t, __hasConflict: hasConflict };
  }).filter(t => !t.__hasConflict);

  // price filter
  if (priceFrom !== null) list = list.filter(t => Number(t.price_per_person) >= priceFrom);
  if (priceTo   !== null) list = list.filter(t => Number(t.price_per_person) <= priceTo);

  renderTours(list);
}

/* Slider init (for cards) */
function initSliders(scope=document){
  scope.querySelectorAll(".card-slider").forEach(slider => {
    const slides = slider.querySelector(".slides");
    const imgs = slides.querySelectorAll("img");
    let current = 0;

    let prev = slider.querySelector(".prev");
    let next = slider.querySelector(".next");
    if (!prev && imgs.length > 1){
      prev = document.createElement("button"); prev.className="prev"; prev.textContent="‹";
      next = document.createElement("button"); next.className="next"; next.textContent="›";
      slider.append(prev, next);
    }

    function show(i) {
      if (!imgs.length) return;
      if (i < 0) current = imgs.length - 1;
      else if (i >= imgs.length) current = 0;
      else current = i;
      slides.style.transform = `translateX(-${current * 100}%)`;
    }

    next?.addEventListener("click", () => show(current + 1));
    prev?.addEventListener("click", () => show(current - 1));

    let startX = 0;
    slides.addEventListener("touchstart", e => (startX = e.touches[0].clientX));
    slides.addEventListener("touchend", e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) show(current - 1);
      if (diff < -50) show(current + 1);
    });
  });
}

/* Render */
function renderTours(tours){
  if (!tours.length){
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_no_tours")}</p>`;
    return;
  }
  cardsContainer.innerHTML = tours.map(tour=>{
    const imgs = (tour.images?.length ? tour.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img loading="lazy" decoding="async" src="${img.image}" alt="${tour.title}">`)
      .join("");
    const price = Number(tour.price_per_person) || 0;
    const days = Math.max(1, Number(tour.days) || 1);
    const dateStr = selectedStart ? fmt(toLocalDate(selectedStart)) : "—";
    return `
      <div class="card" data-card="${tour.id}">
        <div class="card-slider">
          <div class="slides">${imgs}</div>
        </div>
        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${tour.title}</h4>
            <p>${days} ${decline(days)}</p>
          </div>
          <p class="descr-trunc">${tour.description || ""}</p>
          ${(tour.features?.length ? `<div class="goods">${tour.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}
          <div class="line"></div>
          <div class="price">
            <h4>${money(getDynamicTourPrice(tour, days))}</h4>
            <p>${t("per_person")} · ${dateStr}<br>${t("deposit")}: ${money(tour.deposit || 0)}</p>
          </div>
          <button class="openBooking" data-id="${tour.id}">${t("book")}</button>
        </div>
      </div>
    `;
  }).join("");

  initSliders(cardsContainer);

  document.querySelectorAll(".openBooking").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = Number(btn.dataset.id);
      const tour = tours.find(x=>x.id===id);
      if (tour) openBooking(tour);
    });
  });
}


/* Dynamic pricing (per person) */
function getDynamicTourPrice(tour, days) {
  const base = Number(tour.price_per_person) || 0;
  const tiers = (Array.isArray(tour.price_tiers) ? tour.price_tiers : [])
    .filter(x => x && x.is_active)
    .sort((a,b)=> Number(a.min_days) - Number(b.min_days));
  let per = base;
  for (const tr of tiers){
    const min = Number(tr.min_days) || 0;
    if (days >= min){
      const p = Number(tr.price_per_person ?? tr.price_per_day);
      if (!Number.isNaN(p)) per = p;
    } else break;
  }
  return per;
}

/* Promo */
function computeCurrentTotal(tour){
  const days = Math.max(1, Number(tour.days) || 1);
  return getDynamicTourPrice(tour, days); // per person
}
function updateTotalWithPromo(rentTotal){
  const discount = Math.max(0, Math.min(rentTotal, Number(appliedPromo?.discountAbs || 0)));
  const final = rentTotal - discount;
  modalTotal.textContent = money(final);
  if (promoMsg){
    if (discount > 0){
      promoMsg.textContent = `${LANG==="en"?"Applied discount":"Скидка применена"} −${money(discount)}`;
      promoMsg.style.color = "green";
    } else {
      promoMsg.textContent = t("promo_hint");
      promoMsg.style.color = "#6b7280";
    }
  }
}
async function tryApplyPromo(){
  const code = String(promoInput?.value || "").trim();
  if (!code){ promoMsg.textContent = LANG==="en"?"Enter a promo code":"Введите промокод"; promoMsg.style.color="red"; return; }
  if (!currentTour){ promoMsg.textContent = LANG==="en"?"Choose a tour first":"Сначала выберите экскурсию"; promoMsg.style.color="red"; return; }

  const subtotal = computeCurrentTotal(currentTour);
  promoMsg.textContent = LANG==="en"?"Checking…":"Проверяем…"; promoMsg.style.color="#6b7280";

  try{
    const res = await fetch("https://rentareabackend.pythonanywhere.com/api/promos/validate/", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        code,
        subtotal,
        product_type: "excursion",          // <— тип продукта для бэка
        product_id: Number(currentTour.id),
        start_date: selectedStart,
        end_date: selectedStart,
        user_id: user?.id ?? null
      }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.detail || "Promo error");
    if (out.valid && Number(out.discount) > 0){
      appliedPromo = { code, discountAbs: Number(out.discount) };
      updateTotalWithPromo(subtotal);
      tg?.HapticFeedback?.notificationOccurred?.("success");
    } else {
      appliedPromo = null;
      promoMsg.textContent = LANG==="en"?"Promo is invalid":"Промокод недействителен";
      promoMsg.style.color = "red";
      tg?.HapticFeedback?.notificationOccurred?.("error");
      updateTotalWithPromo(subtotal);
    }
  } catch(e){
    console.error(e);
    promoMsg.textContent = LANG==="en"?"Failed to apply promo":"Ошибка применения промокода";
    promoMsg.style.color = "red";
    tg?.HapticFeedback?.notificationOccurred?.("error");
  }
}
promoBtn?.addEventListener("click", tryApplyPromo);

/* Booking modal */
function openBooking(tour){
  currentTour = tour;
  appliedPromo = null; if (promoInput) promoInput.value = ""; updateTotalWithPromo(computeCurrentTotal(tour));

  // images
  if (modalSlider){
    const imgs = (tour.images?.length ? tour.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img src="${img.image}" alt="${tour.title}">`).join("");
    modalSlider.innerHTML = imgs;
    initSliders(bookingModal);
  }

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalTitle.textContent = tour.title || t("tour_title");
  modalDesc.textContent  = tour.description || "";

  if (selectedStart){
    const days = Math.max(1, Number(tour.days) || 1);
    modalRange.textContent = `${fmt(toLocalDate(selectedStart))} · ${days} ${decline(days)}`;
    updateTotalWithPromo(computeCurrentTotal(tour));
  } else {
    modalRange.textContent = "—"; modalTotal.textContent = "—";
  }

  setProviderRules(tour.rental_provider);
  bookingForm?.reset?.();
}

/* Close modals */
function closeBooking(){ bookingModal.style.display = "none"; document.body.style.overflow = ""; }
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e)=>{ if (e.target===bookingModal) closeBooking(); });
window.addEventListener("keydown", e => e.key==="Escape" && closeBooking());
closeSuccess?.addEventListener("click", ()=>{ successModal.style.display="none"; document.body.style.overflow=""; });

/* Submit */
bookingForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if (!currentTour) return alert(LANG==="en"?"Choose a tour":"Выберите экскурсию");
  if (!selectedStart) return alert(t("msg_pick_date"));

  const name = bookingForm.querySelector("input[data-i18n-ph='ph_name']")?.value.trim();
  const phone= bookingForm.querySelector("input[data-i18n-ph='ph_phone']")?.value.trim();
  const comment = bookingForm.querySelector("input[data-i18n-ph='ph_comment']")?.value.trim();

  const payload = {
    excursion: currentTour.id,
    start_date: selectedStart,
    telegram_id: user?.id || 102445,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment,
  };
  if (appliedPromo?.code) payload.promo_code = appliedPromo.code;

  const btn = bookingForm.querySelector(".btn");
  const old = btn.textContent; btn.disabled = true; btn.textContent = t("sending");
  try{
    const res = await fetch(`${API}/bookings/`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    tg?.HapticFeedback?.notificationOccurred?.("success");
    bookingModal.style.display = "none";
    successModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    await fetchBookings(); applyFilters();
  } catch(e){
    console.error(e);
    tg?.HapticFeedback?.notificationOccurred?.("error");
    alert("Error");
  } finally {
    btn.disabled = false; btn.textContent = old;
  }
});

/* Rules modal (shared) */
function ensureRulesModal(){
  if (document.getElementById("rulesModal")) return;
  const html = `
    <div class="modal" id="rulesModal" style="display:none;">
      <div class="modal-content" style="max-width:640px;margin:0 auto;">
        <span class="close rules-close">&times;</span>
        <h3 style="margin:0 0 12px;">${t("rental_rules_btn")[0].toUpperCase()+t("rental_rules_btn").slice(1)}</h3>
        <div class="rules-body" style="display:flex;flex-direction:column;gap:10px;"></div>
        <button type="button" class="btn rules-ok" style="margin-top:16px;">${t("ok")}</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const rm = document.getElementById("rulesModal");
  const close = ()=>{ rm.style.display="none"; document.body.style.overflow=""; };
  rm.querySelector(".rules-close").addEventListener("click", close);
  rm.querySelector(".rules-ok").addEventListener("click", close);
  rm.addEventListener("click", (e)=>{ if (e.target===rm) close(); });
  window.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && rm.style.display==="flex") close(); });
}
function openRulesModal(){ ensureRulesModal(); const rm = document.getElementById("rulesModal"); rm.style.display="flex"; document.body.style.overflow="hidden"; }
function setProviderRules(provider){
  ensureRulesModal();
  const box = document.querySelector("#rulesModal .rules-body");
  const esc = (s)=> String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const name = provider?.name ? ` ${LANG==="en"?"for":"для"} <b>${esc(provider.name)}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms){
    terms = LANG==="en"
      ? "Rental rules are temporarily not specified. Contact the provider for details."
      : "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  }
  const htmlTerms = esc(terms).replace(/\n/g,"<br>");
  const contacts = [
    provider?.phone    ? `<li>${LANG==="en"?"Phone":"Телефон"}: <b>${esc(provider.phone)}</b></li>` : "",
    provider?.telegram ? `<li>Telegram: <b>${esc(provider.telegram)}</b></li>` : "",
    provider?.email    ? `<li>Email: <b>${esc(provider.email)}</b></li>` : "",
  ].filter(Boolean).join("");
  box.innerHTML = `
    <p><b>${(LANG==="en"?"Rental rules":"Правила аренды")}${name}</b></p>
    <div style="color:#333;line-height:1.45">${htmlTerms}</div>
    ${contacts ? `<ul style="margin-top:12px;color:#555">${contacts}</ul>` : ""}
    <p style="color:#99A2AD;margin-top:8px">*${LANG==="en"?"Information provided by the lessor.":"Информация предоставлена арендодателем."}</p>
  `;
}
document.addEventListener("click", (e)=>{
  const link = e.target.closest(".rules-link");
  if (!link) return;
  e.preventDefault();
  setProviderRules(currentTour?.rental_provider || null);
  openRulesModal();
});

/* Recalc inside modal if date changed later */
startInput?.addEventListener("change", ()=>{
  selectedStart = startInput.value || null;
  if (selectedStart) applyFilters();
  if (bookingModal?.style?.display === "flex" && currentTour){
    const days = Math.max(1, Number(currentTour.days) || 1);
    modalRange.textContent = selectedStart ? `${fmt(toLocalDate(selectedStart))} · ${days} ${decline(days)}` : "—";
    updateTotalWithPromo(computeCurrentTotal(currentTour));
  }
});
