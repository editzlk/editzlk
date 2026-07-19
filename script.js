/* =====================================
   EDITZ LK - script.js
===================================== */

// ==============================
// Progress Loader + Click To Enter
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById("loader");
    const enterButton = document.getElementById("enter-site");
    const progressBar = document.getElementById("progress-bar");
    const percentText = document.getElementById("percent");
    const loaderText = document.querySelector(".loader-text");

    // Required elements check
    if (!loader || !enterButton) {
        console.error("Loader or enter button not found.");
        return;
    }

    // Prevent website scrolling before entering
    document.body.classList.remove("site-open");
    document.body.style.overflow = "hidden";

    // Disable clicking until loading finishes
    enterButton.disabled = true;
    enterButton.classList.add("loading");

    if (loaderText) {
        loaderText.textContent = "LOADING...";
    }

    let value = 0;

    const loadingInterval = setInterval(() => {

        value++;

        if (progressBar) {
            progressBar.style.width = `${value}%`;
        }

        if (percentText) {
            percentText.textContent = `${value}%`;
        }

        if (value >= 100) {

            clearInterval(loadingInterval);

            // Enable click after loading
            enterButton.disabled = false;
            enterButton.classList.remove("loading");
            enterButton.classList.add("ready");

            if (loaderText) {
                loaderText.textContent = "CLICK TO ENTER";
            }
        }

    }, 20);

    // ==============================
    // Open Website
    // ==============================

    enterButton.addEventListener("click", () => {

        // Do nothing until loading finishes
        if (value < 100) {
            return;
}
        const music = document.getElementById("background-music");

    if (music) {
        music.volume = 0.35;
        music.play().catch(err => console.log(err));
    }

        // Prevent multiple clicks
        enterButton.disabled = true;

        // Start exit animation
        loader.classList.add("loader-hide");
        document.body.classList.add("site-open");
        document.body.style.overflow = "";

        // Remove loader after animation
        setTimeout(() => {
            loader.remove();
        }, 1000);

    });

});

const music = document.getElementById("background-music");
const playPause = document.getElementById("playPause");
const volumeSlider = document.getElementById("volumeSlider");
const volumeIcon = document.getElementById("volumeIcon");
const volumeValue = document.getElementById("volumeValue");

if (music && playPause && volumeSlider) {

    // Default Volume
    music.volume = Number(volumeSlider.value) / 100;

    // ==========================
    // Update Play Icon
    // ==========================

    function updatePlayIcon() {

        playPause.innerHTML = music.paused
            ? '<i class="fa-solid fa-play"></i>'
            : '<i class="fa-solid fa-pause"></i>';

    }

    // ==========================
    // Update Volume
    // ==========================

    function updateVolumeUI() {

        const volume = Number(volumeSlider.value);

        music.volume = volume / 100;

        if (volumeValue) {
            volumeValue.textContent = `${volume}%`;
        }

        if (!volumeIcon) return;

        if (volume === 0) {

            volumeIcon.className =
                "fa-solid fa-volume-xmark";

        } else if (volume < 50) {

            volumeIcon.className =
                "fa-solid fa-volume-low";

        } else {

            volumeIcon.className =
                "fa-solid fa-volume-high";

        }

    }

    // ==========================
    // Play / Pause
    // ==========================

    playPause.addEventListener("click", async () => {

        try {

            if (music.paused) {

                await music.play();

            } else {

                music.pause();

            }

            updatePlayIcon();

        } catch (err) {

            console.error(err);

        }

    });

    // ==========================
    // Volume Slider
    // ==========================

    volumeSlider.addEventListener("input", updateVolumeUI);

    // ==========================
    // Auto Update
    // ==========================

    music.addEventListener("play", updatePlayIcon);
    music.addEventListener("pause", updatePlayIcon);

    updatePlayIcon();
    updateVolumeUI();

}

const musicPlayer =
document.getElementById("musicPlayer");

const volumePanel =
document.getElementById("volumePanel");

if (musicPlayer && volumePanel) {
    musicPlayer.addEventListener("click", (e) => {
        if (e.target.closest("#playPause")) return;
        volumePanel.classList.toggle("open");
    });
}

