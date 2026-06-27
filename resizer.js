// iOS App Icon Resizer — canvas-based, entirely in-browser, no upload.

// All required iOS app icon sizes (name, pixel size, scale, usage)
const ICON_SIZES = [
  // iPhone
  { name: "Icon-20@2x",   px: 40,   usage: "iPhone Notification 20pt @2x"   },
  { name: "Icon-20@3x",   px: 60,   usage: "iPhone Notification 20pt @3x"   },
  { name: "Icon-29@1x",   px: 29,   usage: "iPhone Settings 29pt @1x"       },
  { name: "Icon-29@2x",   px: 58,   usage: "iPhone Settings 29pt @2x"       },
  { name: "Icon-29@3x",   px: 87,   usage: "iPhone Settings 29pt @3x"       },
  { name: "Icon-40@2x",   px: 80,   usage: "iPhone Spotlight 40pt @2x"      },
  { name: "Icon-40@3x",   px: 120,  usage: "iPhone Spotlight 40pt @3x"      },
  { name: "Icon-60@2x",   px: 120,  usage: "iPhone App 60pt @2x"            },
  { name: "Icon-60@3x",   px: 180,  usage: "iPhone App 60pt @3x"            },
  // iPad
  { name: "Icon-20@1x",   px: 20,   usage: "iPad Notification 20pt @1x"     },
  { name: "Icon-20@2x-pad", px: 40, usage: "iPad Notification 20pt @2x"     },
  { name: "Icon-29@1x-pad", px: 29, usage: "iPad Settings 29pt @1x"         },
  { name: "Icon-29@2x-pad", px: 58, usage: "iPad Settings 29pt @2x"         },
  { name: "Icon-40@1x",   px: 40,   usage: "iPad Spotlight 40pt @1x"        },
  { name: "Icon-40@2x-pad", px: 80, usage: "iPad Spotlight 40pt @2x"        },
  { name: "Icon-76@1x",   px: 76,   usage: "iPad App 76pt @1x"              },
  { name: "Icon-76@2x",   px: 152,  usage: "iPad App 76pt @2x"              },
  { name: "Icon-83.5@2x", px: 167,  usage: "iPad Pro App 83.5pt @2x"        },
  // App Store
  { name: "Icon-1024",    px: 1024, usage: "App Store 1024pt @1x"           },
];

let loadedImage = null;

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
  if (file) loadFile(file);
}

function handleFileInput(e) {
  const file = e.target.files?.[0];
  if (file) loadFile(file);
}

function loadFile(file) {
  if (!file.type.startsWith("image/")) {
    showError("Please drop a PNG or JPEG image.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      showPreview(img, file.name);
    };
    img.onerror = () => showError("Could not load the image.");
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showPreview(img, filename) {
  const dropZone = document.getElementById("dropZone");
  const preview  = document.getElementById("preview");
  const canvas   = document.getElementById("previewCanvas");

  const SIZE = 200;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, 0, 0, SIZE, SIZE);

  document.getElementById("previewFilename").textContent = filename;
  const { width: w, height: h } = img;
  const ok = w >= 1024 && h >= 1024;
  const qualityEl = document.getElementById("previewQuality");
  qualityEl.textContent = ok
    ? `${w}×${h}px — excellent source (1024×1024 or larger recommended)`
    : `${w}×${h}px — source is smaller than 1024×1024; icons may look soft`;
  qualityEl.className = "quality-badge " + (ok ? "ok" : "warn");

  dropZone.style.display = "none";
  preview.style.display  = "block";
  document.getElementById("generateBtn").style.display = "block";
  document.getElementById("output").style.display = "none";
}

function resetDropZone() {
  loadedImage = null;
  document.getElementById("dropZone").style.display  = "";
  document.getElementById("preview").style.display   = "none";
  document.getElementById("generateBtn").style.display = "none";
  document.getElementById("output").style.display    = "none";
}

function generateIcons() {
  if (!loadedImage) return;
  const container = document.getElementById("iconsGrid");
  container.innerHTML = "";

  const roundCorners = document.getElementById("roundCorners").checked;

  ICON_SIZES.forEach(({ name, px, usage }) => {
    const canvas = document.createElement("canvas");
    canvas.width  = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");

    if (roundCorners) {
      const r = px * 0.2237; // iOS continuous corner radius (~22.37%)
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(px - r, 0);
      ctx.quadraticCurveTo(px, 0, px, r);
      ctx.lineTo(px, px - r);
      ctx.quadraticCurveTo(px, px, px - r, px);
      ctx.lineTo(r, px);
      ctx.quadraticCurveTo(0, px, 0, px - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(loadedImage, 0, 0, px, px);

    const previewSize = Math.min(64, px);
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width  = previewSize;
    previewCanvas.height = previewSize;
    const pctx = previewCanvas.getContext("2d");
    pctx.drawImage(canvas, 0, 0, previewSize, previewSize);

    const card = document.createElement("div");
    card.className = "icon-card";
    card.innerHTML = `
      <div class="icon-thumb-wrap">
        <img class="icon-thumb" src="${previewCanvas.toDataURL()}" width="${previewSize}" height="${previewSize}" />
      </div>
      <div class="icon-meta">
        <div class="icon-name">${name}.png</div>
        <div class="icon-size">${px}×${px}px</div>
        <div class="icon-usage">${usage}</div>
      </div>
      <button class="dl-btn" onclick="downloadIcon(this)" data-canvas-id="${name}">↓ Download</button>
    `;
    card.dataset.canvasData = canvas.toDataURL("image/png");
    container.appendChild(card);
  });

  document.getElementById("output").style.display = "block";
  document.getElementById("output").scrollIntoView({ behavior: "smooth", block: "start" });
}

function downloadIcon(btn) {
  const card = btn.closest(".icon-card");
  const dataUrl = card.dataset.canvasData;
  const name = btn.dataset.canvasId;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name + ".png";
  a.click();
  btn.textContent = "Downloaded!";
  setTimeout(() => { btn.textContent = "↓ Download"; }, 1500);
}

function downloadAll() {
  // Download each icon with a 80ms gap to avoid browser blocking
  const cards = document.querySelectorAll(".icon-card");
  cards.forEach((card, i) => {
    setTimeout(() => {
      const btn = card.querySelector(".dl-btn");
      downloadIcon(btn);
    }, i * 80);
  });
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 4000);
}
