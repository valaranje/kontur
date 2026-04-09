/* --- Навигация экранов --- */
function go(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  if (id === "main") setTimeout(initMap, 200);
  if (id === "history") renderHistory();
}

/* --- Города --- */
const cities = {
  moscow: [55.75, 37.61],
  kazan: [55.79, 49.10],
  samara: [53.19, 50.10]
};
let currentCity = "moscow";

/* --- Основная карта --- */
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

/* --- RUN --- */
let runMap, route, runnerPlacemark;
let tracking = true;
let watchId;

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

    runnerPlacemark = null;
    startTracking();
  });
}

function pauseRun() { tracking = !tracking; }

function stopRun() {
  if (route && route.geometry.getCoordinates().length > 2) {
    const coords = route.geometry.getCoordinates();
    coords.push(coords[0]); // замыкание
    route.geometry.setCoordinates(coords);
    saveRun(coords);
  }
  if (watchId) navigator.geolocation.clearWatch(watchId);
  go("main");
}

/* --- GPS трекинг --- */
function startTracking() {
  watchId = navigator.geolocation.watchPosition(pos => {
    if (!tracking) return;
    const coords = [pos.coords.latitude, pos.coords.longitude];

    route.geometry.setCoordinates([...route.geometry.getCoordinates(), coords]);

    if (!runnerPlacemark) {
      runnerPlacemark = new ymaps.Placemark(coords, {}, {
        iconLayout: 'default#image',
        iconImageHref: 'img/runner.png',
        iconImageSize: [20, 20],
        iconImageOffset: [-10, -10]
      });
      runMap.geoObjects.add(runnerPlacemark);
    } else {
      runnerPlacemark.geometry.setCoordinates(coords);
    }

    runMap.panTo(coords, {delay: 300});
  }, {enableHighAccuracy: true});
}

/* --- История забегов --- */
function saveRun(coords) {
  const runs = JSON.parse(localStorage.getItem('runs') || '[]');
  runs.push({date: new Date().toLocaleString(), path: coords});
  localStorage.setItem('runs', JSON.stringify(runs));
}

function renderHistory() {
  const listEl = document.getElementById('history-list');
  const runs = JSON.parse(localStorage.getItem('runs') || '[]');
  listEl.innerHTML = '';
  if (runs.length === 0) {
    listEl.innerHTML = '<p>Нет записей.</p>';
    return;
  }
  runs.forEach((run, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<b>${i+1}. ${run.date}</b> — ${run.path.length} точек`;
    div.style.padding = '6px 0';
    listEl.appendChild(div);
  });
  document.getElementById('runs-count').innerText = runs.length;
}
