"use strict";

/* ==== Telegram bootstrap ==== */
const tg = window.Telegram?.WebApp;
tg?.ready?.(); tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;
if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) {
  tg.swipeBehavior.disableVertical();
}

/* ==== i18n ==== */
const I18N = {
  ru: {
    title:"Мотоциклы",
    heading:"Мотоциклы",
    sort_by_price:"Сортировка:",
    sort_none:"Без сортировки",
    sort_asc:"По возрастанию цены",
    sort_desc:"По убыванию цены",
    setup_filter:"Настроить фильтр",
    rent_date:"Дата аренды",
    from:"От:",
    to:"До:",
    find:"Найти",
    choose_type_moto:"Выберите тип мотоцикла",
    order_details:"Детали заказа",
    moto_title:"Мотоцикл",
    rent_date_colon:"Дата аренды:",
    total:"Итого:",
    name:"Имя",
    phone:"Номер телефона",
    comments:"Комментарии",
    delivery:"Доставка",
    pickup:"Самовывоз",
    delivery_addr:"Доставка (укажите адрес в комментарии)",
    agree_with:"Я согласен с",
    rental_rules_btn:"правилами аренды",
    book:"Забронировать",
    success_title:"Ваша заявка принята!",
    success_text:"В течении 15 минут с вами свяжутся наши менеджеры)",
    ok:"Ок",
    filtering:"Фильтрация",
    brand:"Марка",
    model:"Модель",
    year_from:"Год выпуска (от)",
    color:"Цвет",
    transmission:"Коробка передач",
    any:"Любая",
    white:"Белый", black:"Черный", red:"Красный", silver:"Серебристый", blue:"Синий",
    nav_home:"Главная", nav_cars:"Авто", nav_realty:"Недвижимость", nav_moto:"Мото", nav_tours:"Экскурсии",
    ph_name:"Ваше имя", ph_phone:"Ваш номер телефона", ph_comment:"Ваш комментарий",
    ph_year_from:"Год от", ph_price_from:"От", ph_price_to:"До",
    msg_pick_dates:"Пожалуйста, выберите даты аренды",
    msg_choose_both:"Выберите обе даты",
    msg_no_motos:"Нет доступных мотоциклов",
    loading:"Загрузка...", sending:"Отправка...",
    per_day:"/день", deposit:"Депозит",
    day1:"день", day2:"дня", day5:"дней"
  },
  en: {
    title:"Motorcycles",
    heading:"Motorcycles",
    sort_by_price:"Sort:",
    sort_none:"No sorting",
    sort_asc:"Price ↑",
    sort_desc:"Price ↓",
    setup_filter:"Filter",
    rent_date:"Rental dates",
    from:"From:",
    to:"To:",
    find:"Search",
    choose_type_moto:"Choose motorcycle type",
    order_details:"Order details",
    moto_title:"Motorcycle",
    rent_date_colon:"Rental dates:",
    total:"Total:",
    name:"Name",
    phone:"Phone number",
    comments:"Comments",
    delivery:"Delivery",
    pickup:"Pickup",
    delivery_addr:"Delivery (specify address in comments)",
    agree_with:"I agree with",
    rental_rules_btn:"rental rules",
    book:"Book",
    success_title:"Request submitted!",
    success_text:"Our manager will contact you within 15 minutes.",
    ok:"OK",
    filtering:"Filtering",
    brand:"Brand",
    model:"Model",
    year_from:"Year (from)",
    color:"Color",
    transmission:"Transmission",
    any:"Any",
    white:"White", black:"Black", red:"Red", silver:"Silver", blue:"Blue",
    nav_home:"Home", nav_cars:"Cars", nav_realty:"Realty", nav_moto:"Moto", nav_tours:"Tours",
    ph_name:"Your name", ph_phone:"Your phone number", ph_comment:"Your comment",
    ph_year_from:"Year from", ph_price_from:"From", ph_price_to:"To",
    msg_pick_dates:"Please select rental dates",
    msg_choose_both:"Choose both dates",
    msg_no_motos:"No motorcycles available",
    loading:"Loading...", sending:"Sending...",
    per_day:"/day", deposit:"Deposit",
    day1:"day", day2:"days", day5:"days"
  }
};

const langSelect = document.getElementById("langSelect");
let LANG = localStorage.getItem("rent_lang")
  || (navigator.language?.startsWith("en") ? "en" : "ru");
