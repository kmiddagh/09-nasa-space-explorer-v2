// NASA APOD JSON Feed (Class Mirror)
const DATA_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Get references to DOM elements
const gallery = document.getElementById('gallery');
const statusBox = document.getElementById('status');
const fetchBtn = document.getElementById('fetchBtn');
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

const modal = document.getElementById('modal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// Random Space Facts
const FACTS = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin over 600 times per second.",
  "Jupiter’s Great Red Spot is at least 300 years old.",
  "There are more trees on Earth than stars in the Milky Way (according to some estimates).",
  "Olympus Mons on Mars is almost 3 times taller than Mount Everest.",
  "Saturn could float in a pool of water big enough to hold it.",
  "One teaspoon of a neutron star weighs billions of tons on Earth."
];
// Show a random fact
document.getElementById('factText').textContent =
  FACTS[Math.floor(Math.random() * FACTS.length)];

const DAY_MS = 24 * 60 * 60 * 1000;

// Format a date as YYYY-MM-DD
function dateISO(d) {
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString().slice(0, 10);
}

// Format a date for display
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Set default date selection: yesterday through 8 days earlier
function setDefaultDates() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const start = new Date(end.getTime() - 8 * DAY_MS);
  startInput.valueAsDate = start;
  endInput.valueAsDate = end;
}
setDefaultDates();

// Fetch button click handler
fetchBtn.addEventListener('click', async () => {
  // Check if both dates are selected
  if (!startInput.value || !endInput.value) {
    showStatus(`<div class="error">Choose both start and end dates.</div>`);
    return;
  }

  const start = new Date(startInput.value);
  const end = new Date(endInput.value);

  if (start > end) {
    showStatus(`<div class="error">Start date must be before end date.</div>`);
    return;
  }

  // Use the selected range as-is; we will show up to 9 items within it
  const startISO = dateISO(start);
  const endISO = dateISO(end);

  showStatus(`🔄 Loading space photos…`);
  gallery.innerHTML = '';

  try {
    // Fetch the APOD data
    const all = await fetchJSON(DATA_URL);

    // Filter items in the chosen date range (inclusive) and sort ascending
    const results = all
      .filter(item => item.date >= startISO && item.date <= endISO)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (results.length === 0) {
      showStatus(`<div class="error">No APOD entries in that range. Try different dates.</div>`);
      return;
    }

    // Show up to 9 most recent items within the range (ignore gaps between days)
    const toShow = results.length > 9 ? results.slice(-9) : results;

    renderGallery(toShow);
    clearStatus();
  } catch (err) {
    showStatus(`<div class="error">Could not load images. Please try again.</div>`);
    console.error(err);
  }
});

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

function showStatus(html) {
  statusBox.classList.remove('hidden');
  statusBox.innerHTML = html;
}
function clearStatus() {
  statusBox.classList.add('hidden');
  statusBox.innerHTML = '';
}

// Render the gallery
function renderGallery(items) {
  const frag = document.createDocumentFragment();

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;

    const isVideo = item.media_type === 'video';
    const thumbSrc = isVideo
      ? (item.thumbnail_url || getYoutubeThumb(item.url))
      : (item.url || item.hdurl);

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'thumb-wrap';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = thumbSrc;
    img.alt = item.title;
    thumbWrap.appendChild(img);

    if (isVideo) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Video';
      thumbWrap.appendChild(badge);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('h3');
    title.className = 'title';
    title.textContent = item.title;

    const date = document.createElement('p');
    date.className = 'date';
    date.textContent = fmtDate(item.date);

    meta.append(title, date);
    card.append(thumbWrap, meta);

    card.addEventListener('click', () => openModal(item));
    card.addEventListener('keypress', e => { if (e.key === 'Enter') openModal(item); });

    frag.appendChild(card);
  });

  gallery.innerHTML = '';
  gallery.appendChild(frag);
}

// Modal Functions
function openModal(item) {
  modalMedia.innerHTML = '';

  if (item.media_type === 'video') {
    const iframe = document.createElement('iframe');
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.src = toEmbed(item.url);
    modalMedia.appendChild(iframe);
  } else {
    const img = document.createElement('img');
    img.src = item.hdurl || item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = fmtDate(item.date);
  modalExplanation.textContent = item.explanation || '';

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  modalMedia.innerHTML = '';
  document.body.style.overflow = '';
}

modal.addEventListener('click', e => {
  if (e.target.dataset.close !== undefined) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Video Helpers
function getYoutubeThumb(url) {
  const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]+)/i);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
}

function toEmbed(url) {
  const match = url.match(/(?:youtube\.com.*v=|youtu\.be\/)([\w-]+)/i);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}
