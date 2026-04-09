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
const BALL_ID = "atlas-tennis-ball";
const BALL_DROP_DURATION = 1500;

chrome.storage.sync.get({ atlasInterval: 3, atlasSpeed: 2 }, (items) => {
  const INTERVAL_MINUTES = parseInt(items.atlasInterval, 10);
  const speed = parseInt(items.atlasSpeed, 10);
  const invertedSpeed = 11 - speed;
  const WALK_DURATION = 2000 * invertedSpeed;

  walkAtlasDog(WALK_DURATION);
  setInterval(() => walkAtlasDog(WALK_DURATION), INTERVAL_MINUTES * 60 * 1000);
});

function chooseBehavior() {
  const roll = Math.random();
  if (roll < 0.33) return "dig";
  if (roll < 0.66) return "fetch";
  return "walk";
}

function walkAtlasDog(walkDuration) {
  const behavior = chooseBehavior();

  if (behavior === "fetch") {
    fetchBallAtlas(walkDuration);
    return;
  }

  injectWalkingAtlasDog(walkDuration);
  const img = document.getElementById(ATLAS_ID);
  if (!img) return;
  img.style.left = "-150px";
  img.style.right = "";

  const digPos = diggingPosition();
  const totalDistance = window.innerWidth + 300; // -150 to innerWidth + 150
  const distanceToDigPosition = digPos + 150; // Distance from start to dig position
  const timeToDigPosition =
    (distanceToDigPosition / totalDistance) * walkDuration;

  setTimeout(() => {
    img.style.left = `${window.innerWidth + 150}px`;
  }, 100);

  if (behavior === "dig") {
    setTimeout(() => {
      diggingAtlas();
    }, timeToDigPosition);
  } else {
    setTimeout(() => {
      img.remove();
    }, walkDuration);
  }
}

function injectWalkingAtlasDog(walkDuration) {
  var img = document.getElementById(ATLAS_ID);
  if (img != null) {
    img.remove();
  }
  var ball = document.getElementById(BALL_ID);
  if (ball != null) {
    ball.remove();
  }
  img = document.createElement("img");
  img.src = getWalkingAtlasImageUrl();
  img.id = ATLAS_ID;
  img.style.position = "fixed";
  img.style.bottom = "0px";
  img.style.left = "-150px";
  img.style.right = "";
  img.style.height = "60px";
  img.style.zIndex = 99999;
  img.style.transition = `left ${walkDuration}ms linear`;
  document.body.appendChild(img);
}

function createTennisBall(x) {
  var ball = document.getElementById(BALL_ID);
  if (ball) ball.remove();

  ball = document.createElement("div");
  ball.id = BALL_ID;
  ball.style.position = "fixed";
  ball.style.width = "15px";
  ball.style.height = "15px";
  ball.style.borderRadius = "50%";
  ball.style.backgroundColor = "#ccff00";
  ball.style.border = "1px solid #a0c800";
  ball.style.left = x + "px";
  ball.style.top = "-20px";
  ball.style.zIndex = "99999";
  ball.style.animation =
    "atlas-ball-drop " + BALL_DROP_DURATION + "ms ease-in forwards";
  document.body.appendChild(ball);
  return ball;
}

function fetchBallAtlas(walkDuration) {
  // Pick a random landing position for the ball
  var ballX = Math.floor(Math.random() * (window.innerWidth - 100)) + 50;

  // Drop the tennis ball with a bounce
  var ball = createTennisBall(ballX);

  // After the ball lands, Atlas enters to fetch it
  setTimeout(function () {
    injectWalkingAtlasDog(walkDuration);
    var img = document.getElementById(ATLAS_ID);
    if (!img) return;

    // Calculate timing for Atlas to reach the ball
    var totalDistance = window.innerWidth + 300;
    var distanceToBall = ballX + 150; // from start (-150) to ballX
    var timeToBall = (distanceToBall / totalDistance) * walkDuration;

    // Walk Atlas toward the ball
    img.style.transition = "left " + timeToBall + "ms linear";
    setTimeout(function () {
      img.style.left = ballX + "px";
    }, 100);

    // When Atlas reaches the ball, pick it up and walk off screen
    setTimeout(function () {
      // Remove the ball (Atlas picked it up)
      ball.remove();

      // Brief pause, then walk out to the right
      var remainingDistance = window.innerWidth + 150 - ballX;
      var timeToExit = (remainingDistance / totalDistance) * walkDuration;

      setTimeout(function () {
        img.style.transition = "left " + timeToExit + "ms linear";
        img.style.left = window.innerWidth + 150 + "px";

        setTimeout(function () {
          img.remove();
        }, timeToExit + 100);
      }, 500);
    }, timeToBall + 100);
  }, BALL_DROP_DURATION);
}

function diggingAtlas() {
  const img = document.getElementById(ATLAS_ID);
  if (!img) return;

  const currentLeft = window.getComputedStyle(img).left;
  img.src = getDiggingAtlasImageUrl();
  img.style.transition = "none";
  img.style.left = currentLeft;
  img.style.height = "50px";
  img.style.position = "fixed";
  img.style.bottom = "-2px";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      img.style.willChange = "bottom";
      img.style.transition = "bottom 10000ms ease-in";
      img.style.bottom = "-60px";
    });
  });
}

function diggingPosition() {
  return Math.floor(Math.random() * window.innerWidth);
}
