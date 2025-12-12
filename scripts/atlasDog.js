// atlasDog.js
// Injects and animates Atlas the dog walking across the screen every x minutes

const ATLAS_URL = chrome.runtime.getURL("gifs/atlasWalk.gif");
const XMAS_URL = chrome.runtime.getURL("gifs/christmas-atlas.gif");
const ATLAS_DIGGING = chrome.runtime.getURL("gifs/atlasDigging.gif");
const XMAS_DIGGING = chrome.runtime.getURL("gifs/christmas-atlasDigging.gif");

function getWalkingAtlasImageUrl() {
  const now = new Date();
  if (now.getMonth() === 11) {
    return XMAS_URL;
  }
  return ATLAS_URL;
}

function getDiggingAtlasImageUrl() {
  const now = new Date();
  if (now.getMonth() === 11) {
    return XMAS_DIGGING;
  }
  return ATLAS_DIGGING;
}

const ATLAS_ID = "atlas-dog-walker";

chrome.storage.sync.get({ atlasInterval: 3, atlasSpeed: 2 }, (items) => {
  const INTERVAL_MINUTES = parseInt(items.atlasInterval, 10);
  const speed = parseInt(items.atlasSpeed, 10);
  const invertedSpeed = 11 - speed;
  const WALK_DURATION = 2000 * invertedSpeed;

  walkAtlasDog(WALK_DURATION);
  setInterval(() => walkAtlasDog(WALK_DURATION), INTERVAL_MINUTES * 60 * 1000);
});

function walkAtlasDog(walkDuration) {
  console.log("Atlas injected");
  injectWalkingAtlasDog(walkDuration);
  const img = document.getElementById(ATLAS_ID);
  if (!img) return;
  img.style.left = "-150px";
  img.style.right = "";

  const digPosition = diggingPosition();
  const totalDistance = window.innerWidth + 300; // -150 to innerWidth + 150
  const distanceToDigPosition = digPosition + 150; // Distance from start to dig position
  const timeToDigPosition =
    (distanceToDigPosition / totalDistance) * walkDuration;

  setTimeout(() => {
    img.style.left = `${window.innerWidth + 150}px`;
  }, 100);

  if (smellsSomethingGood()) {
    setTimeout(() => {
      diggingAtlas();
    }, timeToDigPosition);
  }

  setTimeout(() => {
    console.log("Atlas removed");
    img.remove();
  }, walkDuration);
}

function injectWalkingAtlasDog(walkDuration) {
  if (document.getElementById(ATLAS_ID)) return;
  const img = document.createElement("img");
  img.src = getWalkingAtlasImageUrl();
  img.id = ATLAS_ID;
  img.style.position = "fixed";
  img.style.bottom = "1px";
  img.style.left = "-150px";
  img.style.right = "";
  img.style.height = "60px";
  img.style.zIndex = 99999;
  img.style.transition = `left ${walkDuration}ms linear`;
  document.body.appendChild(img);
}

function diggingAtlas() {
  const img = document.getElementById(ATLAS_ID);
  if (!img) return;

  const currentLeft = window.getComputedStyle(img).left;
  img.style.transition = "";
  img.style.left = currentLeft;
  img.style.height = "50px";

  img.src = getDiggingAtlasImageUrl();
  img.style.transition = `bottom 10000ms ease-in`;
  img.style.bottom = "-60px";
}

function diggingPosition() {
  return Math.floor(Math.random() * window.innerWidth);
}

function smellsSomethingGood() {
  const shouldDig = Math.random() < 0.5;
  return shouldDig;
}
