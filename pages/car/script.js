"use strict";

/* ===== Telegram Mini App ===== */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;

if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) {
  tg.swipeBehavior.disableVertical();
  console.log("🔒 Vertical swipe disabled");
}

/* ===== i18n ===== */
const I18N = {
  ru: {
    title:"Авто — Telegram Mini App",
    cars_title:"Автомобили",
    sorting:"Сортировка:",
    sort_none:"Без сортировки",
    sort_asc:"По возрастанию цены",
    sort_desc:"По убыванию цены",
    setup_filter:"Настроить фильтр",
    rent_date:"Дата аренды",
    from:"От:", to:"До:", find:"Найти",
    choose_class:"Выберите класс автомобиля",
    order_details:"Детали заказа",
    car_name_fallback:"Название автомобиля",
    rent_date_colon:"Дата аренды:",
    total:"Итого:",
    name:"Имя", phone:"Номер телефона", delivery:"Доставка", comments:"Комментарии",
    agree_with:"Я согласен с", rental_rules_btn:"правилами аренды",
    book:"Забронировать",
    rental_rules_title:"Правила аренды",
    rules_stub1:"<b>1. Общие условия.</b> Минимальный срок аренды — 1 сутки. Документы и залог требуются согласно условиям компании.",
    rules_stub2:"<b>2. Оплата.</b> Аренда оплачивается авансом. Дополнительно могут взиматься: доставка, депозит, опции.",
    rules_stub3:"<b>3. Депозит.</b> Возвращается после проверки авто/имущества при отсутствии нарушений и штрафов.",
    rules_stub4:"<b>4. Использование.</b> Запрещены гонки, буксировка, передача управления третьим лицам без согласования.",
    rules_stub5:"<b>5. Штрафы и повреждения.</b> Штрафы и ущерб оплачиваются арендатором согласно акту.",
    rules_stub6:"<b>6. Возврат.</b> Возврат в оговорённое время. Просрочка тарифицируется как дополнительный период.",
    rules_stub_note:"*Это шаблон. Подставь сюда свои актуальные правила.",
    ok:"Понятно",
    success_title:"Ваша заявка принята!",
    success_text:"В течении 15 минут с вами свяжутся наши менеджеры)",
    filtering:"Фильтрация",
    brand:"Марка", model:"Модель",
    year_from:"Год выпуска (от)", color:"Цвет",
    transmission:"Коробка передач",
    any:"Любой", white:"Белый", black:"Черный", red:"Красный", silver:"Серебристый", blue:"Синий",
    price_from:"Цена от", price_to:"Цена до",
    nav_home:"Главная", nav_cars:"Авто", nav_realty:"Недвижимость", nav_moto:"Мото", nav_tours:"Экскурсии",
    ph_name:"Ваше имя", ph_phone:"Ваш номер телефона", ph_comment:"Ваш комментарий",
    ph_year_from:"Год от", ph_price_from:"От", ph_price_to:"До",
    msg_choose_dates:"Пожалуйста, выберите даты аренды",
    msg_choose_both:"Выберите обе даты",
    msg_choose_rules:"Пожалуйста, согласитесь с правилами аренды",
    msg_no_available:"Нет доступных автомобилей на выбранные даты",
    btn_sending:"Отправка...", btn_book:"Забронировать",
    delivery_none:"Без доставки",
    per_day:"/день",
    days_1:"день", days_2_4:"дня", days_5p:"дней",
    deposit:"Депозит",
    // промо
    promo_label:"Промокод",
    ph_promo:"PROMO10",
    apply_promo:"Применить",
    promo_hint:"Скидка действует только на стоимость аренды",
    discount_label:"Скидка",
    promo_applied:"Промокод применён",
    promo_invalid:"Некорректный промокод"
  },
  en: {
    title:"Cars — Telegram Mini App",
    cars_title:"Cars",
    sorting:"Sorting:",
    sort_none:"No sorting",
    sort_asc:"Price: Low to High",
    sort_desc:"Price: High to Low",
    setup_filter:"Filter",
    rent_date:"Rental dates",
    from:"From:", to:"To:", find:"Search",
    choose_class:"Choose car class",
    order_details:"Order details",
    car_name_fallback:"Car name",
    rent_date_colon:"Rental dates:",
    total:"Total:",
    name:"Name", phone:"Phone number", delivery:"Delivery", comments:"Comments",
    agree_with:"I agree with", rental_rules_btn:"rental rules",
    book:"Book",
    rental_rules_title:"Rental rules",
    rules_stub1:"<b>1. General.</b> Minimum rental period is 1 day. Documents and deposit are required per company policy.",
    rules_stub2:"<b>2. Payment.</b> Prepaid. Extra fees may apply: delivery, deposit, options.",
    rules_stub3:"<b>3. Deposit.</b> Returned after inspection if no violations or fines.",
    rules_stub4:"<b>4. Usage.</b> Racing, towing, or third-party drivers without consent are prohibited.",
    rules_stub5:"<b>5. Fines & damages.</b> Paid by the renter per inspection act.",
    rules_stub6:"<b>6. Return.</b> Return on time; delay is charged as extra period.",
    rules_stub_note:"*Template. Replace with your actual rules.",
    ok:"OK",
    success_title:"Request submitted!",
    success_text:"Our manager will contact you within 15 minutes.",
    filtering:"Filtering",
    brand:"Brand", model:"Model",
    year_from:"Year from", color:"Color",
    transmission:"Transmission",
    any:"Any", white:"White", black:"Black", red:"Red", silver:"Silver", blue:"Blue",
    price_from:"Price from", price_to:"Price to",
    nav_home:"Home", nav_cars:"Cars", nav_realty:"Realty", nav_moto:"Moto", nav_tours:"Tours",
    ph_name:"Your name", ph_phone:"Your phone number", ph_comment:"Your comment",
    ph_year_from:"Year from", ph_price_from:"From", ph_price_to:"To",
    msg_choose_dates:"Please choose rental dates",
    msg_choose_both:"Choose both dates",
    msg_choose_rules:"Please accept the rental rules",
    msg_no_available:"No cars available for the selected dates",
    btn_sending:"Sending...", btn_book:"Book",
    delivery_none:"No delivery",
    per_day:"/day",
    days_1:"day", days_2_4:"days", days_5p:"days",
    deposit:"Deposit",
    // promo
    promo_label:"Promo code",
    ph_promo:"PROMO10",
    apply_promo:"Apply",
    promo_hint:"Discount applies only to rent amount",
    discount_label:"Discount",
    promo_applied:"Promo applied",
    promo_invalid:"Invalid promo code"
  }
};
const langSelect = document.getElementById("langSelect");
let LANG = localStorage.getItem("rent_lang") || (navigator.language?.startsWith("en") ? "en" : "ru");
langSelect.value = LANG;

