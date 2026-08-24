var places = [{ name: 'Bad Ischl', latitude: 47.7119, longitude: 13.6239 }, { name: 'Linz', latitude: 48.3069, longitude: 14.2858 }];
var activePlace = 0;
var radarOffset = 0;
var radarTimer = null;
var suggestionTimer = null;
var selectedSuggestion = null;
var calendarFeedUrl = 'webcal://p121-caldav.icloud.com/published/2/MjExNjgzMTk1MzYyMTE2OEqdtKga8RUOBsKPCDilM2GVDTkeP77z6Dugpj5jgnVZaw1LEP5tBWO-2_elfFZ8eyajn4lGKc306YLIrPygPh4';
var rssFeedUrl = 'https://rss.orf.at/ooe.xml';
var weatherCodes = { 0: ['Klar', '☀'], 1: ['Heiter', '◐'], 2: ['Teilweise bewölkt', '◐'], 3: ['Bedeckt', '☁'], 45: ['Nebel', '≋'], 48: ['Nebel', '≋'], 51: ['Nieselregen', '▾'], 53: ['Nieselregen', '▾'], 55: ['Nieselregen', '▾'], 61: ['Regen', '雨'], 63: ['Regen', '雨'], 65: ['Starker Regen', '雨'], 71: ['Schnee', '✳'], 73: ['Schnee', '✳'], 75: ['Starker Schnee', '✳'], 80: ['Regenschauer', '雨'], 81: ['Regenschauer', '雨'], 82: ['Starke Schauer', '雨'], 95: ['Gewitter', 'ϟ'] };
var byId = function (id) { return document.getElementById(id); };

