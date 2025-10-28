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

// Поля дат и кнопка показа
const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const showBtn = document.querySelector(".show");

// Модалки
const bookingModal = document.getElementById("bookingModal");
const bookingClose = bookingModal?.querySelector(".close");
const bookingForm = document.getElementById("bookingForm");
const successModal = document.getElementById("successModal");
const closeSuccess = document.getElementById("closeSuccess");

// Элементы внутри bookingModal
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector("h4");
const modalDesc = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");

/* ================
   State
   ================ */
let allHouses = [];
let allCategories = [];
let allBookings = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentHouse = null;

const BOOKING_STATUSES_BLOCK = new Set(["active", "pending"]);

/* ================
   Helpers
   ================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;

const daysInclusive = (startIso, endIso) =>
  Math.max(1, Math.round((toLocalDate(endIso) - toLocalDate(startIso)) / dayMs) + 1);

const declineDays = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дня";
  return "дней";
};

const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart <= bEnd) && (aEnd >= bStart);

/* ================
   API
   ================ */
const API = "https://telegram-mini-app-b3ah.onrender.com/api/houses";
let bookingsController = null;

async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  if (!r.ok) throw new Error("Не удалось загрузить категории");
  const data = await r.json();
  allCategories = data?.results || [];
}

async function fetchHouses() {
  const r = await fetch(`${API}/houses/`);
  if (!r.ok) throw new Error("Не удалось загрузить дома");
  const data = await r.json();
  const city = localStorage.getItem('selectedCity')
  if(city === 'Все'){
    allHouses = data?.results || [];
  }else{
    allHouses = data?.results.filter(item => item.city.name === city) || [];
  }
}

async function fetchBookings() {
  try {
    if (bookingsController) bookingsController.abort();
    bookingsController = new AbortController();
    const r = await fetch(`${API}/bookings/`, { signal: bookingsController.signal });
    if (!r.ok) throw new Error("Не удалось загрузить бронирования");
    const data = await r.json();
    allBookings = (data?.results || []).filter((b) => BOOKING_STATUSES_BLOCK.has(b.status));
  } catch (e) {
    console.warn("Ошибка при загрузке бронирований:", e);
  }
}

/* ================
   Init
   ================ */
(async function init() {
  try {
    await Promise.all([fetchCategories(), fetchHouses()]);
  } catch (e) {
    console.error(e);
  } finally {
    renderCategories();
    applyFilters();
  }
})();

/* ================
   Categories UI
   ================ */
function renderCategories() {
  if (!categoriesContainer) return;
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>Категории не найдены</p>";
    return;
  }

  categoriesContainer.innerHTML = allCategories
    .map(
      (item) => `
      <div class="category" data-category="${item.title}">
        <img src="${item.icon}" alt="${item.title}">
        <p>${item.title}</p>
      </div>`
    )
    .join("");

  const categoryElements = document.querySelectorAll(".category");
  categoryElements.forEach((el) => {
    el.addEventListener("click", () => {
      categoryElements.forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      selectedCategory = el.getAttribute("data-category");
      applyFilters();
    });
  });

  if (categoryElements.length > 0) {
    categoryElements[0].classList.add("active");
    selectedCategory = categoryElements[0].getAttribute("data-category");
  }
}

/* ==============================
   Show availability button click
   ============================== */
showBtn?.addEventListener("click", async () => {
  selectedStart = startInput?.value || null;
  selectedEnd = endInput?.value || null;

  if (!selectedStart || !selectedEnd) {
    alert("Пожалуйста, выберите обе даты аренды");
    return;
  }

  showBtn.disabled = true;
  const oldText = showBtn.textContent;
  showBtn.textContent = "Загрузка...";

  try {
    await fetchBookings();
    applyFilters();
  } catch (err) {
    console.error("Ошибка при обновлении бронирований:", err);
    alert("Ошибка загрузки доступности, попробуйте ещё раз");
  } finally {
    showBtn.disabled = false;
    showBtn.textContent = oldText || "Посмотреть";
  }
});

/* ================
   Filtering & render
   ================ */
function applyFilters() {
  let list = selectedCategory
    ? allHouses.filter((h) => h.category_title === selectedCategory)
    : allHouses.slice();

  if (selectedStart && selectedEnd && allBookings.length > 0) {
    const s = toLocalDate(selectedStart);
    const e = toLocalDate(selectedEnd);

    list = list.map((house) => {
      const houseBookings = allBookings.filter((b) => b.house === house.id);
      const conflicts = houseBookings.filter((b) =>
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
      );
      return {
        ...house,
        __hasConflict: conflicts.length > 0,
        __conflictRange: conflicts,
      };
    });
  } else {
    list = list.map((h) => ({ ...h, __hasConflict: false, __conflictRange: [] }));
  }

  renderHouses(list);
}

