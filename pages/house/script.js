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
    title:"Недвижимость — Telegram Mini App",
    heading:"Недвижимость",
    mode_daily:"Посуточно",
    mode_6m:"6 месяцев",
    mode_12m:"12 месяцев",
    setup_filter:"Настроить фильтр",
    rent_date:"Дата аренды",
    from:"От:",
    to:"До:",
    find:"Найти",
    choose_type:"Выберите тип дома",
    order_details:"Детали заказа",
    obj_fallback:"Объект",
    rent_date_colon:"Дата аренды:",
    total:"Итого:",
    start_date_ltc:"Дата начала аренды (для 6/12 мес)",
    ltc_hint:"Дата окончания рассчитывается автоматически по выбранному контракту.",
    name:"Имя", phone:"Номер телефона", comments:"Комментарии",
    agree_with:"Я согласен с", rental_rules_btn:"правилами аренды",
    book:"Забронировать",
    success_title:"Ваша заявка принята!",
    success_text:"В течении 15 минут с вами свяжутся наши менеджеры)",
    ok:"Ок",
    filtering:"Фильтрация",
    bedrooms:"Количество спален",
    district:"Район",
    any:"Любой",
    price_from:"Цена от",
    price_to:"Цена до",
    nav_home:"Главная", nav_cars:"Авто", nav_realty:"Недвижимость", nav_moto:"Мото", nav_tours:"Экскурсии",
    ph_name:"Ваше имя", ph_phone:"Ваш номер телефона", ph_comment:"Ваш комментарий",
    ph_price_from:"От", ph_price_to:"До",
    msg_pick_mode_or_dates:"Пожалуйста, выберите режим или даты аренды",
    msg_choose_both:"Пожалуйста, выберите обе даты аренды",
    msg_no_avail_daily:"Нет доступных объектов под выбранные условия",
    msg_no_6m:"Нет объектов с тарифом на 6 мес",
    msg_no_12m:"Нет объектов с тарифом на 12 мес",
    loading:"Загрузка...",
    sending:"Отправка...",
    dates_not_selected:"Даты не выбраны",
    contract_on:"Контракт на",
    months_short:"мес",
    per_day:"/день",
    deposit:"Депозит",
    district_label:"Район",
    get_in_touch_with_manager: 'Связаться с менеджером'
  },
  en: {
    get_in_touch_with_manager: "Get in touch with a manager",
    title:"Realty — Telegram Mini App",
    heading:"Realty",
    mode_daily:"Daily",
    mode_6m:"6 months",
    mode_12m:"12 months",
    setup_filter:"Filter",
    rent_date:"Rental dates",
    from:"From:",
    to:"To:",
    find:"Search",
    choose_type:"Choose house type",
    order_details:"Order details",
    obj_fallback:"Property",
    rent_date_colon:"Rental dates:",
    total:"Total:",
    start_date_ltc:"Start date (for 6/12 months)",
    ltc_hint:"End date is calculated automatically by contract.",
    name:"Name", phone:"Phone number", comments:"Comments",
    agree_with:"I agree with", rental_rules_btn:"rental rules",
    book:"Book",
    success_title:"Request submitted!",
    success_text:"Our manager will contact you within 15 minutes.",
    ok:"OK",
    filtering:"Filtering",
    bedrooms:"Bedrooms",
    district:"District",
    any:"Any",
    price_from:"Price from",
    price_to:"Price to",
    nav_home:"Home", nav_cars:"Cars", nav_realty:"Realty", nav_moto:"Moto", nav_tours:"Tours",
    ph_name:"Your name", ph_phone:"Your phone number", ph_comment:"Your comment",
    ph_price_from:"From", ph_price_to:"To",
    msg_pick_mode_or_dates:"Please choose a mode or rental dates",
    msg_choose_both:"Choose both dates",
    msg_no_avail_daily:"No properties match the selected conditions",
    msg_no_6m:"No properties with a 6-month tariff",
    msg_no_12m:"No properties with a 12-month tariff",
    loading:"Loading...",
    sending:"Sending...",
    dates_not_selected:"Dates not selected",
    contract_on:"Contract for",
    months_short:"months",
    per_day:"/day",
    deposit:"Deposit",
    district_label:"District"
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
  document.querySelectorAll(".rent-mode .mode").forEach(btn=>{
    const k = btn.dataset.mode === "daily" ? "mode_daily" : (btn.dataset.mode==="6m"?"mode_6m":"mode_12m");
    btn.innerHTML = t(k);
  });
}
langSelect.addEventListener("change", ()=>{
  LANG = langSelect.value;
  localStorage.setItem("rent_lang", LANG);
  applyI18n();
  renderCategories();
  applyFilters();
});
applyI18n();