function t(key){ return I18N[LANG][key] ?? key; }

function applyI18n() {
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}
langSelect.addEventListener("change", () => {
  LANG = langSelect.value;
  localStorage.setItem("rent_lang", LANG);
  applyI18n();
  applyFilters();
  renderCategories()
});
applyI18n();

/* ===== Elements ===== */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const pickerCities = document.querySelector(".picker-city");

const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const showBtn = document.querySelector(".show");

const filterBtn = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
const filterForm = document.getElementById("filterForm");

const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const bookingClose = bookingModal?.querySelector(".close");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".car-title");
const modalDesc = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

const sortSelect = document.getElementById("sortPrice");

/* ===== Запрет прошедших дат ===== */
(function lockPastDates() {
  if (!startInput || !endInput) return;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const todayStr = ymd(new Date());
  startInput.min = todayStr;
  endInput.min   = todayStr;

  startInput.addEventListener("focus", ()=> startInput.min = todayStr);
  endInput.addEventListener("focus", ()=> endInput.min = startInput.value || todayStr);

  startInput.addEventListener("change", () => {
    const s = startInput.value;
    if (!s) return;
    endInput.min = s;
    if (endInput.value && endInput.value < s) endInput.value = s;
  });
  startInput.addEventListener("input", () => {
    if (startInput.value && startInput.value < todayStr) startInput.value = todayStr;
  });
  endInput.addEventListener("input", () => {
    const minEnd = endInput.min || todayStr;
    if (endInput.value && endInput.value < minEnd) endInput.value = minEnd;
  });
})();

