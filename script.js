"use strict";

/* ==============================
   Telegram Mini App bootstrap
   ============================== */
const tg = window.Telegram?.WebApp;
tg?.ready?.();

// === BACK BUTTON ROBUST INIT ===
let __backHandlerBound = false;

function backHandler() {
  // 👉 сюда твоя логика «Назад»
  // пример: закрыть модалку/страницу, либо выйти:
  // unlockApp(); tg.close();
  console.log('[TG] Back pressed');
}

function initBackButton() {
  if (!tg) return;
  if (__backHandlerBound) return; // не дублируем

  // Показать кнопку
  tg.BackButton?.show?.();

  // 1) Официальный обработчик
  tg.BackButton?.onClick?.(backHandler);

  // 2) Запасной канал — глобальное событие
  tg.offEvent?.('backButtonClicked', backHandler); // на всякий случай уберём дубликаты
  tg.onEvent?.('backButtonClicked', backHandler);

  __backHandlerBound = true;
}

function disposeBackButton() {
  if (!tg) return;
  // Спрячь и отпишись, когда нужно убрать свою логику «Назад»
  tg.BackButton?.hide?.();
  tg.BackButton?.onClick?.(null);
  tg.offEvent?.('backButtonClicked', backHandler);
  __backHandlerBound = false;
}

// ВАЖНО: вызывать ПОСЛЕ tg.ready()
initBackButton();

// Если у тебя где-то есть обработчик viewportChanged,
// не перезаписывай onClick. Максимум — повторно показать:
tg?.onEvent?.('viewportChanged', () => {
  // не трогаем подписку, только гарантируем, что кнопка видна
  tg.BackButton?.show?.();
});


tg?.expand?.();
if (tg?.swipeBehavior?.disableVertical?.isAvailable?.()) {
  tg.swipeBehavior.disableVertical();
}
const user = tg?.initDataUnsafe?.user ?? null;

(function(){
  const tg = window.Telegram?.WebApp;
  const tgId = tg?.initDataUnsafe?.user?.id || null;

  const page = "index"; // поменяй на "cars", "moto", "house", "tour" ¬øна соответствующих страницах
  const city = localStorage.getItem("selectedCity") || "";

  const key = `visit:${page}`;
  if (!sessionStorage.getItem(key)) {
    fetch("https://rentareabackend.pythonanywhere.com/api/track-visit/", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ page, tg_id: user?.id, city })
    }).catch(()=>{});
    sessionStorage.setItem(key, "1");
  }
})();

/* ==============================
   i18n (RU/EN)
   ============================== */
const I18N = {
  ru: {
    title: "Telegram Mini App",

    // Категории
    cat_cars_title: "Автомобили",
    cat_cars_desc: "От эконом до премиум",
    cat_moto_title: "Мотоциклы",
    cat_moto_desc: "Для ярких впечатлений и манёвренности в городе",
    cat_house_title: "Недвижимость",
    cat_house_desc: "От уютных студий до просторных вилл",
    cat_tour_title: "Экскурсии",
    cat_tour_desc: "Незабываемые маршруты от местных гидов",

    // О нас
    about_title: "О нас",
    about_body:
      "Привет! Мы — ваш надёжный помощник в аренде.\n\n" +
      "Знаем, как сложно бывает в незнакомом городе: долгие поиски, сомнения в надёжности, непонятные условия.\n\n" +
      "Поэтому мы сделали всё просто:\n" +
      "· Собрали лучшие локальные компании по аренде авто, мото, жилья и организации экскурсий.\n" +
      "· Проверили их отзывы и репутацию.\n" +
      "· Объединили в одном приложении, чтобы вы могли выбрать всё для поездки за считанные минуты.\n\n" +
      "Как это работает?\n" +
      "· Сравнивайте варианты — все предложения собраны в одном месте.\n" +
      "· Выбирайте подходящее — с помощью удобных фильтров и фиксированных цен.\n" +
      "· Бронируйте прямо в приложении — быстро и без лишних звонков.\n\n" +
      "Наша цель — чтобы вы чувствовали себя уверенно в любой поездке.\n" +
      "Арендуйте с нами — быстро, безопасно и без переплат.",
    support_prefix: "Для связи со службой поддержки по любым вопросам —",

    // Города
    city_all: "Все",
    city_placeholder: "Нажмите чтобы выбрать город",
  },

  en: {
    title: "Telegram Mini App",

    // Categories
    cat_cars_title: "Cars",
    cat_cars_desc: "From economy to premium",
    cat_moto_title: "Motorcycles",
    cat_moto_desc: "For vivid emotions and city agility",
    cat_house_title: "Realty",
    cat_house_desc: "From cozy studios to spacious villas",
    cat_tour_title: "Tours",
    cat_tour_desc: "Unforgettable routes from local guides",

    // About
    about_title: "About us",
    about_body:
      "Hi! We are your reliable rental assistant.\n\n" +
      "We know how hard it can be in a new city: long searches, doubts about reliability, unclear terms.\n\n" +
      "So we made it simple:\n" +
      "· Collected the best local companies for car, moto, housing rentals and tours.\n" +
      "· Checked their reviews and reputation.\n" +
      "· Brought everything together so you can choose in minutes.\n\n" +
      "How it works:\n" +
      "· Compare options — everything in one place.\n" +
      "· Pick what fits — with handy filters and fixed prices.\n" +
      "· Book right in the app — fast and without extra calls.\n\n" +
      "Our goal is that you feel confident on any trip.\n" +
      "Rent with us — fast, safe and without overpayments.",
    support_prefix: "For support on any questions —",

    // Cities
    city_all: "All",
    city_placeholder: "Tap to choose a city",
  },
};

