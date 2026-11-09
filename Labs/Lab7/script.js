const API_URL = 'https://api.unsplash.com/search/photos';
const searchForm = document.getElementById('search-form');
const searchButton = document.getElementById('search-button');
const message = document.getElementById('message');
const photoGrid = document.getElementById('photo-grid');
const resultsTitle = document.getElementById('results-title');
const resultSummary = document.getElementById('result-summary');
const searchQuery = document.getElementById('search-query');
let requestNumber = 0;

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.firstChild.textContent = isLoading ? 'Searching… ' : 'Search photos ';
  if (isLoading) {
    photoGrid.replaceChildren();
    resultSummary.textContent = '';
    message.hidden = false;
    message.textContent = 'Loading photos from Unsplash…';
  }
}

function showError(error) {
  message.hidden = false;
  if (error.status === 401) message.textContent = 'Unsplash did not accept that Access Key. Check the key and try again.';
  else if (error.status === 403 || error.status === 429) message.textContent = 'Unsplash has limited this request. Check the application permissions or try again later.';
  else message.textContent = error.message || 'Something went wrong while loading photos. Please try again.';
  photoGrid.replaceChildren();
  resultSummary.textContent = '';
}

function renderPhotos(payload, query, currentRequest) {
  if (currentRequest !== requestNumber) return;
  const photos = payload.results || [];
  photoGrid.replaceChildren();
  resultsTitle.textContent = `Photos for “${query}”`;
  resultSummary.textContent = `${photos.length} of ${payload.total || 0} results`;
  if (photos.length === 0) {
    message.hidden = false;
    message.textContent = 'No photos found. Try a different search phrase.';
    return;
  }
  message.hidden = true;
  photos.forEach(photo => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    const photoLink = document.createElement('a');
    photoLink.href = photo.links.html;
    photoLink.target = '_blank';
    photoLink.rel = 'noreferrer';
    photoLink.setAttribute('aria-label', `Open photo by ${photo.user.name} on Unsplash`);
    const image = document.createElement('img');
    image.src = photo.urls.small;
    image.alt = photo.alt_description || photo.description || `Photo by ${photo.user.name}`;
    image.loading = 'lazy';
    photoLink.append(image);
    const caption = document.createElement('div');
    caption.className = 'photo-caption';
    const description = document.createElement('p');
    description.textContent = photo.description || photo.alt_description || 'Untitled photo';
    const credit = document.createElement('small');
    credit.append('Photo by ');
    const authorLink = document.createElement('a');
    authorLink.href = `${photo.user.links.html}?utm_source=cpit405_lab7&utm_medium=referral`;
    authorLink.target = '_blank';
    authorLink.rel = 'noreferrer';
    authorLink.textContent = photo.user.name;
    credit.append(authorLink, ' on Unsplash');
    caption.append(description, credit);
    card.append(photoLink, caption);
    photoGrid.append(card);
  });
}

function makeRequestUrl(query) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({ query });
  return url.toString();
}

function requestWithXHR(url, accessKey) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.setRequestHeader('Authorization', `Client-ID ${accessKey}`);
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        try { resolve(JSON.parse(request.responseText)); }
        catch { reject(new Error('The response from Unsplash was not valid JSON.')); }
      } else reject({ status: request.status, message: `Unsplash request failed (${request.status}).` });
    });
    request.addEventListener('error', () => reject(new Error('Network error. Check your connection and try again.')));
    request.send();
  });
}

function requestWithFetchPromise(url, accessKey) {
  return fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } })
    .then(response => {
      if (!response.ok) throw { status: response.status, message: `Unsplash request failed (${response.status}).` };
      return response.json();
    });
}

async function requestWithAsyncAwait(url, accessKey) {
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } });
  if (!response.ok) throw { status: response.status, message: `Unsplash request failed (${response.status}).` };
  return response.json();
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const accessKey = document.getElementById('access-key').value.trim();
  const query = document.getElementById('search-query').value.trim();
  if (!accessKey || !query) return;
  const currentRequest = ++requestNumber;
  const method = document.getElementById('request-method').value;
  const url = makeRequestUrl(query);
  setLoading(true);
  let request;
  if (method === 'xhr') request = requestWithXHR(url, accessKey);
  else if (method === 'promise') request = requestWithFetchPromise(url, accessKey);
  else request = requestWithAsyncAwait(url, accessKey);
  Promise.resolve(request)
    .then(payload => renderPhotos(payload, query, currentRequest))
    .catch(error => { if (currentRequest === requestNumber) showError(error); })
    .finally(() => { if (currentRequest === requestNumber) setLoading(false); });
});

searchButton.addEventListener('mouseover', () => searchButton.classList.add('mouse-over'));
searchButton.addEventListener('mouseout', () => searchButton.classList.remove('mouse-over'));
searchQuery.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    searchQuery.value = '';
    photoGrid.replaceChildren();
    resultsTitle.textContent = 'Photos for your search';
    resultSummary.textContent = '';
    message.hidden = false;
    message.textContent = 'Search cleared. Enter a new search phrase.';
  }
});