langSelect.value = LANG;

function t(key){ return I18N[LANG][key] ?? key; }
function applyI18n() {
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(el => el.innerHTML = t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
}
langSelect.addEventListener("change", ()=>{
  LANG = langSelect.value;
  localStorage.setItem("rent_lang", LANG);
  applyI18n();
  renderCategories();
  applyFilters();
});
applyI18n();

/* ==== DOM ==== */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer      = document.querySelector(".cards");
const startInput          = document.getElementById("start-date");
const endInput            = document.getElementById("end-date");
const showBtn             = document.querySelector(".show");
const sortSelect          = document.getElementById("sortPrice");

/* Modals */
const bookingModal  = document.getElementById("bookingModal");
const bookingForm   = document.getElementById("bookingForm");
const successModal  = document.getElementById("successModal");
const closeSuccess  = document.getElementById("closeSuccess");
const bookingClose  = bookingModal?.querySelector(".close");

/* Elements inside booking modal */
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".modal-title");
const modalDesc  = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");
const modalEngine= bookingModal?.querySelector(".engine");
const modalGear  = bookingModal?.querySelector(".gear");
const modalMileage= bookingModal?.querySelector(".mileage");
const modalOil   = bookingModal?.querySelector(".oil");

/* Promo */
const promoInput = document.getElementById("promoCode");
const promoBtn   = document.getElementById("applyPromo");
const promoMsg   = document.getElementById("promoMessage");

/* Filter modal */
const filterBtn        = document.querySelector(".filter");
const filterModal      = document.getElementById("filterModal");
const filterClose      = filterModal?.querySelector(".close");
const filterForm       = document.getElementById("filterForm");
const filterBrandInput = document.getElementById("filterBrand");
const filterModelInput = document.getElementById("filterModel");
const filterYearInput  = document.getElementById("filterYear");
const filterColorInput = document.getElementById("filterColor");
const filterTransInput = document.getElementById("filterTransmission");
const priceFromInput   = document.getElementById("priceFrom");
const priceToInput     = document.getElementById("priceTo");

/* ==== Helpers ==== */
const dayMs = 24*60*60*1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmt = (d) => d.toLocaleDateString(LANG==="en"?"en-GB":"ru-RU",{day:"2-digit",month:"short"});
const money = (n) => `${Number(n||0).toLocaleString(LANG==="en"?"en-GB":"ru-RU")} ฿`;
const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart < bEnd) && (aEnd > bStart);

function rentalDays(startISO, endISO) {
  const s = toLocalDate(startISO), e = toLocalDate(endISO);
  const diff = Math.ceil((e - s) / dayMs);
  return Math.max(1, diff);
}
function declineDays(n){
  if (LANG==="en") return n===1?t("day1"):t("day2");
  if (n%10===1 && n%100!==11) return t("day1");
  if ([2,3,4].includes(n%10) && ![12,13,14].includes(n%100)) return t("day2");
  return t("day5");
}
const pad = (x) => String(x).padStart(2,"0");

/* === Запрет прошедших дат и согласование диапазона === */
(function lockPastDates() {
  if (!startInput || !endInput) return;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  startInput.min = todayStr; endInput.min = todayStr;
  startInput.addEventListener("focus", ()=> startInput.min = todayStr);
  endInput.addEventListener("focus",  ()=> endInput.min  = startInput.value || todayStr);
  startInput.addEventListener("change", ()=>{
    const s = startInput.value; if (!s) return;
    endInput.min = s; if (endInput.value && endInput.value < s) endInput.value = s;
  });
  startInput.addEventListener("input", ()=>{ if (startInput.value && startInput.value < todayStr) startInput.value = todayStr; });
  endInput.addEventListener("input",   ()=>{
    const minEnd = endInput.min || todayStr;
    if (endInput.value && endInput.value < minEnd) endInput.value = minEnd;
  });
})();

/* ==== API ==== */
const API = "https://rentareabackend.pythonanywhere.com/api/motorcycles";

/* ==== State ==== */
let allMotorcycles = [];
let allCategories  = [];
let allBookings    = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd   = null;
let currentMoto   = null;

let appliedPromo = null; // {code, discountAbs}

/* filter state */
let fBrand = "";
let fModel = "";
let fYear  = "";
let fColor = "";
let fTrans = "";
let fPriceFrom = "";
let fPriceTo   = "";
let sortMode   = "none";