/* ===== Helpers ===== */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString(LANG === "en" ? "en-GB" : "ru-RU", { day:"2-digit", month:"short" });
const rub = (n) => `${Number(n || 0).toLocaleString(LANG === "en" ? "en-GB" : "ru-RU")} ฿`;
const daysExclusiveNights = (startIso, endIso) => Math.max(1, Math.ceil((toLocalDate(endIso) - toLocalDate(startIso)) / dayMs));
const declineDays = (n) => {
  if (LANG === "en") return n === 1 ? t("days_1") : t("days_5p");
  if (n % 10 === 1 && n % 100 !== 11) return t("days_1");
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return t("days_2_4");
  return t("days_5p");
};
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/* ===== API ===== */
const API_BASE = "https://rentareabackend.pythonanywhere.com/api";
const API = `${API_BASE}/cars`;

// ==== PROMO API ====
const PROMO_API = `${API_BASE}/promos`;

async function validatePromo({ code, carId, start, end }) {
  const body = {
    code,
    product_type: "car",
    product_id: carId,
    start_date: start,
    end_date: end
  };
  const r = await fetch(`${PROMO_API}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  return data; // {valid, reason, discount, subtotal, total_after, days, code}
}

async function redeemPromo({ code, bookingId, userId, discountAmount }) {
  const body = {
    code,
    booking_id: bookingId ?? undefined,
    user_id: userId ?? undefined,
    discount_amount: typeof discountAmount === "number" ? discountAmount : undefined
  };
  try {
    await fetch(`${PROMO_API}/redeem/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch(e) {
    console.warn("redeemPromo failed", e);
  }
}

let allCars = [];
let allCategories = [];
let allBookings = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentCar = null;

/* ===== Fetch ===== */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = (data?.results || []).map(c => ({ name: c.name || c.title, icon: c.icon }));
  allCategories.unshift({ name: LANG === "en" ? "All" : "Все", icon: "../../images/sliders.svg" });
}
async function fetchCars() {
  const r = await fetch(`${API}/cars/`);
  const data = await r.json();
  allCars = data?.results || [];
}
async function fetchBookings() {
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter(b => ["active","pending","confirmed"].includes(b.status));
}

/* ===== City picker (optional element) ===== */
if (pickerCities) {
  fetch(`${API_BASE}/core/cities/`)
    .then(r=>r.json())
    .then(res=>{
      const template = [
        `<option value="all">${LANG==="en"?"All":"Все"}</option>`,
        ...(res?.results || []).map((item) => `<option value="${item.name}">${item.name}</option>`),
      ];
      pickerCities.innerHTML = template.join("");
      pickerCities.value = localStorage.getItem("selectedCity") || "all";
    });
  pickerCities.addEventListener("change", (e) => {
    localStorage.setItem("selectedCity", e.target.value);
    applyFilters();
  });
}

/* ===== Init ===== */
(async function init() {
  await Promise.all([fetchCategories(), fetchCars()]);
  renderCategories();
  applyFilters();
})();

/* ===== Categories ===== */
function renderCategories() {
  if (!categoriesContainer) return;
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>—</p>";
    return;
  }
  categoriesContainer.innerHTML = allCategories.map(c => `
    <div class="category" data-category="${c.name}">
      <img src="${c.icon}" alt="${c.name}">
      <p>${LANG === 'en' ? c.name.split('/')[1] : c.name.split('/')[0]}</p>
    </div>`).join("");

  const catElems = document.querySelectorAll(".category");
  catElems.forEach(el =>
    el.addEventListener("click", () => {
      catElems.forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      selectedCategory = el.dataset.category;
      applyFilters();
    })
  );

  const labelAll = LANG==="en" ? "All" : "Все";
  const allEl = Array.from(catElems).find(el => el.dataset.category === labelAll);
  (allEl || catElems[0])?.classList.add("active");
  selectedCategory = allEl ? labelAll : catElems[0]?.dataset.category;
}

