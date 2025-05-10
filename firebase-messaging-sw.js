// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

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

// Handle background messages from FCM
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const title = payload.data?.title || "New Contact Request";
  const name = payload.data?.name || "Anonymous";
  const message = payload.data?.query || "No message provided";
  const whatsapp = payload.data?.whatsapp || "https://wa.me/1234567890";
  const phone = payload.data?.phone || "tel:1234567890";
  const email = payload.data?.email || "mailto:someone@example.com";
  
  const notificationOptions = {
    body: `${name}: ${message}`,
    icon: "assets/notification-icon.png",
    actions: [
      {
        action: 'whatsapp',
        title: 'WhatsApp',
        icon: 'assets/whatsapp.png'
      },
      {
        action: 'phone',
        title: 'Call',
        icon: 'assets/telephone.png'
      },
      {
        action: 'email',
        title: 'Email',
        icon: 'assets/email.png'
      }
    ],
    data: {
      whatsapp: whatsapp,
      phone: phone,
      email: email
    }
  };
  
  self.registration.showNotification(title, notificationOptions);
});

// Handle message from the client-side page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const data = event.data.data;
    
    const notificationOptions = {
      body: `${data.name}: ${data.message}`,
      icon: "assets/notification-icon.png",
      actions: [
        {
          action: 'whatsapp',
          title: 'WhatsApp',
          icon: 'assets/whatsapp.png'
        },
        {
          action: 'phone',
          title: 'Call',
          icon: 'assets/telephone.png'
        },
        {
          action: 'email',
          title: 'Email',
          icon: 'assets/email.png'
        }
      ],
      data: {
        whatsapp: data.whatsapp,
        phone: data.phone,
        email: data.email
      }
    };
    
    self.registration.showNotification(data.title || "New Notification", notificationOptions);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data;
  
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
      url = '/';
  }
  
  event.waitUntil(clients.openWindow(url));
});