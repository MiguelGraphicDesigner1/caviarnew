const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const scrollProgress = document.querySelector("[data-scroll-progress]");
const backToTopButton = document.querySelector("[data-back-to-top]");
const heroBackground = document.querySelector(".hero-bg");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const caviarEmail = "miguel@caviareventos.com";
const formEndpoint = contactForm?.getAttribute("action") || "https://formsubmit.co/ajax/miguel@caviareventos.com";
const successMessage = "Obrigado. O seu brief foi recebido. A equipa Caviar entrará em contacto brevemente.";
const errorMessage =
  "Não foi possível enviar o brief neste momento. Por favor, tente novamente ou contacte-nos por WhatsApp.";

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const syncScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, window.scrollY / scrollableHeight) : 0;

  scrollProgress.style.width = `${progress * 100}%`;
};

const syncBackToTop = () => {
  backToTopButton.classList.toggle("is-visible", window.scrollY > 520);
};

const syncHeroParallax = () => {
  if (prefersReducedMotion || !heroBackground) {
    return;
  }

  const offset = Math.min(window.scrollY * 0.08, 42);
  heroBackground.style.transform = `scale(1.04) translate3d(0, ${offset}px, 0)`;
};

const syncPageChrome = () => {
  syncHeader();
  syncScrollProgress();
  syncBackToTop();
  syncHeroParallax();
};

let scrollTicking = false;

const requestScrollSync = () => {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;
  window.requestAnimationFrame(() => {
    syncPageChrome();
    scrollTicking = false;
  });
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

const setPageScrollTop = (top) => {
  const scroller = document.scrollingElement || document.documentElement;

  scroller.scrollTop = top;
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
  window.scrollTo(0, top);
};

const scrollToPageTop = () => {
  if (prefersReducedMotion) {
    setPageScrollTop(0);
    syncPageChrome();
    return;
  }

  const start = window.scrollY;
  const duration = 620;
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextTop = Math.round(start * (1 - eased));

    setPageScrollTop(nextTop);

    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    syncPageChrome();
  };

  window.requestAnimationFrame(step);
};

const setFormStatus = (message, type = "default") => {
  formStatus.classList.toggle("is-success", type === "success");
  formStatus.classList.toggle("is-error", type === "error");
  formStatus.textContent = message;
};

const setFallbackStatus = (mailtoUrl) => {
  formStatus.classList.remove("is-success");
  formStatus.classList.add("is-error");
  formStatus.innerHTML = `${errorMessage} <a href="${mailtoUrl}">Enviar por email</a>.`;
};

const getValue = (formData, fieldName) => String(formData.get(fieldName) || "").trim();

const getBriefPayload = (formData) => ({
  name: getValue(formData, "name"),
  company: getValue(formData, "company"),
  email: getValue(formData, "email"),
  phone: getValue(formData, "phone"),
  projectType: getValue(formData, "projectType"),
  projectDate: getValue(formData, "projectDate"),
  objective: getValue(formData, "objective"),
  honey: getValue(formData, "_honey")
});

const setInvalidFields = (fieldNames) => {
  contactForm.querySelectorAll("[name]").forEach((field) => field.removeAttribute("aria-invalid"));
  fieldNames.forEach((fieldName) => {
    const field = contactForm.elements[fieldName];

    if (field) {
      field.setAttribute("aria-invalid", "true");
    }
  });
};

const validateBrief = (payload) => {
  const requiredFields = ["name", "company", "email", "phone", "projectType", "projectDate", "objective"];
  const invalidFields = requiredFields.filter((fieldName) => !payload[fieldName]);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+()\d\s-]{7,24}$/;
  const phoneDigits = payload.phone.replace(/\D/g, "");

  if (payload.email && !emailPattern.test(payload.email)) {
    invalidFields.push("email");
  }

  if (payload.phone && (!phonePattern.test(payload.phone) || phoneDigits.length < 7)) {
    invalidFields.push("phone");
  }

  return [...new Set(invalidFields)];
};

const getMailtoUrl = (payload) => {
  const subject = `Brief Caviar - ${payload.company || "Novo projecto"}`;
  const body = [
    `Nome: ${payload.name}`,
    `Marca/Empresa: ${payload.company}`,
    `Email: ${payload.email}`,
    `Telefone: ${payload.phone}`,
    `Tipo de projecto: ${payload.projectType}`,
    `Data prevista: ${payload.projectDate}`,
    "",
    "Objectivo do projecto:",
    payload.objective
  ].join("\n");

  return `mailto:${caviarEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const sendBrief = async (payload) => {
  const response = await fetch(formEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      _subject: `Brief Caviar - ${payload.company}`,
      _replyto: payload.email,
      _template: "table",
      _captcha: "false",
      nome: payload.name,
      "marca/empresa": payload.company,
      email: payload.email,
      telefone: payload.phone,
      "tipo de projecto": payload.projectType,
      "data prevista": payload.projectDate,
      "objectivo do projecto": payload.objective
    })
  });

  if (!response.ok) {
    throw new Error("Form submission failed");
  }

  return response.json().catch(() => ({}));
};

syncPageChrome();
window.addEventListener("scroll", requestScrollSync, { passive: true });
window.addEventListener("resize", requestScrollSync);

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

backToTopButton.addEventListener("click", () => {
  closeNav();
  scrollToPageTop();
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

const animateCounter = (counter) => {
  if (counter.dataset.animated === "true") {
    return;
  }

  counter.dataset.animated = "true";

  const target = Number(counter.dataset.target || "0");
  const prefix = counter.dataset.prefix || "";

  if (prefersReducedMotion || target <= 0) {
    counter.textContent = `${prefix}${target}`;
    return;
  }

  const duration = 1400;
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    counter.textContent = `${prefix}${value}`;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.querySelectorAll("[data-counter]").forEach((counter) => animateCounter(counter));
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

const counterSection = document.querySelector(".impact-stats");

if (counterSection) {
  counterObserver.observe(counterSection);
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formData = new FormData(contactForm);
  const payload = getBriefPayload(formData);

  if (payload.honey) {
    contactForm.reset();
    setFormStatus(successMessage, "success");
    return;
  }

  const invalidFields = validateBrief(payload);
  setInvalidFields(invalidFields);

  if (invalidFields.length) {
    setFormStatus("Preencha todos os campos obrigatórios com dados válidos antes de enviar.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "A enviar...";
  setFormStatus("A enviar o brief...", "default");

  try {
    await sendBrief(payload);
    contactForm.reset();
    setInvalidFields([]);
    setFormStatus(successMessage, "success");
  } catch (error) {
    setFallbackStatus(getMailtoUrl(payload));
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar brief";
  }
});
