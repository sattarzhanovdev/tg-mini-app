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
