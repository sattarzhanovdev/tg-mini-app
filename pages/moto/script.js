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
const modalTitle = bookingModal?.querySelector(".moto-title");
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

/* API (moto) */
const API = "https://rentareabackend.pythonanywhere.com/api/motorcycles";

/* State */
let allMotorcycles = [];
let allCategories  = [];
let allBookings    = [];
let selectedCategory = null;
let selectedStart = null;
let selectedEnd   = null;
let currentMoto   = null;

/* Цена фильтр */
let priceFrom = null;
let priceTo   = null;

/* Fetch */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}
async function fetchMotorcycles() {
  const r = await fetch(`${API}/motorcycles/`);
  const data = await r.json();
  const city = localStorage.getItem("selectedCity");
  const list = data?.results || [];
  allMotorcycles = (!city || city === "Все") ? list : list.filter(m => m.city?.name === city);
}
async function fetchBookings() {
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter(b => ["active","pending","confirmed"].includes(b.status));
}

/* Init */
(async function init(){
  await Promise.all([fetchCategories(), fetchMotorcycles()]);
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

  let list = allMotorcycles.slice();

  // категория
  if (selectedCategory) list = list.filter(m => m.category_title === selectedCategory);

  // доступность
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map(m => {
    const hasConflict = allBookings.some(b => b.motorcycle === m.id && overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date)));
    return { ...m, __hasConflict: hasConflict };
  });

  // показываем только свободные
  list = list.filter(m => !m.__hasConflict);

  // фильтр цены
  if (priceFrom != null && !Number.isNaN(priceFrom)) list = list.filter(m => Number(m.price_per_day) >= Number(priceFrom));
  if (priceTo   != null && !Number.isNaN(priceTo))   list = list.filter(m => Number(m.price_per_day) <= Number(priceTo));

  renderMotorcycles(list);
}

function renderMotorcycles(motos) {
  if (!motos.length) {
    cardsContainer.innerHTML = "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных мотоциклов на выбранные даты</p>";
    return;
  }

  cardsContainer.innerHTML = motos.map(m => {
    const images = (m.images?.length ? m.images : [{ image: "../../images/no_photo.png" }])
      .map(img => `<img src="${img.image}" alt="${m.title}">`)
      .join("");
    return `
      <div class="card">
        <div class="card-slider">
          <div class="slides">${images}</div>
          ${m.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${m.title}</h4>
            <p>${m.year || "—"}, ${m.color || "—"}</p>
          </div>

          <div class="specs">
            <li><img src="../../images/car_parameters/motor.svg"> ${m.engine_volume || "—"}L</li>
            <li><img src="../../images/car_parameters/settings.svg"> ${m.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg"> ${m.mileage || "—"} км</li>
            <li><img src="../../images/car_parameters/oil.svg"> ${m.oil_type || "—"}</li>
          </div>

          ${(m.features?.length ? `<div class="goods">${m.features.map(f=>`<li>${f.title}</li>`).join("")}</div>` : "")}

          <div class="line"></div>
          <div class="price">
            <h4>${rub(m.price_per_day)}</h4>
            <p>${rub(m.price_per_day)}/день<br>Депозит: ${rub(m.deposit || 0)}</p>
          </div>

          <button class="openBooking" data-id="${m.id}">Забронировать</button>
        </div>
      </div>
    `;
  }).join("");

  initSliders();

  document.querySelectorAll(".openBooking").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const moto = motos.find(m => m.id === id);
      if (moto) openBooking(moto);
    });
  });
}

/* Слайдер */
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

    // свайп
    let startX = 0;
    slides.addEventListener("touchstart", e => (startX = e.touches[0].clientX));
    slides.addEventListener("touchend", e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) show(current - 1);
      if (diff < -50) show(current + 1);
    });
  });
}

/* Открытие модалки */
function openBooking(moto) {
  currentMoto = moto;
  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalPhoto.src = moto.images?.[0]?.image || "../../images/no_photo.png";
  modalTitle.textContent = moto.title || "Мотоцикл";
  modalDesc.textContent  = moto.description || "";

  if (selectedStart && selectedEnd) {
    const n = nights(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
    modalTotal.textContent = rub((Number(moto.price_per_day) || 0) * n);
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

/* Отправка бронирования */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentMoto) return alert("Выберите мотоцикл");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']")?.value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']")?.value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();

  const payload = {
    motorcycle: currentMoto.id,                  // <-- фикс: motorcycle
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
