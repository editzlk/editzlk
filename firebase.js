import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const fileInput = document.getElementById("fileInput");
const uploadButton = document.querySelector(".upload-btn");
const progressBar = document.getElementById("progress");
const percentText = document.getElementById("uploadPercent");
const statusText = document.getElementById("status");

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function setStatus(message, type = "") {
  if (!statusText) return;
  statusText.className = type ? `upload-status ${type}` : "upload-status";
  statusText.innerHTML = message;
}

function uploadOne(file, batchId, onProgress) {
  return new Promise((resolve, reject) => {
    const storagePath = `client_uploads/${batchId}/${Date.now()}_${safeName(file.name)}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      customMetadata: { originalName: file.name, batchId }
    });

    task.on("state_changed", snapshot => {
      onProgress(snapshot.bytesTransferred, snapshot.totalBytes);
    }, reject, async () => {
      try {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "clientUploads"), {
          batchId,
          originalName: file.name,
          storagePath,
          downloadURL,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: serverTimestamp(),
          status: "new"
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

window.uploadFiles = async function uploadFiles() {
  const files = Array.from(fileInput?.files || []);
  if (!files.length) {
    setStatus('<i class="fa-solid fa-triangle-exclamation"></i> Please choose at least one file.', "error");
    return;
  }

  uploadButton.disabled = true;
  const batchId = `${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  const completedBytes = new Map();
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  const updateOverallProgress = (index, transferred) => {
    completedBytes.set(index, transferred);
    const sent = [...completedBytes.values()].reduce((a, b) => a + b, 0);
    const progress = totalBytes ? Math.min(100, (sent / totalBytes) * 100) : 100;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${Math.round(progress)}%`;
  };

  try {
    setStatus('<i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> Uploading securely… Keep this tab open.', "working");
    // Sequential uploads are more stable for very large files and slower connections.
    for (let i = 0; i < files.length; i++) {
      await uploadOne(files[i], batchId, (sent) => updateOverallProgress(i, sent));
      completedBytes.set(i, files[i].size);
    }
    setStatus(`<i class="fa-solid fa-circle-check"></i> ${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully.`, "success");
    if (progressBar) progressBar.style.width = "100%";
    if (percentText) percentText.textContent = "100%";
    fileInput.value = "";
    document.getElementById("fileList")?.replaceChildren();
  } catch (error) {
    console.error(error);
    setStatus(`<i class="fa-solid fa-circle-xmark"></i> Upload failed: ${error.message}`, "error");
  } finally {
    uploadButton.disabled = false;
  }
};
