/* ===================== Навигация между экранами ===================== */
function go(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "main") {
    setTimeout(initMap, 200);
  }

  if (id === "profile") {
    setTimeout(initProfileMap, 200);
  }
}

/* ===================== Пользователь ===================== */
function register() {
  const name = document.getElementById("reg-name").value;
  const pass = document.getElementById("reg-pass").value;

  localStorage.setItem("user", JSON.stringify({name, pass}));
  go("privacy");
}

function login() {
  const name = document.getElementById("login-name").value;
  const pass = document.getElementById("login-pass").value;

  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.name === name && user.pass === pass) {
    go("privacy");
  } else {
    alert("Неверные данные");
  }
}

function acceptPrivacy() {
  const user = JSON.parse(localStorage.getItem("user"));
  document.getElementById("profile-name").innerText = user.name;
  go("main");
}

/* ===================== Города ===================== */
const cities = {
  moscow: [55.75, 37.61],
  kazan: [55.79, 49.10],
  samara: [53.19, 50.10]
};

let currentCity = "moscow";

function setCity(city) {
  currentCity = city;

  if (map) {
    map.setCenter(cities[city]);
  }

  document.getElementById("city").innerText =
    city === "moscow" ? "Москва" :
    city === "kazan" ? "Казань" : "Самара";
}

/* ===================== Карта ===================== */
let map;

function initMap() {
  if (map) return;

  ymaps.ready(() => {
    map = new ymaps.Map("map", {
      center: cities[currentCity],
      zoom: 12,
      controls: []
    });
  });
}

/* ===================== RUN ===================== */
let runMap;
let route;
let polygon;
let tracking = true;
let pathCoords = [];

function startRun() {
  go("run");

  ymaps.ready(() => {
    runMap = new ymaps.Map("run-map", {
      center: cities[currentCity],
      zoom: 15,
      controls: []
    });

    pathCoords = [];

    route = new ymaps.Polyline([], {}, {
      strokeColor: "#ffffff",
      strokeWidth: 4
    });

    runMap.geoObjects.add(route);

    polygon = null;

    startTracking();
  });
}

function pauseRun() {
  tracking = !tracking;
}

function stopRun() {
  tracking = false;

  if (pathCoords.length > 2) {
    saveRoute(pathCoords); // Сохраняем маршрут
  }

  go("main");
}

/* ===================== GPS ===================== */
function startTracking() {
  navigator.geolocation.watchPosition(pos => {

    if (!tracking) return;

    const coords = [pos.coords.latitude, pos.coords.longitude];

    // Добавляем координаты только если они новые
    const last = pathCoords[pathCoords.length - 1];
    if (!last || last[0] !== coords[0] || last[1] !== coords[1]) {
      pathCoords.push(coords);
      route.geometry.setCoordinates(pathCoords);
    }

    runMap.setCenter(coords);

    // Проверка замыкания маршрута (~20 метров)
    if (pathCoords.length > 3) {
      const start = pathCoords[0];
      const distance = getDistance(start, coords);
      if (distance < 0.02) { // ~20 метров
        closeRoute();
      }
    }

  }, err => {
    console.error("Ошибка GPS:", err);
  }, { enableHighAccuracy: true, maximumAge: 0 });
}

/* ===================== Замыкание маршрута ===================== */
function closeRoute() {
  if (polygon) return;

  tracking = false;

  polygon = new ymaps.Polygon([pathCoords], {}, {
    fillColor: 'rgba(0, 255, 255, 0.3)',
    strokeColor: '#00ffff',
    strokeWidth: 2
  });

  runMap.geoObjects.add(polygon);

  alert("Маршрут замкнут и залит!");
}

/* ===================== Сохранение маршрутов ===================== */
function saveRoute(coords) {
  const allRoutes = JSON.parse(localStorage.getItem("routes") || "[]");
  allRoutes.push({coords, date: new Date().toLocaleString()});
  localStorage.setItem("routes", JSON.stringify(allRoutes));
}

/* ===================== Профиль ===================== */
let profileMap;

function initProfileMap() {
  if (profileMap) return;

  ymaps.ready(() => {
    profileMap = new ymaps.Map("profile-map", {
      center: cities[currentCity],
      zoom: 12,
      controls: []
    });

    const allRoutes = JSON.parse(localStorage.getItem("routes") || "[]");
    allRoutes.forEach(r => {
      const poly = new ymaps.Polyline(r.coords, {}, {
        strokeColor: "#00ff00",
        strokeWidth: 3
      });
      profileMap.geoObjects.add(poly);
    });
  });
}

/* ===================== Помощь ===================== */
function getDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}