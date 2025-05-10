//import { messaging, getToken } from './js_components/firebase_configuration.js';
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');

function updateToggleIcon() {
  const isCollapsed = sidebar.classList.contains('collapsed');
  toggleBtn.textContent = isCollapsed ? '☰' : '✖';
}

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  updateToggleIcon();
});


document.addEventListener("DOMContentLoaded", () => {
  const contentArea = document.getElementById("content");

  function loadPage(pages) {
    contentArea.innerHTML = "<p>Loading...</p>";
  
    return fetch(pages)
      .then(res => res.text())
      .then(data => {
        contentArea.innerHTML = data;
  
        // After query.html is loaded, dynamically load query.js
        if (pages.includes("query.html")) {
          import('./js_components/query.js')
            .then(module => {
              module.loadAndRenderQueries(); // Call the exported function
            })
            .catch(err => {
              console.error("Failed to load query.js", err);
            });
        }

        if (pages.includes("latestWork.html")) {
          import('./js_components/latestWork.js')
            .then(module => {
              module.loadAndRenderProjects(); // Ensure this function is exported from latest_work.js
            })
            .catch(err => {
              console.error("Failed to load latest_work.js", err);
            });
        }

        if (pages.includes("testimonial.html")) {
          import('./js_components/testimonial.js')
            .then(module => {
              module.loadTestimonials(); // Ensure this function is exported from latest_work.js
            })
            .catch(err => {
              console.error("Failed to load latest_work.js", err);
            });
        }
  

      })
      .catch(err => {
        contentArea.innerHTML = "<p>Error loading content</p>";
        console.error(err);
      });
  }
  

  document.getElementById("link-query").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("./pages/query.html");
  });

  document.getElementById("link-work").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("./pages/latestWork.html");
  });

  document.getElementById("link-testimonials").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("./pages/testimonial.html");
  });

  // Optional: Load default page on startup
  loadPage("./pages/query.html");
});

// Install Prompt

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default install banner
  e.preventDefault();
  deferredPrompt = e;

  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return; // Don't show if already installed
  }

  // Show custom install prompt
  showInstallDialog();
});

function showInstallDialog() {
  const dialog = document.getElementById('installPrompt');
  dialog.style.display = 'block';

  document.getElementById('installBtn').addEventListener('click', async () => {
    dialog.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    }
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    dialog.style.display = 'none';
    deferredPrompt = null;
  });
}