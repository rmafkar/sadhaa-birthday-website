"use strict";

// Birthday page settings for Sadha.
// Note: this is a front-end password gate, not server-side security.
const WEBSITE_PASSWORD = "Sadha_111";
const BIRTH_DATE = { year: 2006, month: 10, day: 31 };
const CELEBRATION_YEAR = 2026;
const SESSION_KEY = "sadhaBirthdayUnlocked";

const wishes = [
  "May the next twelve months bring you closer to the dreams you quietly carry.",
  "May you always find a reason to smile, even on the most ordinary days.",
  "May new doors open for you, and may you feel brave enough to walk through them.",
  "May your heart stay kind, your mind stay curious, and your hopes stay bright.",
  "May you collect moments that make you laugh long after the day has passed.",
  "May this chapter surprise you with beautiful people and unexpected opportunities.",
  "May you never forget how much potential you have and how far you can go.",
  "May peace find you in quiet moments and happiness find you in little things."
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const elements = {};
let toastTimeout = null;
let lastWishIndex = -1;
let lightboxWasOpen = false;

function cacheElements() {
    elements.musicButton = $("#musicButton");
    elements.backgroundMusic = $("#backgroundMusic");
  elements.body = document.body;
  elements.lockScreen = $("#lockScreen");
  elements.lockCard = $(".lock-card");
  elements.website = $("#website");
  elements.passwordForm = $("#passwordForm");
  elements.passwordInput = $("#passwordInput");
  elements.passwordError = $("#passwordError");
  elements.togglePasswordButton = $("#togglePasswordButton");
  elements.menuButton = $("#menuButton");
  elements.navMenu = $("#navMenu");
  elements.siteHeader = $("#siteHeader");
  elements.lockWebsiteButton = $("#lockWebsiteButton");
  elements.celebrateButton = $("#celebrateButton");
  elements.finalCelebrateButton = $("#finalCelebrateButton");
  elements.newWishButton = $("#newWishButton");
  elements.randomWish = $("#randomWish");
  elements.countdownGrid = $("#countdownGrid");
  elements.countdownKicker = $("#countdownKicker");
  elements.birthdayLive = $("#birthdayLive");
  elements.photoLightbox = $("#photoLightbox");
  elements.openPhotoButton = $("#openPhotoButton");
  elements.closePhotoButton = $("#closePhotoButton");
  elements.lightboxPhoto = $("#lightboxPhoto");
  elements.sadhaPhoto = $("#sadhaPhoto");
  elements.photoFallback = $("#photoFallback");
  elements.galleryPhoto = $("#galleryPhoto");
  elements.galleryPhotoFallback = $("#galleryPhotoFallback");
  elements.confettiLayer = $("#confettiLayer");
  elements.toast = $("#toast");
}

function init() {
  cacheElements();
  bindEvents();
  createLockStars();
  setupPhotoFallbacks();
  initializeRevealAnimations();
  initializeNavigationObserver();
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  if (getSessionUnlockState()) {
    showWebsite(false);
  } else {
    elements.body.classList.add("is-locked");
    window.setTimeout(() => elements.passwordInput?.focus(), 350);
  }
}

function bindEvents() {
    // Music Player Events
elements.musicButton.addEventListener("click", toggleMusic);

elements.backgroundMusic.addEventListener(
    "play", updateMusicButton
);

elements.backgroundMusic.addEventListener(
    "pause", updateMusicButton
);

elements.backgroundMusic.addEventListener(
    "error", handleMusicError
);
  elements.passwordForm.addEventListener("submit", handlePasswordSubmit);
  elements.togglePasswordButton.addEventListener("click", togglePasswordVisibility);
  elements.menuButton.addEventListener("click", toggleMobileMenu);
  elements.navMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });
  elements.lockWebsiteButton.addEventListener("click", lockWebsite);
  elements.celebrateButton.addEventListener("click", celebrate);
  elements.finalCelebrateButton.addEventListener("click", celebrate);
  elements.newWishButton.addEventListener("click", showAnotherWish);
  elements.openPhotoButton.addEventListener("click", openPhotoLightbox);
  elements.closePhotoButton.addEventListener("click", closePhotoLightbox);
  elements.photoLightbox.addEventListener("click", (event) => {
    if (event.target === elements.photoLightbox) closePhotoLightbox();
  });
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMobileMenu();
  });
  document.addEventListener("keydown", handleKeyboard);
}


function getSessionUnlockState() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "true";
  } catch {
    // Some local-file browser contexts disable web storage; the password gate still works for this visit.
    return false;
  }
}

function setSessionUnlockState(isUnlocked) {
  try {
    if (isUnlocked) window.sessionStorage.setItem(SESSION_KEY, "true");
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore unavailable session storage without preventing the birthday page from opening.
  }
}