function updateClock() {
  var now = new Date();
  byId('clock').textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  byId('date').textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  byId('timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Lokale Zeit';
  byId('week-number').textContent = 'KW ' + getWeekNumber(now);
}
function getWeekNumber(date) { var first = new Date(Date.UTC(date.getFullYear(), 0, 1)); return Math.ceil((((date - first) / 86400000) + first.getUTCDay() + 1) / 7); }
function loadWeather() {
  var place = places[activePlace];
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude + '&longitude=' + place.longitude + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=2&wind_speed_unit=kmh&timezone=auto';
  fetch(url).then(function (response) { if (!response.ok) throw new Error('Wetter'); return response.json(); }).then(function (data) {
    var current = data.current; var weather = weatherCodes[current.weather_code] || ['Unbekannt', '•'];
    byId('weather-icon').textContent = weather[1]; byId('temperature').innerHTML = Math.round(current.temperature_2m) + '<sup>°C</sup>'; byId('condition').textContent = weather[0];
    byId('weather-title').textContent = 'Wetter · ' + place.name; byId('footer-location').textContent = place.name.indexOf(',') >= 0 ? place.name : place.name + ', Österreich'; byId('wind').textContent = Math.round(current.wind_speed_10m) + ' km/h'; byId('feels-like').textContent = Math.round(current.apparent_temperature) + '°';
    renderHourly(data.hourly); renderWeatherSummary(data.hourly);
    byId('connection').textContent = 'Wetter aktualisiert ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }).catch(function () { byId('condition').textContent = 'Wetter nicht erreichbar'; });
}
function renderHourly(hourly) {
  var currentHour = new Date().getHours(); var start = hourly.time.findIndex(function (value) { return Number(value.slice(11, 13)) >= currentHour; }); if (start < 0) start = 0;
  var cards = hourly.time.slice(start, start + 6).map(function (time, index) { var weather = weatherCodes[hourly.weather_code[start + index]] || ['-', '•']; return '<span class="hour"><span class="hour-time">' + time.slice(11, 16) + '</span><span class="hour-icon">' + weather[1] + '</span><span class="hour-temp">' + Math.round(hourly.temperature_2m[start + index]) + '°</span></span>'; });
  byId('hourly-list').innerHTML = cards.join('');
}
function renderWeatherSummary(hourly) {
  var now = new Date(); var currentHour = now.getHours(); var start = hourly.time.findIndex(function (value) { return Number(value.slice(11, 13)) >= currentHour; }); if (start < 0) start = 0;
  var today = hourly.time.slice(start, start + 12).map(function (time, index) { return { hour: Number(time.slice(11, 13)), code: hourly.weather_code[start + index], temperature: hourly.temperature_2m[start + index] }; });
  var rain = today.find(function (item) { return item.code >= 51; }); var warmest = Math.max.apply(null, today.map(function (item) { return item.temperature; }));
  var sentence = warmest < 8 ? 'Heute bleibt es kühl.' : warmest > 24 ? 'Heute wird es warm.' : 'Heute wird es mild.';
  if (rain) sentence += ' Ab ca. ' + (rain.hour < 10 ? '0' : '') + rain.hour + ':00 Uhr ist Regen möglich.'; else sentence += ' Voraussichtlich bleibt es trocken.';
  byId('weather-summary').textContent = sentence;
}
function savePlaces() { localStorage.setItem('infoboard-places', JSON.stringify(places)); }
function updatePlaceLabels() { document.querySelectorAll('.place, .location').forEach(function (button) { button.textContent = places[Number(button.getAttribute('data-place'))].name || 'Ort'; }); }
function setActivePlace(index) {
  activePlace = index; var place = places[index];
  document.querySelectorAll('.place, .location').forEach(function (item) { item.classList.toggle('active', Number(item.getAttribute('data-place')) === index); });
  byId('weather-title').textContent = 'Wetter · ' + place.name; byId('footer-location').textContent = place.name.indexOf(',') >= 0 ? place.name : place.name + ', Österreich'; byId('radar-frame').src = radarUrl(place); loadWeather();
}
var lastPlaceTap = {};
function switchPlace(event) {
  var index = Number(event.currentTarget.getAttribute('data-place')); var now = Date.now();
  if (activePlace === index && lastPlaceTap[index] && now - lastPlaceTap[index] < 450) { openSettings(index); lastPlaceTap[index] = 0; return; }
  lastPlaceTap[index] = now; setActivePlace(index);
}
function loadSavedPlaces() {
  try { var saved = JSON.parse(localStorage.getItem('infoboard-places')); if (saved && saved.length === 2) places = saved; } catch (error) { }
  updatePlaceLabels();
}
function radarUrl(place) { var timestamp = radarOffset ? '&time=' + Math.round((Date.now() + radarOffset * 60000) / 60000) : ''; return 'https://www.rainviewer.com/map.html?loc=' + place.latitude + ',' + place.longitude + ',8' + timestamp; }
function renderRadarTime() { byId('radar-time').textContent = radarOffset === 0 ? 'Jetzt' : (radarOffset > 0 ? '+' : '') + radarOffset + ' min'; byId('radar-frame').src = radarUrl(places[activePlace]); }
function shiftRadar(minutes) { radarOffset += minutes; renderRadarTime(); }
function toggleRadarPlay() { if (radarTimer) { clearInterval(radarTimer); radarTimer = null; byId('radar-play').textContent = '▶'; } else { radarTimer = setInterval(function () { shiftRadar(30); }, 30000); byId('radar-play').textContent = '❚❚'; } }
var settingsPlaceIndex = 0;
function openSettings(index) { settingsPlaceIndex = index; selectedSuggestion = { name: places[index].name, latitude: places[index].latitude, longitude: places[index].longitude }; byId('settings-backdrop').classList.add('open'); byId('place-name').value = places[index].name; byId('place-suggestions').innerHTML = ''; byId('place-suggestions').hidden = true; byId('place-search-status').textContent = 'Tippen und einen Vorschlag auswählen.'; }
function closeSettings() { byId('settings-backdrop').classList.remove('open'); }
function geocodePlace(name, index) {
  if (!name) return Promise.reject(new Error('Ort fehlt'));
  return fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(name) + '&count=1&language=de&format=json').then(function (response) { if (!response.ok) throw new Error('Ort'); return response.json(); }).then(function (data) {
    if (!data.results || !data.results.length) throw new Error('Ort nicht gefunden'); var result = data.results[0]; places[index] = { name: result.name, latitude: result.latitude, longitude: result.longitude };
  });
}
function saveSettings() {
  if (!selectedSuggestion) { byId('place-search-status').textContent = 'Bitte zuerst einen Suchvorschlag auswählen.'; return; }
  places[settingsPlaceIndex] = { name: selectedSuggestion.name, latitude: selectedSuggestion.latitude, longitude: selectedSuggestion.longitude }; savePlaces(); updatePlaceLabels(); closeSettings(); if (activePlace === settingsPlaceIndex) setActivePlace(activePlace);
}
function searchPlaces(event) {
  var query = event.target.value.trim(); selectedSuggestion = null;
  byId('place-suggestions').hidden = true;
  if (query.length < 2) { byId('place-search-status').textContent = 'Mindestens zwei Zeichen eingeben.'; return; }
  clearTimeout(suggestionTimer); suggestionTimer = setTimeout(function () {
    byId('place-search-status').textContent = 'Suche Vorschläge ...';
    fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=6&language=de&format=json').then(function (response) { if (!response.ok) throw new Error('Ort'); return response.json(); }).then(function (data) {
      var list = byId('place-suggestions'); list.innerHTML = '';
      (data.results || []).forEach(function (result) { var suggestion = document.createElement('button'); suggestion.type = 'button'; suggestion.className = 'suggestion'; suggestion.dataset.name = result.name; suggestion.dataset.latitude = result.latitude; suggestion.dataset.longitude = result.longitude; suggestion.innerHTML = '<strong>' + escapeHTML(result.name) + '</strong><span>' + escapeHTML((result.admin1 || result.country || '') + (result.country ? ', ' + result.country : '')) + '</span>'; list.appendChild(suggestion); });
      list.hidden = !(data.results && data.results.length);
      byId('place-search-status').textContent = data.results && data.results.length ? 'Vorschlag auswählen, dann speichern.' : 'Kein Ort gefunden.';
    }).catch(function () { byId('place-search-status').textContent = 'Ortssuche momentan nicht erreichbar.'; });
  }, 250);
}
function applySuggestion(event) {
  var suggestion = event.target.closest ? event.target.closest('.suggestion') : event.target;
  if (!suggestion || !suggestion.classList.contains('suggestion')) return;
  selectedSuggestion = { name: suggestion.dataset.name, latitude: Number(suggestion.dataset.latitude), longitude: Number(suggestion.dataset.longitude) };
  byId('place-name').value = selectedSuggestion.name; byId('place-suggestions').hidden = true; byId('place-search-status').textContent = 'Ort ausgewählt. Jetzt speichern.';
}
function parseICS(text) {
  var blocks = text.replace(/\r?\n[ \t]/g, '').split(/BEGIN:(VEVENT|VTODO)/).slice(1); var entries = [];
  for (var index = 0; index < blocks.length; index += 2) { var type = blocks[index]; var block = blocks[index + 1] || ''; var summary = (block.match(/SUMMARY(?:;[^:]*)?:(.*)/) || [,'Termin'])[1].trim(); var dateMatch = block.match(/(?:DTSTART|DUE)(?:;[^:]*)?:(\d{8})(?:T(\d{6}))?/); if (dateMatch) entries.push({ title: summary, date: dateMatch[1], time: dateMatch[2] ? dateMatch[2].slice(0, 2) + ':' + dateMatch[2].slice(2, 4) : '', type: type }); }
  return entries.sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 4);
}
function renderAgendaEntries(entries, targetId, emptyText) {
  byId(targetId).innerHTML = entries.length ? entries.map(function (item) { return '<li class="agenda-item"><span class="agenda-time">' + item.date.slice(6, 8) + '.' + item.date.slice(4, 6) + '<br>' + item.time + '</span><span class="agenda-text">' + escapeHTML(item.title) + '<span class="agenda-sub">' + (item.type === 'VTODO' ? 'Erinnerung' : 'Kalender') + '</span></span></li>'; }).join('') : '<li class="empty">' + emptyText + '</li>';
}
function loadCalendar() {
  if (!calendarFeedUrl) { byId('agenda-list').innerHTML = '<li class="empty">Noch kein Kalender verbunden.<br>Trage in app.js eine öffentliche iCloud-ICS-URL ein.</li>'; return; }
  fetch(calendarFeedUrl).then(function (response) { if (!response.ok) throw new Error('ICS'); return response.text(); }).then(function (text) { var entries = parseICS(text); renderAgendaEntries(entries.filter(function (item) { return item.type === 'VEVENT'; }), 'agenda-list', 'Keine kommenden Termine gefunden.'); renderAgendaEntries(entries.filter(function (item) { return item.type === 'VTODO'; }), 'reminder-list', 'Keine Erinnerungen gefunden.'); }).catch(function () { byId('agenda-list').innerHTML = '<li class="empty">Kalender konnte nicht geladen werden.<br>Prüfe URL und CORS-Freigabe.</li>'; });
}
function escapeHTML(value) { return value.replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }

