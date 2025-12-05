// Saves options to chrome.storage
const saveOptions = () => {
  const speed = document.getElementById("atlasWalkSpeed").value;
  const isRandomInterval = document.getElementById("randomInterval").checked;

  chrome.storage.sync.set(
    { favoriteColor: color, likesColor: likesColor },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { favoriteColor: "red", likesColor: true },
    (items) => {
      document.getElementById("atlasWalkSpeed").value = items.favoriteColor;
      document.getElementById("randomInterval").checked = items.likesColor;
    }
  );
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
