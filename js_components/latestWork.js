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

  const form = document.getElementById("projectForm");
  let isEditMode = false;
  let editProjectId = null;

/*Add New Project*/

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const file = form.image.files[0];
  
    try {
      let imageUrl;
      if (file) {
        imageUrl = await uploadImage(file);
      }
  
      const projectData = {
        title: form.title.value,
        description: form.description.value,
        github: form.github.value,
        live: form.live.value,
        ...(imageUrl && { image: imageUrl }), // Only update image if new one selected
        updatedAt: new Date()
      };

        if (isEditMode && editProjectId) {
          const projectRef = doc(db, "projects", editProjectId);
          await updateDoc(projectRef, projectData);
          console.log("Project updated!");
          alert("Project updated successfully!");
          setTimeout(() => {
            modal.classList.add('hidden');
            form.reset();
          }, 500);
        } else {
          if (!file) {
            alert("Please select an image for a new project");
            return;
          }
          projectData.image = imageUrl;
          projectData.createdAt = new Date();
          await addDoc(collection(db, "projects"), projectData);
          console.log("Project added!");
          alert("Project added successfully!");
          setTimeout(() => {
            modal.classList.add('hidden');
            form.reset();
          }, 500);
          isEditMode = false;
          editProjectId = null;
          await loadAndRenderProjects();
          
    } 
  }
    catch (err) {
      console.error("Error adding project:", err);
      alert("Failed to add project.");
    }
  });

  
export async function loadAndRenderProjects(){
  const querySnapshot = await getDocs(collection(db, "projects"));
  const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const container = document.getElementById("projects-container");
  container.innerHTML = projects.map(project => `
    <div class="project-card" data-id="${project.id}">
      <img src="${project.image}" alt="Project" class="project-image" />
      <div class="project-info">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-categories">${project.description}</p>
        <div class="repos">
          <a href="${project.github}" target="_blank"><img src="./assets/github.png" class="card-icon git"></a>
          <a href="${project.live}" target="_blank" class="live">LIVE LINK</a>
        </div> 
        <div class="edit">
          <button class="view btn"><img src="./assets/view.png" class="view-btn">  View</button>
          <button class="edit-project-btn btn" data-id="${project.id}">
            <img src="./assets/edit.png" class="edit-btn">  Edit
          </button>
         <button  class="delete btn" data-id="${project.id}">
            <img src="./assets/delete.png" class="delete-btn">
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

//  View Modal 
document.addEventListener("click", (e) => {
  if (e.target.closest(".view")) {
    const card = e.target.closest(".project-card");
    const title = card.querySelector(".project-title").textContent;
    const description = card.querySelector(".project-categories").textContent;
    const image = card.querySelector("img.project-image").src;
   
    // Fill the view modal
    document.getElementById("viewTitle").textContent = title;
    document.getElementById("viewDescription").textContent = description;
    document.getElementById("viewImage").src = image;

    // Show the modal
    document.getElementById("viewModal").classList.remove("hidden");
  }
});

// Close modal
document.getElementById("closeViewModal").addEventListener("click", () => {
  document.getElementById("viewModal").classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("viewModal")) {
    document.getElementById("viewModal").classList.add("hidden");
  }
});


// Edit Project Card
document.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-project-btn");

  if (editBtn) {
    const projectId = editBtn.getAttribute("data-id");

    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = projectSnap.data();

        // Set Edit Mode ON
        isEditMode = true;
        editProjectId = projectId;

        // Pre-fill form values
        form.title.value = projectData.title || '';
        form.description.value = projectData.description || '';
        form.github.value = projectData.github || '';
        form.live.value = projectData.live || '';

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
      await deleteDoc(doc(db, "projects", projectId));
      alert("Project deleted!");

      // Refresh the projects UI
      await loadAndRenderProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  }
});
