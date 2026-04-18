import { auth, db, storage } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const categoryTemplate = document.getElementById("categoryTemplate");
const categoriesDiv = document.getElementById("categories");
const authStatus = document.getElementById("authStatus");
const uploadStatus = document.getElementById("uploadStatus");
const results = document.getElementById("results");
const weightWarning = document.getElementById("weightWarning");

const profileBtn = document.getElementById("profileBtn");
const profileBtnName = document.getElementById("profileBtnName");
const profileMenu = document.getElementById("profileMenu");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");

const stageEls = {
  1: document.getElementById("stage1"),
  2: document.getElementById("stage2"),
  3: document.getElementById("stage3"),
  4: document.getElementById("stage4"),
  5: document.getElementById("stage5")
};

let currentUser = null;
let currentStage = 1;
const googleProvider = new GoogleAuthProvider();

function showOnlyStage(stageKey) {
  Object.values(stageEls).forEach((el) => el.classList.add("hidden"));
  stageEls[stageKey].classList.remove("hidden");
  currentStage = stageKey;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetClassFlow() {
  document.getElementById("syllabusFile").value = "";
  document.getElementById("targetGrade").value = "";
  document.getElementById("finalCategoryName").value = "Final Exam";
  uploadStatus.textContent = "";
  results.innerHTML = "";

  categoriesDiv.innerHTML = "";
  addCategoryRow("Homework", 20, "");
  addCategoryRow("Quizzes", 15, "");
  addCategoryRow("Midterm", 25, "");
  addCategoryRow("Final Exam", 40, "");
  updateWeightWarning();
}

function addCategoryRow(name = "", weight = "", score = "") {
  const node = categoryTemplate.content.cloneNode(true);
  const row = node.querySelector(".category-row");

  row.querySelector(".cat-name").value = name;
  row.querySelector(".cat-weight input").value = weight;
  row.querySelector(".cat-score input").value = score;

  row.querySelector(".remove-category").addEventListener("click", () => {
    row.remove();
    updateWeightWarning();
  });

  categoriesDiv.appendChild(node);
}

function getCategoryData() {
  return [...document.querySelectorAll(".category-row")].map((row) => ({
    name: row.querySelector(".cat-name").value.trim(),
    weight: parseFloat(row.querySelector(".cat-weight input").value) || 0,
    score: parseFloat(row.querySelector(".cat-score input").value) || 0
  }));
}

function updateWeightWarning() {
  const total = getCategoryData().reduce((sum, item) => sum + item.weight, 0);
  weightWarning.textContent = `Current total weight entered: ${total.toFixed(2)}%`;
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.getElementById("signupPanel").classList.toggle("active", tabName === "signup");
  document.getElementById("loginPanel").classList.toggle("active", tabName === "login");
}

async function loadProfile(user) {
  let displayName = "Account";

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.exists() ? userDoc.data() : null;

    if (data?.firstName) {
      displayName = data.firstName;
    } else if (user.displayName) {
      displayName = user.displayName.split(" ")[0];
    } else if (user.email) {
      displayName = user.email.split("@")[0];
    }
  } catch (error) {
    console.error(error);
  }

  profileBtnName.textContent = displayName;
  profileEmail.textContent = user.email || "";
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

document.querySelectorAll(".goal-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".goal-btn").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    document.getElementById("targetGrade").value = button.dataset.goal;
  });
});

profileBtn.addEventListener("click", () => {
  profileMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  const clickedInsideProfile =
    profileBtn.contains(event.target) || profileMenu.contains(event.target);

  if (!clickedInsideProfile) {
    profileMenu.classList.add("hidden");
  }
});

document.getElementById("googleLoginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        createdAt: Date.now()
      },
      { merge: true }
    );

    authStatus.textContent = "Logged in with Google.";
    showOnlyStage(2);
  } catch (error) {
    console.error(error);
    authStatus.textContent = "Google login failed. Check Firebase settings.";
  }
});

document.getElementById("signupBtn").addEventListener("click", async () => {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!firstName || !lastName || !email || !password) {
    authStatus.textContent = "Fill everything out.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        firstName,
        lastName,
        email,
        createdAt: Date.now()
      },
      { merge: true }
    );

    authStatus.textContent = "Account created.";
    showOnlyStage(2);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      authStatus.textContent = "Account already exists. Try logging in.";
    } else {
      authStatus.textContent = error.message;
    }
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Logged in.";
    showOnlyStage(2);
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

document.getElementById("mockParseBtn").addEventListener("click", () => {
  categoriesDiv.innerHTML = "";
  addCategoryRow("Homework", 20, "");
  addCategoryRow("Quizzes", 15, "");
  addCategoryRow("Midterm", 25, "");
  addCategoryRow("Participation", 10, "");
  addCategoryRow("Final Exam", 30, "");
  updateWeightWarning();
  uploadStatus.textContent = "Demo weights added.";
  showOnlyStage(3);
});

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  addCategoryRow();
});

document.getElementById("backToUploadBtn").addEventListener("click", () => {
  showOnlyStage(2);
});

