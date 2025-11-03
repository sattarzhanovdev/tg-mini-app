"use strict";

/* Telegram bootstrap */
const tg = window.Telegram?.WebApp;
tg?.ready?.(); tg?.expand?.();
const user = tg?.initDataUnsafe?.user ?? null;

if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) {
  tg.swipeBehavior.disableVertical();
  console.log("🔒 Vertical swipe disabled");
}

/* DOM */
const categoriesContainer = document.querySelector(".categories");
const cardsContainer      = document.querySelector(".cards");
const startInput          = document.getElementById("start-date");
const endInput            = document.getElementById("end-date");
const showBtn             = document.querySelector(".show");
const sortSelect          = document.getElementById("sortPrice");

/* Modals */
const bookingModal  = document.getElementById("bookingModal");
const bookingForm   = document.getElementById("bookingForm");
const successModal  = document.getElementById("successModal");
const closeSuccess  = document.getElementById("closeSuccess");
const bookingClose  = bookingModal?.querySelector(".close");

/* Elements inside booking modal */
const modalPhoto = bookingModal?.querySelector(".photo_product");
const modalTitle = bookingModal?.querySelector(".modal-title");
const modalDesc  = bookingModal?.querySelector(".description");
const modalRange = bookingModal?.querySelector(".date-pick-result");
const modalTotal = bookingModal?.querySelector(".price");
const modalEngine= bookingModal?.querySelector(".engine");
const modalGear  = bookingModal?.querySelector(".gear");
const modalMileage= bookingModal?.querySelector(".mileage");
const modalOil   = bookingModal?.querySelector(".oil");

/* Filter modal */
const filterBtn        = document.querySelector(".filter");
const filterModal      = document.getElementById("filterModal");
const filterClose      = filterModal?.querySelector(".close");
const filterForm       = document.getElementById("filterForm");
const filterBrandInput = document.getElementById("filterBrand");
const filterModelInput = document.getElementById("filterModel");
const filterYearInput  = document.getElementById("filterYear");
const filterColorInput = document.getElementById("filterColor");
const filterTransInput = document.getElementById("filterTransmission");
const priceFromInput   = document.getElementById("priceFrom");
const priceToInput     = document.getElementById("priceTo");

const deliveryType = document.getElementById("deliveryType")?.value || "pickup";
const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();


/* Helpers */
const dayMs = 24*60*60*1000;
const toLocalDate = (iso) => { const [y,m,d]=iso.split("-").map(Number); return new Date(y, m-1, d); };

const fmtRu = (d) => d.toLocaleDateString("ru-RU", { day:"2-digit", month:"short" });
const rub = (n) => `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart < bEnd) && (aEnd > bStart);
const daysInclusive = (a,b) => {
  const s = toLocalDate(a), e = toLocalDate(b);
  const diff = Math.ceil((e - s) / dayMs) + 1;
  return rentalDays(a, b);
};


function rentalDays(startISO, endISO) {
  const s = toLocalDate(startISO);
  const e = toLocalDate(endISO);
  const diff = Math.ceil((e - s) / dayMs);   // 22→23 = 1; 22→22 = 0
  return Math.max(1, diff);                  // минимум 1 сутки
}


/* API */
const API = "https://rentareabackend.pythonanywhere.com/api/motorcycles";

/* State */
let allMotorcycles = [];
let allCategories  = [];
let allBookings    = [];

let selectedCategory = null;
let selectedStart = null;
let selectedEnd   = null;
let currentMoto   = null;

/* filter state */
let fBrand = "";
let fModel = "";
let fYear  = "";
let fColor = "";
let fTrans = "";
let fPriceFrom = "";
let fPriceTo   = "";
let sortMode   = "none";

/* Booking statuses considered as blocking */
const BOOKING_STATUSES_BLOCK = new Set(["active", "pending", "confirmed"]);

/* Fetchers */
async function fetchCategories() {
  const r = await fetch(`${API}/categories/`);
  const data = await r.json();
  allCategories = data?.results || [];
}
async function fetchMotorcycles() {
  const r = await fetch(`${API}/motorcycles/`);
  const data = await r.json();
  const city = localStorage.getItem('selectedCity');
  const list = data?.results || [];
  allMotorcycles = (!city || city === 'Все') ? list : list.filter(i => i.city?.name === city);
}
async function fetchBookings() {
  try {
    const r = await fetch(`${API}/bookings/`);
    const data = await r.json();
    allBookings = (data?.results || []).filter(b => BOOKING_STATUSES_BLOCK.has(b.status));
  } catch (e) {
    console.warn("Ошибка загрузки бронирований:", e);
  }
}

/* Init */
(async function init(){
  await Promise.all([fetchCategories(), fetchMotorcycles()]);
  renderCategories();
  hydrateFiltersFromDataset(allMotorcycles);
  // подсказка до выбора дат
  cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">Пожалуйста, выберите даты аренды</p>`;
})();