/* ===== Filter modal ===== */
filterBtn?.addEventListener("click", () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});
filterClose?.addEventListener("click", () => {
  filterModal.style.display = "none";
  document.body.style.overflow = "";
});
filterModal?.addEventListener("click", (e) => {
  if (e.target === filterModal) {
    filterModal.style.display = "none";
    document.body.style.overflow = "";
  }
});

/* ===== Dates → availability ===== */
const showBookingsAndFilter = async () => {
  await fetchBookings();
  applyFilters();
};

const showBtnHandler = async () => {
  selectedStart = startInput.value;
  selectedEnd = endInput.value;
  if (!selectedStart || !selectedEnd) return alert(t("msg_choose_both"));
  showBtn.disabled = true;
  showBtn.textContent = t("btn_sending");
  await showBookingsAndFilter();
  showBtn.disabled = false;
  showBtn.textContent = t("find");
};

showBtn?.addEventListener("click", showBtnHandler);

/* ===== Sorting ===== */
sortSelect?.addEventListener("change", applyFilters);

/* ===== Filter form submit ===== */
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* ===== Filtering + render ===== */
function applyFilters() {
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_choose_dates")}</p>`;
    return;
  }

  let list = allCars.slice();

  const labelAll = LANG==="en" ? "All" : "Все";
  if (selectedCategory && selectedCategory !== labelAll) {
    list = list.filter(c => c.category_title === selectedCategory);
  }

  const selectedCity = localStorage.getItem("selectedCity");
  if (selectedCity && selectedCity !== "Все" && selectedCity !== "all") {
    list = list.filter(c => c.city?.name === selectedCity);
  }

  const yearFrom = parseInt(document.getElementById("filterYear")?.value || "");
  const color = document.getElementById("filterColor")?.value || "";
  const transmission = document.getElementById("filterTransmission")?.value || "";
  const priceFrom = parseFloat(document.getElementById("priceFrom")?.value || "");
  const priceTo = parseFloat(document.getElementById("priceTo")?.value || "");
  const brand = document.getElementById("filterBrand")?.value || "";
  const model = document.getElementById("filterModel")?.value || "";

  if (brand) list = list.filter(c => Number(c.brand) === Number(brand));
  if (model) list = list.filter(c => Number(c.model) === Number(model));
  if (!isNaN(yearFrom)) list = list.filter(c => Number(c.year || 0) >= yearFrom);
  if (color) list = list.filter(c => (c.color || "").toLowerCase() === color.toLowerCase());
  if (transmission) {
    const t1 = transmission.toLowerCase();
    list = list.filter(c => (c.transmission || "").toLowerCase().includes(t1));
  }
  if (!isNaN(priceFrom)) list = list.filter(c => Number(c.price_per_day) >= priceFrom);
  if (!isNaN(priceTo)) list = list.filter(c => Number(c.price_per_day) <= priceTo);

  // бронь
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map(car => {
    const conflicts = allBookings.some(b => b.car === car.id && overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date)));
    return { ...car, __hasConflict: conflicts };
  }).filter(car => !car.__hasConflict);

  // сортировка
  const sort = sortSelect?.value;
  if (sort === "asc") list.sort((a,b)=> Number(a.price_per_day) - Number(b.price_per_day));
  if (sort === "desc") list.sort((a,b)=> Number(b.price_per_day) - Number(a.price_per_day));

  if (!list.length) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_no_available")}</p>`;
    return;
  }
  renderCars(list);
}