// ======================================
// Mobile Navigation + Active Link
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const header = document.querySelector("header");

    const sections = document.querySelectorAll("section[id]");
    const navItems = document.querySelectorAll(".nav-links a");

    // ======================================
    // Helper: Close Mobile Menu
    // ======================================

    function closeMobileMenu() {

        if (!menuBtn || !navLinks) return;

        menuBtn.classList.remove("active");
        navLinks.classList.remove("active");

        document.body.classList.remove("menu-open");

        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open navigation menu");
    }

    // ======================================
    // Mobile Menu Toggle
    // ======================================

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", (event) => {

            event.stopPropagation();

            const isOpen = navLinks.classList.toggle("active");

            menuBtn.classList.toggle("active", isOpen);
            document.body.classList.toggle("menu-open", isOpen);

            menuBtn.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            menuBtn.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );

        });

        // Prevent nav clicks from triggering outside click
        navLinks.addEventListener("click", (event) => {
            event.stopPropagation();
        });

    }

    // ======================================
    // Close Menu When Link Is Clicked
    // ======================================

    navItems.forEach((link) => {

        link.addEventListener("click", () => {

            closeMobileMenu();

        });

    });

    // ======================================
    // Close Menu When Clicking Outside
    // ======================================

    document.addEventListener("click", () => {

        closeMobileMenu();

    });

    // ======================================
    // Close Menu With Escape Key
    // ======================================

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeMobileMenu();
        }

    });

    // ======================================
    // Header Scroll Effect
    // ======================================

    function updateHeader() {

        if (!header) return;

        header.classList.toggle(
            "header-scrolled",
            window.scrollY > 50
        );

    }

    // ======================================
    // Active Navigation Link
    // ======================================

    function updateActiveNavigation() {

        let currentSection = "";

        sections.forEach((section) => {

            const sectionTop = section.offsetTop - 150;
            const sectionBottom =
                sectionTop + section.offsetHeight;

            if (
                window.scrollY >= sectionTop &&
                window.scrollY < sectionBottom
            ) {
                currentSection = section.id;
            }

        });

        // Set Home active at the top
        if (window.scrollY < 100 && sections.length > 0) {
            currentSection = sections[0].id;
        }

        navItems.forEach((link) => {

            const linkTarget = link.getAttribute("href");

            link.classList.toggle(
                "active",
                linkTarget === `#${currentSection}`
            );

        });

    }

    // ======================================
    // Combined Scroll Handler
    // ======================================

    function handleScroll() {

        updateHeader();
        updateActiveNavigation();

    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
        passive: true
    });

    // ======================================
    // Close Mobile Menu On Desktop Resize
    // ======================================

    window.addEventListener("resize", () => {

        if (window.innerWidth > 991) {
            closeMobileMenu();
        }

    });

});

document.querySelector(".nav-links")

// ==============================
// Reveal Animation
// ==============================

const revealElements = document.querySelectorAll(
    ".card, .portfolio-card, .about p, .section-title, .download-card, .downloads-heading"
);

const reveal = () => {

    const trigger = window.innerHeight * 0.85;

    revealElements.forEach(el => {

        const top = el.getBoundingClientRect().top;

        if (top < trigger) {

            el.style.opacity = "1";
            el.style.transform = "translateY(0px)";

        }

    });

};

revealElements.forEach(el => {

    el.style.opacity = "0";
    el.style.transform = "translateY(60px)";
    el.style.transition = ".7s ease";

});

window.addEventListener("scroll", reveal);
window.addEventListener("load", reveal);

// ==============================
// Smooth Scroll
// ==============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function(e){

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        target.scrollIntoView({

            behavior:"smooth"

        });

    });

});

// ==============================
// Button Glow Effect
// ==============================

const buttons = document.querySelectorAll(".btn");

buttons.forEach(btn => {

    btn.addEventListener("mouseenter", () => {

        btn.style.boxShadow =
        "0 0 20px #8b5cf6,0 0 40px #00e5ff";

    });

    btn.addEventListener("mouseleave", () => {

        btn.style.boxShadow = "none";

    });

});

// ======================================
// Premium Hero Floating Animation
// ======================================

const heroImage = document.querySelector(".hero-image img");

