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
let allTours = [];
let allCategories = [];
let allBookings = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentTour = null;

const BOOKING_STATUSES_BLOCK = new Set(["active", "pending"]);

const API = "https://telegram-mini-app-b3ah.onrender.com/api/excursions";

/* ================
   Helpers
   ================ */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} $`;
const daysInclusive = (a, b) => Math.max(1, Math.round((toLocalDate(b) - toLocalDate(a)) / dayMs) + 1);
const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart <= bEnd) && (aEnd >= bStart);

/* ================
   API calls
   ================ */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}

async function fetchTours() {
  const r = await fetch(`${API}/`);
  const data = await r.json();
  allTours = data?.results || [];
}

async function fetchBookings() {
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter((b) => BOOKING_STATUSES_BLOCK.has(b.status));
}

/* ================
   Init
   ================ */
(async function init() {
  await Promise.all([fetchCategories(), fetchTours()]);
  renderCategories();
  applyFilters();
})();

/* ================
   Render categories
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

  catElems[0]?.classList.add("active");
  selectedCategory = catElems[0]?.getAttribute("data-category");
}

/* ================
   Apply filters
   ================ */
function applyFilters() {
  let list = selectedCategory
    ? allTours.filter((t) => t.category_title === selectedCategory)
    : allTours.slice();

  if (selectedStart && selectedEnd && allBookings.length) {
    const s = toLocalDate(selectedStart);
    const e = toLocalDate(selectedEnd);
    list = list.map((tour) => {
      const tourBookings = allBookings.filter((b) => b.tour === tour.id);
      const conflicts = tourBookings.filter((b) =>
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
      );
      return { ...tour, __hasConflict: conflicts.length > 0 };
    });
  } else {
    list = list.map((t) => ({ ...t, __hasConflict: false }));
  }

  renderTours(list);
}

/* ================
   Render tours
   ================ */
function renderTours(tours) {
  if (!tours.length) {
    cardsContainer.innerHTML = "<p>Нет доступных экскурсий</p>";
    return;
  }

  const html = tours
    .map((tour) => {
      return `
      <div class="card ${tour.__hasConflict ? "unavailable" : ""}">
        <img src="${tour.images?.[0]?.image || "../../images/no_photo.png"}" alt="${tour.title}">
        <div class="info">
          <h4>${tour.title}</h4>
          <p>${tour.description || ""}</p>

          <div class="goods">
            ${(tour.features || []).map((f) => `<li>${f.title}</li>`).join("") || ""}
          </div>

          <div class="line"></div>

          <div class="price">
            <h4>${tour.price_per_day}$</h4>
            <p>за день</p>
          </div>

          <button class="openBooking" ${tour.__hasConflict ? "disabled" : ""} data-id="${tour.id}">
            ${tour.__hasConflict ? "Недоступно" : "Забронировать"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  cardsContainer.innerHTML = html;

  document.querySelectorAll(".openBooking:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const tour = tours.find((t) => t.id === id);
      if (tour) openBookingForTour(tour);
    });
  });
}

/* ================
   Booking modal
   ================ */
function openBookingForTour(tour) {
  currentTour = tour;

  const photo = bookingModal.querySelector(".photo_product");
  const title = bookingModal.querySelector("h4");
  const desc = bookingModal.querySelector(".description");
  const totalPrice = bookingModal.querySelector(".price");
  const dateSpan = bookingModal.querySelector(".date-time");

  if (photo) photo.src = tour.images?.[0]?.image || "../../images/no_photo.png";
  if (title) title.textContent = tour.title;
  if (desc) desc.textContent = tour.description || "";

  if (selectedStart && selectedEnd) {
    const n = daysInclusive(selectedStart, selectedEnd);
    dateSpan.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} дней`;
    const total = (tour.price_per_day || 0) * n;
    totalPrice.textContent = rub(total);
  }

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  bookingForm.reset();
}

bookingClose?.addEventListener("click", () => {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
});

/* ================
   Booking form submit
   ================ */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentTour) return alert("Выберите экскурсию");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']").value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']").value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']").value.trim();

  const telegramId = user?.id || null;

  const payload = {
    tour: currentTour.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: telegramId,
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

    bookingModal.style.display = "none";
    successModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  } catch (err) {
    console.error(err);
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
