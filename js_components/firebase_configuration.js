// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, deleteDoc, updateDoc, getDocs, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging.js";

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
const VAPID_KEY = "BOvoqZNfVjeNAF6D_P5MV24J7j3qQ5bS_clo5wYjs1J3DwYnzc2P54t_ZUR5fP3QwG_gaOwIeTOs_N_7TG4imBA";

// Register service worker with correct scope
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Make sure to register the service worker at the root level for proper scope
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      return registration;
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
      return null;
    }
  }
  return null;
}

// Request notification permission and get FCM token
async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted");
      
      // Make sure service worker is registered first
      const swRegistration = await registerServiceWorker();
      
      if (!swRegistration) {
        console.error("Failed to register service worker");
        return null;
      }
      
      // Get FCM token with the service worker registration
      try {
        const tokenOptions = { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration
        };
        
        const token = await getToken(messaging, tokenOptions);
        
        if (token) {
          console.log('✅ FCM Token:', token);
          
          // Store token in Firestore for server-side use
          try {
            const tokensRef = collection(db, "fcmTokens");
            await addDoc(tokensRef, {
              token: token,
              timestamp: new Date(),
              deviceInfo: navigator.userAgent
            });
            console.log("Token saved to Firestore");
          } catch (err) {
            console.error("Failed to save token:", err);
          }
          
          return token;
        } else {
          console.warn("No FCM token received");
          return null;
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
      }
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

// Listen for foreground messages
function setupForegroundMessageListener() {
  onMessage(messaging, (payload) => {
    console.log("📩 Foreground message received:", payload);
    
    // Extract notification data
    const title = payload.notification?.title || payload.data?.title || "New Notification";
    const name = payload.data?.name || "Anonymous";
    const message = payload.notification?.body || payload.data?.message || "No message provided";
    
    // Create notification options
    const notificationOptions = {
      body: message,
      icon: '/assets/notification-icon.png',
      badge: '/assets/badge-icon.png',
      actions: [
        { action: 'whatsapp', title: 'WhatsApp', icon: '/assets/whatsapp.png' },
        { action: 'phone', title: 'Call', icon: '/assets/telephone.png' },
        { action: 'email', title: 'Email', icon: '/assets/email.png' }
      ],
      data: {
        whatsapp: payload.data?.whatsapp || `https://wa.me/${payload.data?.phone?.replace(/[^0-9]/g, '')}`,
        phone: payload.data?.phone || "tel:1234567890",
        email: payload.data?.email || "mailto:someone@example.com"
      }
    };
    
    // Show notification using the Notifications API directly
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, notificationOptions);
      });
    }
  });
}

// Real-time Firestore listener for new contact requests
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
                  icon: "/assets/query.png"
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

// Initialize all notification components
async function initializeNotifications() {
  try {
    await requestPermission();
    setupForegroundMessageListener();
    listenForNewQueries();
    console.log("Notification system initialized successfully");
  } catch (error) {
    console.error("Failed to initialize notification system:", error);
  }
}

// Start the notification system
initializeNotifications();

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
  UPLOAD_PRESET,
  requestPermission 
};