/* statuses that block availability */
const BLOCK = new Set(["active","pending","confirmed"]);

/* ==== Fetchers ==== */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
  const allLabel = LANG==="en"?"All":"Все";
  const hasAll = allCategories.some(c => (c.title||"").trim().toLowerCase() === allLabel.toLowerCase());
  if (!hasAll) allCategories.unshift({ title: allLabel, icon: "../../images/sliders.svg" });
}
async function fetchMotorcycles() {
  const r = await fetch(`${API}/motorcycles/`);
  const data = await r.json();
  const city = localStorage.getItem('selectedCity');
  const list = data?.results || [];
  allMotorcycles = (!city || city === 'Все' || city === 'All') ? list : list.filter(i => i.city?.name === city);
}
async function fetchBookings() {
  try {
    const r = await fetch(`${API}/bookings/`);
    const data = await r.json();
    allBookings = (data?.results || []).filter(b => BLOCK.has(String(b.status).toLowerCase()));
  } catch (e) {
    console.warn("booking load error:", e);
    allBookings = [];
  }
}

/* ==== Init ==== */
(async function init(){
  await Promise.all([fetchCategories(), fetchMotorcycles()]);
  renderCategories();
  hydrateFiltersFromDataset(allMotorcycles);
  cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_dates")}</p>`;
})();

/* ==== Categories ==== */
function renderCategories() {
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>—</p>"; return;
  }
  categoriesContainer.innerHTML = allCategories.map(
    (c) => `
      <div class="category" data-category="${c.title}">
        <img src="${c.icon}" alt="${c.title}">
        <p>${c.title}</p>
      </div>`
  ).join("");

  const catElems = document.querySelectorAll(".category");
  catElems.forEach((el) => {
    el.addEventListener("click", () => {
      catElems.forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      selectedCategory = el.getAttribute("data-category");
      applyFilters();
    });
  });

  const allLabel = LANG==="en"?"All":"Все";
  const allEl = Array.from(catElems).find(el => el.dataset.category === allLabel);
  (allEl || catElems[0])?.classList.add("active");
  selectedCategory = allEl ? allLabel : catElems[0]?.dataset.category || null;
}

/* Build brand/model lists from dataset (fallback if API lists not used) */
function hydrateFiltersFromDataset(list){
  if (!filterBrandInput || !filterModelInput) return;
  const brands = [...new Set(list.map(i => i.brand?.name || i.brand || "").filter(Boolean))].sort();
  filterBrandInput.innerHTML = `<option value="">${t("any")}</option>` + brands.map(b=>`<option value="${b}">${b}</option>`).join("");

  const models = [...new Set(list.map(i => i.model?.name || i.model || "").filter(Boolean))].sort();
  filterModelInput.innerHTML = `<option value="">${t("any")}</option>` + models.map(m=>`<option value="${m}">${m}</option>`).join("");

  filterBrandInput.onchange = () => {
    fBrand = filterBrandInput.value;
    const scoped = fBrand ? list.filter(i => (i.brand?.name || i.brand) === fBrand) : list;
    const subModels = [...new Set(scoped.map(i => i.model?.name || i.model || "").filter(Boolean))].sort();
    filterModelInput.innerHTML = `<option value="">${t("any")}</option>` + subModels.map(m=>`<option value="${m}">${m}</option>`).join("");
  };
}