/* ===== Render ===== */
function renderCars(cars) {
  const container = document.querySelector(".cards");
  container.innerHTML = cars.map(car => {
    const imgs = (car.images?.length ? car.images : [{image: "../../images/no_photo.jpg"}])
      .map(img => `<img loading="lazy" decoding="async" src="${img.image}" alt="${car.title}">`)
      .join("");
    const days = selectedStart && selectedEnd ? daysExclusiveNights(selectedStart, selectedEnd) : 1;
    const perDay = getDynamicPrice(car, days);
    const total = perDay * days;

    return `
      <div class="card">
        <div class="card-slider">
          <div class="slides">${imgs}</div>
          ${car.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${car.title}</h4>
            <p>${car.year || "—"}, ${car.color || "—"}</p>
          </div>

          <div>
            <li><img src="../../images/car_parameters/motor.svg" alt=""> ${car.engine_volume || "—"}L</li>
            <li><img src="../../images/car_parameters/settings.svg" alt=""> ${car.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg" alt=""> ${car.mileage || "—"} км</li>
            <li><img src="../../images/car_parameters/oil.svg" alt=""> ${car.oil_type || "—"}</li>
          </div>

          ${car.features?.length ? `<div class="goods">${car.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : ""}

          <div class="line"></div>
          <div class="price">
            <h4>${rub(total)}</h4>
            <p>${rub(perDay)}${t("per_day")} · ${days} ${declineDays(days)}<br>${t("deposit")}: ${rub(car.deposit || 0)}</p>
          </div>

          <button class="openBooking" data-id="${car.id}">${t("book")}</button>
        </div>
      </div>`;
  }).join("");

  initCarSliders();

  document.querySelectorAll(".openBooking").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const car = cars.find(c => String(c.id) === String(id));
      if (car) openBooking(car);
    });
  });
}

function initCarSliders() {
  document.querySelectorAll('.card-slider').forEach(slider => {
    const slides = slider.querySelector('.slides');
    const imgs = slides.querySelectorAll('img');
    let current = 0;

    const prev = slider.querySelector('.prev');
    const next = slider.querySelector('.next');

    function showSlide(index) {
      if (!imgs.length) return;
      if (index < 0) current = imgs.length - 1;
      else if (index >= imgs.length) current = 0;
      else current = index;
      slides.style.transform = `translateX(-${current * 100}%)`;
    }

    next?.addEventListener('click', () => showSlide(current + 1));
    prev?.addEventListener('click', () => showSlide(current - 1));

    // свайп
    let startX = 0;
    slides.addEventListener('touchstart', e => (startX = e.touches[0].clientX));
    slides.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) showSlide(current - 1);
      if (diff < -50) showSlide(current + 1);
    });
  });
}

/* ===== Promo logic (через бэкенд) ===== */
let appliedPromo = null; // { code, fixed }
function normalizeCode(s){ return String(s||"").trim().toUpperCase(); }

/* ===== Booking ===== */
function openBooking(car) {
  currentCar = car;
  appliedPromo = null;

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalPhoto.src = car.images?.[0]?.image || "../../images/no_photo.jpg";
  modalTitle.textContent = car.title || t("car_name_fallback");
  modalDesc.textContent  = car.description || "";

  const rangeEl = bookingModal.querySelector(".date-pick-result") || modalRange;
  const rentEl  = bookingModal.querySelector(".rent-amount");
  const delivEl = bookingModal.querySelector(".delivery-amount");
  const depEl   = bookingModal.querySelector(".deposit-amount");
  const discRow = bookingModal.querySelector(".discount-row");
  const discEl  = bookingModal.querySelector(".discount-amount");
  const totalEl = bookingModal.querySelector(".total-amount");
  const deliverySelect = bookingModal.querySelector(".delivery");

  // поля промо из разметки модалки
  const promoInput = document.getElementById("promoCode");
  const applyPromoBtn = document.getElementById("applyPromo");
  const promoMsg = document.getElementById("promoMessage");

  // delivery options
  deliverySelect.innerHTML = "";
  if (car.delivery_zones?.length) {
    const options = car.delivery_zones
      .filter(z => z.is_active)
      .map(z => `<option value="${z.price}" data-name="${z.name}">${z.name} (+${rub(z.price)})</option>`)
      .join("");
    deliverySelect.innerHTML = `<option value="0">${t("delivery_none")}</option>` + options;
  } else {
    deliverySelect.innerHTML = `<option value="0">${t("delivery_none")}</option>`;
  }

  // один раз получаем депозит
  const deposit = Number(currentCar.deposit || 0);

  // === пересчёт итогов ===
  const updateTotal = () => {
    if (!selectedStart || !selectedEnd) {
      rangeEl.textContent = LANG==="en" ? "Dates not selected" : "Даты не выбраны";
      rentEl.textContent  = "—";
      delivEl.textContent = "—";
      depEl.textContent   = rub(deposit);
      discRow.style.display = "none";
      discEl.textContent = "—";
      totalEl.textContent = "—";
      modalTotal.textContent = "—";
      return;
    }

    const days = daysExclusiveNights(selectedStart, selectedEnd);
    const pricePerDay = getDynamicPrice(currentCar, days);
    const rentTotal = pricePerDay * days;
    const deliveryFee = Number(deliverySelect.value || 0);

    // скидка только на аренду
    const discount = Math.max(0, Math.min(rentTotal, Number(appliedPromo?.discountAbs || 0)));
    const rentAfter = Math.max(0, rentTotal - discount);
    const grandTotal = rentAfter + deliveryFee + deposit;

    rangeEl.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${days} ${declineDays(days)}`;
    rentEl.textContent  = `${rub(rentTotal)} (${rub(pricePerDay)}${t("per_day")} × ${days})`;
    delivEl.textContent = rub(deliveryFee);
    depEl.textContent   = rub(deposit);

    if (discount > 0) {
      discRow.style.display = "";
      discEl.textContent = `−${rub(discount)}`;
    } else {
      discRow.style.display = "none";
      discEl.textContent = "—";
    }

    totalEl.textContent = rub(grandTotal);
    modalTotal.textContent = rub(grandTotal);
  };

  // === валидация промо на бэке ===
  const tryApplyPromo = async () => {
    const code = String(promoInput?.value || "").trim();
    if (!code) {
      promoMsg.textContent = LANG==="en" ? "Enter a promo code" : "Введите промокод";
      promoMsg.style.color = "red";
      return;
    }
    if (!selectedStart || !selectedEnd || !currentCar?.id) {
      promoMsg.textContent = LANG==="en" ? "Choose dates and a car first" : "Сначала выберите даты и автомобиль";
      promoMsg.style.color = "red";
      return;
    }
    const days = daysExclusiveNights(selectedStart, selectedEnd);
    const pricePerDay = getDynamicPrice(currentCar, days);
    const rentTotal = pricePerDay * days;

    promoMsg.textContent = LANG==="en" ? "Checking..." : "Проверяем...";
    promoMsg.style.color = "#6b7280";
    

    try {
      const res = await fetch("https://rentareabackend.pythonanywhere.com/api/promos/validate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal: rentTotal,        // 👈 вот это ключевой параметр
          product_type: "car",
          product_id: Number(currentCar.id),
          start_date: selectedStart,
          end_date: selectedEnd,
          user_id: user?.id ?? null
        }),
      });
      const out = await res.json();

      if (!res.ok) throw new Error(out?.detail || "Validation error");

      if (out.valid) {
        const discountAbs = Number(out.discount || 0);
        appliedPromo = { code, discountAbs };

        promoMsg.textContent = (LANG==="en"
          ? `Promo applied. Discount −${discountAbs.toLocaleString("en-GB")} ฿`
          : `Промокод применён. Скидка −${discountAbs.toLocaleString("ru-RU")} ฿`);
        promoMsg.style.color = "green";

        tg?.HapticFeedback?.notificationOccurred?.("success");
        updateTotal();
      } else {
        appliedPromo = null;
        const reasonMap = {
          not_found:                LANG==="en" ? "Promo not found" : "Промокод не найден",
          inactive_or_out_of_window: LANG==="en" ? "Inactive or out of date" : "Не активен или вне дат",
          min_days:                 LANG==="en" ? "Minimum rental days not reached" : "Не выполнен минимум суток",
          min_subtotal:             LANG==="en" ? "Minimum subtotal not reached" : "Не достигнут минимальный чек",
          product_type_not_allowed: LANG==="en" ? "Not allowed for this product type" : "Недоступно для этого типа",
          target_not_allowed:       LANG==="en" ? "Not allowed for this item" : "Недоступно для этого объекта",
          limits:                   LANG==="en" ? "Usage limit reached" : "Превышен лимит использования",
        };
        promoMsg.textContent = reasonMap[out.reason] || (LANG==="en" ? "Promo is not valid" : "Промокод недействителен");
        promoMsg.style.color = "red";
        tg?.HapticFeedback?.notificationOccurred?.("error");
        updateTotal();
      }
    } catch (e) {
      console.error(e);
      appliedPromo = null;
      promoMsg.textContent = LANG==="en" ? "Error checking promo" : "Ошибка проверки промокода";
      promoMsg.style.color = "red";
      tg?.HapticFeedback?.notificationOccurred?.("error");
      updateTotal();
    }
  };

  // вешаем обработчики ТОЛЬКО внутри openBooking
  applyPromoBtn?.addEventListener("click", tryApplyPromo);
  promoInput?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") { e.preventDefault(); tryApplyPromo(); } });

  deliverySelect.addEventListener("change", updateTotal);
  updateTotal();
  bookingForm?.reset?.();
}


