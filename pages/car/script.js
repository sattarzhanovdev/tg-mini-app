const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const user = tg.initDataUnsafe?.user ?? null;

const nameElement = document.getElementById("user-name");
const photoElement = document.getElementById("photo-profile");

if (user) {
  nameElement.textContent = `Здравствуйте, ${user.first_name || "гость"}!`;
  photoElement.src = user.photo_url || "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
} else {
  nameElement.textContent = "Здравствуйте, гость!";
  photoElement.src = "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";
}

const navLinks = document.querySelectorAll("footer .bottom__bar li a");

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    // снять active со всех
    navLinks.forEach(l => l.classList.remove("active"));

    // добавить active на выбранный
    link.classList.add("active");
  });
});


const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const text = document.getElementById('date-text'); // если хочешь выводить итог куда-то

const declineDays = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'дня';
  return 'дней';
};

function updateDateText() {
  if (!startInput.value || !endInput.value) return;
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);
  const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const options = { day: 'numeric', month: 'short' };
  const startStr = startDate.toLocaleDateString('ru-RU', options);
  const endStr = endDate.toLocaleDateString('ru-RU', options);
  text.textContent = `${startStr} – ${endStr} · ${diffDays} ${declineDays(diffDays)}`;
}

startInput.addEventListener('change', updateDateText);
endInput.addEventListener('change', updateDateText);

const bookingModal = document.getElementById('bookingModal');
const successModal = document.getElementById('successModal');
const openBooking = document.getElementById('openBooking');
const closeSuccess = document.getElementById('closeSuccess');
const bookingForm = document.getElementById('bookingForm');
const closeBtn = document.querySelector('.close');

// открыть форму бронирования
openBooking.addEventListener('click', () => {
  bookingModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
});

// закрыть форму бронирования
closeBtn.addEventListener('click', () => {
  bookingModal.style.display = 'none';
  document.body.style.overflow = 'auto';
});

// отправка формы
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  bookingModal.style.display = 'none';
  successModal.style.display = 'flex';
});

// закрыть окно успешной заявки
closeSuccess.addEventListener('click', () => {
  successModal.style.display = 'none';
  document.body.style.overflow = 'auto';
});

// клик вне модалки закрывает её
window.addEventListener('click', (e) => {
  if (e.target === successModal) {
    successModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
});
