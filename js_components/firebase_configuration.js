// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, deleteDoc, updateDoc, getDocs, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDXZM4rY5XrsWwqPKKZrhzCJm7umoOsGRA",
  authDomain: "anupam-s-portfolio.firebaseapp.com",
  projectId: "anupam-s-portfolio",
  storageBucket: "anupam-s-portfolio.firebasestorage.app",
  messagingSenderId: "886849041281",
  appId: "1:886849041281:web:b02aa30634a6ae940aae80",
  measurementId: "G-PMYBEZHF7L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

const CLOUD_NAME = 'dqhroqlaa';
const UPLOAD_PRESET = 'my_unsigned_preset';

// Add to firebase-config.js
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Get the base URL for the current GitHub Pages repository
      const baseUrl = window.location.pathname.replace(/\/[^\/]*$/, '/');
      const swPath = './firebase-messaging-sw.js';
      
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('ServiceWorker registration successful');
      return registration;
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  }
  return null;
}

// Call this before using the service worker
await registerServiceWorker();

// Request permission and get FCM token
async function requestPermission() {
  const permission = await Notification.requestPermission();
  if(permission === "granted"){
    console.log("You granted for the notification");
    try {
      const token = await getToken(messaging, { 
        vapidKey: "BOvoqZNfVjeNAF6D_P5MV24J7j3qQ5bS_clo5wYjs1J3DwYnzc2P54t_ZUR5fP3QwG_gaOwIeTOs_N_7TG4imBA",
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('./firebase-messaging-sw.js')
      });
      console.log('✅ FCM Token:', token);
    } catch (error) {
      console.error('Error getting token:', error);
    }
  } else if(permission === "denied"){
    console.log("you denied for the notification");
  }
}

// Listen for foreground messages
onMessage(messaging, async (payload) => {
  console.log("📩 Foreground message", payload);
  
  // Ensure service worker is ready
  const registration = await navigator.serviceWorker.ready;
  
  const title = payload.data?.title || "New Notification";
  const name = payload.data?.name || "Anonymous";
  const message = payload.data?.message || "No message provided";
  
  registration.showNotification(title, {
    body: `${name}: ${message}`,
    icon: './assets/notification-icon.png',
    actions: [
      { action: 'whatsapp', title: 'WhatsApp', icon: './assets/whatsapp.png' },
      { action: 'phone', title: 'Call', icon: './assets/telephone.png' },
      { action: 'email', title: 'Email', icon: './assets/email.png' }
    ],
    data: {
      whatsapp: payload.data?.whatsapp || "https://wa.me/1234567890",
      phone: payload.data?.phone || "tel:1234567890",
      email: payload.data?.email || "mailto:someone@example.com"
    }
  });
});

// Real-time Firestore listener for new users
async function listenForNewQueries() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("timestamp", "desc"), limit(1));
  
  let lastDocId = null;
  let isFirstRun = true;
  
  try {
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        
        if (change.type === "added" && change.doc.id !== lastDocId) {
          if (!isFirstRun) {
            const name = docData.name || "New User";
            const message = docData.query || "A new user submitted their information";
            const phone = docData.phone || docData.phoneNumber || "";
            const email = docData.email || docData.emailAddress || "";
            
            const whatsappLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
            const phoneLink = `tel:${phone}`;
            const emailLink = `mailto:${email}`;
            
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                  title: "New Contact Request",
                  body: message,
                  name: name,
                  message: message,
                  whatsapp: whatsappLink,
                  phone: phoneLink,
                  email: emailLink
                }
              });
            } else {
              // Fallback without actions if service worker isn't available
              if (Notification.permission === "granted") {
                new Notification(`New message from ${name}`, {
                  body: message,
                  icon: "./assets/query.png"
                });
              }
            }
          }
          
          lastDocId = change.doc.id;
        }
      });
      
      isFirstRun = false;
    });
  } catch (error) {
    console.error("Error setting up Firestore listener:", error);
  }
}

// Initialize
requestPermission();
listenForNewQueries();

// Export Firestore + Cloudinary vars
export { 
  db, 
  collection, 
  getDoc, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  CLOUD_NAME, 
  UPLOAD_PRESET 
};