function handlePasswordSubmit(event) {
  event.preventDefault();
  const enteredPassword = elements.passwordInput.value;

 if (enteredPassword === WEBSITE_PASSWORD) {

    elements.passwordError.textContent = "";

    // Start music immediately after correct password
    startMusic();

    showWebsite(true);

    return;
}

  elements.passwordError.textContent = enteredPassword.trim()
    ? "That password doesn't look right. Please try again."
    : "Please enter the password to continue.";
  elements.lockCard.classList.remove("shake");
  void elements.lockCard.offsetWidth;
  elements.lockCard.classList.add("shake");
  elements.passwordInput.select();
}

function showWebsite(withAnimation = true) {
  elements.website.hidden = false;
  elements.body.classList.remove("is-locked");
  if (withAnimation) {
    elements.lockScreen.classList.add("unlocking");
    window.setTimeout(() => {
      elements.lockScreen.hidden = true;
      revealElementsNowVisible();
    }, 650);
  } else {
    elements.lockScreen.hidden = true;
    revealElementsNowVisible();
  }
}

function lockWebsite() {
    stopMusic();
  setSessionUnlockState(false);
  closeMobileMenu();
  closePhotoLightbox();
  elements.passwordInput.value = "";
  elements.passwordError.textContent = "";
  elements.lockScreen.hidden = false;
  elements.lockScreen.classList.remove("unlocking");
  elements.website.hidden = true;
  elements.body.classList.add("is-locked");
  window.scrollTo({ top: 0, behavior: "auto" });
  window.setTimeout(() => elements.passwordInput.focus(), 120);
}

function togglePasswordVisibility() {
  const show = elements.passwordInput.type === "password";
  elements.passwordInput.type = show ? "text" : "password";
  elements.togglePasswordButton.textContent = show ? "◌" : "◉";
  elements.togglePasswordButton.setAttribute("aria-label", show ? "Hide password" : "Show password");
}

// ========================================
// SADHA BIRTHDAY BACKGROUND MUSIC PLAYER
// ========================================

function startMusic() {

    const music = elements.backgroundMusic;

    if (!music) return;

    music.volume = 0.4;

    try {
        music.currentTime = 0;
    } catch (error) {
        // Ignore seeking errors.
    }

    // Play immediately during the password-submit user action.
    const playRequest = music.play();

    if (playRequest && typeof playRequest.then === "function") {

        playRequest
            .then(updateMusicButton)
            .catch(handleMusicPlaybackError);

    } else {

        updateMusicButton();
    }
}


function toggleMusic() {

    const music = elements.backgroundMusic;

    if (!music) return;

    if (music.paused) {

        startMusic();

    } else {

        stopMusic();

    }
}


function stopMusic() {

    const music = elements.backgroundMusic;

    if (!music) return;

    music.pause();

    try {
        music.currentTime = 0;
    } catch (error) {
        // Ignore seeking errors.
    }

    updateMusicButton();
}


function updateMusicButton() {

    const music = elements.backgroundMusic;
    const button = elements.musicButton;

    if (!music || !button) return;

    const playing = !music.paused;

    const icon = $(".music-button-icon", button);
    const label = $(".music-button-text", button);

    if (icon) {
        icon.textContent = playing ? "Ⅱ" : "♫";
    }

    if (label) {
        label.textContent = playing ? "Stop Music" : "Play Music";
    }

    button.classList.toggle("is-playing", playing);

    button.setAttribute(
        "aria-pressed",
        String(playing)
    );

    button.setAttribute(
        "aria-label",
        playing ? "Stop background music" : "Play background music"
    );
}


function handleMusicPlaybackError(error) {

    updateMusicButton();

    if (error && error.name === "NotAllowedError") {

        showToast("Please click Play Music to start the song.");

    } else {

        showToast("Please check your birthday MP3 file.");

    }
}


function handleMusicError() {

    updateMusicButton();

    console.error(
        "Music file not found. Check audio/birthday-music.mp3"
    );
}

function updateCountdown() {
  const now = new Date();
  const celebrationDate = new Date(CELEBRATION_YEAR, BIRTH_DATE.month - 1, BIRTH_DATE.day, 0, 0, 0);

  // This is a one-time countdown for Sadha's 20th birthday in 2026.
  // After the celebration begins, keep the birthday message visible rather than counting to 2027.
  if (now.getTime() >= celebrationDate.getTime()) {
    elements.countdownGrid.hidden = true;
    elements.birthdayLive.hidden = false;
    elements.countdownKicker.textContent = "A MOMENT TO CELEBRATE";
    return;
  }

  elements.countdownGrid.hidden = false;
  elements.birthdayLive.hidden = true;
  elements.countdownKicker.textContent = "THE CELEBRATION BEGINS IN";
  const remaining = celebrationDate.getTime() - now.getTime();
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  setCountdownNumber("#days", days);
  setCountdownNumber("#hours", hours);
  setCountdownNumber("#minutes", minutes);
  setCountdownNumber("#seconds", seconds);
}

