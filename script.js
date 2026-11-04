const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.querySelector(".visually-hidden").textContent = isOpen ? "Close menu" : "Open menu";
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.querySelector(".visually-hidden").textContent = "Open menu";
    });
  });
}

const bookingForm = document.querySelector("#booking-form");
const formMessage = document.querySelector(".form-message");

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = new FormData(bookingForm).get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    formMessage.textContent = "Please enter a valid email address.";
    return;
  }
  formMessage.textContent = "Thank you. Your booking journey is ready to begin.";
  bookingForm.reset();
});

const galleryFilters = document.querySelectorAll(".filter-button");
const galleryItems = document.querySelectorAll("[data-category]");
galleryFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    galleryFilters.forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    const category = filter.dataset.filter;
    galleryItems.forEach((item) => {
      item.hidden = category !== "all" && item.dataset.category !== category;
    });
  });
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
document.querySelectorAll("[data-lightbox]").forEach((image) => {
  image.setAttribute("tabindex", "0");
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `Enlarge image: ${image.alt}`);
  const openLightbox = () => {
    if (!lightbox || !lightboxImage) return;
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
document.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-visible")) closeLightbox();
});

const matcherForm = document.querySelector("#matcher-form");
const matcherUpload = document.querySelector("#matcher-upload");
const uploadPreview = document.querySelector(".upload-preview");
matcherUpload?.addEventListener("change", () => {
  const file = matcherUpload.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    matcherUpload.value = "";
    uploadPreview.textContent = "Please choose an image file.";
    return;
  }
  const image = document.createElement("img");
  image.src = URL.createObjectURL(file);
  image.alt = "Your uploaded preview";
  uploadPreview.replaceChildren(image);
});
matcherForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector(".recommendation")?.classList.add("is-visible");
});

const bookingSteps = document.querySelectorAll(".booking-step");
let currentStep = 0;
const bookingDate = document.querySelector("#booking-date");
if (bookingDate) bookingDate.min = new Date().toISOString().split("T")[0];
const bookingData = {
  treatment: "",
  stylist: "",
  appointmentDate: "",
  appointmentTime: "",
};
const showBookingStep = (step) => {
  bookingSteps.forEach((item, index) => item.classList.toggle("active", index === step));
  document.querySelectorAll(".step-indicator span").forEach((item, index) => item.classList.toggle("active", index <= step));
};
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
document.querySelectorAll(".choice").forEach((choice) => choice.addEventListener("click", () => {
  choice.parentElement.querySelectorAll(".choice").forEach((item) => item.classList.remove("selected"));
  choice.classList.add("selected");
  choice.parentElement.closest(".booking-step")?.querySelector(".booking-error")?.remove();
  choice.parentElement.querySelectorAll(".choice").forEach((item) => item.setAttribute("aria-pressed", String(item === choice)));
  const stepIndex = [...bookingSteps].indexOf(choice.closest(".booking-step"));
  const selectedValue = choice.querySelector("strong")?.textContent.trim() || "";
  if (stepIndex === 0) bookingData.treatment = selectedValue;
  if (stepIndex === 1) bookingData.stylist = selectedValue;
  if (stepIndex === 2) bookingData.appointmentTime = selectedValue;
}));

bookingDate?.addEventListener("change", () => {
  bookingData.appointmentDate = bookingDate.value;
});

document.querySelector('[data-next-step][data-submit-booking]')?.addEventListener("click", async (event) => {
  event.preventDefault();
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Sending request...";
  try {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The appointment could not be created.");
    currentStep += 1;
    showBookingStep(currentStep);
  } catch (error) {
    const message = document.querySelector(".booking-error");
    if (message) message.textContent = error.message;
    button.disabled = false;
    button.textContent = "Review request →";
  }
});

document.querySelectorAll(".contact-form").forEach((form) => form.addEventListener("submit", (event) => {
  event.preventDefault();
  form.querySelector(".form-status").textContent = "Thank you. We will be in touch shortly.";
  form.reset();
}));
