const REGISTRATIONS_KEY = "skycast-registrations";

const signupForm = document.querySelector("#signup-form");
const signupMessage = document.querySelector("#signup-message");
const exportButton = document.querySelector("[data-export-json]");
const syncButton = document.querySelector("[data-sync-json]");

let baseUsersCache = null;

const readLocalRegistrations = () => {
  try {
    const stored = localStorage.getItem(REGISTRATIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to parse local registrations", error);
    return [];
  }
};

const writeLocalRegistrations = (users) => {
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(users));
};

const setSignupMessage = (message, type = "info") => {
  if (!signupMessage) return;
  signupMessage.textContent = message;
  signupMessage.classList.remove("error", "success");
  if (type === "error") {
    signupMessage.classList.add("error");
  } else if (type === "success") {
    signupMessage.classList.add("success");
  }
};

const setFormLoading = (isLoading) => {
  const button = signupForm?.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? "Saving..." : "Save Account";
};

const loadBaseUsers = async () => {
  if (baseUsersCache) {
    return baseUsersCache;
  }

  const response = await fetch("users.json");
  if (!response.ok) {
    throw new Error("Unable to load base user list.");
  }
  const data = await response.json();
  baseUsersCache = Array.isArray(data.users) ? data.users : [];
  return baseUsersCache;
};

const loadAllUsers = async () => {
  const baseUsers = await loadBaseUsers();
  const localUsers = readLocalRegistrations();
  return [...baseUsers, ...localUsers];
};

const buildUserRecord = ({ fullName, username, password, role }) => ({
  username,
  password,
  name: fullName,
  role: role || "member",
  createdAt: new Date().toISOString(),
});

const handleSignup = async (event) => {
  event.preventDefault();

  const formData = new FormData(signupForm);
  const fullName = String(formData.get("fullName") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!fullName || !username || !password) {
    setSignupMessage("Please fill in all required fields.", "error");
    return;
  }

  if (password.length < 6) {
    setSignupMessage("Password must be at least 6 characters long.", "error");
    return;
  }

  try {
    setFormLoading(true);
    setSignupMessage("Saving account...");

    const allUsers = await loadAllUsers();
    const exists = allUsers.some((user) => user.username.toLowerCase() === username.toLowerCase());

    if (exists) {
      setSignupMessage("That username is already taken. Please choose another.", "error");
      return;
    }

    const localUsers = readLocalRegistrations();
    const newUser = buildUserRecord({ fullName, username, password, role });
    localUsers.push(newUser);
    writeLocalRegistrations(localUsers);

    setSignupMessage(`Account for ${fullName} saved successfully!`, "success");
    signupForm.reset();
    signupForm.querySelector("#full-name")?.focus();
    updateExportData();
    revealSyncButtonIfAvailable();
  } catch (error) {
    console.error(error);
    setSignupMessage(error.message || "Unable to save account. Try again later.", "error");
  } finally {
    setFormLoading(false);
  }
};

const buildCombinedJson = async () => {
  const baseUsers = await loadBaseUsers();
  const localUsers = readLocalRegistrations();
  return JSON.stringify({ users: [...baseUsers, ...localUsers] }, null, 2);
};

const updateExportData = async () => {
  if (!exportButton) return;
  const existingUrl = exportButton.dataset.downloadUrl;
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl);
    delete exportButton.dataset.downloadUrl;
  }
  try {
    const json = await buildCombinedJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    exportButton.dataset.downloadUrl = url;
    exportButton.dataset.downloadName = "users.json";
  } catch (error) {
    console.error(error);
  }
};

const handleExport = async () => {
  if (!exportButton) return;
  await updateExportData();
  const url = exportButton.dataset.downloadUrl;
  const name = exportButton.dataset.downloadName || "users.json";
  if (!url) {
    setSignupMessage("Unable to prepare download. Please try again.", "error");
    return;
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setSignupMessage("Download started. Replace users.json with the downloaded file.", "success");
};

const revealSyncButtonIfAvailable = () => {
  if (!syncButton) return;
  if ("showSaveFilePicker" in window || "showOpenFilePicker" in window) {
    syncButton.hidden = false;
  }
};

const writeFile = async (handle, contents) => {
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
};

const handleSync = async () => {
  try {
    const json = await buildCombinedJson();
    let fileHandle;

    if ("showSaveFilePicker" in window) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "users.json",
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
    } else if ("showOpenFilePicker" in window) {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      fileHandle = handle;
    } else {
      throw new Error("This browser does not support direct file access. Use the download option instead.");
    }

    await writeFile(fileHandle, json);
    setSignupMessage("users.json updated successfully!", "success");
  } catch (error) {
    console.error(error);
    setSignupMessage(error.message || "Unable to update users.json. Please use the download option.", "error");
  }
};

if (signupForm) {
  signupForm.addEventListener("submit", handleSignup);
  signupForm.querySelector("#full-name")?.focus();
  updateExportData();
  revealSyncButtonIfAvailable();
}

if (exportButton) {
  exportButton.addEventListener("click", handleExport);
}

if (syncButton) {
  syncButton.addEventListener("click", handleSync);
}


