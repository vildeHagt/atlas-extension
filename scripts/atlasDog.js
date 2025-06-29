// atlasDog.js
// Injects and animates Atlas the dog walking across the screen every x minutes

const ATLAS_IMAGE_URL = chrome.runtime.getURL("images/atlasWalk.gif"); // Use your dog gif
const ATLAS_ID = "atlas-dog-walker";
const WALK_DURATION = 10000; // ms for dog to cross the screen
const INTERVAL_MINUTES = 3; // Change to your desired interval

function injectAtlasDog() {
  if (document.getElementById(ATLAS_ID)) return;
  const img = document.createElement("img");
  img.src = ATLAS_IMAGE_URL;
  img.id = ATLAS_ID;
  img.style.position = "fixed";
  img.style.bottom = "1px";
  img.style.right = "-150px";
  img.style.left = "";
  img.style.height = "60px";
  img.style.zIndex = 99999;
  img.style.transition = `right ${WALK_DURATION}ms linear`;
  img.style.transform = "scaleX(-1)"; // Flip image to face left
  document.body.appendChild(img);
}

function walkAtlasDog() {
  injectAtlasDog();
  const img = document.getElementById(ATLAS_ID);
  if (!img) return;
  img.style.right = "-150px";
  setTimeout(() => {
    img.style.right = `${window.innerWidth + 150}px`;
  }, 100);
  setTimeout(() => {
    img.remove();
  }, WALK_DURATION + 1000);
}

// Start the interval
walkAtlasDog();
setInterval(walkAtlasDog, INTERVAL_MINUTES * 60 * 1000);
