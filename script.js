const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

if (menuToggle && navigation) {
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.querySelector(".visually-hidden").textContent = "Open menu";
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.querySelector(".visually-hidden").textContent = isOpen ? "Close menu" : "Open menu";
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("is-open")) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const servicesList = document.querySelector("[data-services-list]");
const renderServices = (services) => {
  servicesList.replaceChildren(...services.map((service) => {
    const row = document.createElement("div");
    row.className = "price-row";
    const name = document.createElement("h3");
    name.textContent = service.name;
    const description = document.createElement("p");
    description.textContent = service.description;
    const price = document.createElement("span");
    price.className = "price-detail";
    price.textContent = `From £${service.price_from}`;
    const duration = document.createElement("span");
    duration.className = "price-detail";
    duration.textContent = `${service.duration_minutes} min`;
    const bookingLink = document.createElement("a");
    bookingLink.className = "button";
    bookingLink.href = "booking.html";
    bookingLink.textContent = "Book";
    row.append(name, description, price, duration, bookingLink);
    return row;
  }));
};
const loadServices = async () => {
  if (!servicesList) return;
  try {
    const response = await fetch("/api/services");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Services could not be loaded.");
    if (!Array.isArray(result.services) || result.services.length === 0) {
      throw new Error("No live services are available.");
    }
    renderServices(result.services);
  } catch (error) {
    const status = document.createElement("p");
    status.className = "booking-error";
    status.setAttribute("role", "status");
    status.textContent = `Live services are unavailable. Showing the demonstration list. (${error.message})`;
    servicesList.before(status);
  }
};
loadServices();

const bookingForm = document.querySelector("#booking-form");
const formMessage = document.querySelector(".form-message");

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = new FormData(bookingForm).get("email");
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formMessage.textContent = "Please enter a valid email address.";
    return;
  }
  formMessage.textContent = "Taking you to the booking journey...";
  sessionStorage.setItem("studio54.bookingEmail", email.trim());
  window.location.href = "booking.html";
});

const galleryFilters = document.querySelectorAll(".filter-button");
const galleryItems = document.querySelectorAll("[data-category]");
galleryFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    galleryFilters.forEach((item) => item.classList.remove("active"));
    galleryFilters.forEach((item) => item.setAttribute("aria-pressed", String(item === filter)));
    filter.classList.add("active");
    const category = filter.dataset.filter;
    galleryItems.forEach((item) => {
      item.hidden = category !== "all" && item.dataset.category !== category;
    });
  });
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
let lightboxTrigger;
let previewUrl;
document.querySelectorAll("[data-lightbox]").forEach((image) => {
  image.setAttribute("tabindex", "0");
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `Enlarge image: ${image.alt}`);
  const openLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightboxTrigger = image;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add("is-visible");
    lightbox.querySelector(".lightbox-close")?.focus();
  };
  image.addEventListener("click", () => {
    openLightbox();
  });
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox();
    }
  });
});
const closeLightbox = () => lightbox?.classList.remove("is-visible");
document.querySelector(".lightbox-close")?.addEventListener("click", () => {
  closeLightbox();
  lightboxTrigger?.focus();
});
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
    lightboxTrigger?.focus();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-visible")) {
    closeLightbox();
    lightboxTrigger?.focus();
  }
  if (event.key === "Tab" && lightbox?.classList.contains("is-visible")) {
    event.preventDefault();
    lightbox.querySelector(".lightbox-close")?.focus();
  }
});

const matcherForm = document.querySelector("#matcher-form");
const matcherUpload = document.querySelector("#matcher-upload");
const uploadPreview = document.querySelector(".upload-preview");
const matcherNotes = matcherForm?.querySelector("#style-notes");
matcherNotes?.addEventListener("input", () => matcherNotes.setCustomValidity(""));
matcherUpload?.addEventListener("change", () => {
  const file = matcherUpload.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    matcherUpload.value = "";
    uploadPreview.textContent = file.type.startsWith("image/")
      ? "Please choose an image smaller than 10 MB."
      : "Please choose an image file.";
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.src = previewUrl;
  image.alt = "Your uploaded preview";
  uploadPreview.replaceChildren(image);
});
matcherForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const notes = matcherNotes;
  if (notes && !notes.value.trim()) {
    notes.setCustomValidity("Tell us what you love so we can prepare your considered edit.");
    notes.reportValidity();
    return;
  }
  notes?.setCustomValidity("");
  const recommendation = document.querySelector(".recommendation");
  recommendation?.classList.add("is-visible");
  recommendation?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});

