// query.js
import { db, collection, getDocs} from "./firebase_configuration.js";

let allQueries = [];
let currentPage = 1;
const cardsPerPage = 5;

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "N/A";
  
  const date = timestamp.toDate(); // Firestore Timestamp to JS Date
  return date.toLocaleDateString("en-GB", {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadAndRenderQueries() {
  const cardsContainer = document.getElementById("cards");
  const pageIndicator = document.getElementById("pageIndicator");

  if (!cardsContainer || !pageIndicator) return;

  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    allQueries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    currentPage = 1;
    renderPage();
  } catch (err) {
    console.error("Error loading queries:", err);
    cardsContainer.innerHTML = "<p>Error loading queries.</p>";
  }
}

function renderPage() {
  const cardsContainer = document.getElementById("cards");
  const pageIndicator = document.getElementById("pageIndicator");

  const start = (currentPage - 1) * cardsPerPage;
  const end = start + cardsPerPage;
  const currentCards = allQueries.slice(start, end);

  if (currentCards.length === 0) {
    cardsContainer.innerHTML = "<p>No queries found.</p>";
  } else {
    cardsContainer.innerHTML = currentCards.map(user => `
      <div class="card">
        <div class="user-details">
          <h3>${user.name}</h3>

          <p>
          
          <strong>Phone: +91</strong> 
          <a href="tel:${user.contact}" target="_blank" class="clickable">
            ${user.contact}
          </a>
          </p>

           <p>
          <strong>Email:</strong> 
          <a href="mailto:${user.email}" target="_blank" class="clickable">
            ${user.email}
          </a>
          </p>

          <p><strong>Message : </strong>${user.query}
          <div class="contact-link">
             <a href="tel: +91 ${user.contact}" target="_blank"><img src="assets/telephone.png" class="card-icon"></a>
             <a href="mailto:${user.email}" target="_blank"><img src="assets/gmail.png" class="card-icon"></a>
             <a href="https://wa.me/+91${user.contact}" target="_blank"><img src="assets/whatsapp.png" class="card-icon"></a>
          </div>
          </div>
          <div class="time-stamp">${formatDate(user.timestamp)}</div>
        </div>
    `).join('');
  }

  pageIndicator.textContent = `Page ${currentPage} of ${Math.ceil(allQueries.length / cardsPerPage)}`;
}

window.prevPage = function () {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
};

window.nextPage = function () {
  if (currentPage < Math.ceil(allQueries.length / cardsPerPage)) {
    currentPage++;
    renderPage();
  }
};

// Export this function to be called from main.js
export { loadAndRenderQueries };