function renderHouses(houses) {
  if (!cardsContainer) return;

  if (!houses.length) {
    cardsContainer.innerHTML = "<p>Нет доступных домов по фильтрам</p>";
    return;
  }

  const html = houses
    .map((h) => {
      const isBooked = h.__hasConflict;
      let bookedText = "";
      if (isBooked && h.__conflictRange.length) {
        const b = h.__conflictRange[0];
        bookedText = `Занято: ${toLocalDate(b.start_date).toLocaleDateString(
          "ru-RU"
        )} — ${toLocalDate(b.end_date).toLocaleDateString("ru-RU")}`;
      }

      return `
      <div class="card ${isBooked ? "unavailable" : ""}">
        <img src="${h.images?.[0]?.image || "../../images/no_photo.png"}" alt="${h.title}">
        <div class="info">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h4>${h.title}</h4>
            <p>${h.area ?? "—"} кв/м</p>
          </div>
          ${isBooked ? `<p class="booked" style="color: red; margin-top: 6px;">${bookedText}</p>` : ""}
          <div class="goods">
            ${(h.features || []).map((v) => `<li>${v.title}</li>`).join("")}
          </div>
          <div class="line"></div>
          <div class="price">
            <h4>${rub(h.price_per_day)}</h4>
            <p>${rub(h.price_per_day)}/день<br>Депозит: ${rub(h.deposit || 0)}</p>
          </div>
          <button class="openBooking" ${isBooked ? "disabled" : ""} data-id="${h.id}">
            ${isBooked ? "Недоступно" : "Забронировать"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  cardsContainer.innerHTML = html;

  $$(".openBooking:not([disabled])", cardsContainer).forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const house = houses.find((h) => h.id === id);
      if (house) openBookingForHouse(house);
    });
  });
}

/* ================
   Booking modal
   ================ */
function openBookingForHouse(house) {
  if (!bookingModal) return;
  currentHouse = house;
  resetModalDates();

  if (modalPhoto) modalPhoto.src = house.images?.[0]?.image || "../../images/no_photo.png";
  if (modalTitle) modalTitle.textContent = house.title || "Объект";
  if (modalDesc) {
    const featuresText = (house.features || []).map((f) => f.title).join(", ");
    modalDesc.textContent =
      house.description || `${house.area ? house.area + " кв/м · " : ""}${featuresText || ""}`;
  }

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  bookingForm?.reset?.();
}

/* ================
   Modal close
   ================ */
function closeBooking() {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());
bookingModal?.addEventListener("click", (e) => {
  if (e.target?.id === "bookingModal") closeBooking();
});

/* ==============================
   Даты внутри bookingModal
   ============================== */
const modalStartInput = document.getElementById("modal-start");
const modalEndInput = document.getElementById("modal-end");

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

    selectedStart = sVal;
    selectedEnd = eVal;

    if (currentHouse) {
      const total = (currentHouse.price_per_day || 0) * n;
      if (modalTotal) modalTotal.textContent = rub(total);
    }
  } else {
    modalRange.style.color = "";
    modalRange.textContent = "Выберите даты";
  }
}

modalStartInput?.addEventListener("change", updateModalDates);
modalEndInput?.addEventListener("change", updateModalDates);

function resetModalDates() {
  modalStartInput.value = "";
  modalEndInput.value = "";
  if (modalRange) modalRange.textContent = "Выберите даты";
  if (modalTotal) modalTotal.textContent = "—";
}

/* ================
   Booking submit
   ================ */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentHouse) return alert("Выберите дом");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']")?.value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']")?.value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();

  if (!user?.id) return alert("Откройте Mini App в Telegram!");

  const payload = {
    house: currentHouse.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user.id,
    client_name: name,
    phone_number: phone,
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

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ================
   Filter modal
   ================ */
const filterBtn = document.querySelector(".filter");
const filterModal = document.getElementById("filterModal");
const filterClose = filterModal?.querySelector(".close");
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

filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const from = Number(document.getElementById("priceFrom").value);
  const to = Number(document.getElementById("priceTo").value);

  const filtered = allHouses.filter((house) => {
    const matchPrice =
      (!from || house.price_per_day >= from) && (!to || house.price_per_day <= to);
    return matchPrice;
  });

  renderHouses(filtered);
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
