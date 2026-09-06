import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD0sNOMvF69ueXoY8Smg25CgCXecVB-RvQ",
  authDomain: "ai-digital-forensics-c603f.firebaseapp.com",
  projectId: "ai-digital-forensics-c603f",
  storageBucket: "ai-digital-forensics-c603f.firebasestorage.app",
  messagingSenderId: "703433864174",
  appId: "1:703433864174:web:40c219236095db7dc954ff"
};

const app = initializeApp(firebaseConfig);

export default app;