document.getElementById("continueToGoalsBtn").addEventListener("click", () => {
  const totalWeight = getCategoryData().reduce((sum, item) => sum + item.weight, 0);

  if (Math.abs(totalWeight - 100) > 0.01) {
    weightWarning.textContent = `Your weights must add up to 100%. Right now they add up to ${totalWeight.toFixed(2)}%.`;
    return;
  }

  showOnlyStage(4);
});

document.getElementById("backToWeightsBtn").addEventListener("click", () => {
  showOnlyStage(3);
});

document.getElementById("backToGoalsBtn").addEventListener("click", () => {
  showOnlyStage(4);
});

document.getElementById("startAnotherBtn").addEventListener("click", () => {
  resetClassFlow();
  showOnlyStage(2);
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = document.getElementById("syllabusFile").files[0];
  const finalCategoryNameInput = document.getElementById("finalCategoryName");

  if (!currentUser) {
    uploadStatus.textContent = "Log in first.";
    return;
  }

  if (!file) {
    uploadStatus.textContent = "Choose a syllabus file first.";
    return;
  }

  try {
    uploadStatus.textContent = "Uploading and analyzing syllabus...";

    const path = `syllabi/${currentUser.uid}/${Date.now()}-${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://gradepath-parser.onrender.com/analyze-syllabus", {
      method: "POST",
      body: formData
    });

    const raw = await res.text();
    console.log("RAW AI RESPONSE:", raw);

    if (!res.ok) {
      throw new Error(raw || "AI parser request failed.");
    }

    const data = JSON.parse(raw);
    console.log("AI RESULT:", data);

    if (data.finalCategoryName) {
      finalCategoryNameInput.value = data.finalCategoryName;
    }

    if (Array.isArray(data.categories) && data.categories.length > 0) {
      categoriesDiv.innerHTML = "";
      data.categories.forEach((cat) => {
        addCategoryRow(cat.name || "", cat.weight || "", "");
      });
      updateWeightWarning();
    }

    uploadStatus.textContent = "Syllabus uploaded and parsed by AI.";
    showOnlyStage(3);
  } catch (error) {
    console.error(error);
    uploadStatus.textContent = error.message;
  }
});

document.getElementById("calcBtn").addEventListener("click", () => {
  const targetGrade = parseFloat(document.getElementById("targetGrade").value);
  const finalCategoryName =
    document.getElementById("finalCategoryName").value.trim().toLowerCase() || "final exam";
  const categories = getCategoryData();

  if (!targetGrade) {
    results.innerHTML = "<p>Enter a target grade first.</p>";
    return;
  }

  const totalWeight = categories.reduce((sum, item) => sum + item.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    results.innerHTML = `<p>Your category weights must add up to 100%. Right now they add up to ${totalWeight.toFixed(2)}%.</p>`;
    showOnlyStage(3);
    return;
  }

  const finalCategory = categories.find(
    (item) => item.name.trim().toLowerCase() === finalCategoryName
  );

  if (!finalCategory) {
    results.innerHTML = `<p>Could not find a category named “${
      document.getElementById("finalCategoryName").value || "Final Exam"
    }”. Make sure one category matches that exact name.</p>`;
    return;
  }

  const nonFinalCategories = categories.filter((item) => item !== finalCategory);

  const currentWeightedGrade = nonFinalCategories.reduce(
    (sum, item) => sum + (item.weight * item.score) / 100,
    0
  );

  const completedWeight = nonFinalCategories.reduce((sum, item) => sum + item.weight, 0);

  const currentAverage =
    completedWeight === 0 ? 0 : (currentWeightedGrade / completedWeight) * 100;

  const neededOnFinal = ((targetGrade - currentWeightedGrade) / finalCategory.weight) * 100;

  let message = `
    <p><strong>Current average (based on completed work):</strong> ${currentAverage.toFixed(2)}%</p>
    <p><strong>Progress toward final course grade:</strong> ${currentWeightedGrade.toFixed(2)} / 100</p>
    <p><strong>Target overall grade:</strong> ${targetGrade.toFixed(2)}%</p>
    <p><strong>Needed on ${finalCategory.name}:</strong> ${neededOnFinal.toFixed(2)}%</p>
  `;

  if (neededOnFinal > 100) {
    message += `<p>This target is not reachable with the scores entered so far unless some other grades improve.</p>`;
  } else if (neededOnFinal < 0) {
    message += `<p>You are already above this target based on the numbers entered so far.</p>`;
  } else {
    message += `<p>You are on track if you can earn about ${neededOnFinal.toFixed(2)}% on the final.</p>`;
  }

  results.innerHTML = message;
  showOnlyStage(5);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    await loadProfile(user);
    profileBtn.classList.remove("hidden");
    profileMenu.classList.add("hidden");

    if (currentStage === 1) {
      showOnlyStage(2);
    }
  } else {
    profileBtn.classList.add("hidden");
    profileMenu.classList.add("hidden");
    showOnlyStage(1);
  }
});

categoriesDiv.addEventListener("input", updateWeightWarning);

resetClassFlow();
showOnlyStage(1);
