const loginForm = document.querySelector("#login-form");
const messageNode = document.querySelector("#login-message");
const submitButton = loginForm?.querySelector("button[type='submit']");

const REGISTRATIONS_KEY = "skycast-registrations";

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

const setMessage = (message, type = "info") => {
  if (!messageNode) return;
  messageNode.textContent = message;
  messageNode.classList.remove("error", "success");
  if (type === "error") {
    messageNode.classList.add("error");
  } else if (type === "success") {
    messageNode.classList.add("success");
  }
};

const setLoading = (isLoading) => {
  if (!submitButton) return;
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Signing in..." : "Sign In";
};

const loadBaseUsers = async () => {
  if (baseUsersCache) {
    return baseUsersCache;
  }

  const response = await fetch("users.json");
  if (!response.ok) {
    throw new Error("Unable to load user database. Please try again later.");
  }

  const data = await response.json();
  baseUsersCache = Array.isArray(data.users) ? data.users : [];
  return baseUsersCache;
};

const loadUsers = async () => {
  const baseUsers = await loadBaseUsers();
  const localUsers = readLocalRegistrations();
  return [...baseUsers, ...localUsers];
};

const saveSession = (user) => {
  const payload = {
    username: user.username,
    name: user.name,
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem("skycast-session", JSON.stringify(payload));
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!username || !password) {
    setMessage("Please fill in both username and password.", "error");
    return;
  }

  try {
    setLoading(true);
    setMessage("Checking credentials...");

    const users = await loadUsers();
    const match = users.find(
      (user) =>
        user.username.toLowerCase() === username.toLowerCase() && user.password === password,
    );

    if (!match) {
      setMessage("Invalid username or password. Please try again.", "error");
      return;
    }

    saveSession(match);
    setMessage(`Welcome back, ${match.name}! You are signed in.`, "success");
    loginForm.reset();
  } catch (error) {
    console.error(error);
    setMessage(error.message || "Something went wrong. Please try again later.", "error");
  } finally {
    setLoading(false);
  }
};

if (loginForm) {
  loginForm.addEventListener("submit", handleSubmit);
  loginForm.querySelector("#username")?.focus();
}

