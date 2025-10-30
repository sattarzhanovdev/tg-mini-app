"use strict";

/* Telegram Mini App */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;

/* API */
const API = "https://rentareabackend.pythonanywhere.com/api/houses";

/* DOM */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const showBtn = document.querySelector(".show");

/* Модалки */
const bookingModal = document.getElementById("bookingModal");
const bookingClose = bookingModal?.querySelector(".close");
const bookingForm = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

/* Элементы модалки */
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".house-title");
const modalDesc = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

/* Фильтр */
const filterBtn = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
const filterForm = document.getElementById("filterForm");

/* Режимы аренды */
const modeButtons = document.querySelectorAll(".rent-mode .mode");
const datePickerBox = document.querySelector(".date-picker");
const ltcStartWrap = document.querySelector(".ltc-start");
const ltcStartInput = document.getElementById("ltc-start-date");

/* Helpers */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
const nights = (startIso, endIso) => {
  const s = toLocalDate(startIso);
  const e = toLocalDate(endIso);
  const diff = Math.ceil((e - s) / dayMs);
  return Math.max(1, diff);
};
const declineDays = (n) =>
  n % 10 === 1 && n % 100 !== 11 ? "день" :
  [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "дня" : "дней";

const addMonths = (date, months) => {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0); // корректируем перепрыгивание
  return d;
};

function getDynamicPrice(house, days) {
  const base = Number(house.price_per_day) || 0;
  const tiers = Array.isArray(house.price_tiers)
    ? house.price_tiers
        .filter(t => t && t.is_active)
        .sort((a, b) => Number(a.min_days) - Number(b.min_days))
    : [];

  let price = base;
  for (const t of tiers) {
    const min = Number(t.min_days) || 0;
    if (days >= min) price = Number(t.price_per_day) || price;
  }
  return price;
}

/* State */
let allHouses = [];
let allCategories = [];
let allBookings = [];
let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentHouse = null;
let rentMode = "daily"; // 'daily' | '6m' | '12m'

/* Фильтры */
let priceFrom = null;
let priceTo = null;

const modeMonths = () => (rentMode === "6m" ? 6 : rentMode === "12m" ? 12 : 0);

/* Fetch */
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
    const r = await fetch(`${API}/bookings/`, { method: "GET" });
    if (!r.ok) throw new Error(`Bookings HTTP ${r.status}`);
    const data = await r.json();
    allBookings = (data?.results || []).filter(b =>
      ["active", "pending", "confirmed"].includes(String(b.status).toLowerCase())
    );
  } catch (err) {
    console.error("fetchBookings error:", err);
    allBookings = [];
  }
}