/* ===== API ===== */
const API = "https://rentareabackend.pythonanywhere.com/api/houses";

/* ===== DOM ===== */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const showBtn = document.querySelector(".show");

/* ===== Модалки ===== */
const bookingModal = document.getElementById("bookingModal");
const bookingClose = bookingModal?.querySelector(".close");
const bookingForm = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

/* ===== Элементы модалки ===== */
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".house-title");
const modalDesc = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

/* ===== Фильтр ===== */
const filterBtn = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
const filterForm = document.getElementById("filterForm");

/* ===== Режимы аренды ===== */
const modeButtons = document.querySelectorAll(".rent-mode .mode");
const datePickerBox = document.querySelector(".date-picker");
const ltcStartWrap = document.querySelector(".ltc-start");
const ltcStartInput = document.getElementById("ltc-start-date");

/* ===== Helpers ===== */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtDate = (d) => d.toLocaleDateString(LANG==="en"?"en-GB":"ru-RU", { day:"2-digit", month:"short" });
const rub = (n) => `${Number(n || 0).toLocaleString(LANG==="en"?"en-GB":"ru-RU")} ฿`;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
const nights = (startIso, endIso) => Math.max(1, Math.ceil((toLocalDate(endIso) - toLocalDate(startIso))/dayMs));
const declineDays = (n) => {
  if (LANG==="en") return n===1 ? "day" : "days";
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return "дня";
  return "дней";
};
const pad = (x) => String(x).padStart(2,"0");

/* === Запрет прошедших дат и согласование диапазона === */
(function lockPastDates() {
  if (!startInput || !endInput) return;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
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

/* ===== Pricing ===== */
function getDynamicPrice(house, days) {
  const base = Number(house.price_per_day) || 0;
  const tiers = Array.isArray(house.price_tiers)
    ? house.price_tiers.filter(t=>t?.is_active).sort((a,b)=>Number(a.min_days)-Number(b.min_days))
    : [];
  let price = base;
  for (const t of tiers) if (days >= Number(t.min_days||0)) price = Number(t.price_per_day) || price;
  return price;
}

/* ===== State ===== */
let allHouses = [];
let allCategories = [];
let allBookings = [];
let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentHouse = null;
let rentMode = "daily"; // 'daily' | '6m' | '12m'
let priceFrom = null;
let priceTo = null;

/* ===== Promo state ===== */
let appliedPromo = null;

const modeMonths = () => (rentMode === "6m" ? 6 : rentMode === "12m" ? 12 : 0);

/* ===== Fetch ===== */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}
async function fetchHouses() {
  const r = await fetch(`${API}/houses/`);
  const data = await r.json();
  allHouses = data?.results || [];
}
async function fetchBookings() {
  try {
    const r = await fetch(`${API}/bookings/`);
    if (!r.ok) throw new Error(`Bookings HTTP ${r.status}`);
    const data = await r.json();
    allBookings = (data?.results || []).filter(b =>
      ["active","pending","confirmed"].includes(String(b.status).toLowerCase())
    );
  } catch (e) {
    console.error("fetchBookings error:", e);
    allBookings = [];
  }
}

/* ===== Init ===== */
(async function init() {
  await Promise.all([fetchCategories(), fetchHouses(), fetchBookings()]);
  renderCategories();
  loadDistricts();
  cardsContainer.innerHTML =
    `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_mode_or_dates")}</p>`;

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      rentMode = btn.dataset.mode;

      const isDaily = rentMode === "daily";
      datePickerBox.classList.toggle("disabled", !isDaily);
      if (ltcStartWrap) ltcStartWrap.style.display = isDaily ? "none" : "block";

      // сбрасываем даты и промокод при смене режима
      appliedPromo = null;
      document.getElementById("promoCode")?.value && (document.getElementById("promoCode").value = "");
      const pm = document.getElementById("promoMessage"); if (pm){ pm.textContent="Скидка применяется только к аренде"; pm.style.color="#6b7280"; }

      if (!isDaily) {
        selectedStart = null;
        selectedEnd = null;
        if (startInput) startInput.value = "";
        if (endInput) endInput.value = "";
      }
      applyFilters();
    });
  });
})();