/* Filter modal open */
filterBtn?.addEventListener("click", () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

/* Date search */
showBtn?.addEventListener("click", async () => {
  selectedStart = startInput?.value || null;
  selectedEnd   = endInput?.value || null;

  if (!selectedStart || !selectedEnd) {
    alert(t("msg_choose_both"));
    return;
  }
  showBtn.disabled = true;
  const old = showBtn.textContent;
  showBtn.textContent = t("loading");

  await fetchBookings();
  applyFilters();

  showBtn.disabled = false;
  showBtn.textContent = old;
});

/* Sorting select */
sortSelect?.addEventListener("change", () => {
  sortMode = sortSelect.value || "none";
  applyFilters();
});

/* ==== Apply filters ==== */
function applyFilters() {
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_dates")}</p>`;
    return;
  }

  let list = allMotorcycles.slice();
  const allLabel = LANG==="en"?"All":"Все";
  if (selectedCategory && selectedCategory !== allLabel) {
    list = list.filter(m => (m.category_title || "") === selectedCategory);
  }

  // brand/model/year/color/transmission/price
  const getBrandId = (m) => String(m.brand?.id ?? m.brand ?? "");
  const getModelId = (m) => String(m.model?.id ?? m.model ?? "");

  if (fBrand) list = list.filter(m => getBrandId(m) === String(fBrand) || (m.brand?.name === fBrand));
  if (fModel) list = list.filter(m => getModelId(m) === String(fModel) || (m.model?.name === fModel));
  if (fYear)  list = list.filter(m => Number(m.year || 0) >= Number(fYear));
  if (fColor) list = list.filter(m => (m.color || "").toLowerCase() === fColor.toLowerCase());
  if (fTrans) list = list.filter(m => (m.transmission || "").toUpperCase() === fTrans.toUpperCase());
  if (fPriceFrom !== "" && !Number.isNaN(Number(fPriceFrom))) list = list.filter(m => Number(m.price_per_day) >= Number(fPriceFrom));
  if (fPriceTo   !== "" && !Number.isNaN(Number(fPriceTo)))   list = list.filter(m => Number(m.price_per_day) <= Number(fPriceTo));

  // availability by bookings
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list
    .map((m) => {
      const conflicts = (allBookings||[]).filter((b) => b.motorcycle === m.id);
      const hasConflict = conflicts.some((b) => overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date)));
      return { ...m, __hasConflict: hasConflict };
    })
    .filter(m => !m.__hasConflict);

  // sorting
  if (sortMode === "asc")  list.sort((a,b)=> Number(a.price_per_day)-Number(b.price_per_day));
  if (sortMode === "desc") list.sort((a,b)=> Number(b.price_per_day)-Number(a.price_per_day));

  renderMotorcycles(list);
}

