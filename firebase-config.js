import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyC6Z081EBLS4cEXwXrHp87JFWJnds0Mu0A",
  authDomain: "gradepath-dc14f.firebaseapp.com",
  projectId: "gradepath-dc14f",
  storageBucket: "gradepath-dc14f.firebasestorage.app",
  messagingSenderId: "267448889709",
  appId: "1:267448889709:web:900001ebe023dbbc58aa64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services 
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
