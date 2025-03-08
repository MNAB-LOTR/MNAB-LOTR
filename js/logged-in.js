function toggleMenu(event) {
  const menu = document.querySelector(".account-menu");
  const isMenuOpen = menu.style.display === "block";

  menu.style.display = isMenuOpen ? "none" : "block";

  event.stopPropagation();
}

function toggleSubMenu(menuId) {
  const subMenu = document.querySelector(`.${menuId}`);
  const isVisible = subMenu.style.display === "block";

  const allSubMenus = document.querySelectorAll(".sub-menu");
  allSubMenus.forEach((sub) => (sub.style.display = "none"));

  subMenu.style.display = isVisible ? "none" : "block";
}
