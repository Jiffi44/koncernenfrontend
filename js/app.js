console.log("app.js fungerar");

/* GLOBALA VARIABLER */

const API_URL = "http://localhost:8080/api/v1";

let allCars = [];
let allUsers = [];
let allBookings = [];
let userSortAsc = true;

/* BILAR */

async function getCars() {
    const response = await fetch(`${API_URL}/cars`);
    const cars = await response.json();

    allCars = cars;

    const carContainer = document.getElementById("car-container");

    if (carContainer) {
        displayCars(allCars);
    }
}
function displayCars(cars) {
    const container = document.getElementById("car-container");
    container.innerHTML = "";

    cars.forEach(car => {
        container.innerHTML += `
            <div class="car-row panel neutral-panel">
                <img src="images/${car.id}.png" alt="${car.name}" class="car-row-image">

                <div class="car-row-info">
                    <strong>${car.name}</strong>
                    <span>Modell: ${car.model}</span>
                    <span>Typ: ${car.type}</span>
                    <span>Pris: ${car.price} kr/dag</span>
                </div>

                ${car.booked
                ? `<button class="btn negative-btn" disabled>Redan bokad</button>`
                : `<button class="btn standard-btn" onclick="showBookingForm(${car.id}, this)">
                            Välj bil
                       </button>`
            }
            </div>
        `;
    });
}

/* SORTERING OCH FILTRERING */

function sortByName() {
    allCars.sort((a, b) => a.name.localeCompare(b.name));
    displayCars(allCars);
}

function sortByType() {
    allCars.sort((a, b) => a.type.localeCompare(b.type));
    displayCars(allCars);
}

function sortByPrice() {
    allCars.sort((a, b) => a.price - b.price);
    displayCars(allCars);
}

function filterCars() {
    const selectedType = document.getElementById("typeFilter").value;

    if (selectedType === "Alla") {
        displayCars(allCars);
        return;
    }

    const filteredCars = allCars.filter(car => car.type === selectedType);
    displayCars(filteredCars);
}

/* LOGIN OCH LOGOUT */

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    if (response.ok) {
        const data = await response.json();

        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        sessionStorage.setItem("user", JSON.stringify(data));

        showLoggedInUser(data);
    } else {
        alert("Fel användarnamn eller lösenord");
    }
}

function showLoggedInUser(user) {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("user-info").classList.remove("hidden");

    document.getElementById("logged-user").textContent =
        `Inloggad som: ${user.username}`;

    if (user.isAdmin) {
        document.getElementById("admin-nav-link").classList.remove("hidden");
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

/* BOKNINGAR */

function showBookingForm(carId, button) {
    const bookingBox = document.getElementById(`booking-form-${carId}`);

    if (bookingBox) {
        bookingBox.remove();
        return;
    }

    const carRow = button.closest(".car-row");

    carRow.insertAdjacentHTML("afterend", `
        <div id="booking-form-${carId}" class="booking-form panel neutral-panel">
            <h3>Beställning</h3>

            <label for="from-${carId}">Från datum</label>
            <input type="date" id="from-${carId}">

            <label for="to-${carId}">Till datum</label>
            <input type="date" id="to-${carId}">

            <button class="btn positive-btn" onclick="bookCar(${carId})">
                Bekräfta bokning
            </button>
        </div>
    `);
}

async function bookCar(carId) {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    if (!username || !password) {
        alert("Du måste logga in först.");
        return;
    }

    const fromDate = document.getElementById(`from-${carId}`).value;
    const toDate = document.getElementById(`to-${carId}`).value;

    if (!fromDate || !toDate) {
        alert("Välj både från-datum och till-datum.");
        return;
    }

    const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(username + ":" + password)
        },
        body: JSON.stringify({
            carId: carId,
            fromDate: fromDate,
            toDate: toDate,
            active: true
        })
    });

    if (response.ok) {
        alert("Bokning skapad!");
        getCars(); // Hämtar bilarna igen så att bokad-status uppdateras

    } else {
        alert("Bokningen misslyckades. Status: " + response.status);
    }
}