function setCountdownNumber(selector, value) {
  const node = $(selector);
  const formatted = String(value).padStart(2, "0");
  if (node.textContent !== formatted) node.textContent = formatted;
}

function setupPhotoFallbacks() {
  const pairs = [
    [elements.sadhaPhoto, elements.photoFallback],
    [elements.galleryPhoto, elements.galleryPhotoFallback]
  ];

  pairs.forEach(([image, fallback]) => {
    image.addEventListener("error", () => {
      image.classList.add("is-missing");
      fallback.hidden = false;
    }, { once: true });
    image.addEventListener("load", () => {
      image.classList.remove("is-missing");
      fallback.hidden = true;
    });
    if (image.complete && image.naturalWidth === 0) {
      image.classList.add("is-missing");
      fallback.hidden = false;
    }
  });

  elements.lightboxPhoto.addEventListener("error", () => {
    showToast("Add Sadha's photo to the images folder to use the photo viewer.");
    closePhotoLightbox();
  });
}

function openPhotoLightbox() {
  if (elements.galleryPhoto.classList.contains("is-missing")) {
    showToast("Add her photo as images/sadha-photo.jpg to view it here.");
    return;
  }
  elements.photoLightbox.hidden = false;
  elements.body.classList.add("is-locked");
  lightboxWasOpen = true;
  elements.closePhotoButton.focus();
}

function closePhotoLightbox() {
  if (!lightboxWasOpen) return;
  elements.photoLightbox.hidden = true;
  elements.body.classList.remove("is-locked");
  lightboxWasOpen = false;
  elements.openPhotoButton.focus();
}

function createLockStars() {
  const container = $("#lockStars");
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 28; i += 1) {
    const star = document.createElement("span");
    star.className = "lock-star";
    star.textContent = i % 4 === 0 ? "✧" : "·";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.fontSize = `${8 + Math.random() * 10}px`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    fragment.append(star);
  }
  container.append(fragment);
}

function initializeRevealAnimations() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  items.forEach((item) => observer.observe(item));
}

function revealElementsNowVisible() {
  $$(".reveal").forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) item.classList.add("visible");
  });
}

function initializeNavigationObserver() {
  if (!("IntersectionObserver" in window)) return;
  const links = $$(".nav-menu a");
  const validSections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-38% 0px -52% 0px", threshold: 0 });
  validSections.forEach((section) => observer.observe(section));
}

function toggleMobileMenu() {
  const open = elements.navMenu.classList.toggle("open");
  elements.menuButton.classList.toggle("active", open);
  elements.menuButton.setAttribute("aria-expanded", String(open));
  elements.menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function closeMobileMenu() {
  elements.navMenu.classList.remove("open");
  elements.menuButton.classList.remove("active");
  elements.menuButton.setAttribute("aria-expanded", "false");
  elements.menuButton.setAttribute("aria-label", "Open navigation");
}

function updateHeader() {
  elements.siteHeader.classList.toggle("scrolled", window.scrollY > 18);
}

function showAnotherWish() {
  let index = Math.floor(Math.random() * wishes.length);
  if (wishes.length > 1 && index === lastWishIndex) index = (index + 1) % wishes.length;
  lastWishIndex = index;
  elements.randomWish.animate(
    [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 330, easing: "ease-out" }
  );
  elements.randomWish.textContent = wishes[index];
}

function celebrate() {
  launchConfetti(105);
  showToast("A little sparkle for your 20th birthday, Sadha! ✨");
}

function launchConfetti(amount = 90) {
  const colors = ["#e8d6b6", "#c98783", "#f7f1e8", "#b28c64", "#a87891"];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < amount; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty("--spin", `${Math.random() * 900 - 450}deg`);
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${2.8 + Math.random() * 2}s`;
    piece.style.width = `${5 + Math.random() * 6}px`;
    piece.style.height = `${9 + Math.random() * 10}px`;
    fragment.append(piece);
    window.setTimeout(() => piece.remove(), 5600);
  }
  elements.confettiLayer.append(fragment);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function handleKeyboard(event) {
  if (event.key === "Escape") {
    if (lightboxWasOpen) closePhotoLightbox();
    if (elements.navMenu.classList.contains("open")) closeMobileMenu();
  }
}

document.addEventListener("DOMContentLoaded", init);
