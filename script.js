const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // попытка увеличить область

const user = tg.initDataUnsafe?.user;
document.getElementById("user-name").innerText = user ? `Здравствуйте, ${user.first_name}!` : "Здравствуйте, гость!";
document.getElementById("photo-profile").src = user && user.photo_url ? user.photo_url : "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=";