/* Init */
(async function init() {
  await Promise.all([fetchCategories(), fetchHouses(), fetchBookings()]);
  renderCategories();
  loadDistricts();
  cardsContainer.innerHTML =
    `<p style="text-align:center;color:#99A2AD;margin-top:40px;">
      Пожалуйста, выберите режим или даты аренды
    </p>`;

  // Переключение режимов
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      rentMode = btn.dataset.mode;

      const isDaily = rentMode === "daily";

      if (isDaily) {
        datePickerBox.classList.remove("disabled");
      } else {
        datePickerBox.classList.add("disabled");
      }

      if (ltcStartWrap) ltcStartWrap.style.display = isDaily ? "none" : "block";

      // сбрасываем выбранные даты поиска при долгосроке
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

/* Категории */
function renderCategories() {
  if (!categoriesContainer) return;
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>Категории не найдены</p>";
    return;
  }

  categoriesContainer.innerHTML = allCategories
    .map(
      (c) => `
    <div class="category" data-category="${c.title}">
      <img src="${c.icon}" alt="${c.title}">
      <p>${c.title}</p>
    </div>`
    )
    .join("");

  const catElems = document.querySelectorAll(".category");
  catElems.forEach((el) =>
    el.addEventListener("click", () => {
      catElems.forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      selectedCategory = el.dataset.category;
      applyFilters();
    })
  );

  if (catElems.length) {
    catElems[0].classList.add("active");
    selectedCategory = catElems[0].dataset.category;
  }
}

/* Нажатие "Посмотреть" */
showBtn?.addEventListener("click", async () => {
  if (rentMode !== "daily") {
    try {
      await fetchBookings();
    } catch (e) {
      /* уже залогировано внутри fetchBookings */
    } finally {
      showBtn.disabled = false;
      showBtn.textContent = oldText;
      try {
        applyFilters();
      } catch (e) {
        console.error("applyFilters error:", e);
      }
    }
    return;
  }

  selectedStart = startInput.value;
  selectedEnd   = endInput.value;

  if (!selectedStart || !selectedEnd) {
    alert("Пожалуйста, выберите обе даты аренды");
    return;
  }

  // блокируем кнопку и показываем лоадер
  showBtn.disabled = true;
  const oldText = showBtn.textContent;
  showBtn.textContent = "Загрузка...";

  try {
    await fetchBookings();       // может кинуть — не страшно
  } catch (e) {
    /* уже залогировано внутри fetchBookings */
  } finally {
    // в любом случае возвращаем кнопку и перерисовываем список
    applyFilters();
    showBtn.disabled = false;
    showBtn.textContent = oldText;
  }
});

function isBlockedStatus(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  // RU и EN варианты
  return s === "активно" || s === "подтверждено" || s === "active" || s === "confirmed";
}

async function fetchBookings() {
  try {
    const r = await fetch(`${API}/bookings/`, { method: "GET" });
    if (!r.ok) throw new Error(`Bookings HTTP ${r.status}`);
    const data = await r.json();
    allBookings = (data?.results || []).filter(b =>
      ["active", "pending", "confirmed"].includes(String(b.status).toLowerCase())
    );
  } catch (err) {
    console.error("fetchBookings error:", err);
    // Не ломаем UI из-за сетевой ошибки
    allBookings = [];
  }
}
/* === Основная фильтрация === */
function applyFilters() {
  // Посуточно — требуем обе даты
  if (rentMode === "daily" && (!selectedStart || !selectedEnd)) {
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        Пожалуйста, выберите даты аренды
      </p>`;
    return;
  }

  let list = allHouses.slice();
  list = list.filter(house => {
    const hasBlockedBooking = (allBookings || []).some(
      b => b.house === house.id && isBlockedStatus(b.status || b.status_title)
    );
    return !hasBlockedBooking;
  });

  // --- значения фильтров ---
  const bedrooms = document.getElementById("filterBedrooms")?.value || "";
  const district = document.getElementById("filterDistrict")?.value || "";
  const priceFromValue = document.getElementById("priceFrom")?.value?.trim?.();
  const priceToValue   = document.getElementById("priceTo")?.value?.trim?.();

  // --- Категория ---
  if (selectedCategory) {
    list = list.filter(
      h => (h.category_title || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
  }

  // --- Фильтр спален ---
  if (bedrooms) {
    if (bedrooms === "5") list = list.filter(h => Number(h.bedrooms) >= 5);
    else list = list.filter(h => Number(h.bedrooms) === Number(bedrooms));
  }

  // --- Район ---
  if (district) {
    const d = district.trim().toLowerCase();
    list = list.filter(h => (String(h.district || "")).trim().toLowerCase() === d);
  }

  // --- Цена/день (поля заполнены) ---
  if (priceFromValue !== "" && !isNaN(priceFromValue)) {
    const min = Number(priceFromValue);
    list = list.filter(h => Number(h.price_per_day) >= min);
  }
  if (priceToValue !== "" && !isNaN(priceToValue)) {
    const max = Number(priceToValue);
    list = list.filter(h => Number(h.price_per_day) <= max);
  }

  // --- Фильтрация по режиму аренды (ТО ЧТО НУЖНО) ---
  if (rentMode === "6m" || rentMode === "12m") {
    const m = modeMonths(); // 6 или 12
    const needDays = m * 30;
    list = list.filter(h =>
      (h.price_tiers || []).some(
        t => t.is_active && Number(t.min_days) === Number(needDays)
      )
      // если используешь хелпер:
      // hasExactTierForMonths(h, m)
    );
  }

  // --- Бронь/пересечения — только для посуточного ---
  if (rentMode === "daily") {
    const s = toLocalDate(selectedStart);
    const e = toLocalDate(selectedEnd);

    // сначала убираем дома с заблокированными пересекающимися бронями
    list = list.filter(h => {
      const hasBlockedOverlap = (allBookings || []).some(b =>
        b.house === h.id &&
        isBlockedStatus(b.status || b.status_title) &&
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
      );
      return !hasBlockedOverlap;
    });

    // затем обычная проверка пересечений (если она у тебя уже была — оставь)
    list = list
      .map(h => {
        const conflicts = (allBookings || []).some(
          b => b.house === h.id &&
              overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
        );
        return { ...h, __hasConflict: conflicts };
      })
      .filter(h => !h.__hasConflict);
  }

  // --- Рендер/пустое состояние ---
  if (!list.length) {
    const emptyMsg =
      rentMode === "6m"
        ? "Нет объектов с тарифом на 6 мес"
        : rentMode === "12m"
          ? "Нет объектов с тарифом на 12 мес"
          : "Нет доступных объектов под выбранные условия";
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        ${emptyMsg}
      </p>`;
    return;
  }

  renderHouses(list);
}

function hasBasePrice(item) {
  return Number(item?.price_per_day) > 0;
}


/* === Рендер карточек === */
function renderHouses(houses) {
  if (!houses.length) {
    cardsContainer.innerHTML =
      "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных объектов под выбранные условия</p>";
    return;
  }

  cardsContainer.innerHTML = houses.map(h => {
    const images = (h.images?.length ? h.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img src="${img.image}" alt="${h.title}">`)
      .join("");

    return `
      <div class="card">
        <div class="card-slider">
          <div class="slides">${images}</div>
          ${h.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${h.title}</h4>
            <p>${h.area ?? "—"} кв/м<br>${h.bedrooms ?? "-"} спален</p>
          </div>
          ${h.district ? `<p style="font-size:14px;color:#6e6e6e;">Район: ${h.district?.name || h.district}</p>` : ""}
          ${(h.features?.length ? `<div class="goods">${h.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}
          <div class="line"></div>

          ${
            hasBasePrice(h)
              ? `<div class="price">
                  ${(() => {
                    if (rentMode === "daily") {
                      const days = (selectedStart && selectedEnd) ? nights(selectedStart, selectedEnd) : 1;
                      const pricePerDay = getDynamicPrice(h, days);
                      return `
                        <h4>${rub(pricePerDay)}/день</h4>
                        <p>${days} ${declineDays(days)}<br>Депозит: ${rub(h.deposit || 0)}</p>
                      `;
                    } else {
                      const m = modeMonths();
                      const res = getContractPrice(h, m);
                      const hint = res.mode === "daily-fallback"
                        ? `<br><span style="font-size:12px;color:#8a8a8a;">(по посуточной сетке)</span>`
                        : "";
                      return `
                        <h4>${rub(res.monthly)}/мес</h4>
                        <p>Контракт на ${m} мес<br>Депозит: ${rub(h.deposit || 0)}${hint}</p>
                      `;
                    }
                  })()}
                </div>`
              : ""  // если базовая цена 0 — не показываем блок цены вовсе
          }

          <button class="openBooking" data-id="${h.id}">Забронировать</button>
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

/* === Слайдер === */
function initSliders() {
  document.querySelectorAll(".card-slider").forEach(slider => {
    const slides = slider.querySelector(".slides");
    const imgs = slides.querySelectorAll("img");
    let current = 0;

    const prev = slider.querySelector(".prev");
    const next = slider.querySelector(".next");

    function show(i) {
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

/* === Модалки === */
function openBooking(house) {
  currentHouse = house;
  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalPhoto.src = house.images?.[0]?.image || "../../images/no_photo.png";
  const titleEl = modalTitle || document.querySelector(".car-title") || document.querySelector(".house-title");
  if (titleEl) titleEl.textContent = house.title || "Объект";
  modalDesc.textContent = house.description || (house.area ? `${house.area} кв/м` : "");

  if (rentMode === "daily" && selectedStart && selectedEnd) {
    const n = nights(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
    const pricePerDay = getDynamicPrice(house, n);
    modalTotal.textContent = rub(pricePerDay * n);
    if (ltcStartWrap) ltcStartWrap.style.display = "none";
  } else if (rentMode !== "daily") {
    const m = modeMonths(); // 6 или 12
    modalRange.textContent = `Контракт на ${m} мес`;

    const res = getContractPrice(house, m);
    modalTotal.textContent = rub(res.total);

    if (ltcStartWrap) ltcStartWrap.style.display = "block";
  } else {
    modalRange.textContent = "Даты не выбраны";
    modalTotal.textContent = "—";
    if (ltcStartWrap) ltcStartWrap.style.display = "none";
  }

  // правила поставщика
  setProviderRules(house.rental_provider);

  bookingForm?.reset?.();
}



function closeBooking() {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => {
  if (e.target === bookingModal) closeBooking();
});
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());

/* === Отправка брони === */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentHouse) return alert("Выберите дом");

  let sDate = selectedStart;
  let eDate = selectedEnd;

  if (rentMode === "daily") {
    if (!sDate || !eDate) return alert("Выберите даты");
  } else {
    // для долгосрока нужна только дата начала
    const startVal = ltcStartInput?.value;
    if (!startVal) return alert("Выберите дату начала контракта");
    const s = toLocalDate(startVal);
    const months = modeMonths();
    const e = addMonths(s, months);
    const pad = (x) => String(x).padStart(2, "0");
    sDate = `${s.getFullYear()}-${pad(s.getMonth()+1)}-${pad(s.getDate())}`;
    eDate = `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}`;
  }

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']").value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']").value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']").value.trim();

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
    contract_type: rentMode,             // 'daily' | '6m' | '12m'
    contract_months: modeMonths() || null
  };

  const btn = bookingForm.querySelector(".btn");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Отправка...";

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
    alert("Ошибка при бронировании");
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
});

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* === Фильтр-модалка === */
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
  priceTo = Number(document.getElementById("priceTo").value);
  if (Number.isNaN(priceFrom)) priceFrom = null;
  if (Number.isNaN(priceTo)) priceTo = null;
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* === Заполнение районов === */
function loadDistricts() {
  const select = document.getElementById("filterDistrict");
  if (!select) return;
  const allDistricts = [...new Set(allHouses.map(h => h.district).filter(Boolean))];
  select.innerHTML =
    '<option value="">Любой</option>' +
    allDistricts.map(d => `<option value="${d}">${d}</option>`).join("");
}

// === Хелперы для долгосрока ===
function findTierByMinDays(house, minDays) {
  return (house.price_tiers || []).find(
    t => t.is_active && Number(t.min_days) === Number(minDays)
  ) || null;
}

function getTierForMonths(house, months) {
  const days = months * 30;
  return findTierByMinDays(house, days); // 180 -> 6 мес, 360 -> 12 мес
}

function hasExactTierForMonths(house, months) {
  const needDays = months * 30;
  return (house.price_tiers || []).some(
    t => t.is_active && Number(t.min_days) === Number(needDays)
  );
}

// Возвращает цену для долгосрока с фолбэком на посуточную сетку:
// - если есть точный tier → месячная = perDay*30
// - если нет → считаем посуточно для (months*30) дней
function getContractPrice(house, months) {
  const days = months * 30;
  const exactTier = getTierForMonths(house, months);
  if (exactTier) {
    const perDay = Number(exactTier.price_per_day) || 0;
    return {
      mode: "exact-tier",
      perDay,
      monthly: perDay * 30,
      total: perDay * 30 * months
    };
  }
  // фолбэк: посуточная логика для большого количества дней
  const perDay = getDynamicPrice(house, days);
  return {
    mode: "daily-fallback",
    perDay,
    monthly: perDay * 30,
    total: perDay * days // можно и monthly*months, это то же самое
  };
}



/* ==== Rules modal helpers ==== */
function ensureRulesModal() {
  if (document.getElementById("rulesModal")) return;
  const html = `
    <div class="modal" id="rulesModal" style="display:none;">
      <div class="modal-content" style="max-width:640px;margin:0 auto;">
        <span class="close rules-close">&times;</span>
        <h3 style="margin-top:0;">Правила аренды</h3>
        <div class="rules-body" style="display:flex;flex-direction:column;gap:10px;"></div>
        <button type="button" class="btn rules-ok" style="margin-top:16px;">Понятно</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const rm = document.getElementById("rulesModal");
  const close = () => {
    rm.style.display = "none";
    document.body.style.overflow = "";
  };  
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

// безопасная подстановка terms + контактов
function setProviderRules(provider) {
  ensureRulesModal();
  const box = document.querySelector("#rulesModal .rules-body");
  const name = provider?.name ? ` для <b>${provider.name}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms) {
    terms = "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  }
  const esc = (s) => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const htmlTerms = esc(terms).replace(/\n/g, "<br>");

  const contacts = [
    provider?.phone ? `<li>Телефон: <b>${provider.phone}</b></li>` : "",
    provider?.telegram ? `<li>Telegram: <b>${provider.telegram}</b></li>` : "",
    provider?.email ? `<li>Email: <b>${provider.email}</b></li>` : ""
  ].filter(Boolean).join("");

  box.innerHTML = `
    <p><b>Правила аренды${name}</b></p>
    <div style="color:#333;line-height:1.45">${htmlTerms}</div>
    ${contacts ? `<ul style="margin-top:12px;color:#555">${contacts}</ul>` : ""}
    <p style="color:#99A2AD;margin-top:8px">*Информация предоставлена арендодателем.</p>
  `;
}

// Делегирование клика по «правилами аренды»
document.addEventListener("click", (e) => {
  const link = e.target.closest(".rules-link");
  if (!link) return;
  e.preventDefault();
  setProviderRules(currentHouse?.rental_provider || null);
  openRulesModal();
});
