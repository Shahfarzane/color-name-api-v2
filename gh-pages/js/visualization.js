// Visualization logic for color requests
import { elements } from './elements.js';
import { highlightMapCountry } from './map.js';
import { getColorValue, colorArrToSteppedGradient } from './colors.js';
import { API_BASE_URL } from './config.js';

const MAX_COLORS_DISPLAY = 50;
const MAX_COLOR_ITEMS = 1;

const entryTpl = document.createElement('template');
entryTpl.innerHTML = `
  <div class="color-item">
    <div class="color-item__header">
      <h4 class="color-item__title"></h4>
      <span class="color-item__country"></span>
    </div>
    <a class="color-item__url" target="_blank"></a>
  </div>
`;

export function addColorsToVisualization(data) {
  const { paletteTitle, colors } = data;
  let url = data.request?.url || '';
  if (url && !url.startsWith('http')) {
    if (!url.includes('/v1/') && !url.startsWith('/v1/')) {
      url = url.startsWith('/') ? url.substring(1) : url;
      url = API_BASE_URL + url;
    } else {
      url = url.startsWith('/') ? url : '/' + url;
      url = API_BASE_URL.split('/v1/')[0] + url;
    }
  }
  url = url.replace(/%2C/g, ',');
  let countryCode = null;

  // Check for clientLocation at root level first (new format), then in request (old format)
  const clientLocation = data.clientLocation || data.request?.clientLocation;

  // Debug logging
  console.log('[Visualization] Received data:', {
    paletteTitle,
    clientLocation,
    requestClientLocation: data.request?.clientLocation,
    rootClientLocation: data.clientLocation,
  });

  if (clientLocation && clientLocation.country) {
    countryCode = clientLocation.country.toUpperCase();
    console.log('[Visualization] Country code:', countryCode);
  } else {
    console.warn('[Visualization] No country code found in data');
  }
  if (!document.getElementById('color-visualization')) {
    const visualizationContainer = document.createElement('div');
    visualizationContainer.id = 'color-visualization';
    visualizationContainer.classList.add('color-visualization');
    elements.requestsContainer.parentNode.insertBefore(
      visualizationContainer,
      elements.requestsContainer
    );
  }
  const visualizationContainer = document.getElementById('color-visualization');
  // Use entryTpl to create the color item
  const colorItem = entryTpl.content.firstElementChild.cloneNode(true);
  const max = Math.min(MAX_COLORS_DISPLAY, colors.length);
  colorItem.style.setProperty('--max', max);
  const colorValues = [];
  for (let i = 0; i < max; i++) {
    colorValues.push(getColorValue(colors[i]));
  }
  colorItem.style.setProperty('--g', colorArrToSteppedGradient(colorValues));
  colorItem.style.setProperty('--c', colors[0].bestContrast);

  // Set palette title if present
  if (paletteTitle) {
    const titleElement = colorItem.querySelector('.color-item__title');
    if (titleElement) titleElement.textContent = paletteTitle;
  }
  // Set URL if present
  if (url) {
    const urlElement = colorItem.querySelector('.color-item__url');
    if (urlElement) {
      urlElement.href = url;
      urlElement.textContent = url;
    }
  }
  // Set country code if present
  if (countryCode) {
    const countryElement = colorItem.querySelector('.color-item__country');
    if (countryElement) countryElement.innerText = countryCode;
    highlightMapCountry(countryCode, colors);
  }
  visualizationContainer.insertBefore(
    colorItem,
    visualizationContainer.firstChild
  );
  while (visualizationContainer.children.length > MAX_COLOR_ITEMS) {
    visualizationContainer.removeChild(visualizationContainer.lastChild);
  }
}
