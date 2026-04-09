/* Навигация экранов */
function go(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  if (id === "main") setTimeout(initMap, 200);
}

/* Города */
const cities = {
  moscow: [55.75, 37.61],
  kazan: [55.79, 49.10],
  samara: [53.19, 50.10]
};
let currentCity = "moscow";

/* Основная карта */
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

function setCity(city) {
  currentCity = city;
  if (map) map.setCenter(cities[city]);
  document.getElementById("city").innerText =
    city === "moscow" ? "Москва" :
    city === "kazan" ? "Казань" : "Самара";
}

/* RUN */
let runMap, route;
let tracking = true;

function startRun() {
  go("run");
  ymaps.ready(() => {
    runMap = new ymaps.Map("run-map", {
      center: cities[currentCity],
      zoom: 15,
      controls: []
    });

    route = new ymaps.Polyline([], {}, {
      strokeColor: "#FF6A00",
      strokeWidth: 4
    });
    runMap.geoObjects.add(route);

    startTracking();
  });
}

function pauseRun() { tracking = !tracking; }
function stopRun() { go("main"); }

/* GPS трекинг */
function startTracking() {
  navigator.geolocation.watchPosition(pos => {
    if (!tracking) return;
    const coords = [pos.coords.latitude, pos.coords.longitude];
    route.geometry.setCoordinates([
      ...route.geometry.getCoordinates(),
      coords
    ]);
    runMap.setCenter(coords);
  });
}