/* ===== Submit booking ===== */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!document.getElementById("agreeRules")?.checked)
    return alert(t("msg_choose_rules"));
  if (!selectedStart || !selectedEnd) return alert(t("msg_choose_both"));

  const name = bookingForm.querySelector("input[placeholder]")?.value?.trim();
  const phone = bookingForm.querySelector("input[type='tel']")?.value?.trim();
  const commentOrig = bookingForm.querySelector("input[type='text'][data-i18n-ph='ph_comment']")?.value?.trim() ?? "";

  const deliverySelect = bookingForm.querySelector(".delivery");
  const deliveryPrice = parseFloat(deliverySelect?.value || 0);
  const deliveryName = deliverySelect?.selectedOptions?.[0]?.dataset?.name || null;

  const meta = [];
  if (deliveryName) meta.push(`delivery:${deliveryName}`);
  if (appliedPromo?.code) meta.push(`promo:${appliedPromo.code}`);
  if (typeof appliedPromo?.fixed === "number") meta.push(`discount:${appliedPromo.fixed}`);
  const comment = [commentOrig, meta.length ? `[${meta.join(",")}]` : ""].filter(Boolean).join(" ");

  const payload = {
    car: currentCar.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user?.id || 102445,
    client_name: name,
    phone_number: phone,
    city: currentCar?.city?.id ?? undefined,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment,
    delivery_zone_name: deliveryName,
    delivery_price: deliveryPrice,
    promo_code: appliedPromo?.code || null,
    discount_amount: typeof appliedPromo?.fixed === "number" ? appliedPromo.fixed : 0
  };

  const btn = bookingForm.querySelector(".btn");
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("btn_sending");

  try {
    const res = await fetch(`${API}/bookings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());

    const created = await res.json();
    const bookingId = created?.id;

    try {
      if (appliedPromo?.code) {
        await redeemPromo({
          code: appliedPromo.code,
          bookingId,
          userId: user?.id,
          discountAmount: typeof appliedPromo.fixed === "number" ? appliedPromo.fixed : undefined
        });
      }
    } catch (e) {
      console.warn("redeemPromo failed:", e);
    }

    tg?.HapticFeedback?.notificationOccurred?.("success");
    bookingModal.style.display = "none";
    successModal.style.display = "flex";
    await fetchBookings();
    applyFilters();
  } catch (err) {
    console.error(err);
    tg?.HapticFeedback?.notificationOccurred?.("error");
    alert("Error");
  } finally {
    btn.disabled = false;
    btn.textContent = t("btn_book");
  }
});

bookingClose?.addEventListener("click", () => {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
});
closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ===== Load brands/models for filter (on first open) ===== */
const API_CARS = `${API_BASE}/cars`;
let filterDataLoaded = false;

async function loadFilterData() {
  try {
    const brandsRes = await fetch(`${API_CARS}/brands`);
    const brandsJson = await brandsRes.json();
    const brands = Array.isArray(brandsJson) ? brandsJson : (brandsJson?.results || []);
    const brandSelect = document.getElementById("filterBrand");
    brandSelect.innerHTML = `<option value="">${t("any")}</option>` + brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("");

    const modelsRes = await fetch(`${API_CARS}/models`);
    const modelsJson = await modelsRes.json();
    const allModels = Array.isArray(modelsJson) ? modelsJson : (modelsJson?.results || []);
    const modelSelect = document.getElementById("filterModel");

    const renderModels = (list) => {
      modelSelect.innerHTML = `<option value="">${t("any")}</option>` + list.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
    };
    renderModels(allModels);

    brandSelect.onchange = (e) => {
      const brandId = Number(e.target.value);
      if (!brandId) return renderModels(allModels);
      renderModels(allModels.filter(m => Number(m.brand) === brandId));
    };
  } catch (e) { console.error("Filter load error:", e); }
}

filterBtn?.addEventListener("click", async () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  if (!filterDataLoaded) {
    await loadFilterData();
    filterDataLoaded = true;
  }
});

/* ===== Pricing tiers ===== */
function getDynamicPrice(car, days) {
  if (car.price_tiers?.length) {
    const active = car.price_tiers.filter(t => t.is_active).sort((a,b)=> a.min_days - b.min_days);
    let pick = null;
    for (const t of active) if (days >= t.min_days) pick = t;
    if (pick) return Number(pick.price_per_day);
  }
  return Number(car.price_per_day);
}

/* ===== Rules modal (provider terms) ===== */
const rulesModal  = document.getElementById("rulesModal");
const rulesClose  = rulesModal?.querySelector(".rules-close");
const rulesOkBtn  = rulesModal?.querySelector(".rules-ok");

function openRulesModal() {
  rulesModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function setProviderRules(provider) {
  const box = document.querySelector("#rulesModal .rules-body");
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const name = provider?.name ? ` ${LANG==="en"?"for":"для"} <b>${esc(provider.name)}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms) terms = LANG==="en"
    ? "Rental rules are temporarily not specified. Contact the provider for details."
    : "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  const htmlTerms = esc(terms).replace(/\n/g, "<br>");
  const contacts = [
    provider?.phone    ? `<li>${LANG==="en"?"Phone":"Телефон"}: <b>${esc(provider.phone)}</b></li>` : "",
    provider?.telegram ? `<li>Telegram: <b>${esc(provider.telegram)}</b></li>` : "",
    provider?.email    ? `<li>Email: <b>${esc(provider.email)}</b></li>` : "",
  ].filter(Boolean).join("");
  box.innerHTML = `
    <p><b>${t("rental_rules_title")}${name}</b></p>
    <div style="color:#333;line-height:1.45">${htmlTerms}</div>
    ${contacts ? `<ul style="margin-top:12px;color:#555">${contacts}</ul>` : ""}
    <p style="color:#99A2AD;margin-top:8px">*${LANG==="en"?"Information provided by the lessor.":"Информация предоставлена арендодателем."}</p>
  `;
}
function closeRulesModal(){
  rulesModal.style.display = "none";
  document.body.style.overflow = "";
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".rules-link");
  if (!btn) return;
  e.preventDefault();
  setProviderRules(currentCar?.rental_provider || null);
  openRulesModal();
});
rulesClose?.addEventListener("click", closeRulesModal);
rulesOkBtn?.addEventListener("click", closeRulesModal);
rulesModal?.addEventListener("click", (e)=>{ if (e.target === rulesModal) closeRulesModal(); });
window.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && rulesModal?.style.display === "flex") closeRulesModal(); });