/* Categories UI */
function renderCategories() {
  if (!allCategories.length) {
    categoriesContainer.innerHTML = "<p>Категории не найдены</p>";
    return;
  }

  categoriesContainer.innerHTML = allCategories.map(
    (c) => `
      <div class="category" data-category="${c.title}">
        <img src="${c.icon}" alt="${c.title}">
        <p>${c.title}</p>
      </div>`
  ).join("");

  const catElems = document.querySelectorAll(".category");
  catElems.forEach((el) => {
    el.addEventListener("click", () => {
      catElems.forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      selectedCategory = el.getAttribute("data-category");
      applyFilters();
    });
  });

  if (catElems.length > 0) {
    catElems[0].classList.add("active");
    selectedCategory = catElems[0].getAttribute("data-category");
  }
}

/* Build brand/model/color/transmission lists from dataset */
function hydrateFiltersFromDataset(list){
  // Если в разметке нет селектов — выход (ничего не ломаем)
  if (!filterBrandInput || !filterModelInput) return;

  const brands = [...new Set(list.map(i => i.brand?.name || i.brand || "").filter(Boolean))].sort();
  filterBrandInput.innerHTML = `<option value="">Все</option>` + brands.map(b=>`<option value="${b}">${b}</option>`).join("");

  const models = [...new Set(list.map(i => i.model?.name || i.model || "").filter(Boolean))].sort();
  filterModelInput.innerHTML = `<option value="">Все</option>` + models.map(m=>`<option value="${m}">${m}</option>`).join("");

  filterBrandInput.onchange = () => {
    fBrand = filterBrandInput.value;
    const scoped = fBrand ? list.filter(i => (i.brand?.name || i.brand) === fBrand) : list;
    const subModels = [...new Set(scoped.map(i => i.model?.name || i.model || "").filter(Boolean))].sort();
    filterModelInput.innerHTML = `<option value="">Все</option>` + subModels.map(m=>`<option value="${m}">${m}</option>`).join("");
  };
}

const API_MOTO = "https://rentareabackend.pythonanywhere.com/api/motorcycles";

async function loadMotoFilterData() {
  const brandSel = document.getElementById("filterBrand");
  const modelSel = document.getElementById("filterModel");
  if (!brandSel || !modelSel) return;

  const toList = (x) => Array.isArray(x) ? x : (x?.results || []);

  try {
    // бренды
    const brRes = await fetch(`${API_MOTO}/brands/`);
    const brJson = await brRes.json();
    const brands = toList(brJson); // [{id, name}, ...]
    brandSel.innerHTML =
      `<option value="">Любая</option>` +
      brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("");

    // модели
    const mdRes = await fetch(`${API_MOTO}/models/`);
    const mdJson = await mdRes.json();
    const models = toList(mdJson); // [{id, name, brand}, ...]

    function renderModels(list) {
      modelSel.innerHTML =
        `<option value="">Любая</option>` +
        list.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
    }
    renderModels(models);

    // каскад по марке
    brandSel.onchange = () => {
      const brandId = parseInt(brandSel.value, 10);
      if (!brandId) return renderModels(models);
      const scoped = models.filter(m => Number(m.brand) === brandId);
      renderModels(scoped);
    };
  } catch (e) {
    console.error("Не удалось загрузить бренды/модели мото:", e);
  }
}



// При сабмите фильтра — тоже защищаемся
filterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  fBrand     = filterBrandInput?.value || "";
  fModel     = filterModelInput?.value || "";
  fYear      = filterYearInput?.value || "";
  fColor     = filterColorInput?.value || "";
  fTrans     = filterTransInput?.value || "";
  fPriceFrom = priceFromInput?.value ?? "";
  fPriceTo   = priceToInput?.value ?? "";

  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
  
});
/* Date availability check */

filterBtn?.addEventListener("click", async () => {
  filterModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  await loadMotoFilterData();      // <-- ВАЖНО: тянем brands/models именно здесь
});