async function getMyBookings() {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch("http://localhost:8080/api/v1/bookings/me", {
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    const container = document.getElementById("booking-container");
    container.innerHTML = "";

    if (response.ok) {
        const bookings = await response.json();

        bookings.forEach(booking => {

            const car = allCars.find(c => c.id === booking.carId);

            container.innerHTML += `
                <div class="booking-card panel neutral-panel">
                    <h3>${car ? car.name : "Okänd bil"}</h3>
                    <p><strong>Modell:</strong> ${car ? car.model : "-"}</p>
                    <p><strong>Typ:</strong> ${car ? car.type : "-"}</p>
                    <p><strong>Från:</strong> ${booking.fromDate}</p>
                    <p><strong>Till:</strong> ${booking.toDate}</p>
        
                    ${booking.active
                    ? `<p><strong>Status:</strong> Väntar på återlämning</p>`
                    : `<p>Bokningen är avslutad.</p>`
                }

                </div>
            `;
        });

    } else {
        container.innerHTML = "<p>Du har inga bokningar.</p>";
    }


}

async function returnCar(id) {

    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch(
        `http://localhost:8080/api/v1/bookings/return/${id}`,
        {
            method: "PUT",
            headers: {
                "Authorization": "Basic " + btoa(username + ":" + password)
            }
        }
    );

    if (response.ok) {
        alert("Bokningen avslutades.");
        getMyBookings();
        getCars();
    } else {
        alert("Kunde inte avsluta bokningen.");
    }
}

/* ADMIN */

async function getAllUsers() {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch(`${API_URL}/users`, {
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    if (response.ok) {
        allUsers = await response.json();
        displayUsers(allUsers);
    } else {
        alert("Du har inte behörighet att visa användare.");
    }
}

function displayUsers(users) {
    const container = document.getElementById("admin-container");
    container.innerHTML = "";

    users.forEach(user => {
        container.innerHTML += `
    <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.firstName}</td>
        <td>${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
    </tr>
`;
    });
}

function sortUsersBy(column) {
    allUsers.sort((a, b) => {
        const valueA = String(a[column]).toLowerCase();
        const valueB = String(b[column]).toLowerCase();

        return userSortAsc
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
    });

    userSortAsc = !userSortAsc;
    displayUsers(allUsers);
}

/* MOBILMENY */

function toggleMenu() {
    document.getElementById("top-nav").classList.toggle("active");
}

/* START */

if (document.getElementById("car-container")) {
    getCars();
}

const storedUser = JSON.parse(sessionStorage.getItem("user"));

if (storedUser) {
    showLoggedInUser(storedUser);
}

if (storedUser && storedUser.isAdmin) {
    const adminLink = document.getElementById("admin-nav-link");

    if (adminLink) {
        adminLink.classList.remove("hidden");
    }
}

async function getAllBookings() {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch(`${API_URL}/bookings`, {
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    console.log("Alla bokningar status:", response.status);

    const container = document.getElementById("all-bookings-container");
    container.innerHTML = "";

    if (response.ok) {
        allBookings = await response.json();
        console.log(allBookings);
        displayAllBookings(allBookings);
    } else {
        container.innerHTML = "<p>Du har inte behörighet att visa bokningar.</p>";
    }
}

function displayAllBookings(bookings) {
    const container = document.getElementById("all-bookings-container");
    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML = "<p>Inga bokningar hittades.</p>";
        return;
    }

    bookings.forEach(booking => {
        const car = allCars.find(c => c.id === booking.carId);

        container.innerHTML += `
            <div class="booking-card panel neutral-panel">
                <h3>Bokning #${booking.id}</h3>

                <p><strong>Bil:</strong> ${car ? car.name : "Bil ID " + booking.carId}</p>
                <p><strong>Modell:</strong> ${car ? car.model : "-"}</p>
                <p><strong>Användare ID:</strong> ${booking.userId}</p>
                <p><strong>Från:</strong> ${booking.fromDate}</p>
                <p><strong>Till:</strong> ${booking.toDate}</p>
                <p><strong>Status:</strong> ${booking.active ? "Aktiv bokning" : "Avslutad"}</p>

                ${booking.active
                ? `<button class="btn negative-btn" onclick="returnCarAdmin(${booking.id})">
                            Avsluta bokning
                       </button>`
                : `<p>Bokningen är avslutad.</p>`
            }
            </div>
        `;
    });
}

function searchBookings() {
    const bookingId = document.getElementById("booking-id-search").value;

    if (bookingId === "") {
        alert("Skriv in ett boknings-ID.");
        return;
    }

    const filteredBookings = allBookings.filter(
        booking => booking.id == bookingId
    );

    displayAllBookings(filteredBookings);
}

async function returnCarAdmin(id) {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch(`${API_URL}/bookings/return/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    if (response.ok) {
        alert("Bokningen avslutades.");
        getAllBookings();
        getCars();
    } else {
        alert("Kunde inte avsluta bokningen.");
    }
}

function toggleRegisterForm() {

    document
        .getElementById("register-form")
        .classList.toggle("hidden");

}
async function registerUser() {
    const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            firstName: document.getElementById("reg-firstname").value,
            lastName: document.getElementById("reg-lastname").value,
            email: document.getElementById("reg-email").value,
            phone: document.getElementById("reg-phone").value,
            username: document.getElementById("reg-username").value,
            password: document.getElementById("reg-password").value,
            role: "ROLE_USER"
        })
    });

    if (response.ok) {
        alert("Kontot skapades! Du kan nu logga in.");
        toggleRegisterForm();
    } else {
        alert("Kunde inte skapa konto. Kontrollera att användarnamn eller e-post inte redan används.");
    }
}