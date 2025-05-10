import { db, collection, getDoc, getDocs, addDoc, deleteDoc, doc, updateDoc, CLOUD_NAME, UPLOAD_PRESET } from "./firebase_configuration.js"

const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const modal = document.getElementById("modal");

openModalBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Optional: Close modal when clicking outside modal content
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

const form = document.getElementById("projectForm");
let isEditMode = false;
let editTestimonialId = null;



async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(url, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.secure_url;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = form.image.files[0];

  try {
    let imageUrl;
    if (file) {
      imageUrl = await uploadImage(file);
    }

    const testimonialData = {
      name: form.title.value,
      text: form.description.value,
      company: form.company.value,
      rating: parseFloat(form.rating.value),
      ...(imageUrl && { image: imageUrl }),
      updatedAt: new Date()
    };

    if (isEditMode && editTestimonialId) {
      const docRef = doc(db, "testimonials", editTestimonialId);
      await updateDoc(docRef, testimonialData);
      console.log("Testimonial updated!");
      alert("Testimonial updated successfully!");
      isEditMode = false;
      editTestimonialId = null;
    } else {
      if (!file) {
        alert("Please select an image for a new testimonial");
        return;
      }
      testimonialData.image = imageUrl;
      testimonialData.createdAt = new Date();

      await addDoc(collection(db, "testimonials"), testimonialData);
      console.log("Testimonial added!");
      alert("Testimonial added successfully!");
    }

    setTimeout(() => {
      modal.classList.add("hidden");
      form.reset();
    }, 500);
  } catch (err) {
    console.error("Error submitting testimonial:", err);
    alert("Failed to submit testimonial.");
  }
});


export async function loadTestimonials(testimonials) {

  const querySnapshot = await getDocs(collection(db, "testimonials"));
  const testimonial = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const wrapper = document.getElementById("testimonial-wrapper");

  wrapper.innerHTML = testimonial.map(t => {
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="${i < t.stars ? 'filled' : ''}">&#9733;</span>`
    ).join("");

    return `
      <div class="testimonial-card">
        <p class="testimonial-text">${t.text}</p>
        <div class="author">
          <div class="author-image">
            <img src="${t.image}" alt="${t.name}">
          </div>
          <div class="author-info">
            <div class="star-rating">${stars}</div>
            <h3 class="author-name">${t.name}</h3>
            <p class="company">${t.company}</p>
          </div>
        </div>
        <div class="edit">
          <button class="edit-project-btn btn" data-id="${t.id}">
            <img src="./assets/edit.png" class="edit-btn">  Edit
          </button>
         <button  class="delete btn" data-id="${t.id}">
            <img src="./assets/delete.png" class="delete-btn">
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Edit Project Card
document.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-project-btn");

  if (editBtn) {
    const projectId = editBtn.getAttribute("data-id");

    try {
      const projectRef = doc(db, "testimonials", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = projectSnap.data();

        // Set Edit Mode ON
        isEditMode = true;
        editTestimonialId = projectId;

        // Pre-fill form values
        form.title.value = projectData.name || '';
        form.description.value = projectData.text || '';
        form.company.value = projectData.company || '';
        // Image won't be displayed in file input (browser security), so no need to fill that
        form.image.removeAttribute('required'); // Make image optional when editing

        // Open modal
        modal.classList.remove('hidden');

      } else {
        alert("Project not found!");
      }
    } catch (error) {
      console.error("Error fetching project for edit:", error);
      alert("Failed to load project for editing.");
    }
  }
});


//Delete the Card

document.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".delete");

  if (deleteBtn) {
    const projectId = deleteBtn.getAttribute("data-id");

    const confirmDelete = confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "testimonials", projectId));
      alert("Project deleted!");

      // Refresh the projects UI
      await loadAndRenderProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  }
});

/*
export async function loadTestimonials() {
    const testimonials = [
        {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 3
          },
          {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 3
          },
          {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 2
          },
          {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 3
          },
          {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 2
          },
          {
            text: "This is a template Figma file, turned into code using Anima. Learn more at AnimaApp.com",
            image: "assets/Client Image.png",
            name: "Gemma Nolen",
            company: "Google",
            stars: 2
          }
    ];
  
    const wrapper = document.getElementById("testimonial-wrapper");
    wrapper.innerHTML = testimonials.map(t => {
      const stars = Array.from({ length: 5 }, (_, i) =>
        `<span class="${i < t.stars ? 'filled' : ''}">&#9733;</span>`
      ).join("");
    
      return `
        <div class="testimonial-card">
          <p class="testimonial-text">${t.text}</p>
          <div class="author">
            <div class="author-image">
              <img src="${t.image}" alt="${t.name}">
            </div>
            <div class="author-info">
              <div class="star-rating">${stars}</div>
              <h3 class="author-name">${t.name}</h3>
              <p class="company">${t.company}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }*/
  