showBtn?.addEventListener("click", async () => {
  selectedStart = startInput?.value || null;
  selectedEnd   = endInput?.value || null;

  if (!selectedStart || !selectedEnd) {
    alert("Выберите обе даты");
    return;
  }
  showBtn.disabled = true;
  const old = showBtn.textContent;
  showBtn.textContent = "Загрузка...";

  await fetchBookings();
  applyFilters();

  showBtn.disabled = false;
  showBtn.textContent = old;
});

/* Sorting select */
sortSelect?.addEventListener("change", () => {
  sortMode = sortSelect.value || "none";
  applyFilters();
});

/* Apply filters */
function applyFilters() {
  if (!selectedStart || !selectedEnd) {
    cardsContainer.innerHTML = `<p style="text-align:center;color:#99A2AD;margin-top:40px;">Пожалуйста, выберите даты аренды</p>`;
    return;
  }

  let list = selectedCategory
    ? allMotorcycles.filter((m) => m.category_title === selectedCategory)
    : allMotorcycles.slice();

  // brand/model/year/color/transmission/price
  const getBrandId = (m) => String(m.brand?.id ?? m.brand ?? "");
  const getModelId = (m) => String(m.model?.id ?? m.model ?? "");

  if (fBrand) list = list.filter(m => getBrandId(m) === String(fBrand));
  if (fModel) list = list.filter(m => getModelId(m) === String(fModel));
  if (fYear)  list = list.filter(m => Number(m.year || 0) >= Number(fYear));
  if (fColor) list = list.filter(m => (m.color || "").toLowerCase() === fColor.toLowerCase());
  if (fTrans) list = list.filter(m => (m.transmission || "").toUpperCase() === fTrans.toUpperCase());
  if (fPriceFrom !== "" && !Number.isNaN(Number(fPriceFrom))) list = list.filter(m => Number(m.price_per_day) >= Number(fPriceFrom));
  if (fPriceTo   !== "" && !Number.isNaN(Number(fPriceTo)))   list = list.filter(m => Number(m.price_per_day) <= Number(fPriceTo));

  // availability
  const s = toLocalDate(selectedStart);
  const e = toLocalDate(selectedEnd);
  list = list.map((m) => {
    const conflicts = allBookings.filter((b) => b.motorcycle === m.id);
    const hasConflict = conflicts.some((b) => overlaps(s, e, toLocalDate(b.start_date), toLocalDate(b.end_date)));
    return { ...m, __hasConflict: hasConflict, __conflictRange: conflicts };
  }).filter(m => !m.__hasConflict);

  // sorting by price
  if (sortMode === "asc")  list.sort((a,b)=> Number(a.price_per_day)-Number(b.price_per_day));
  if (sortMode === "desc") list.sort((a,b)=> Number(b.price_per_day)-Number(a.price_per_day));

  renderMotorcycles(list);
}


function mountCarousels() {
  document.querySelectorAll(".card-slider").forEach(wrap => {
    const track  = wrap.querySelector(".track");
    const slides = Array.from(track.querySelectorAll(".slide"));
    if (!track || !slides.length) return;

    // выставляем ширины (чтобы transform сдвигал «страницы»)
    const W = () => wrap.clientWidth;
    let idx = 0;
    const update = () => { track.style.transform = `translateX(${-idx * W()}px)`; };

    // не даём ничему прокручиваться/скроллиться
    ["wheel","scroll","touchstart","touchmove","touchend","pointerdown","pointermove"]
      .forEach(ev => track.addEventListener(ev, e => e.preventDefault(), { passive: false }));

    // кнопки
    wrap.querySelector(".prev")?.addEventListener("click", () => {
      idx = Math.max(0, idx - 1); update();
    });
    wrap.querySelector(".next")?.addEventListener("click", () => {
      idx = Math.min(slides.length - 1, idx + 1); update();
    });

    // при ресайзе держим корректную позицию
    window.addEventListener("resize", update);
    update();
  });
}



