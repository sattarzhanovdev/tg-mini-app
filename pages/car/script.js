"use strict";

/* Telegram Mini App */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;

/* Elements */
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
const modalPrice = bookingModal?.querySelector(".price");
const modalTotal = bookingModal?.querySelector(".price");


const sortSelect = document.getElementById("sortPrice");

/* Helpers */
const dayMs = 24 * 60 * 60 * 1000;
const toLocalDate = (iso) => new Date(iso + "T00:00:00");
const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
const daysExclusiveNights = (startIso, endIso) => {
  const s = toLocalDate(startIso);
  const e = toLocalDate(endIso);
  const diff = Math.ceil((e - s) / dayMs);
  return Math.max(1, diff);
};
const declineDays = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дня";
  return "дней";
};
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/* API */
const API_BASE = "https://rentareabackend.pythonanywhere.com/api";
const API = `${API_BASE}/cars`;

let allCars = [];
let allCategories = [];
let allBookings = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd = null;
let currentCar = null;

/* Fetch */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  // сервер отдаёт {title, icon} или {name, icon} — нормализуем
  allCategories = (data?.results || []).map(c => ({ name: c.name || c.title, icon: c.icon }));
}

async function fetchCars() {
  const r = await fetch(`${API}/cars/`);
  const data = await r.json();
  allCars = data?.results || [];
}

async function fetchBookings() {
  const r = await fetch(`${API}/bookings/`);
  const data = await r.json();
  allBookings = (data?.results || []).filter((b) => ["active", "pending", "confirmed"].includes(b.status));
}

/* City picker */
if (pickerCities) {
  fetch(`${API_BASE}/core/cities/`)
    .then((r) => r.json())
    .then((res) => {
      const template = [
        `<option value="all">Все</option>`,
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

/* Init */
(async function init() {
  await Promise.all([fetchCategories(), fetchCars()]);
  renderCategories();
  applyFilters();
})();

/* Categories */
function renderCategories() {
  if (!categoriesContainer) return;
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>Категории не найдены</p>";
    return;
  }
  categoriesContainer.innerHTML = allCategories
    .map(
      (c) => `
      <div class="category" data-category="${c.name}">
        <img src="${c.icon}" alt="${c.name}">
        <p>${c.name}</p>
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

  if (catElems.length > 0) {
    catElems[0].classList.add("active");
    selectedCategory = catElems[0].dataset.category;
  }
}

/* Open/Close Filter Modal */
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

/* Dates → availability */
showBtn?.addEventListener("click", async () => {
  selectedStart = startInput.value;
  selectedEnd = endInput.value;
  if (!selectedStart || !selectedEnd) return alert("Выберите обе даты");
  showBtn.disabled = true;
  const oldText = showBtn.textContent;
  showBtn.textContent = "Загрузка...";
  await fetchBookings();
  applyFilters();
  showBtn.disabled = false;
  showBtn.textContent = oldText;
});

/* Sorting */
sortSelect?.addEventListener("change", applyFilters);

/* Apply filter form */
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});

/* Filtering + render */
/* Filtering + render */

function applyFilters() {
  // если даты не выбраны — показываем сообщение и ничего не рендерим
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        Пожалуйста, выберите даты аренды
      </p>`;
    return;
  }

  let list = allCars.slice();

  // категория
  if (selectedCategory) list = list.filter((c) => c.category_title === selectedCategory);

  // город
  const selectedCity = localStorage.getItem("selectedCity");
  if (selectedCity && selectedCity !== "Все") {
    list = list.filter((c) => c.city?.name === selectedCity);
  }

  // значения из фильтра
  const yearFrom = parseInt(document.getElementById("filterYear")?.value || "");
  const color = document.getElementById("filterColor")?.value || "";
  const transmission = document.getElementById("filterTransmission")?.value || "";
  const priceFrom = parseFloat(document.getElementById("priceFrom")?.value || "");
  const priceTo = parseFloat(document.getElementById("priceTo")?.value || "");
  const brand = document.getElementById("filterBrand")?.value || "";
  const model = document.getElementById("filterModel")?.value || "";

  // фильтры
  if (brand) list = list.filter((c) => Number(c.brand) === Number(brand));
  if (model) list = list.filter((c) => Number(c.model) === Number(model));
  if (!isNaN(yearFrom)) list = list.filter((c) => Number(c.year || 0) >= yearFrom);
  if (color) list = list.filter((c) => (c.color || "").toLowerCase() === color.toLowerCase());
  if (transmission) {
    const t = transmission.toLowerCase();
    list = list.filter((c) => (c.transmission || "").toLowerCase().includes(t));
  }
  if (!isNaN(priceFrom)) list = list.filter((c) => Number(c.price_per_day) >= priceFrom);
  if (!isNaN(priceTo)) list = list.filter((c) => Number(c.price_per_day) <= priceTo);

  // фильтр по бронированиям (так как даты уже точно выбраны)
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map((car) => {
    const conflicts = allBookings.some(
      (b) =>
        b.car === car.id &&
        overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date))
    );
    return { ...car, __hasConflict: conflicts };
  });
  list = list.filter((car) => !car.__hasConflict);

  // сортировка
  const sort = sortSelect?.value;
  if (sort === "asc") list.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
  if (sort === "desc") list.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));

  // если фильтры выбраны, но ничего не найдено
  if (!list.length) {
    cardsContainer.innerHTML = `
      <p style="text-align:center;color:#99A2AD;margin-top:40px;">
        Нет доступных автомобилей на выбранные даты
      </p>`;
    return;
  }

  renderCars(list);
}




