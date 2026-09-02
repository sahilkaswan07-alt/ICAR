import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyAL52Ft1McOTdlB_59GNAYQm11ZqdmBRFM",
    authDomain: "icar-test-series.firebaseapp.com",
    projectId: "icar-test-series",
    storageBucket: "icar-test-series.firebasestorage.app",
    messagingSenderId: "869939091111",
    appId: "1:869939091111:web:b38acaf892ec79ce83ad82",
    measurementId: "G-5VYBRQ0RJV"
};

const app = initializeApp(firebaseConfig);

export { app };