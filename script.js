const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const caviarEmail = "geral@caviareventos.com";

const getGmailComposeUrl = ({ subject, body }) => {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: caviarEmail,
    su: subject,
    body
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
};

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const closeNav = () => {
  document.body.classList.remove("nav-open");
  header.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
};

const getScrollTargetTop = (target) => {
  const headerOffset = header.getBoundingClientRect().height + 14;
  return Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
};

const scrollToTarget = (targetId) => {
  const target = targetId ? document.querySelector(targetId) : null;

  if (!target) {
    return false;
  }

  const top = getScrollTargetTop(target);
  const scroller = document.scrollingElement || document.documentElement;

  scroller.scrollTop = top;
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
  window.scrollTo(0, top);

  return true;
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || !document.querySelector(targetId)) {
      return;
    }

    event.preventDefault();
    closeNav();
    history.pushState(null, "", targetId);
    window.requestAnimationFrame(() => scrollToTarget(targetId));
  });
});

window.addEventListener("hashchange", () => {
  closeNav();
  window.requestAnimationFrame(() => scrollToTarget(window.location.hash));
});

window.addEventListener("load", () => {
  if (window.location.hash) {
    window.setTimeout(() => scrollToTarget(window.location.hash), 0);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const subject = `Brief Caviar - ${brand}`;
  const body = `Nome: ${name}\nMarca: ${brand}\n\nObjectivo:\n${message}`;
  const gmailUrl = getGmailComposeUrl({ subject, body });
  const gmailWindow = window.open(gmailUrl, "_blank", "noopener,noreferrer");

  if (!gmailWindow) {
    const fallbackSubject = encodeURIComponent(subject);
    const fallbackBody = encodeURIComponent(body);
    window.location.href = `mailto:${caviarEmail}?subject=${fallbackSubject}&body=${fallbackBody}`;
  }

  formStatus.innerHTML =
    'A abrir o Gmail com o brief preenchido. <a href="' + gmailUrl + '" target="_blank" rel="noreferrer">Abrir novamente</a>.';
});