/* Рендер карточек */
function renderCars(cars) {
  const container = document.querySelector(".cards");
  if (!cars.length) {
    container.innerHTML = "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных автомобилей на выбранные даты</p>";
    return;
  }

  container.innerHTML = cars
    .map((car) => {
      const images = car.images?.length
        ? car.images.map(img => `<img src="${img.image}" alt="${car.title}">`).join('')
        : `<img src='../../images/no_photo.jpg' alt='no photo'>`;

      return `
      <div class="card">
        <div class="card-slider">
          <div class="slides">${images}</div>
          ${car.images?.length > 1 ? `<button class="prev">‹</button><button class="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${car.title}</h4>
            <p>${car.year || "—"}, ${car.color || "—"}</p>
          </div>

          <div>
            <li><img src="../../images/car_parameters/motor.svg"> ${car.engine_volume || "—"}L</li>
            <li><img src="../../images/car_parameters/settings.svg"> ${car.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg"> ${car.mileage || "—"} км</li>
            <li><img src="../../images/car_parameters/oil.svg"> ${car.oil_type || "—"}</li>
          </div>

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
                <h4>${rub(total + car.deposit)}</h4>
                <p>${rub(pricePerDay)}/день · ${days} ${declineDays(days)}<br>Депозит: ${rub(car.deposit || 0)}</p>
              `;
            })()}
          </div>

          <button class="openBooking" data-id="${car.id}">Забронировать</button>
        </div>
      </div>`;
    })
    .join("");

  initCarSliders();

  document.querySelectorAll(".openBooking").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const car = cars.find((c) => String(c.id) === String(id));
      if (!car) return;
      openBooking(car);
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


/* Booking */
function openBooking(car) {
  currentCar = car;
  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalPhoto.src = car.images?.[0]?.image || "../../images/no_photo.jpg";
  modalTitle.textContent = car.title;
  modalDesc.textContent  = car.description || "";

  const deliverySelect = bookingModal.querySelector(".delivery");
  deliverySelect.innerHTML = "";

  // добавляем варианты доставки
  if (car.delivery_zones?.length) {
    const options = car.delivery_zones
      .filter(z => z.is_active)
      .map(z => `<option value="${z.price}" data-name="${z.name}">${z.name} (+${rub(z.price)})</option>`)
      .join("");
    deliverySelect.innerHTML = `<option value="0">Без доставки</option>` + options;
  } else {
    deliverySelect.innerHTML = `<option value="0">Без доставки</option>`;
  }

  // расчёт цен
  const updateTotal = () => {
    if (!selectedStart || !selectedEnd) {
      modalRange.textContent = "Даты не выбраны";
      modalTotal.textContent = "—";
      return;
    }

    const days = daysExclusiveNights(selectedStart, selectedEnd);
    const basePrice = getDynamicPrice(car, days);
    const rentTotal = basePrice * days;
    const delivery = parseFloat(deliverySelect.value || 0);
    const grandTotal = rentTotal + delivery;

    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${days} ${declineDays(days)}`;
    modalTotal.textContent = `${rub(grandTotal)} (включая доставку ${rub(delivery)})`;
  };

  // при изменении зоны пересчитываем сумму
  deliverySelect.addEventListener("change", updateTotal);

  // первичный расчёт
  updateTotal();

  bookingForm?.reset?.();
}



bookingClose?.addEventListener("click", () => {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
});
bookingModal?.addEventListener("click", (e) => {
  if (e.target === bookingModal) {
    bookingModal.style.display = "none";
    document.body.style.overflow = "";
  }
});

const modalStartInput = document.getElementById("modal-start");
const modalEndInput   = document.getElementById("modal-end");

modalStartInput?.addEventListener("change", updateModalDates);
modalEndInput?.addEventListener("change", updateModalDates);

function updateModalDates() {
  const sVal = modalStartInput.value;
  const eVal = modalEndInput.value;
  if (sVal && eVal) {
    const n = daysExclusiveNights(sVal, eVal);
    modalRange.textContent = `${fmtRu(toLocalDate(sVal))} — ${fmtRu(
      toLocalDate(eVal)
    )} · ${n} ${declineDays(n)}`;
    const pricePerDay = getDynamicPrice(currentCar, n);
    modalPrice.textContent = rub(pricePerDay * n);
    selectedStart = sVal;
    selectedEnd = eVal;
  } else {
    modalRange.textContent = "Выберите даты";
    modalPrice.textContent = "—";
  }
}

/* Submit booking */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!document.getElementById("agreeRules")?.checked)
    return alert("Пожалуйста, согласитесь с правилами аренды");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name = bookingForm.querySelector("input[placeholder='Ваше имя']").value.trim();
  const phone = bookingForm.querySelector("input[placeholder='Ваш номер телефона']").value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']").value.trim();

  const deliverySelect = bookingForm.querySelector(".delivery");
  const deliveryPrice = parseFloat(deliverySelect?.value || 0);
  const deliveryName = deliverySelect?.selectedOptions?.[0]?.dataset?.name || null;

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
    delivery_price: deliveryPrice
  };

  const btn = bookingForm.querySelector(".btn");
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
  } catch (err) {
    console.error(err);
    alert("Ошибка при бронировании");
  } finally {
    btn.disabled = false;
    btn.textContent = "Забронировать";
  }
});

closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

const API_CARS = `${API_BASE}/cars`;

/* === Загрузка данных в фильтр === */
async function loadFilterData() {
  try {
    // BRANDS
    const brandsRes = await fetch(`${API_CARS}/brands`);
    if (!brandsRes.ok) throw new Error(`brands HTTP ${brandsRes.status}`);
    const brandsJson = await brandsRes.json();
    const brands = Array.isArray(brandsJson) ? brandsJson : (brandsJson?.results || []);
    const brandSelect = document.getElementById("filterBrand");
    brandSelect.innerHTML = '<option value="">Любая</option>' +
    brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("");

    // MODELS
    const modelsRes = await fetch(`${API_CARS}/models`);
    if (!modelsRes.ok) throw new Error(`models HTTP ${modelsRes.status}`);
    const modelsJson = await modelsRes.json();
    const allModels = Array.isArray(modelsJson) ? modelsJson : (modelsJson?.results || []);
    const modelSelect = document.getElementById("filterModel");

    const renderModels = (list) => {
      modelSelect.innerHTML = '<option value="">Любая</option>' +
        list.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
    };
    renderModels(allModels);

    brandSelect.onchange = (e) => {
      const brandId = Number(e.target.value);
      if (!brandId) return renderModels(allModels);
      const filtered = allModels.filter(m => {
        const id = m.brand;
        return Number(id) === brandId;
      });
      renderModels(filtered);
    };
  } catch (err) {
    console.error("Ошибка загрузки фильтра:", err);
  }
}


let filterDataLoaded = false;

filterBtn?.addEventListener("click", async () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  if (!filterDataLoaded) {
    await loadFilterData();
    filterDataLoaded = true;
  }
});



/* === Расчёт динамической цены в зависимости от количества дней === */
function getDynamicPrice(car, days) {
  // Если есть уровни цен
  if (car.price_tiers && car.price_tiers.length) {
    // фильтруем только активные уровни
    const activeTiers = car.price_tiers.filter(t => t.is_active);

    // сортируем по min_days по возрастанию
    activeTiers.sort((a, b) => a.min_days - b.min_days);

    // ищем подходящий уровень (последний, у которого min_days <= days)
    let matchedTier = null;
    for (const tier of activeTiers) {
      if (days >= tier.min_days) matchedTier = tier;
    }

    // если нашли уровень — возвращаем его цену
    if (matchedTier) return Number(matchedTier.price_per_day);
  }

  // иначе — стандартная цена
  return Number(car.price_per_day);
}
