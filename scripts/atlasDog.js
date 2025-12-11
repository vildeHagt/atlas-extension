// atlasDog.js
// Injects and animates Atlas the dog walking across the screen every x minutes

function getAtlasImageUrl() {
  const now = new Date();
  if (now.getMonth() === 11) {
    return chrome.runtime.getURL("images/christmas-atlas.gif");
  }
  return chrome.runtime.getURL("images/atlasWalk.gif");
}

const ATLAS_ID = "atlas-dog-walker";

chrome.storage.sync.get({ atlasInterval: 3, atlasSpeed: 2 }, (items) => {
  const INTERVAL_MINUTES = parseInt(items.atlasInterval, 10);
  const speed = parseInt(items.atlasSpeed, 10);
  const invertedSpeed = 11 - speed;
  const WALK_DURATION = 2000 * invertedSpeed;

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
    }, WALK_DURATION);
  }

  function injectAtlasDog() {
    if (document.getElementById(ATLAS_ID)) return;
    const img = document.createElement("img");
    img.src = getAtlasImageUrl();
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

  walkAtlasDog();
  setInterval(walkAtlasDog, INTERVAL_MINUTES * 60 * 1000);
});
