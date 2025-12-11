const saveOptions = () => {
  const interval = document.getElementById("intervalInput").value;
  const speed = document.getElementById("speedInput").value;

  chrome.storage.sync.set(
    { atlasInterval: interval, atlasSpeed: speed },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      const button = document.getElementById("save");
      status.textContent = "SAVED";
      button.style.display = "none";
      setTimeout(() => {
        status.textContent = "";
        button.style.display = "";
      }, 2000);
    }
  );
};

const restoreOptions = () => {
  chrome.storage.sync.get({ atlasInterval: 3, atlasSpeed: 2 }, (items) => {
    document.getElementById("intervalInput").value = items.atlasInterval;
    document.getElementById("speedInput").value = items.atlasSpeed;
  });
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
