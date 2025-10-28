"use strict";

/* Telegram Mini App */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;

/* DOM */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const startInput = document.getElementById("start-date");
const endInput   = document.getElementById("end-date");
const showBtn    = document.querySelector(".show");

/* Модалки */
const bookingModal = document.getElementById("bookingModal");
const bookingClose = bookingModal?.querySelector(".close");
const bookingForm  = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

/* Элементы модалки */
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".tour-title");
const modalDesc  = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

/* Фильтр (цена) */
const filterBtn   = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
const filterForm  = document.getElementById("filterForm");

/* Helpers */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
const nights = (startIso, endIso) => Math.max(1, Math.ceil((toLocalDate(endIso) - toLocalDate(startIso)) / dayMs));
const declineDays = (n) => (n % 10 === 1 && n % 100 !== 11) ? "день" : ([2,3,4].includes(n%10) && ![12,13,14].includes(n%100) ? "дня" : "дней");

/* API (tours) */
const API = "https://rentareabackend.pythonanywhere.com/api/excursions";

/* State */
let allTours = [];
let allCategories = [];
let allBookings = [];
let selectedCategory = null;
let selectedStart = null;
let selectedEnd   = null;
let currentTour   = null;

/* Цена фильтр */
let priceFrom = null;
let priceTo   = null;

/* Fetchers */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}
async function fetchTours() {
  const r = await fetch(`${API}/excursions/`);
  const data = await r.json();
  const city = localStorage.getItem("selectedCity");
  const list = data?.results || [];
  allTours = (!city || city === "Все") ? list : list.filter(t => t.city?.name === city);
}
async function fetchBookings() {
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter(b => ["active","pending","confirmed"].includes(b.status));
}

/* Init */
(async function init(){
  await Promise.all([fetchCategories(), fetchTours()]);
  renderCategories();
  // до выбора дат — подсказка
  cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">Пожалуйста, выберите даты аренды</p>`;
})();

/* Категории */
function renderCategories() {
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>Категории не найдены</p>";
    return;
  }

  categoriesContainer.innerHTML = allCategories.map(c => `
    <div class="category" data-category="${c.title}">
      <img src="${c.icon}" alt="${c.title}">
      <p>${c.title}</p>
    </div>
  `).join("");

  const catElems = document.querySelectorAll(".category");
  catElems.forEach(el => el.addEventListener("click", () => {
    catElems.forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    selectedCategory = el.dataset.category;
    applyFilters();
  }));
  if (catElems.length) {
    catElems[0].classList.add("active");
    selectedCategory = catElems[0].dataset.category;
  }
}

/* Нажатие "Посмотреть" */
showBtn?.addEventListener("click", async () => {
  selectedStart = startInput.value;
  selectedEnd   = endInput.value;
  if (!selectedStart || !selectedEnd) return alert("Выберите обе даты");

  showBtn.disabled = true;
  const old = showBtn.textContent;
  showBtn.textContent = "Загрузка...";
  await fetchBookings();
  applyFilters();
  showBtn.disabled = false;
  showBtn.textContent = old;
});

/* Фильтрация и рендер */
function applyFilters() {
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">Пожалуйста, выберите даты аренды</p>`;
    return;
  }

  let list = allTours.slice();

  // категория
  if (selectedCategory) list = list.filter(t => t.category_title === selectedCategory);

  // доступность по броням
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map(t => {
    const hasConflict = allBookings.some(b => b.tour === t.id && overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date)));
    return { ...t, __hasConflict: hasConflict };
  });

  // показываем только свободные
  list = list.filter(t => !t.__hasConflict);

  // фильтр цены (за человека)
  if (priceFrom != null && !Number.isNaN(priceFrom)) list = list.filter(t => Number(t.price_per_person) >= Number(priceFrom));
  if (priceTo   != null && !Number.isNaN(priceTo))   list = list.filter(t => Number(t.price_per_person) <= Number(priceTo));

  renderTours(list);
}

function renderTours(tours) {
  if (!tours.length) {
    cardsContainer.innerHTML = "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных экскурсий на выбранные даты</p>";
    return;
  }

  cardsContainer.innerHTML = tours.map(t => {
    const img = t.images?.[0]?.image || "../../images/no_photo.png";
    return `
      <div class="card">
        <img src="${img}" alt="${t.title}">
        <div class="info">
          <h4>${t.title}</h4>
          <p class="descr-trunc">${t.description || ""}</p>

          ${(t.features?.length ? `<div class="goods">${t.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}

          <div class="line"></div>
          <div class="price">
            ${(() => {
              let pricePerDay = Number(car.price_per_day);
              let total = pricePerDay;
              let days = 1;

              if (selectedStart && selectedEnd) {
                days = daysExclusiveNights(selectedStart, selectedEnd);
                pricePerDay = getDynamicPrice(car, days);
                total = pricePerDay * days;
              }

              return `
                <h4>${rub(total)}</h4>
                <p>${rub(pricePerDay)}/день · ${days} ${declineDays(days)}<br>Депозит: ${rub(car.deposit || 0)}</p>
              `;
            })()}
          </div>

          <button class="openBooking" data-id="${t.id}">Забронировать</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".openBooking").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const tour = tours.find(t => t.id === id);
      if (tour) openBooking(tour);
    });
  });
}

/* Открытие модалки */
function openBooking(tour) {
  currentTour = tour;
  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalPhoto.src = tour.images?.[0]?.image || "../../images/no_photo.png";
  modalTitle.textContent = tour.title || "Экскурсия";
  modalDesc.textContent  = tour.description || "";

  if (selectedStart && selectedEnd) {
    const n = nights(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
    const pricePerPerson = getDynamicTourPrice(tour, n);
    modalTotal.textContent = rub(pricePerPerson);
  } else {
    modalRange.textContent = "Даты не выбраны";
    modalTotal.textContent = "—";
  }

  bookingForm?.reset?.();
}

/* Закрытие модалок */
function closeBooking(){
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => { if (e.target === bookingModal) closeBooking(); });
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* Отправка брони */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentTour) return alert("Выберите экскурсию");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']")?.value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']")?.value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();

  const payload = {
    excursion: currentTour.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user?.id || 102445,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment,
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

/* Модалка фильтра */
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
  if (Number.isNaN(priceTo))   priceTo   = null;
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});


/* === Расчёт динамической цены в зависимости от количества дней === */
function getDynamicTourPrice(tour, days) {
  if (!tour.price_tiers || !tour.price_tiers.length) {
    return Number(tour.price_per_person) || 0;
  }

  // ищем диапазон, подходящий по количеству дней
  const tier = tour.price_tiers.find(t => {
    const min = Number(t.min_days) || 0;
    const max = t.max_days ? Number(t.max_days) : Infinity;
    return days >= min && days <= max;
  });

  // если нашли диапазон — возвращаем цену из него
  return tier ? Number(tier.price_per_person) : Number(tour.price_per_person);
}