/* Render */
function renderMotorcycles(motos) {
  if (!motos.length) {
    cardsContainer.innerHTML = "<p style='text-align:center;color:#99A2AD;margin-top:40px;'>Нет доступных мотоциклов</p>";
    return;
  }

  cardsContainer.innerHTML = motos.map((m) => {
    const images = (m.images || []).map(x => x?.image).filter(Boolean);
    const slides = images.length ? images : ["../../images/no_photo.png"];

    return `
      <div class="card" data-card="${m.id}">
        <div class="card-slider">
          ${slides.length > 1 ? `<button class="prev" aria-label="prev">‹</button>` : ""}
          <div class="track">
            ${slides.map(src => `
              <div class="slide">
                <img src="${src}" alt="${m.title}" loading="lazy">
              </div>
            `).join("")}
          </div>
          ${slides.length > 1 ? `<button class="next" aria-label="next">›</button>` : ""}
        </div>

        <div class="info">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h4>${m.title}</h4>
            <p>${m.year || "—"}, ${m.color || "—"}</p>
          </div>

          <div style="display:flex;gap:10px;overflow-x:auto;">
            <li><img src="../../images/car_parameters/motor.svg" alt="motor"> ${m.engine_volume || "—"} CC</li>
            <li><img src="../../images/car_parameters/settings.svg" alt="settings"> ${m.transmission || "—"}</li>
            <li><img src="../../images/car_parameters/road.svg" alt="road"> ${m.mileage || "—"} km</li>
            <li><img src="../../images/car_parameters/oil.svg" alt="oil"> ${m.oil_type || "—"}</li>
          </div>

          <div class="goods">
            ${(m.features || []).map((f) => `<li>${f.title}</li>`).join("")}
          </div>

          <div class="line"></div>
          <div class="price">
            ${(function(){
              let days = 1, pricePerDay = Number(m.price_per_day) || 0, total = pricePerDay;
              if (selectedStart && selectedEnd) {
                days = rentalDays(selectedStart, selectedEnd);
                pricePerDay = getDynamicPrice(m, days);
                total = pricePerDay * days;
              }
              return `<h4>${rub(total)}</h4>
                      <p>${rub(pricePerDay)}/день · ${days} ${declineDays(days)}<br>Депозит: ${rub(m.deposit || 0)}</p>`;
            })()}
          </div>

          <button class="openBooking" data-id="${m.id}">Забронировать</button>
        </div>
      </div>`;
  }).join("");

  // инициализируем карусели ПОСЛЕ вставки разметки
  mountCarousels();

  document.querySelectorAll(".openBooking").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const moto = motos.find((m) => m.id === id);
      if (moto) openBookingForMoto(moto);
    })
  );
}





/* Booking modal open */
function openBookingForMoto(moto) {
  currentMoto = moto;

  if (modalPhoto)  modalPhoto.src = moto.images?.[0]?.image || "../../images/no_photo.png";
  if (modalTitle)  modalTitle.textContent = moto.title || "Мотоцикл";
  if (modalDesc)   modalDesc.textContent  = moto.description || "";
  if (modalEngine) modalEngine.textContent= (moto.engine_volume ? `${moto.engine_volume}L` : "—");
  if (modalGear)   modalGear.textContent  = moto.transmission || "—";
  if (modalMileage)modalMileage.textContent= (moto.mileage ? `${moto.mileage} km` : "—");
  if (modalOil)    modalOil.textContent   = moto.oil_type || "—";
  if (modalEngine) modalEngine.textContent = (moto.engine_volume ? `${moto.engine_volume} CC` : "—");

  if (selectedStart && selectedEnd) {
    const n = rentalDays(selectedStart, selectedEnd);
    modalRange.textContent = `${fmtRu(toLocalDate(selectedStart))} — ${fmtRu(toLocalDate(selectedEnd))} · ${n} ${declineWord(n)}`;
    const pricePerDay = getDynamicPrice(moto, n);
    modalTotal.textContent = rub(pricePerDay * n);
  } else {
    modalRange.textContent = "—";
    modalTotal.textContent = "—";
  }

  bookingModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  bookingForm?.reset?.();
}

/* Declensions */
function declineWord(n){
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return "дня";
  return "дней";
}
const declineDays = declineWord;

/* Close modals */
function closeBooking() {
  bookingModal.style.display = "none";
  document.body.style.overflow = "";
}
bookingClose?.addEventListener("click", closeBooking);
bookingModal?.addEventListener("click", (e) => { if (e.target?.id === "bookingModal") closeBooking(); });
window.addEventListener("keydown", (e) => e.key === "Escape" && closeBooking());
closeSuccess?.addEventListener("click", () => {
  successModal.style.display = "none";
  document.body.style.overflow = "";
});

