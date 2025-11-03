"use strict";

/* ==============================
   Telegram Mini App bootstrap
   ============================== */
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();

if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) {
  tg.swipeBehavior.disableVertical();
  console.log("🔒 Vertical swipe disabled");
}

const user = tg?.initDataUnsafe?.user ?? null;

const nameElement = document.getElementById("user-name");
const photoElement = document.getElementById("photo-profile");

// if (user) {
//   nameElement.textContent = `Здравствуйте, ${user.first_name || "гость"}!`;
//   photoElement.src =
//     user.photo_url ||
//     "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
// } else {
//   nameElement.textContent = "Здравствуйте, гость!";
//   photoElement.src =
//     "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
// }

/* ==============================
   Навигация внизу
   ============================== */
const navLinks = document.querySelectorAll("footer .bottom__bar li a");
navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

/* ==============================
   Новые предложения — пример загрузки с API
   ============================== */
const cardsContainer = document.getElementById("new-cards");
const API_BASE = "https://rentareabackend.pythonanywhere.com/api";

function rub(n) {
  return `${Number(n || 0).toLocaleString("ru-RU")} ฿`;
}

/**
 * Функция для загрузки новых авто по умолчанию.
 * Можно адаптировать под любые категории (мото, дома, туры и т.д.)
 */
// async function fetchNewCars() {
//   try {
//     const res = await fetch(`${API_BASE}/cars/cars/`);
//     if (!res.ok) throw new Error("Ошибка загрузки данных");
//     const data = await res.json();
//     const cars = data?.results || [];
//     renderCards(cars);
//   } catch (err) {
//     console.error(err);
//     cardsContainer.innerHTML = `<p style="text-align:center;color:red;">Не удалось загрузить данные</p>`;
//   }
// }

// /**
//  * Рендер карточек (используем одну структуру для всех типов)
//  */
// function renderCards(items, type = "default") {
//   if (!items?.length) {
//     cardsContainer.innerHTML = "<p>Нет предложений</p>";
//     return;
//   }

//   console.log(type);
  
//   const html = items
//     .slice(0, 6)
//     .map((item) => {
//       // если это недвижимость (houses)
//       if (type === "houses" || type === "tours" || item.area !== undefined) {
//         const isBooked = item.__hasConflict || false;
//         let bookedText = "";
//         if (isBooked && item.__conflictRange?.length) {
//           const b = item.__conflictRange[0];
//           bookedText = `Занято: ${toLocalDate(b.start_date).toLocaleDateString(
//             "ru-RU"
//           )} — ${toLocalDate(b.end_date).toLocaleDateString("ru-RU")}`;
//         }

//         return `
//         <div class="card ${isBooked ? "unavailable" : ""}">
//           <img src="${item.images?.[0]?.image || "../../images/no_photo.png"}" alt="${item.title}">
//           <div class="info">
//             <div style="display: flex; align-items: center; justify-content: space-between;">
//               <h4>${item.title}</h4>
//               <p>${item.area ?? "—"} кв/м</p>
//             </div>
//             ${
//               isBooked
//                 ? `<p class="booked" style="color: red; margin-top: 6px;">${bookedText}</p>`
//                 : ""
//             }
//             <div class="goods">
//               ${(item.features || []).map((v) => `<li>${v.title}</li>`).join("")}
//             </div>
//             <div class="line"></div>
//             <div class="price">
//               <h4>${rub(item.price_per_day)}</h4>
//               <p>${rub(item.price_per_day)}/день<br>Депозит: ${rub(item.deposit || 0)}</p>
//             </div>
//             <button class="openBooking" ${
//               isBooked ? "disabled" : ""
//             } data-id="${item.id}">
//               ${isBooked ? "Недоступно" : "Забронировать"}
//             </button>
//           </div>
//         </div>`;
//       }

//       // иначе — стандартная карточка (авто, мото, экскурсии)
//       return `
//       <div class="card">
//         <img src="${item.images?.[0]?.image || './images/car_img.png'}" alt="${item.title}">
//         <div class="info">
//           <div>
//             <h4>${item.title}</h4>
//             <p>${item.year || "—"}, ${item.color || "—"}</p>
//           </div>
//           <div>
//             <li><img src="./images/car_parameters/motor.svg" alt="motor">${item.engine_volume || "—"}L</li>
//             <li><img src="./images/car_parameters/settings.svg" alt="settings">${item.transmission || "—"}</li>
//             <li><img src="./images/car_parameters/road.svg" alt="road">${item.mileage || 0} km</li>
//             <li><img src="./images/car_parameters/oil.svg" alt="oil">${item.oil_type || "—"}</li>
//           </div>
//           <div class="goods">
//             ${(item.features || []).map(f => `<li>${f.title}</li>`).join("")}
//           </div>
//           <div class="line"></div>
//           <div class="price">
//             <h4>${item.price_per_day || 0}฿</h4>
//             <p>Депозит: ${item.deposit || 0}฿</p>
//           </div>
//           <button>Забронировать</button>
//         </div>
//       </div>`;
//     })
//     .join("");

//   cardsContainer.innerHTML = html;
// }

/* ==============================
   Кнопки переключения категорий
   ============================== */
document.querySelectorAll(".choices__btns button").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".choices__btns button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.textContent.trim();

    if (type === "Автомобили") await fetchCategory("cars/cars", "cars");
    else if (type === "Мотоциклы") await fetchCategory("motorcycles/motorcycles", "motorcycles");
    else if (type === "Недвижимость") await fetchCategory("houses/houses", "houses");
    else if (type === "Экскурсии") await fetchCategory("excursions/excursions", "tours");
  });
});

/* ==============================
   Общая функция для подгрузки категорий
   ============================== */
async function fetchCategory(endpoint, type = "default") {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}/`);
    if (!res.ok) throw new Error("Ошибка загрузки данных");
    const data = await res.json();
    renderCards(data?.results || [], type);
  } catch (err) {
    console.error(err);
    cardsContainer.innerHTML = `<p style="text-align:center;color:red;">Ошибка загрузки ${endpoint}</p>`;
  }
}
/* ==============================
   Стартовая загрузка
   ============================== */
// fetchNewCars();

if(!localStorage.getItem('selectedCity')){
  localStorage.setItem('selectedCity', 'Все')
}

const pickerCities = document.querySelector('.picker-city');

fetch(`${API_BASE}/core/cities/`)
  .then(res => res.json())
  .then(res => {
    // создаём пункт "Все"
    const options = [
      `<option value="Все" selected>Нажмите чтобы выбрать город</option>`,
      ...res.results.map(item => `<option value="${item.name}">${item.name}</option>`)
    ];

    pickerCities.innerHTML = options.join('');

    // восстановим сохранённый город из localStorage
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
      pickerCities.value = savedCity;
    } else {
      pickerCities.value = 'all'; // по умолчанию — "Все"
    }
  })
  .catch(err => console.error('Ошибка загрузки городов:', err));

// слушаем выбор пользователя
pickerCities.addEventListener('change', (e) => {
  const selectedCity = e.target.value;
  localStorage.setItem('selectedCity', selectedCity);
  console.log('Выбран город:', selectedCity);
});
