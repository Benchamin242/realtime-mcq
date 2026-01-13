// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHfC8tM2GjXfRN6rmDk7EmTuX7ZCrrb4g",
  authDomain: "realtime-mcq.firebaseapp.com",
  projectId: "realtime-mcq",
  storageBucket: "realtime-mcq.firebasestorage.app",
  messagingSenderId: "706926189834",
  appId: "1:706926189834:web:bb45ccc43b7e7c30f46ef3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);