const bookingSteps = document.querySelectorAll(".booking-step");
let currentStep = 0;
const bookingDate = document.querySelector("#booking-date");
if (bookingDate) bookingDate.min = new Date().toISOString().split("T")[0];
const bookingEmail = document.querySelector("#guest-email");
const storedBookingEmail = sessionStorage.getItem("studio54.bookingEmail");
if (bookingEmail && storedBookingEmail) {
  bookingEmail.value = storedBookingEmail;
  sessionStorage.removeItem("studio54.bookingEmail");
}
const bookingData = {
  treatment: "",
  stylist: "",
  appointmentDate: "",
  appointmentTime: "",
};
const bookingChoiceGrids = [...document.querySelectorAll(".booking-step .choice-grid")];
let availabilityRequestId = 0;
const bookingStatus = (grid, text) => {
  let status = grid.parentElement.querySelector(".booking-data-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "booking-data-status booking-error";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    grid.after(status);
  }
  status.textContent = text;
};
const renderBookingChoices = (grid, choices) => {
  grid.setAttribute("aria-busy", "false");
  grid.replaceChildren(...choices.map(({ value, detail }) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    const title = document.createElement("strong");
    title.textContent = value;
    const description = document.createElement("small");
    description.textContent = detail;
    button.append(title, description);
    return button;
  }));
};
const loadBookingData = async () => {
  if (bookingChoiceGrids.length < 2) return;
  bookingChoiceGrids.slice(0, 2).forEach((grid) => grid.setAttribute("aria-busy", "true"));
  try {
    const [servicesResponse, stylistsResponse] = await Promise.all([
      fetch("/api/services"),
      fetch("/api/stylists"),
    ]);
    const services = await servicesResponse.json();
    const stylists = await stylistsResponse.json();
    if (!servicesResponse.ok) throw new Error(services.error || "Services could not be loaded.");
    if (!stylistsResponse.ok) throw new Error(stylists.error || "Stylists could not be loaded.");
    renderBookingChoices(bookingChoiceGrids[0], services.services.map((service) => ({
      value: service.name,
      detail: `From £${service.price_from} · ${service.duration_minutes} min`,
    })));
    renderBookingChoices(bookingChoiceGrids[1], [
      { value: "Any available stylist", detail: "We'll find your best match" },
      ...stylists.stylists.map((stylist) => ({ value: stylist.name, detail: stylist.speciality })),
    ]);
  } catch (error) {
    bookingChoiceGrids.slice(0, 2).forEach((grid) => {
      grid.setAttribute("aria-busy", "false");
      grid.replaceChildren();
      bookingStatus(grid, error.message);
    });
  }
};
loadBookingData();
const showBookingStep = (step) => {
  bookingSteps.forEach((item, index) => {
    const isActive = index === step;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-hidden", String(!isActive));
  });
  document.querySelectorAll(".step-indicator span").forEach((item, index) => {
    item.classList.toggle("active", index <= step);
    if (index === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
};
showBookingStep(currentStep);
document.querySelectorAll("[data-next-step]:not([data-submit-booking])").forEach((button) => button.addEventListener("click", () => {
  const step = bookingSteps[currentStep];
  const choiceRequired = step.querySelector(".choice-grid") && !step.querySelector(".choice.selected");
  const date = step.querySelector('input[type="date"]');
  const requiredInputs = [...step.querySelectorAll("input[required]")];
  if (choiceRequired) {
    step.querySelector(".booking-error")?.remove();
    const error = document.createElement("p");
    error.className = "booking-error";
    error.textContent = "Please choose an option to continue.";
    step.querySelector(".choice-grid").after(error);
    return;
  }
  if (date && !date.value) {
    date.focus();
    return;
  }
  if (requiredInputs.some((input) => !input.value.trim() || !input.checkValidity())) {
    requiredInputs.find((input) => !input.value.trim() || !input.checkValidity())?.reportValidity();
    return;
  }
  if (currentStep < bookingSteps.length - 1) currentStep += 1;
  if (currentStep === bookingSteps.length - 1) {
    bookingData.customerName = document.querySelector("#guest-name")?.value.trim() || "";
    bookingData.customerEmail = document.querySelector("#guest-email")?.value.trim() || "";
  }
  showBookingStep(currentStep);
}));
document.querySelectorAll("[data-previous-step]").forEach((button) => button.addEventListener("click", () => {
  if (currentStep > 0) currentStep -= 1;
  showBookingStep(currentStep);
}));
document.addEventListener("click", (event) => {
  const choice = event.target.closest(".choice");
  if (!choice) return;
  choice.parentElement.querySelectorAll(".choice").forEach((item) => item.classList.remove("selected"));
  choice.classList.add("selected");
  choice.parentElement.closest(".booking-step")?.querySelector(".booking-error")?.remove();
  choice.parentElement.querySelectorAll(".choice").forEach((item) => item.setAttribute("aria-pressed", String(item === choice)));
  const stepIndex = [...bookingSteps].indexOf(choice.closest(".booking-step"));
  const selectedValue = choice.querySelector("strong")?.textContent.trim() || "";
  if (stepIndex === 0) bookingData.treatment = selectedValue;
  if (stepIndex === 1) bookingData.stylist = selectedValue;
  if (stepIndex === 2) bookingData.appointmentTime = selectedValue;
});

bookingDate?.addEventListener("change", async () => {
  bookingData.appointmentDate = bookingDate.value;
  const timeGrid = bookingChoiceGrids[2];
  const requestId = ++availabilityRequestId;
  if (!timeGrid || !bookingDate.value) {
    timeGrid?.replaceChildren();
    timeGrid?.removeAttribute("aria-busy");
    return;
  }
  const requestedDate = bookingDate.value;
  timeGrid.setAttribute("aria-busy", "true");
  timeGrid.replaceChildren();
  bookingStatus(timeGrid, "Loading available times...");
  try {
    const response = await fetch(`/api/availability?date=${encodeURIComponent(requestedDate)}`);
    const result = await response.json();
    if (requestId !== availabilityRequestId || bookingDate.value !== requestedDate) return;
    if (!response.ok) throw new Error(result.error || "Availability could not be loaded.");
    renderBookingChoices(timeGrid, result.slots.map((time) => ({ value: time, detail: "Available" })));
    if (!result.slots.length) bookingStatus(timeGrid, "No appointments are available on this date.");
  } catch (error) {
    if (requestId !== availabilityRequestId || bookingDate.value !== requestedDate) return;
    timeGrid.setAttribute("aria-busy", "false");
    bookingStatus(timeGrid, error.message);
  }
});

document.querySelector('[data-next-step][data-submit-booking]')?.addEventListener("click", async (event) => {
  event.preventDefault();
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = "Sending request...";
  try {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The appointment could not be created.");
    const confirmationStep = bookingSteps[currentStep + 1];
    const confirmationMessage = confirmationStep?.querySelector("p:last-of-type");
    if (confirmationMessage) {
      confirmationMessage.textContent = `Your request is pending confirmation from the house. Reference: ${result.appointment.confirmation_reference}.`;
    }
    if (confirmationStep && !confirmationStep.querySelector(".confirmation-reference")) {
      const reference = document.createElement("p");
      reference.className = "confirmation-reference";
      reference.setAttribute("role", "status");
      reference.textContent = `Status: ${result.appointment.status}.`;
      confirmationStep.querySelector("h2")?.after(reference);
    }
    currentStep += 1;
    showBookingStep(currentStep);
  } catch (error) {
    const message = document.querySelector(".booking-error");
    if (message) message.textContent = error.message;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = "Review request →";
  }
});

document.querySelectorAll(".contact-form").forEach((form) => form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  const status = form.querySelector(".form-status");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  status.textContent = "Sending your enquiry...";
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The enquiry could not be sent.");
    status.textContent = "Thank you. We will be in touch shortly.";
    form.reset();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}));