/* ==== Slider ==== */
function initSliders() {
  document.querySelectorAll(".card-slider").forEach(slider => {
    const slides = slider.querySelector(".slides");
    const imgs = slides.querySelectorAll("img");
    let current = 0;

    const prev = slider.querySelector(".prev");
    const next = slider.querySelector(".next");

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

/* ==== Render ==== */
function renderMotorcycles(motos) {
  if (!motos.length) {
    cardsContainer.innerHTML = `<p style='text-align:center;color:#99A2AD;margin-top:40px;'>${t("msg_no_motos")}</p>`;
    return;
  }

  cardsContainer.innerHTML = motos.map((m) => {
    const images = (m.images?.length ? m.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img loading="lazy" decoding="async" src="${img.image}" alt="${m.title}">`)
      .join("");

    // price block
    const block = (() => {
      let days = 1, perDay = Number(m.price_per_day) || 0, total = perDay;
      if (selectedStart && selectedEnd) {
        days = rentalDays(selectedStart, selectedEnd);
        perDay = getDynamicPrice(m, days);
        total = perDay * days;
      }
      const labelDays = `${days} ${declineDays(days)}`;
      const perDayLabel = `${money(perDay)} ${t("per_day")}`;
      const deposit = `${t("deposit")}: ${money(m.deposit || 0)}`;
      return `<h4>${money(total)}</h4><p>${perDayLabel} · ${labelDays}<br>${deposit}</p>`;
    })();

    return `
      <div class="card" data-card="${m.id}">
        <div class="card-slider">
          <div class="slides">${images}</div>
          ${m.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${m.title}</h4>
            <p>${m.year || "—"}, ${m.color || "—"}</p>
          </div>

          <div style="display:flex;gap:10px;overflow-x:auto;">
            <li><img src="../../images/car_parameters/motor.svg" alt="motor"> ${m.engine_volume ? `${m.engine_volume} CC` : "—"}</li>
            <li><img src="../../images/car_parameters/settings.svg" alt="settings"> ${m.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg" alt="road"> ${m.mileage ? `${m.mileage} km` : "—"}</li>
            <li><img src="../../images/car_parameters/oil.svg" alt="oil"> ${m.oil_type || "—"}</li>
          </div>

          ${(m.features?.length ? `<div class="goods">${m.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}
          <div class="line"></div>

          <div class="price">${block}</div>
          <button class="openBooking" data-id="${m.id}">${t("book")}</button>
        </div>
      </div>`;
  }).join("");

  initSliders();

  document.querySelectorAll(".openBooking").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const moto = motos.find((m) => m.id === id);
      if (moto) openBookingForMoto(moto);
    })
  );
}

/* ==== Dynamic pricing tiers ==== */
function getDynamicPrice(moto, days) {
  const base = Number(moto.price_per_day) || 0;
  const tiers = (Array.isArray(moto.price_tiers) ? moto.price_tiers : [])
    .filter(t => t && t.is_active)
    .sort((a, b) => Number(a.min_days) - Number(b.min_days));
  let perDay = base;
  for (const t of tiers) {
    const min = Number(t.min_days) || 0;
    if (days >= min) {
      const p = Number(t.price_per_day);
      if (!Number.isNaN(p)) perDay = p;
    } else break;
  }
  return perDay;
}

/* ==== Promo helpers ==== */
function computeCurrentTotal(moto){
  if (!moto) return 0;
  if (selectedStart && selectedEnd){
    const n = rentalDays(selectedStart, selectedEnd);
    return getDynamicPrice(moto, n) * n;
  }
  return Number(moto.price_per_day) || 0;
}
function updateTotalWithPromo(rentTotal) {
  const discount = Math.max(0, Math.min(rentTotal, Number(appliedPromo?.discountAbs || 0)));
  const final = rentTotal - discount;
  modalTotal.textContent = money(final);
  if (discount > 0) {
    promoMsg.textContent = `✅ Промокод применён. Скидка −${money(discount)}`;
    promoMsg.style.color = "green";
  } else {
    promoMsg.textContent = "Скидка не применяется";
    promoMsg.style.color = "#6b7280";
  }
}
async function tryApplyPromo() {
  const code = String(promoInput?.value || "").trim();
  if (!code) { promoMsg.textContent = "Введите промокод"; promoMsg.style.color = "red"; return; }
  if (!currentMoto?.id) { promoMsg.textContent = "Сначала выберите мотоцикл"; promoMsg.style.color = "red"; return; }

  const rentTotal = computeCurrentTotal(currentMoto);
  promoMsg.textContent = "Проверяем..."; promoMsg.style.color = "#6b7280";

  try {
    const res = await fetch("https://rentareabackend.pythonanywhere.com/api/promos/validate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        subtotal: rentTotal,
        product_type: "motorcycle",          // ВАЖНО: как в твоих моделях
        product_id: Number(currentMoto.id),
        start_date: selectedStart,
        end_date: selectedEnd,
        user_id: user?.id ?? null
      }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.detail || "Ошибка проверки");

    if (out.valid && Number(out.discount) > 0) {
      appliedPromo = { code, discountAbs: Number(out.discount) };
      updateTotalWithPromo(rentTotal);
      tg?.HapticFeedback?.notificationOccurred?.("success");
    } else {
      appliedPromo = null;
      promoMsg.textContent = "❌ Промокод недействителен";
      promoMsg.style.color = "red";
      tg?.HapticFeedback?.notificationOccurred?.("error");
      updateTotalWithPromo(rentTotal);
    }
  } catch (err) {
    console.error(err);
    promoMsg.textContent = "Ошибка при проверке промокода";
    promoMsg.style.color = "red";
    tg?.HapticFeedback?.notificationOccurred?.("error");
  }
}
promoBtn?.addEventListener("click", tryApplyPromo);

/* ==== Booking modal open ==== */
function openBookingForMoto(moto) {
  currentMoto = moto;

  // сброс промо при каждом открытии
  appliedPromo = null;
  if (promoInput) promoInput.value = "";
  if (promoMsg) { promoMsg.textContent = "Скидка применяется только к аренде"; promoMsg.style.color="#6b7280"; }

  if (modalPhoto)  modalPhoto.src = moto.images?.[0]?.image || "../../images/no_photo.png";
  if (modalTitle)  modalTitle.textContent = moto.title || t("moto_title");
  if (modalDesc)   modalDesc.textContent  = moto.description || "";
  if (modalEngine) modalEngine.textContent= (moto.engine_volume ? `${moto.engine_volume} CC` : "—");
  if (modalGear)   modalGear.textContent  = moto.transmission || "—";
  if (modalMileage)modalMileage.textContent= (moto.mileage ? `${moto.mileage} km` : "—");
  if (modalOil)    modalOil.textContent   = moto.oil_type || "—";

  if (selectedStart && selectedEnd) {
    const n = rentalDays(selectedStart, selectedEnd);
    modalRange.textContent = `${fmt(toLocalDate(selectedStart))} — ${fmt(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
  } else {
    modalRange.textContent = "—";
  }

  const total = computeCurrentTotal(moto);
  updateTotalWithPromo(total);

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  bookingForm?.reset?.();
}

/* ==== Close modals ==== */
function closeBooking() {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => { if (e.target?.id === "bookingModal") closeBooking(); });
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());
closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ==== Booking submit ==== */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentMoto) return alert(LANG==="en"?"Select a motorcycle":"Выберите мотоцикл");
  if (!selectedStart || !selectedEnd) return alert(t("msg_choose_both"));

  const name    = bookingForm.querySelector("input[data-i18n-ph='ph_name']")?.value.trim();
  const phone   = bookingForm.querySelector("input[data-i18n-ph='ph_phone']")?.value.trim();
  const comment = bookingForm.querySelector("input[data-i18n-ph='ph_comment']")?.value.trim();
  const deliveryType = document.getElementById("deliveryType")?.value || "pickup";

  const payload = {
    motorcycle: currentMoto.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user?.id || 112345,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment: `[delivery:${deliveryType}] ${comment || ""}`.trim(),
  };
  if (appliedPromo?.code) payload.promo_code = appliedPromo.code;

  const btn = bookingForm.querySelector(".btn");
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("sending");

  try {
    const res = await fetch(`${API}/bookings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());

    tg?.HapticFeedback?.notificationOccurred?.("success");
    bookingModal.style.display = "none";
    successModal.style.display = "flex";
    document.body.style.overflow = "hidden";

    await fetchBookings();
    applyFilters();
  } catch (err) {
    console.error(err);
    tg?.HapticFeedback?.notificationOccurred?.("error");
    alert("Error");
  } finally {
    btn.disabled = false;
    btn.textContent = prevText;
  }
});

/* ==== Filter modal behaviour ==== */
filterClose?.addEventListener("click", () => {
  filterModal.style.display = "none";
  document.body.style.overflow = "";
});
filterModal?.addEventListener("click", (e) => {
  if (e.target.id === "filterModal") {
    filterModal.style.display = "none";
    document.body.style.overflow = "";
  }
});
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  fBrand     = filterBrandInput?.value || "";
  fModel     = filterModelInput?.value || "";
  fYear      = filterYearInput?.value || "";
  fColor     = filterColorInput?.value || "";
  fTrans     = filterTransInput?.value || "";
  fPriceFrom = priceFromInput?.value ?? "";
  fPriceTo   = priceToInput?.value ?? "";
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* ==== Rules modal (shared) ==== */
function ensureRulesModal() {
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
  const close = () => { rm.style.display = "none"; document.body.style.overflow = ""; };
  rm.querySelector(".rules-close").addEventListener("click", close);
  rm.querySelector(".rules-ok").addEventListener("click", close);
  rm.addEventListener("click", (e)=>{ if (e.target===rm) close(); });
  window.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && rm.style.display==="flex") close(); });
}
function openRulesModal() {
  ensureRulesModal();
  const rm = document.getElementById("rulesModal");
  rm.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function setProviderRules(provider) {
  ensureRulesModal();
  const box = document.querySelector("#rulesModal .rules-body");
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const name = provider?.name ? ` ${LANG==="en"?"for":"для"} <b>${esc(provider.name)}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms) {
    terms = LANG==="en"
      ? "Rental rules are temporarily not specified. Contact the provider for details."
      : "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  }
  const htmlTerms = esc(terms).replace(/\n/g, "<br>");
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
document.addEventListener("click", (e) => {
  const link = e.target.closest(".rules-link");
  if (!link) return;
  e.preventDefault();
  setProviderRules(currentMoto?.rental_provider || null);
  openRulesModal();
});

/* ==== react to date change inside open modal (recalc price & promo) ==== */
[startInput, endInput].forEach(inp => {
  inp?.addEventListener("change", () => {
    selectedStart = startInput?.value || null;
    selectedEnd   = endInput?.value || null;
    if (selectedStart && selectedEnd) applyFilters();

    if (bookingModal?.style?.display === "flex" && currentMoto) {
      const n = (selectedStart && selectedEnd) ? rentalDays(selectedStart, selectedEnd) : 0;
      if (n > 0) {
        modalRange.textContent = `${fmt(toLocalDate(selectedStart))} — ${fmt(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
      } else {
        modalRange.textContent = "—";
      }
      const total = computeCurrentTotal(currentMoto);
      updateTotalWithPromo(total);
    }
  });
});