if (heroImage) {

    let start = null;

    function animate(time) {

        if (!start) start = time;

        const elapsed = (time - start) / 1000;

        const y = Math.sin(elapsed * 1.2) * 12;
        const rotate = Math.sin(elapsed * 0.8) * 2;
        const scale = 1 + Math.sin(elapsed * 1.2) * 0.015;

        heroImage.style.transform =
            `translateY(${y}px)
             rotate(${rotate}deg)
             scale(${scale})`;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

}

// ==============================
// Contact Form
// ==============================

const form = document.querySelector(".contact form");
if (form) {
    form.addEventListener("submit", () => {
        alert("Your message is being sent...");
    });
}

// ==============================
// Scroll To Top Button
// ==============================

const topBtn = document.createElement("button");

topBtn.innerHTML = "↑";

topBtn.id = "topBtn";

document.body.appendChild(topBtn);

topBtn.style.position = "fixed";
topBtn.style.right = "25px";
topBtn.style.bottom = "100px";
topBtn.style.width = "50px";
topBtn.style.height = "50px";
topBtn.style.borderRadius = "50%";
topBtn.style.border = "none";
topBtn.style.background = "#8b5cf6";
topBtn.style.color = "#fff";
topBtn.style.fontSize = "20px";
topBtn.style.cursor = "pointer";
topBtn.style.display = "none";
topBtn.style.zIndex = "999";

window.addEventListener("scroll",()=>{

    if(window.scrollY>500){

        topBtn.style.display="block";

    }else{

        topBtn.style.display="none";

    }

});

topBtn.onclick=()=>{

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

// ==============================
// Console Message
// ==============================

console.log("%cEDITZ LK",
"color:#00e5ff;font-size:30px;font-weight:bold;");

console.log("Website Developed for EDITZ LK");

// =====================================
// Aggressive Selected File Preview
// =====================================

const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const uploadButton = document.querySelector(".upload-btn");
const statusText = document.getElementById("status");

if (fileInput && fileList) {
    fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files);

        fileList.innerHTML = "";

        if (files.length === 0) {
            fileList.classList.remove("files-selected");

            if (statusText) {
                statusText.textContent = "No files selected";
            }

            if (uploadButton) {
                uploadButton.disabled = true;
            }

            return;
        }

        fileList.classList.add("files-selected");

        files.forEach((file, index) => {
            const fileCard = document.createElement("div");
            fileCard.className = "selected-file-card";

            const preview = createFilePreview(file);

            fileCard.innerHTML = `
                <div class="file-preview">
                    ${preview}
                </div>

                <div class="selected-file-info">
                    <span class="selected-badge">
                        <i class="fa-solid fa-bolt"></i>
                        READY TO UPLOAD
                    </span>

                    <h4>${escapeHTML(file.name)}</h4>

                    <div class="file-meta">
                        <span>
                            <i class="fa-solid fa-hard-drive"></i>
                            ${formatFileSize(file.size)}
                        </span>

                        <span>
                            <i class="fa-solid fa-file"></i>
                            ${escapeHTML(file.type || "Unknown type")}
                        </span>
                    </div>
                </div>

                <div class="selected-check">
                    <i class="fa-solid fa-check"></i>
                </div>
            `;

            fileCard.style.animationDelay = `${index * 0.08}s`;

            fileList.appendChild(fileCard);

            if (file.type.startsWith("image/")) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const image = fileCard.querySelector(".preview-image");

                    if (image) {
                        image.src = event.target.result;
                    }
                };

                reader.readAsDataURL(file);
            }
        });

        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.classList.add("ready");
        }

        if (statusText) {
            statusText.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                ${files.length} file${files.length > 1 ? "s" : ""}
                selected and ready to upload
            `;
        }
    });
}

function createFilePreview(file) {
    if (file.type.startsWith("image/")) {
        return `
            <img
                class="preview-image"
                src=""
                alt="Selected file preview"
            >
        `;
    }

    if (file.type.startsWith("video/")) {
        return `
            <i class="fa-solid fa-video file-type-icon"></i>
        `;
    }

    return `
        <i class="fa-solid fa-file file-type-icon"></i>
    `;
}

function formatFileSize(bytes) {
    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(2)} ${units[index]}`;
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value;

    return element.innerHTML;
}

// =====================================
// Music Preview
// =====================================
