"use strict";

/* ===========================
   Telegram Mini App bootstrap
   =========================== */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();

const user = tg?.initDataUnsafe?.user ?? null;

const nameElement = document.getElementById("user-name");
const photoElement = document.getElementById("photo-profile");

if (nameElement && photoElement) {
  if (user) {
    nameElement.textContent = `Здравствуйте, ${user.first_name || "гость"}!`;
    photoElement.src =
      user.photo_url ||
      "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
  } else {
    nameElement.textContent = "Здравствуйте, гость!";
    photoElement.src =
      "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
  }
}

/* ================
   DOM references
   ================ */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer = document.querySelector(".cards");
const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const showBtn = document.querySelector(".show");

// Модалки
const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");
const bookingClose = bookingModal?.querySelector(".close");

/* ================
   State
   ================ */
let allMotorcycles = [];
let allCategories = [];
let allBookings = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentMoto = null;

const BOOKING_STATUSES_BLOCK = new Set(["active", "pending"]);


const brandsSelect = document.querySelector('.select_marka')
const modelsSelect = document.querySelector('.select_model')

fetch('https://telegram-mini-app-b3ah.onrender.com/api/cars/brands')
  .then(res => res.json())
  .then(res => {
    console.log(res);
    const template = res.map(item => `
      <option value="${item.name}">
        ${item.name}
      </option>  
    `)

    brandsSelect.innerHTML = template
  })

fetch('https://telegram-mini-app-b3ah.onrender.com/api/cars/models')
  .then(res => res.json())
  .then(res => {
    console.log(res);
    const template = res.map(item => `
      <option value="${item.name}">
        ${item.name}
      </option>  
    `)

    modelsSelect.innerHTML = template
  })
  
/* ================
   Helpers
   ================ */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
const daysInclusive = (a, b) => Math.max(1, Math.round((toLocalDate(b) - toLocalDate(a)) / dayMs) + 1);
const declineDays = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дня";
  return "дней";
};
const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart <= bEnd) && (aEnd >= bStart);

/* ================
   API
   ================ */
const API = "https://telegram-mini-app-b3ah.onrender.com/api/motorcycles";
let bookingsController = null;

async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}

async function fetchMotorcycles() {
  const r = await fetch(`${API}/motorcycles/`);
  const data = await r.json();
  const city = localStorage.getItem('selectedCity')
  if(city === 'Все'){
    allMotorcycles = data?.results || [];
  }else{
    allMotorcycles = data?.results.filter(item => item.city.name === city) || [];
  }
}

async function fetchBookings() {
  try {
    if (bookingsController) bookingsController.abort();
    bookingsController = new AbortController();
    const r = await fetch(`${API}/bookings/`, { signal: bookingsController.signal });
    const data = await r.json();
    allBookings = (data?.results || []).filter((b) => BOOKING_STATUSES_BLOCK.has(b.status));
  } catch (e) {
    console.warn("Ошибка загрузки бронирований:", e);
  }
}

/* ================
   Init
   ================ */
(async function init() {
  await Promise.all([fetchCategories(), fetchMotorcycles()]);
  renderCategories();
  applyFilters();
})();

/* ================
   Categories
   ================ */
function renderCategories() {
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
      selectedCategory = el.getAttribute("data-category");
      applyFilters();
    })
  );

  if (catElems.length > 0) {
    catElems[0].classList.add("active");
    selectedCategory = catElems[0].getAttribute("data-category");
  }
}

/* ================
   Date filtering
   ================ */
showBtn?.addEventListener("click", async () => {
  selectedStart = startInput?.value;
  selectedEnd = endInput?.value;
  if (!selectedStart || !selectedEnd) return alert("Выберите обе даты");

  showBtn.disabled = true;
  const oldText = showBtn.textContent;
  showBtn.textContent = "Загрузка...";

  await fetchBookings();
  applyFilters();

  showBtn.disabled = false;
  showBtn.textContent = oldText;
});

/* ================
   Apply filters
   ================ */
function applyFilters() {
  let list = selectedCategory
    ? allMotorcycles.filter((m) => m.category_title === selectedCategory)
    : allMotorcycles.slice();

  if (selectedStart && selectedEnd && allBookings.length) {
    const s = toLocalDate(selectedStart);
    const e = toLocalDate(selectedEnd);
    list = list.map((m) => {
      const motoBookings = allBookings.filter((b) => b.motorcycle === m.id);
      const conflicts = motoBookings.filter((b) =>
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
      );
      return { ...m, __hasConflict: conflicts.length > 0, __conflictRange: conflicts };
    });
  } else {
    list = list.map((m) => ({ ...m, __hasConflict: false, __conflictRange: [] }));
  }

  renderMotorcycles(list);
}

/* ================
   Render motorcycles
   ================ */
