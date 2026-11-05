const login = document.querySelector("#staff-login");
const dashboard = document.querySelector("#staff-dashboard");
const status = document.querySelector("#staff-status");
const appointmentList = document.querySelector("#appointment-list");
const enquiryList = document.querySelector("#enquiry-list");

const showStatus = (message) => { status.textContent = message; };
const request = async (url, options) => {
  const response = await fetch(url, options);
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result?.error || "The request could not be completed.");
  return result;
};
const renderAppointments = (appointments) => {
  appointmentList.replaceChildren(...appointments.map((appointment) => {
    const item = document.createElement("article");
    item.className = "admin-card";
    const title = document.createElement("h4");
    title.textContent = `${appointment.customer_name} · ${appointment.appointment_date} ${appointment.appointment_time}`;
    const detail = document.createElement("p");
    detail.textContent = `${appointment.treatment} with ${appointment.stylist} · ${appointment.customer_email}`;
    const select = document.createElement("select");
    ["requested", "confirmed", "cancelled"].forEach((value) => {
      const option = new Option(value, value, false, value === appointment.status);
      select.add(option);
    });
    select.addEventListener("change", async () => {
      try {
        await request(`/api/staff/appointments/${appointment.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: select.value }),
        });
        showStatus("Appointment status updated.");
      } catch (error) { showStatus(error.message); }
    });
    item.append(title, detail, select);
    return item;
  }));
};
const renderEnquiries = (enquiries) => {
  enquiryList.replaceChildren(...enquiries.map((enquiry) => {
    const item = document.createElement("article");
    item.className = "admin-card";
    const title = document.createElement("h4");
    title.textContent = `${enquiry.customer_name} · ${enquiry.customer_email}`;
    const message = document.createElement("p");
    message.textContent = enquiry.message;
    item.append(title, message);
    return item;
  }));
};
const loadDashboard = async () => {
  const [appointments, enquiries] = await Promise.all([
    request("/api/staff/appointments"), request("/api/staff/enquiries"),
  ]);
  renderAppointments(appointments.appointments);
  renderEnquiries(enquiries.enquiries);
  login.hidden = true;
  dashboard.hidden = false;
};
login.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = login.querySelector("button");
  button.disabled = true;
  try {
    await request("/api/staff/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: login.querySelector("#staff-email").value,
        password: login.querySelector("#staff-password").value,
      }),
    });
    await loadDashboard();
  } catch (error) { showStatus(error.message); }
  finally { button.disabled = false; }
});
document.querySelector("#staff-logout").addEventListener("click", async () => {
  await request("/api/staff/logout", { method: "POST" });
  dashboard.hidden = true;
  login.hidden = false;
  login.reset();
  showStatus("You have been signed out.");
});