const langSelect = document.getElementById("langSelect");
let LANG =
  localStorage.getItem("rent_lang") ||
  (navigator.language?.startsWith("en") ? "en" : "ru");
langSelect.value = LANG;

function t(key) {
  return I18N[LANG][key] ?? key;
}

function nl2br(str) {
  return String(str).replace(/\n/g, "<br>");
}

function applyI18n() {
  // document title
  document.title = t("title");

  // simple [data-i18n] replacements (innerHTML)
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = t(key);
    // поддержка многострочного about_body
    if (key === "about_body") {
      el.innerHTML = nl2br(val);
    } else {
      el.innerHTML = val;
    }
  });

  // city picker placeholder + “All”
  const picker = document.getElementById("cityPicker");
  if (picker && picker.options.length) {
    // Обновим тексты первого (placeholder) и пункта "Все/All" при наличии
    const placeholder = picker.querySelector("option[data-kind='placeholder']");
    const allOpt = picker.querySelector("option[data-kind='all']");
    if (placeholder) placeholder.textContent = t("city_placeholder");
    if (allOpt) allOpt.textContent = t("city_all");
  }
}

// language change
langSelect.addEventListener("change", () => {
  LANG = langSelect.value;
  localStorage.setItem("rent_lang", LANG);
  applyI18n();
});

/* ==============================
   Города (City Picker)
   ============================== */
const API_BASE = "https://rentareabackend.pythonanywhere.com/api";
const cityPicker = document.getElementById("cityPicker");

// ensure default selectedCity
if (!localStorage.getItem("selectedCity")) {
  localStorage.setItem("selectedCity", I18N[LANG].city_all);
}

function fillCitiesOptions(list) {
  const saved = localStorage.getItem("selectedCity");

  const opts = [
    `<option data-kind="placeholder" value="" selected>${t("city_placeholder")}</option>`,
    `<option data-kind="all" value="${t("city_all")}">${t("city_all")}</option>`,
    ...list.map(
      (item) => `<option value="${item.name}">${item.name}</option>`
    ),
  ];

  cityPicker.innerHTML = opts.join("");

  // restore saved value if present in options, else keep placeholder
  if (saved) {
    const toSet =
      Array.from(cityPicker.options).find((o) => o.value === saved)?.value ||
      "";
    cityPicker.value = toSet;
  }
}

fetch(`${API_BASE}/core/cities/`)
  .then((r) => r.json())
  .then((res) => fillCitiesOptions(res?.results || []))
  .catch((err) => {
    console.error("Ошибка загрузки городов:", err);
    // even if failed, render baseline options
    fillCitiesOptions([]);
  });

cityPicker.addEventListener("change", (e) => {
  const selectedCity = e.target.value || t("city_all");
  localStorage.setItem("selectedCity", selectedCity);
  console.log("Выбран город:", selectedCity);
});

/* ==============================
   Первый рендер i18n
   ============================== */
applyI18n();
