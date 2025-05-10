// firebase-messaging-sw.js
// Use consistent Firebase version with your app
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");

// Initialize Firebase with your config
firebase.initializeApp({
  apiKey: "AIzaSyDXZM4rY5XrsWwqPKKZrhzCJm7umoOsGRA",
  authDomain: "anupam-s-portfolio.firebaseapp.com",
  projectId: "anupam-s-portfolio",
  storageBucket: "anupam-s-portfolio.firebasestorage.app",
  messagingSenderId: "886849041281",
  appId: "1:886849041281:web:b02aa30634a6ae940aae80",
  measurementId: "G-PMYBEZHF7L"
});

const messaging = firebase.messaging();

// Log service worker activation
self.addEventListener('install', function(event) {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', function(event) {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Extract notification data from either notification or data fields
  const title = payload.notification?.title || payload.data?.title || "New Contact Request";
  
  // Get body from either notification or data object
  let body;
  if (payload.notification && payload.notification.body) {
    body = payload.notification.body;
  } else if (payload.data) {
    const name = payload.data.name || "Anonymous";
    const message = payload.data.message || payload.data.query || "New contact request";
    body = `${name}: ${message}`;
  } else {
    body = "You have a new contact request";
  }
  
  // Set up notification options
  const notificationOptions = {
    body: body,
    icon: "/assets/notification-icon.png",
    badge: "/assets/badge-icon.png",
    timestamp: Date.now(), // Add timestamp for newer notifications
    vibrate: [200, 100, 200], // Vibration pattern
    actions: [
      {
        action: 'whatsapp',
        title: 'WhatsApp',
        icon: '/assets/whatsapp.png'
      },
      {
        action: 'phone',
        title: 'Call',
        icon: '/assets/telephone.png'
      },
      {
        action: 'email',
        title: 'Email',
        icon: '/assets/email.png'
      }
    ],
    data: {
      whatsapp: payload.data?.whatsapp || `https://wa.me/${payload.data?.phone?.replace(/[^0-9]/g, '')}` || "https://wa.me/1234567890",
      phone: payload.data?.phone || "tel:1234567890",
      email: payload.data?.email || "mailto:someone@example.com",
      url: payload.data?.url || "/"  // Default URL to open if no action selected
    }
  };
  
  // Show notification
  self.registration.showNotification(title, notificationOptions);
});

// Handle message from the client-side page
self.addEventListener('message', function(event) {
  console.log('[firebase-messaging-sw.js] Received client message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const data = event.data.data;
    
    const notificationOptions = {
      body: `${data.name}: ${data.message}`,
      icon: "/assets/notification-icon.png",
      badge: "/assets/badge-icon.png",
      timestamp: Date.now(),
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'whatsapp',
          title: 'WhatsApp',
          icon: '/assets/whatsapp.png'
        },
        {
          action: 'phone',
          title: 'Call',
          icon: '/assets/telephone.png'
        },
        {
          action: 'email',
          title: 'Email',
          icon: '/assets/email.png'
        }
      ],
      data: {
        whatsapp: data.whatsapp || "https://wa.me/1234567890",
        phone: data.phone || "tel:1234567890",
        email: data.email || "mailto:someone@example.com",
        url: data.url || "/"
      }
    };
    
    self.registration.showNotification(data.title || "New Notification", notificationOptions);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.action);
  
  // Close the notification
  event.notification.close();
  
  // Get data from notification
  const data = event.notification.data;
  
  // Determine which URL to open based on the action clicked
  let url;
  switch (event.action) {
    case 'whatsapp':
      url = data.whatsapp;
      break;
    case 'phone':
      url = data.phone;
      break;
    case 'email':
      url = data.email;
      break;
    default:
      // If no specific action was clicked (just the notification body)
      url = data.url || '/';
  }
  
  // Open the URL in a browser tab
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then(function(clientList) {
        // Check if there's already an open window/tab
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // If we find an open window, focus it and navigate
          if ('focus' in client) {
            client.focus();
            if (url && url !== '/') {
              // For external URLs, we need to open in a new tab
              return clients.openWindow(url);
            } else {
              // For internal URLs, navigate the existing client
              return client.navigate(url);
            }
          }
        }
        // If no open window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});