function showAgendaPanel(panelId) { document.querySelectorAll('.agenda-panel').forEach(function (panel) { panel.classList.toggle('active', panel.id === panelId); }); document.querySelectorAll('.agenda-dot').forEach(function (dot) { dot.classList.toggle('active', dot.getAttribute('data-panel') === panelId); }); }
function showCalendar() { showAgendaPanel('calendar-panel'); }
function showReminders() { showAgendaPanel('reminder-panel'); }
function setupAgendaSwipe() {
  var tile = byId('agenda-tile'); var startX = 0; var startY = 0;
  tile.addEventListener('touchstart', function (event) { if (!event.touches || !event.touches.length) return; startX = event.touches[0].clientX; startY = event.touches[0].clientY; }, { passive: true });
  tile.addEventListener('touchend', function (event) { if (!event.changedTouches || !event.changedTouches.length) return; var endX = event.changedTouches[0].clientX; var endY = event.changedTouches[0].clientY; var diffX = endX - startX; var diffY = endY - startY; if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) { if (diffX < 0) showReminders(); else showCalendar(); } }, { passive: true });
}
loadSavedPlaces(); updateClock(); showRandomFact(); loadWeather(); loadCalendar(); renderRadarTime(); setupAgendaSwipe();
setInterval(updateClock, 1000); setInterval(showRandomFact, 10800000); setInterval(loadWeather, 900000);
document.querySelectorAll('.place, .location').forEach(function (button) { button.addEventListener('click', switchPlace); });
byId('fact-card').addEventListener('click', showRandomFact); byId('settings-close').addEventListener('click', closeSettings); byId('settings-cancel').addEventListener('click', closeSettings); byId('settings-save').addEventListener('click', saveSettings);
byId('settings-backdrop').addEventListener('click', function (event) { if (event.target === byId('settings-backdrop')) closeSettings(); });
byId('place-name').addEventListener('input', searchPlaces); byId('place-suggestions').addEventListener('click', applySuggestion);
document.querySelectorAll('.agenda-dot').forEach(function (dot) { dot.addEventListener('click', function () { showAgendaPanel(dot.getAttribute('data-panel')); }); });
byId('radar-back').addEventListener('click', function () { shiftRadar(-30); }); byId('radar-forward').addEventListener('click', function () { shiftRadar(30); }); byId('radar-play').addEventListener('click', toggleRadarPlay);
