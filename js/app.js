console.log("app.js fungerar");

let allCars = [];

async function getCars() {
    const response = await fetch("http://localhost:8080/api/v1/cars");
    const cars = await response.json();

    allCars = cars;

    displayCars(allCars);
}

function displayCars(cars) {
    const container = document.getElementById("car-container");
    container.innerHTML = "";

    cars.forEach(car => {
        container.innerHTML += `
            <div class="car-card panel neutral-panel">
                <h2>${car.name}</h2>
                <p>Modell: ${car.model}</p>
                <p>Typ: ${car.type}</p>
                <p>Pris: ${car.price} kr/dag</p>

                <input type="date" id="from-${car.id}">
                <input type="date" id="to-${car.id}">
<button class="btn standard-btn" onclick="bookCar(${car.id})">Boka</button>
                
            </div>
        `;
    });
}

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

    const selectedType =
        document.getElementById("typeFilter").value;

    if(selectedType === "Alla"){
        displayCars(allCars);
        return;
    }

    const filteredCars = allCars.filter(
        car => car.type === selectedType
    );

    displayCars(filteredCars);
}

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

const data = await response.json();

if (response.ok) {

    sessionStorage.setItem("username", username);
    sessionStorage.setItem("password", password);
    sessionStorage.setItem("user", JSON.stringify(data));

    document.getElementById("login-form")
        .classList.add("hidden");

    document.getElementById("user-info")
        .classList.remove("hidden");

    document.getElementById("logged-user")
        .textContent = `Inloggad som: ${data.username}`;

    if (data.isAdmin) {
        document.getElementById("admin-section")
            .classList.remove("hidden");
    }

} else {

    alert("Fel användarnamn eller lösenord");

}
}
async function bookCar(carId) {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const fromDate = document.getElementById(`from-${carId}`).value;
    const toDate = document.getElementById(`to-${carId}`).value;

    const response = await fetch("http://localhost:8080/api/v1/bookings", {
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
    const errorText = await response.text();
    console.log("Status:", response.status);
    console.log("Fel:", errorText);
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
let allUsers = [];
let userSortAsc = true;

async function getAllUsers() {

    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    const response = await fetch("http://localhost:8080/api/v1/users", {
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    });

    allUsers = await response.json();
    displayUsers(allUsers);
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

        if (userSortAsc) {
            return valueA.localeCompare(valueB);
        } else {
            return valueB.localeCompare(valueA);
        }
    });

    userSortAsc = !userSortAsc;
    displayUsers(allUsers);
}

function logout() {

    sessionStorage.clear();

    document.getElementById("login-form")
        .classList.remove("hidden");

    document.getElementById("user-info")
        .classList.add("hidden");

    document.getElementById("admin-section")
        .classList.add("hidden");

}

getCars();