/* ===== Категории ===== */
function renderCategories() {
  if (!categoriesContainer) return;
  const labelAll = LANG==="en" ? "All" : "Все";
  const iconAll = "../../images/sliders.svg";
  const cats = [{ title: labelAll, icon: iconAll }, ...allCategories];

  categoriesContainer.innerHTML = cats.map(c => `
    <div class="category" data-category="${c.title}">
      <img src="${c.icon}" alt="${c.title}">
      <p>${LANG === 'en' ? c.title.split('/')[1] : c.title.split('/')[0]}</p>
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

  const allEl = Array.from(catElems).find(el => el.dataset.category === labelAll);
  (allEl || catElems[0])?.classList.add("active");
  selectedCategory = allEl ? labelAll : catElems[0]?.dataset.category;
}

/* ===== Кнопка «Найти» ===== */
showBtn?.addEventListener("click", async () => {
  if (rentMode !== "daily") {
    await fetchBookings().catch(()=>{});
    applyFilters();
    return;
  }
  selectedStart = startInput.value;
  selectedEnd   = endInput.value;
  if (!selectedStart || !selectedEnd) return alert(t("msg_choose_both"));
  const oldText = showBtn.textContent;
  showBtn.disabled = true;
  showBtn.textContent = t("loading");
  await fetchBookings().catch(()=>{});
  applyFilters();
  showBtn.disabled = false;
  showBtn.textContent = oldText;
});

/* ===== Утилиты для режимов ===== */
function hasTierForDays(house, d) {
  return (house.price_tiers || []).some(t => t?.is_active && Number(t.min_days) === Number(d));
}
function getTierForMonths(house, months) {
  const days = months * 30;
  return (house.price_tiers || []).find(t => t?.is_active && Number(t.min_days) === Number(days)) || null;
}
function hasExactTierForMonths(house, months) {
  return !!getTierForMonths(house, months);
}
function getContractPrice(house, months) {
  const tier = getTierForMonths(house, months);
  if (!tier) return { mode:"no-tier", perDay:0, monthly:NaN, total:NaN };
  const perDay = Number(tier.price_per_day) || 0;
  const monthly = perDay * 30;
  const total = monthly * months;
  return { mode:"exact-tier", perDay, monthly, total };
}

/* ===== Фильтрация и рендер ===== */
function applyFilters() {
  if (rentMode === "daily" && (!selectedStart || !selectedEnd)) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${t("msg_pick_mode_or_dates")}</p>`;
    return;
  }

  let list = allHouses.slice();
  if (rentMode === "daily") list = list.filter(h => hasTierForDays(h, 1));
  if (rentMode === "6m" || rentMode === "12m") {
    const m = modeMonths();
    list = list.filter(h => hasExactTierForMonths(h, m));
  }

  // категории
  const labelAll = LANG==="en" ? "All" : "Все";
  if (selectedCategory && selectedCategory !== labelAll) {
    list = list.filter(h => (h.category_title || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase());
  }

  // фильтры формы
  const bedrooms = document.getElementById("filterBedrooms")?.value || "";
  const district = document.getElementById("filterDistrict")?.value || "";
  const pf = document.getElementById("priceFrom")?.value?.trim?.();
  const pt = document.getElementById("priceTo")?.value?.trim?.();

  if (bedrooms) {
    if (bedrooms === "5") list = list.filter(h => Number(h.bedrooms) >= 5);
    else list = list.filter(h => Number(h.bedrooms) === Number(bedrooms));
  }
  if (district) {
    const d = district.trim().toLowerCase();
    list = list.filter(h => (String(h.district || "")).trim().toLowerCase() === d);
  }
  if (pf !== "" && !isNaN(pf)) list = list.filter(h => Number(h.price_per_day) >= Number(pf));
  if (pt !== "" && !isNaN(pt)) list = list.filter(h => Number(h.price_per_day) <= Number(pt));

  // пересечения по датам только для посуточного
  if (rentMode === "daily") {
    const s = toLocalDate(selectedStart);
    const e = toLocalDate(selectedEnd);
    list = list
      .map(h => {
        const conflict = (allBookings||[]).some(b =>
          b.house === h.id && overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
        );
        return { ...h, __hasConflict: conflict };
      })
      .filter(h => !h.__hasConflict);
  }

  if (!list.length) {
    const msg = rentMode==="6m" ? t("msg_no_6m") : (rentMode==="12m" ? t("msg_no_12m") : t("msg_no_avail_daily"));
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">${msg}</p>`;
    return;
  }
  renderHouses(list);
}

function renderHouses(houses) {
  cardsContainer.innerHTML = houses.map(h => {
    const images = (h.images?.length ? h.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img loading="lazy" decoding="async" src="${img.image}" alt="${h.title}">`)
      .join("");

    const priceBlock = (() => {
      if (rentMode === "daily") {
        const d = (selectedStart && selectedEnd) ? nights(selectedStart, selectedEnd) : 1;
        const perDay = getDynamicPrice(h, d);
        const total = perDay * d;
        return `
          <h4>${rub(total)} ${LANG==="en"?"for": "за"} ${d} ${declineDays(d)}</h4>
          <p>(${rub(perDay)}${t("per_day")})<br>${t("deposit")}: ${rub(h.deposit || 0)}</p>
        `;
      } else {
        const m = modeMonths();
        const res = getContractPrice(h, m);
        return `
          <h4>${rub(res.monthly)}/${LANG==="en"?"month":"мес"}</h4>
          <p>${t("contract_on")} ${m} ${t("months_short")}<br>${t("deposit")}: ${rub(h.deposit || 0)}</p>
        `;
      }
    })();

    return `
      <div class="card">
        <div class="card-slider">
          <div class="slides">${images}</div>
          ${h.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${h.title}</h4>
            <p>${h.area ?? "—"} м²<br>${t("bedrooms")}: ${h.bedrooms ?? "-"}</p>
          </div>
          ${h.district ? `<p style="font-size:14px;color:#6e6e6e;">${t("district_label")}: ${h.district?.name || h.district}</p>` : ""}
          ${(h.features?.length ? `<div class="goods">${h.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}
          <div class="line"></div>

          <div class="price">${priceBlock}</div>
          <button class="openBooking" data-id="${h.id}">${t("book")}</button>
        </div>
      </div>`;
  }).join("");

  initSliders();

  document.querySelectorAll(".openBooking").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const house = houses.find(h => h.id === id);
      if (house) openBooking(house);
    });
  });
}

/* ===== Слайдер ===== */
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

/* ===== Promo helpers ===== */
const promoInput = document.getElementById("promoCode");
const promoBtn = document.getElementById("applyPromo");
const promoMsg = document.getElementById("promoMessage");

function computeCurrentTotal(house){
  if (!house) return 0;
  if (rentMode === "daily" && selectedStart && selectedEnd){
    const n = nights(selectedStart, selectedEnd);
    return getDynamicPrice(house, n) * n;
  }
  if (rentMode !== "daily"){
    const m = modeMonths();
    const tier = getTierForMonths(house, m);
    if (!tier) return 0;
    return (Number(tier.price_per_day)||0) * 30 * m;
  }
  return 0;
}

function updateTotalWithPromo(rentTotal) {
  const discount = Math.max(0, Math.min(rentTotal, Number(appliedPromo?.discountAbs || 0)));
  const final = rentTotal - discount;
  modalTotal.textContent = rub(final);
  if (discount > 0) {
    promoMsg.textContent = `✅ Промокод применён. Скидка −${rub(discount)}`;
    promoMsg.style.color = "green";
  } else {
    promoMsg.textContent = "Скидка не применяется";
    promoMsg.style.color = "#6b7280";
  }
}

async function tryApplyPromo() {
  const code = String(promoInput?.value || "").trim();
  if (!code) {
    promoMsg.textContent = "Введите промокод";
    promoMsg.style.color = "red";
    return;
  }
  if (!currentHouse?.id) {
    promoMsg.textContent = "Сначала выберите объект";
    promoMsg.style.color = "red";
    return;
  }

  // базовая сумма для проверки
  const rentTotal = computeCurrentTotal(currentHouse);

  promoMsg.textContent = "Проверяем...";
  promoMsg.style.color = "#6b7280";

  try {
    const res = await fetch("https://rentareabackend.pythonanywhere.com/api/promos/validate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        subtotal: rentTotal,
        product_type: "realty",
        product_id: Number(currentHouse.id),
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

/* ===== Даты меняются — обновить суммы ===== */
[startInput, endInput].forEach(inp => {
  inp?.addEventListener("change", () => {
    selectedStart = startInput?.value || null;
    selectedEnd   = endInput?.value || null;
    if (selectedStart && selectedEnd && rentMode === "daily") applyFilters();

    if (bookingModal?.style?.display === "flex" && currentHouse) {
      const n = (selectedStart && selectedEnd) ? nights(selectedStart, selectedEnd) : 0;
      if (rentMode === "daily" && n > 0) {
        modalRange.textContent = `${fmtDate(toLocalDate(selectedStart))} — ${fmtDate(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
      }
      const total = computeCurrentTotal(currentHouse);
      updateTotalWithPromo(total);
    }
  });
});

/* ===== Модалки ===== */
function openBooking(house) {
  currentHouse = house;
  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // сбрасываем промокод при новом открытии
  appliedPromo = null;
  if (promoInput) promoInput.value = "";
  if (promoMsg) { promoMsg.textContent = "Скидка применяется только к аренде"; promoMsg.style.color="#6b7280"; }

  modalPhoto.src = house.images?.[0]?.image || "../../images/no_photo.png";
  modalTitle.textContent = house.title || t("obj_fallback");
  modalDesc.textContent = house.description || (house.area ? `${house.area} м²` : "");

  if (rentMode === "daily" && selectedStart && selectedEnd) {
    const n = nights(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtDate(toLocalDate(selectedStart))} — ${fmtDate(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
  } else if (rentMode !== "daily") {
    const m = modeMonths();
    modalRange.textContent = `${t("contract_on")} ${m} ${t("months_short")}`;
  } else {
    modalRange.textContent = t("dates_not_selected");
  }

  const total = computeCurrentTotal(house);
  updateTotalWithPromo(total);

  if (ltcStartWrap) ltcStartWrap.style.display = (rentMode === "daily") ? "none" : "block";

  setProviderRules(house.rental_provider);
  bookingForm?.reset?.();
}
function closeBooking(){
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => { if (e.target === bookingModal) closeBooking(); });
window.addEventListener("keydown", (e)=> e.key==="Escape" && closeBooking());

/* ===== Отправка брони ===== */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentHouse) return;

  let sDate = selectedStart;
  let eDate = selectedEnd;

  if (rentMode === "daily") {
    if (!sDate || !eDate) return alert(t("msg_choose_both"));
  } else {
    const startVal = ltcStartInput?.value;
    if (!startVal) return alert(t("from"));
    const s = toLocalDate(startVal);
    const months = modeMonths();
    const end = new Date(s.getTime()); end.setMonth(end.getMonth()+months);
    sDate = `${s.getFullYear()}-${pad(s.getMonth()+1)}-${pad(s.getDate())}`;
    eDate = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`;
  }

  const name = bookingForm.querySelector("input[data-i18n-ph='ph_name']").value.trim();
  const phone = bookingForm.querySelector("input[data-i18n-ph='ph_phone']").value.trim();
  const comment = bookingForm.querySelector("input[data-i18n-ph='ph_comment']").value.trim();

  const payload = {
    house: currentHouse.id,
    start_date: sDate,
    end_date: eDate,
    telegram_id: user?.id || 102445,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment,
    contract_type: rentMode,
    contract_months: modeMonths() || null
  };
  if (appliedPromo?.code) payload.promo_code = appliedPromo.code;

  const btn = bookingForm.querySelector(".btn");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("sending");

  try {
    const res = await fetch(`${API}/bookings/`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    tg?.HapticFeedback?.notificationOccurred?.("success");
    bookingModal.style.display = "none";
    successModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    await fetchBookings();
    applyFilters();
  } catch(err) {
    console.error(err);
    tg?.HapticFeedback?.notificationOccurred?.("error");
    alert("Error");
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
});

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ===== Фильтр-модалка ===== */
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
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  priceFrom = Number(document.getElementById("priceFrom").value);
  priceTo   = Number(document.getElementById("priceTo").value);
  if (Number.isNaN(priceFrom)) priceFrom = null;
  if (Number.isNaN(priceTo))   priceTo = null;
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* ===== Заполнение районов ===== */
function loadDistricts() {
  const select = document.getElementById("filterDistrict");
  if (!select) return;
  const allDistricts = [...new Set(allHouses.map(h => h.district).filter(Boolean))];
  select.innerHTML =
    `<option value="">${t("any")}</option>` +
    allDistricts.map(d => `<option value="${d}">${d}</option>`).join("");
}

/* ===== Правила аренды (модалка) ===== */
function ensureRulesModal() {
  if (document.getElementById("rulesModal")) return;
  const html = `
    <div class="modal" id="rulesModal" style="display:none;">
      <div class="modal-content" style="max-width:640px;margin:0 auto;">
        <span class="close rules-close">&times;</span>
        <h3 style="margin-top:0;">${t("rental_rules_btn")[0].toUpperCase()+t("rental_rules_btn").slice(1)}</h3>
        <div class="rules-body" style="display:flex;flex-direction:column;gap:10px;"></div>
        <button type="button" class="btn rules-ok" style="margin-top:16px;">${t("ok")}</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const rm = document.getElementById("rulesModal");
  const close = () => { rm.style.display = "none"; document.body.style.overflow = ""; };
  rm.querySelector(".rules-close").addEventListener("click", close);
  rm.querySelector(".rules-ok").addEventListener("click", close);
  rm.addEventListener("click", (e)=>{ if(e.target===rm) close(); });
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
  const name = provider?.name ? ` ${LANG==="en"?"for":"для"} <b>${provider.name}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms) {
    terms = LANG==="en"
      ? "Rental rules are temporarily not specified. Contact the provider for details."
      : "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  }
  const esc = (s) => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const htmlTerms = esc(terms).replace(/\n/g, "<br>");

  const contacts = [
    provider?.phone    ? `<li>${LANG==="en"?"Phone":"Телефон"}: <b>${provider.phone}</b></li>` : "",
    provider?.telegram ? `<li>Telegram: <b>${provider.telegram}</b></li>` : "",
    provider?.email    ? `<li>Email: <b>${provider.email}</b></li>` : ""
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
  setProviderRules(currentHouse?.rental_provider || null);
  openRulesModal();
});

/* ===== Внутренняя утилита (для промо) ===== */
function getTierForMonths(house, months) {
  const days = months * 30;
  return (house.price_tiers || []).find(t => t?.is_active && Number(t.min_days) === Number(days)) || null;
}
