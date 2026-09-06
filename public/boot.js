document.documentElement.classList.add("is-booting");
setTimeout(function () {
  document.documentElement.classList.remove("is-booting");
}, 3000);
