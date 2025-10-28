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

/* API */
const API = "https://rentareabackend.pythonanywhere.com/api/houses";

/* State */
let allHouses = [];
let allCategories = [];
let allBookings = [];
let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentHouse = null;

/* Фильтры */
let priceFrom = null;
let priceTo = null;

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
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter(b =>
    ["active", "pending", "confirmed"].includes(b.status)
  );
}

/* Init */
(async function init() {
  await Promise.all([fetchCategories(), fetchHouses()]);
  renderCategories();
  loadDistricts();
  cardsContainer.innerHTML =
    `<p style="text-align:center;color:#99A2AD;margin-top:40px;">
      Пожалуйста, выберите даты аренды
    </p>`;
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
  selectedStart = startInput.value;
  selectedEnd = endInput.value;

  if (!selectedStart || !selectedEnd) {
    alert("Пожалуйста, выберите обе даты аренды");
    return;
  }

  showBtn.disabled = true;
  const oldText = showBtn.textContent;
  showBtn.textContent = "Загрузка...";
  await fetchBookings();
  applyFilters();
  showBtn.disabled = false;
  showBtn.textContent = oldText;
});

/* === Основная фильтрация === */
function applyFilters() {
  // Проверяем, выбраны ли даты
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        Пожалуйста, выберите даты аренды
      </p>`;
    return;
  }

  let list = allHouses.slice();

  // Берём значения фильтров
  const bedrooms = document.getElementById("filterBedrooms")?.value || "";
  const district = document.getElementById("filterDistrict")?.value || "";

  // --- Фильтры (только если пользователь выбрал) ---
  if (bedrooms) {
    if (bedrooms === "5") list = list.filter(h => Number(h.bedrooms) >= 5);
    else list = list.filter(h => Number(h.bedrooms) === Number(bedrooms));
  }

  if (district) {
    list = list.filter(
      h => (h.district || "").trim().toLowerCase() === district.trim().toLowerCase()
    );
  }

  if (selectedCategory) {
    list = list.filter(
      h => h.category_title.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
  }
  // Фильтрация по цене — только если поля действительно заполнены
  const priceFromValue = document.getElementById("priceFrom")?.value.trim();
  const priceToValue = document.getElementById("priceTo")?.value.trim();

  if (priceFromValue !== "" && !isNaN(priceFromValue)) {
    const min = Number(priceFromValue);
    list = list.filter(h => Number(h.price_per_day) >= min);
  }

  if (priceToValue !== "" && !isNaN(priceToValue)) {
    const max = Number(priceToValue);
    list = list.filter(h => Number(h.price_per_day) <= max);
  }

  // --- Проверяем занятость по датам ---
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map(h => {
    const conflicts = allBookings.some(
      b =>
        b.house === h.id &&
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
    );
    return { ...h, __hasConflict: conflicts };
  });
  list = list.filter(h => !h.__hasConflict);

  // --- Рендер ---
  if (!list.length) {
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        Нет доступных объектов на выбранные даты
      </p>`;
    return;
  }

  console.log("Осталось:", list.length);
  renderHouses(list);
}



/* === Рендер карточек === */
function renderHouses(houses) {
  if (!houses.length) {
    cardsContainer.innerHTML =
      "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных объектов на выбранные даты</p>";
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
          <<div class="price">
            ${(() => {
              let pricePerDay = Number(h.price_per_day);
              let total = pricePerDay;
              let days = 1;

              if (selectedStart && selectedEnd) {
                days = daysExclusiveNights(selectedStart, selectedEnd);
                pricePerDay = getDynamicPrice(h, days);
                total = pricePerDay * days;
              }

              return `
                <h4>${rub(total + h.deposit)}</h4>
                <p>${rub(pricePerDay)}/день · ${days} ${declineDays(days)}<br>Депозит: ${rub(h.deposit || 0)}</p>
              `;
            })()}
          </div>
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
  modalTitle.textContent = house.title || "Объект";
  modalDesc.textContent = house.description || (house.area ? `${house.area} кв/м` : "");

  if (selectedStart && selectedEnd) {
    const n = nights(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
    const pricePerDay = getDynamicPrice(house, n);
    modalTotal.textContent = rub(pricePerDay * n);  } else {
    modalRange.textContent = "Даты не выбраны";
    modalTotal.textContent = "—";
  }

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
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']").value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']").value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']").value.trim();

  const payload = {
    house: currentHouse.id,
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
  console.log("Доступные районы:", allDistricts);
}

function getDynamicPrice(house, days) {
  if (!house.price_tiers || !house.price_tiers.length) {
    return Number(house.price_per_day) || 0;
  }

  // ищем подходящий диапазон по дням
  const tier = house.price_tiers.find(t => {
    const min = Number(t.min_days) || 0;
    const max = Number(t.max_days) || Infinity;
    return days >= min && days <= max;
  });

  // если найден — возвращаем цену по этому диапазону
  return tier ? Number(tier.price_per_day) : Number(house.price_per_day);
}