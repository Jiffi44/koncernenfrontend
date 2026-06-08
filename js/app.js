console.log("app.js fungerar");

/* GLOBALA VARIABLER */

const API_URL = "http://localhost:8080/api/v1";

let allCars = [];
let allUsers = [];
let userSortAsc = true;

/* BILAR */

async function getCars() {
    const response = await fetch(`${API_URL}/cars`);
    const cars = await response.json();

    allCars = cars;
    displayCars(allCars);
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

                <button class="btn standard-btn" onclick="showBookingForm(${car.id}, this)">
                    Välj bil
                </button>
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
        document.getElementById("admin-section").classList.remove("hidden");
        document.getElementById("admin-nav-link").classList.remove("hidden");
    }
}

function logout() {
    sessionStorage.clear();

    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("user-info").classList.add("hidden");

    document.getElementById("admin-section").classList.add("hidden");
    document.getElementById("admin-nav-link").classList.add("hidden");
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
    } else {
        alert("Bokningen misslyckades. Status: " + response.status);
    }
}

async function getMyBookings() {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    if (!username || !password) {
        alert("Du måste logga in först.");
        return;
    }

    const response = await fetch(`${API_URL}/bookings/me`, {
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    const container = document.getElementById("booking-container");
    container.innerHTML = "";

    if (response.ok) {
        const bookings = await response.json();

        bookings.forEach(booking => {
            container.innerHTML += `
                <div class="booking-card">
                    <p>Bokning ID: ${booking.id}</p>
                    <p>Bil ID: ${booking.carId}</p>
                    <p>Från: ${booking.fromDate}</p>
                    <p>Till: ${booking.toDate}</p>
                    <p>Aktiv: ${booking.active}</p>
                </div>
            `;
        });
    } else {
        container.innerHTML = "<p>Inga bokningar hittades.</p>";
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

getCars();