/* Booking submit */
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentMoto) return alert("Выберите мотоцикл");
  if (!selectedStart || !selectedEnd) return alert("Выберите даты");

  const name    = bookingForm.querySelector("input[placeholder='Ваше имя']")?.value.trim();
  const phone   = bookingForm.querySelector("input[placeholder='Ваш номер телефона']")?.value.trim();
  const comment = bookingForm.querySelector("input[placeholder='Ваш комментарий']")?.value.trim();


  const payload = {
    motorcycle: currentMoto.id,
    start_date: selectedStart,
    end_date: selectedEnd,
    telegram_id: user?.id || 112345,
    client_name: name,
    phone_number: phone,
    provider_terms_accepted: true,
    service_terms_accepted: true,
    comment: `[delivery:${deliveryType}] ${comment || ""}`.trim(),
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

/* Filter modal behaviour */
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
  fBrand     = filterBrandInput.value || "";
  fModel     = filterModelInput.value || "";
  fYear      = filterYearInput.value || "";
  fColor     = filterColorInput.value || "";
  fTrans     = filterTransInput.value || "";
  fPriceFrom = priceFromInput.value;
  fPriceTo   = priceToInput.value;

  filterModal.style.display = "none";
  document.body.style.overflow = "";
  applyFilters();
});


/* === Расчёт динамической цены в зависимости от количества дней === */

// берём «лучшую» ступень (если не отсортированы)
// берём тариф с наибольшим min_days, который <= days
function getDynamicPrice(moto, days) {
  const base = Number(moto.price_per_day) || 0;
  const tiers = (Array.isArray(moto.price_tiers) ? moto.price_tiers : [])
    .filter(t => t && t.is_active)
    .sort((a, b) => Number(a.min_days) - Number(b.min_days)); // по возрастанию

  let perDay = base;
  for (const t of tiers) {
    const min = Number(t.min_days) || 0;
    if (days >= min) {
      const p = Number(t.price_per_day);
      if (!Number.isNaN(p)) perDay = p; // обновляем на более выгодный
    } else {
      break; // дальше только больше min_days — можно выйти
    }
  }
  return perDay;
}

/* ==== Rules modal helpers (универсальные) ==== */
function ensureRulesModal() {
  if (document.getElementById("rulesModal")) return;
  const html = `
    <div class="modal" id="rulesModal" style="display:none;">
      <div class="modal-content" style="max-width:640px;margin:0 auto;">
        <span class="close rules-close">&times;</span>
        <h3 style="margin:0 0 12px;">Правила аренды</h3>
        <div class="rules-body" style="display:flex;flex-direction:column;gap:10px;"></div>
        <button type="button" class="btn rules-ok" style="margin-top:16px;">Понятно</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const rm = document.getElementById("rulesModal");
  const close = () => { rm.style.display = "none"; document.body.style.overflow = ""; };
  rm.querySelector(".rules-close").addEventListener("click", close);
  rm.querySelector(".rules-ok").addEventListener("click", close);
  rm.addEventListener("click", (e)=>{ if (e.target===rm) close(); });
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
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const name = provider?.name ? ` для <b>${esc(provider.name)}</b>` : "";
  let terms = (provider?.terms ?? "").trim();
  if (!terms) {
    terms = "Правила аренды временно не указаны. Свяжитесь с поставщиком для уточнения условий.";
  }
  const htmlTerms = esc(terms).replace(/\n/g, "<br>");
  const contacts = [
    provider?.phone    ? `<li>Телефон: <b>${esc(provider.phone)}</b></li>`       : "",
    provider?.telegram ? `<li>Telegram: <b>${esc(provider.telegram)}</b></li>`   : "",
    provider?.email    ? `<li>Email: <b>${esc(provider.email)}</b></li>`         : "",
  ].filter(Boolean).join("");

  box.innerHTML = `
    <p><b>Правила аренды${name}</b></p>
    <div style="color:#333;line-height:1.45">${htmlTerms}</div>
    ${contacts ? `<ul style="margin-top:12px;color:#555">${contacts}</ul>` : ""}
    <p style="color:#99A2AD;margin-top:8px">*Информация предоставлена арендодателем.</p>
  `;
}

/* Делегирование на клик по ссылке "правилами аренды" */
document.addEventListener("click", (e) => {
  const link = e.target.closest(".rules-link");
  if (!link) return;
  e.preventDefault();
  setProviderRules(currentMoto?.rental_provider || null);
  openRulesModal();
});