function renderMotorcycles(motos) {
  if (!motos.length) {
    cardsContainer.innerHTML = "<p>Нет доступных мотоциклов</p>";
    return;
  }

  cardsContainer.innerHTML = motos
    .map((m) => {
      const booked = m.__hasConflict;
      let bookedText = "";
      if (booked && m.__conflictRange.length) {
        const b = m.__conflictRange[0];
        bookedText = `Занято: ${toLocalDate(b.start_date).toLocaleDateString("ru-RU")} — ${toLocalDate(b.end_date).toLocaleDateString("ru-RU")}`;
      }

      return `
      <div class="card ${booked ? "unavailable" : ""}">
        <img src="${m.images?.[0]?.image || "../../images/no_photo.png"}" alt="${m.title}" class="photo_moto">
        <div class="info">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h4>${m.title}</h4>
            <p>${m.year || "—"}, ${m.color || "—"}</p>
          </div>

          <div>
            <li><img src="../../images/car_parameters/motor.svg" alt="motor"> ${m.engine_volume || "—"}L</li>
            <li><img src="../../images/car_parameters/settings.svg" alt="settings"> ${m.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg" alt="road"> ${m.mileage || "—"} km</li>
            <li><img src="../../images/car_parameters/oil.svg" alt="oil"> ${m.oil_type || "—"}</li>
          </div>

          <div class="goods">
            ${(m.features || []).map((f) => `<li>${f.title}</li>`).join("") || "<li>Без предоплаты</li><li>Для путешествий</li>"}
          </div>

          <div class="line"></div>
          <div class="price">
            <h4>${rub(m.price_per_day)}</h4>
            <p>${rub(m.price_per_day)}/день<br>Депозит: ${rub(m.deposit)}</p>
          </div>

          ${booked ? `<p class="booked" style="color:red;">${bookedText}</p>` : ""}
          <button class="openBooking" ${booked ? "disabled" : ""} data-id="${m.id}">
            ${booked ? "Недоступно" : "Забронировать"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  document.querySelectorAll(".openBooking:not([disabled])").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const moto = motos.find((m) => m.id === id);
      if (moto) openBookingForMoto(moto);
    })
  );
}

/* ================
   Booking modal
   ================ */
function openBookingForMoto(moto) {
  currentMoto = moto;
  
  resetModalDates(); // <— вот это добавь

  const photo = bookingModal.querySelector(".photo_product");
  const title = bookingModal.querySelector("h4");
  const desc = bookingModal.querySelector(".description");
  const range = bookingModal.querySelector(".row p");
  const total = bookingModal.querySelector(".price");

  if (photo) photo.src = moto.images?.[0]?.image || "../../images/no_photo.png";
  if (title) title.textContent = moto.title;
  if (desc) desc.textContent = moto.description || "";

  if (selectedStart && selectedEnd) {
    const n = daysInclusive(selectedStart, selectedEnd);
    range.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineDays(n)}`;
    total.textContent = `${rub(moto.price_per_day * n)}`;
  } else {
    total.textContent = "—";
  }

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  bookingForm?.reset?.();
}

/* ================
   Close modals
   ================ */
function closeBooking() {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => {
  if (e.target.id === "bookingModal") closeBooking();
});
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());
closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ================
   Booking submit
   ================ */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentMoto) return alert("Выберите мотоцикл");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']")?.value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']")?.value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();

  if (!user?.id) return alert("Откройте Mini App в Telegram!");

  const payload = {
    car: currentMoto.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user.id,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment,
  };

  const btn = bookingForm.querySelector(".btn");
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Отправка...";

  try {
    const res = await fetch(`${API}/bookings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());

    // Успешная отправка
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
    btn.textContent = prevText;
  }
});


/* ==============================
   Выбор дат внутри bookingModal
   ============================== */
const modalStartInput = document.getElementById("modal-start");
const modalEndInput = document.getElementById("modal-end");
const modalRange = bookingModal?.querySelector(".date-pick-result");

function updateModalDates() {
  const sVal = modalStartInput.value;
  const eVal = modalEndInput.value;

  if (sVal && eVal) {
    const s = toLocalDate(sVal);
    const e = toLocalDate(eVal);

    if (e < s) {
      modalRange.textContent = "Дата окончания раньше начала!";
      modalRange.style.color = "red";
      return;
    }

    const n = daysInclusive(sVal, eVal);
    modalRange.style.color = "";
    modalRange.textContent = `${fmtRu(s)} — ${fmtRu(e)} · ${n} ${declineDays(n)}`;

    // обновляем глобальные переменные
    selectedStart = sVal;
    selectedEnd = eVal;

    // обновляем цену
    if (currentCar) {
      const total = (currentCar.price_per_day || 0) * n;
      const totalPrice = bookingModal.querySelector(".price");
      if (totalPrice) totalPrice.textContent = rub(total);
    }
  } else {
    modalRange.style.color = "";
  }
}

modalStartInput?.addEventListener("change", updateModalDates);
modalEndInput?.addEventListener("change", updateModalDates);

// при открытии модалки — очистим поля
function resetModalDates() {
  modalStartInput.value = "";
  modalEndInput.value = "";
}

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

const filterBtn = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal.querySelector(".close");
const filterForm = document.getElementById("filterForm");

filterBtn?.addEventListener("click", () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

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

// Обработка формы
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const from = Number(document.getElementById("priceFrom").value);
  const to = Number(document.getElementById("priceTo").value);

  // Пример фильтрации уже загруженных машин
  const filtered = allMotorcycles.filter(car => {
    const matchPrice = (!from || car.price_per_day >= from) && (!to || car.price_per_day <= to);
    return matchPrice;
  });

  renderMotorcycles(filtered);
  filterModal.style.display = "none";
  document.body.style.overflow = "";
});


/* ================
   Bottom nav
   ================ */
const navLinks = document.querySelectorAll("footer .bottom__bar li a");
navLinks.forEach((link) =>
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  })
);

const city = document.querySelector('.city')

city.innerHTML = localStorage.getItem('selectedCity')