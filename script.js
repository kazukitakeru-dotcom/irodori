/* ═══════════════════════════════════════════
   Color Capture – script.js (revised)
═══════════════════════════════════════════ */

// ── DOM refs ──
const video           = document.getElementById("video");
const canvas          = document.getElementById("captureCanvas");
const ctx             = canvas.getContext("2d", { willReadFrequently: true });

const startCameraBtn  = document.getElementById("startCameraBtn");
const imageInput      = document.getElementById("imageInput");

const colorPreview    = document.getElementById("colorPreview");
const hexValue        = document.getElementById("hexValue");
const rgbValue        = document.getElementById("rgbValue");
const hslValue        = document.getElementById("hslValue");
const colorName       = document.getElementById("colorName");

const saveColorBtn    = document.getElementById("saveColorBtn");
const savedColorsContainer = document.getElementById("savedColors");
const sortSelect      = document.getElementById("sortSelect");

const paletteDisplay  = document.getElementById("paletteDisplay");
const tapMarker       = document.getElementById("tapMarker");
const crosshair       = document.getElementById("crosshair");
const idleHint        = document.getElementById("idleHint");

const deleteModal     = document.getElementById("deleteModal");
const deleteModalPreview = document.getElementById("deleteModalPreview");
const deleteModalHex  = document.getElementById("deleteModalHex");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn  = document.getElementById("cancelDeleteBtn");

// ── State ──
let currentColor   = null;
let cameraStream   = null;
let cameraActive   = false;
let pendingDeleteIndex = null;
let imageLoaded    = false;
let animFrameId    = null;

// ── Color dictionary (Japanese names) ──
const colorDictionary = [
    { name: "ブラック",       hex: "#000000" },
    { name: "ホワイト",       hex: "#FFFFFF" },
    { name: "レッド",         hex: "#FF0000" },
    { name: "スカーレット",    hex: "#FF2400" },
    { name: "クリムゾン",      hex: "#DC143C" },
    { name: "ローズ",         hex: "#FF007F" },
    { name: "コーラル",       hex: "#FF6B6B" },
    { name: "サーモンピンク",  hex: "#FF8C8C" },
    { name: "ピンク",         hex: "#FFC0CB" },
    { name: "ホットピンク",    hex: "#FF69B4" },
    { name: "マゼンタ",       hex: "#FF00FF" },
    { name: "パープル",       hex: "#800080" },
    { name: "バイオレット",    hex: "#8B00FF" },
    { name: "インディゴ",      hex: "#4B0082" },
    { name: "ネイビー",       hex: "#000080" },
    { name: "ダークブルー",    hex: "#003366" },
    { name: "ブルー",         hex: "#0000FF" },
    { name: "ロイヤルブルー",  hex: "#4169E1" },
    { name: "コーンフラワー",  hex: "#6495ED" },
    { name: "スカイブルー",    hex: "#87CEEB" },
    { name: "ライトブルー",    hex: "#ADD8E6" },
    { name: "ティール",       hex: "#008080" },
    { name: "シアン",         hex: "#00FFFF" },
    { name: "ターコイズ",      hex: "#40E0D0" },
    { name: "アクアマリン",    hex: "#7FFFD4" },
    { name: "ミントグリーン",  hex: "#98FF98" },
    { name: "ライトグリーン",  hex: "#90EE90" },
    { name: "グリーン",       hex: "#008000" },
    { name: "ライム",         hex: "#00FF00" },
    { name: "フォレストグリーン", hex: "#228B22" },
    { name: "オリーブ",       hex: "#808000" },
    { name: "イエローグリーン", hex: "#9ACD32" },
    { name: "イエロー",       hex: "#FFFF00" },
    { name: "ゴールド",       hex: "#FFD700" },
    { name: "アンバー",       hex: "#FFBF00" },
    { name: "オレンジ",       hex: "#FFA500" },
    { name: "ダークオレンジ",  hex: "#FF8C00" },
    { name: "バーント",       hex: "#CC5500" },
    { name: "ブラウン",       hex: "#8B4513" },
    { name: "シエナ",         hex: "#A0522D" },
    { name: "タン",           hex: "#D2B48C" },
    { name: "ベージュ",       hex: "#F5F5DC" },
    { name: "クリーム",       hex: "#FFFDD0" },
    { name: "ライトグレー",    hex: "#D3D3D3" },
    { name: "シルバー",       hex: "#C0C0C0" },
    { name: "グレー",         hex: "#808080" },
    { name: "ダークグレー",    hex: "#404040" },
    { name: "チャコール",      hex: "#2D2D2D" }
];

// ══════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════

startCameraBtn.addEventListener("click", () => {
    if (cameraActive) {
        stopCamera();
    } else {
        startCamera();
    }
});

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        cameraStream  = stream;
        cameraActive  = true;
        imageLoaded   = false;

        video.srcObject = stream;
        video.style.display = "block";
        canvas.style.display = "none";
        idleHint.style.display = "none";
        crosshair.style.display = "block";
        tapMarker.classList.add("hidden");

        // Remove image click handler
        canvas.onclick = null;

        startCameraBtn.textContent = "";
        startCameraBtn.innerHTML = '<span class="btn-icon">⏹</span><span class="btn-label">カメラ停止</span>';
        startCameraBtn.classList.add("stop");

        video.addEventListener("loadedmetadata", () => {
            startRealtimeSampling();
        }, { once: true });

    } catch (error) {
        alert("カメラ起動に失敗しました:\n" + error.message);
        console.error(error);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    cameraActive = false;

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    video.srcObject = null;
    video.style.display = "block";
    canvas.style.display = "none";

    if (!imageLoaded) {
        idleHint.style.display = "flex";
    }

    crosshair.style.display = "none";

    startCameraBtn.innerHTML = '<span class="btn-icon">📷</span><span class="btn-label">カメラ開始</span>';
    startCameraBtn.classList.remove("stop");

    // Reset palette
    paletteDisplay.innerHTML = '<div class="palette-placeholder">画像を読み込むと<br>色の割合を表示します</div>';
}

function startRealtimeSampling() {

    function update() {
        if (!cameraActive) return;

        if (video.videoWidth > 0) {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const x = canvas.width / 2;
            const y = canvas.height / 2;
            sampleColor(x, y);
        }

        animFrameId = requestAnimationFrame(update);
    }

    update();
}

// ══════════════════════════════════════════
// IMAGE UPLOAD
// ══════════════════════════════════════════

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Stop camera if running
    if (cameraActive) stopCamera();

    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();

        img.onload = function() {
            canvas.width  = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            imageLoaded = true;
            video.style.display = "none";
            canvas.style.display = "block";
            idleHint.style.display = "none";
            crosshair.style.display = "none";
            tapMarker.classList.add("hidden");

            // Analyse palette
            analyzePalette();

            // Tap to sample – fix coordinate mapping
            canvas.onclick = function(ev) {
                const rect = canvas.getBoundingClientRect();

                // Correct pixel coordinates accounting for CSS scaling
                const scaleX = canvas.width  / rect.width;
                const scaleY = canvas.height / rect.height;

                const x = (ev.clientX - rect.left) * scaleX;
                const y = (ev.clientY - rect.top)  * scaleY;

                sampleColor(x, y);

                // Show tap marker at CSS position
                showTapMarker(ev.clientX - rect.left, ev.clientY - rect.top);
            };
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    imageInput.value = "";
});

function showTapMarker(cssX, cssY) {
    tapMarker.classList.remove("hidden");
    tapMarker.style.left = cssX + "px";
    tapMarker.style.top  = cssY + "px";

    // Re-trigger animation
    tapMarker.style.animation = "none";
    requestAnimationFrame(() => {
        tapMarker.style.animation = "";
    });
}

// ══════════════════════════════════════════
// COLOR SAMPLING
// ══════════════════════════════════════════

function sampleColor(x, y) {
    // Sample a small area (3×3) and average for stability
    const size  = 3;
    const half  = Math.floor(size / 2);
    const sx    = Math.max(0, Math.round(x) - half);
    const sy    = Math.max(0, Math.round(y) - half);
    const sw    = Math.min(size, canvas.width  - sx);
    const sh    = Math.min(size, canvas.height - sy);

    const data  = ctx.getImageData(sx, sy, sw, sh).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
    }

    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);

    const hex  = rgbToHex(r, g, b);
    const hsl  = rgbToHsl(r, g, b);
    const name = getNearestColorName(hex);

    currentColor = {
        hex,
        rgb:  `(${r}, ${g}, ${b})`,
        hsl:  `(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        name,
        timestamp: Date.now()
    };

    updateUI(currentColor);
}

function updateUI(color) {
    colorPreview.style.background = color.hex;

    const previewLabel = colorPreview.querySelector(".preview-label");
    if (previewLabel) previewLabel.remove();

    hexValue.textContent  = color.hex;
    rgbValue.textContent  = color.rgb;
    hslValue.textContent  = color.hsl;
    colorName.textContent = color.name;
}

// ══════════════════════════════════════════
// PALETTE ANALYSIS
// ══════════════════════════════════════════

function analyzePalette() {
    // Sample a grid of pixels and cluster into dominant colors
    const w = canvas.width;
    const h = canvas.height;

    const step   = Math.max(1, Math.floor(Math.min(w, h) / 40));
    const colors = [];

    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const d = ctx.getImageData(x, y, 1, 1).data;
            // Quantise to reduce noise
            colors.push([
                Math.round(d[0] / 16) * 16,
                Math.round(d[1] / 16) * 16,
                Math.round(d[2] / 16) * 16
            ]);
        }
    }

    // Simple frequency-based clustering
    const freq = {};
    for (const [r, g, b] of colors) {
        const key = `${r},${g},${b}`;
        freq[key] = (freq[key] || 0) + 1;
    }

    const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const total = sorted.reduce((s, [, c]) => s + c, 0);

    // Build palette UI
    paletteDisplay.innerHTML = "";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "主要カラー";
    paletteDisplay.appendChild(title);

    for (const [key, count] of sorted) {
        const [r, g, b] = key.split(",").map(Number);
        const hex   = rgbToHex(r, g, b);
        const pct   = Math.round((count / total) * 100);
        const name  = getNearestColorName(hex);

        const row   = document.createElement("div");
        row.className = "palette-bar-row";

        const bar   = document.createElement("div");
        bar.className = "palette-bar-color";
        bar.style.background = hex;
        bar.style.width = `${Math.max(pct, 8)}%`;
        bar.title = `${name} – ${hex}`;

        // Click to select this color
        bar.addEventListener("click", () => {
            currentColor = {
                hex,
                rgb:  `(${r}, ${g}, ${b})`,
                hsl:  (() => { const h = rgbToHsl(r,g,b); return `(${h.h}, ${h.s}%, ${h.l}%)`; })(),
                name,
                timestamp: Date.now()
            };
            updateUI(currentColor);
        });

        const info  = document.createElement("div");
        info.className = "palette-bar-info";
        info.innerHTML = `<span>${hex}</span><span class="palette-percentage">${pct}%</span>`;

        row.appendChild(bar);
        row.appendChild(info);
        paletteDisplay.appendChild(row);
    }
}

// ══════════════════════════════════════════
// SAVE & RENDER
// ══════════════════════════════════════════

saveColorBtn.addEventListener("click", () => {
    if (!currentColor) return;

    const saved = getSaved();
    saved.unshift({ ...currentColor, timestamp: Date.now() });
    setSaved(saved);
    renderSavedColors();
});

function getSaved() {
    return JSON.parse(localStorage.getItem("savedColors") || "[]");
}

function setSaved(arr) {
    localStorage.setItem("savedColors", JSON.stringify(arr));
}

sortSelect.addEventListener("change", renderSavedColors);

function renderSavedColors() {
    const saved  = getSaved();
    const mode   = sortSelect.value;
    const sorted = sortColors(saved, mode);

    savedColorsContainer.innerHTML = "";

    if (sorted.length === 0) {
        savedColorsContainer.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:12px 0;">まだ保存された色はありません</p>';
        return;
    }

    if (mode === "similar") {
        renderGrouped(sorted);
    } else {
        sorted.forEach((color, idx) => {
            savedColorsContainer.appendChild(makeCard(color, idx, saved));
        });
    }
}

function sortColors(arr, mode) {
    const copy = [...arr];
    switch (mode) {
        case "date-asc":
            return copy.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        case "date-desc":
            return copy.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        case "hue-asc":
            return copy.sort((a, b) => getHue(a.hex) - getHue(b.hex));
        case "hue-desc":
            return copy.sort((a, b) => getHue(b.hex) - getHue(a.hex));
        case "similar":
            return copy.sort((a, b) => getHue(a.hex) - getHue(b.hex));
        default:
            return copy;
    }
}

function getHue(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b).h;
}

function renderGrouped(sorted) {
    // Group into hue buckets
    const groups = {
        "🔴 レッド系":      [],
        "🟠 オレンジ系":    [],
        "🟡 イエロー系":    [],
        "🟢 グリーン系":    [],
        "🔵 ブルー系":      [],
        "🟣 パープル系":    [],
        "⬛ ダーク系":      [],
        "⬜ ライト系":      []
    };

    for (const color of sorted) {
        const { r, g, b } = hexToRgb(color.hex);
        const { h, s, l } = rgbToHsl(r, g, b);

        if (l < 15) {
            groups["⬛ ダーク系"].push(color);
        } else if (l > 85) {
            groups["⬜ ライト系"].push(color);
        } else if (s < 20) {
            groups["⬛ ダーク系"].push(color);
        } else if (h < 15 || h >= 345) {
            groups["🔴 レッド系"].push(color);
        } else if (h < 45) {
            groups["🟠 オレンジ系"].push(color);
        } else if (h < 75) {
            groups["🟡 イエロー系"].push(color);
        } else if (h < 165) {
            groups["🟢 グリーン系"].push(color);
        } else if (h < 255) {
            groups["🔵 ブルー系"].push(color);
        } else {
            groups["🟣 パープル系"].push(color);
        }
    }

    // Get original saved for deletion index
    const saved = getSaved();

    for (const [groupName, colors] of Object.entries(groups)) {
        if (colors.length === 0) continue;

        const label = document.createElement("div");
        label.className = "group-label";
        label.textContent = groupName;
        savedColorsContainer.appendChild(label);

        colors.forEach(color => {
            const originalIdx = saved.findIndex(s =>
                s.hex === color.hex && s.timestamp === color.timestamp
            );
            savedColorsContainer.appendChild(makeCard(color, originalIdx, saved));
        });
    }
}

function makeCard(color, originalIndex, savedArr) {
    const card = document.createElement("div");
    card.className = "savedColorCard";

    const hsl = (() => {
        const { r, g, b } = hexToRgb(color.hex);
        return rgbToHsl(r, g, b);
    })();
    const textColor = hsl.l > 55 ? "#111" : "#fff";

    card.innerHTML = `
        <div class="savedColorPreview" style="background:${color.hex}"></div>
        <div class="savedColorInfo">
            <div class="saved-color-name">${color.name}</div>
            <div>${color.hex}</div>
            <div style="opacity:0.6">${color.rgb}</div>
        </div>
        <button class="deleteBtn">削除</button>
    `;

    card.querySelector(".deleteBtn").addEventListener("click", () => {
        openDeleteModal(originalIndex, color);
    });

    // Click preview to re-select color
    card.querySelector(".savedColorPreview").addEventListener("click", () => {
        currentColor = { ...color };
        updateUI(currentColor);
    });

    return card;
}

// ══════════════════════════════════════════
// DELETE MODAL
// ══════════════════════════════════════════

function openDeleteModal(index, color) {
    pendingDeleteIndex = index;
    deleteModalPreview.style.background = color.hex;
    deleteModalHex.textContent = color.hex + " / " + color.name;
    deleteModal.classList.remove("hidden");
}

confirmDeleteBtn.addEventListener("click", () => {
    if (pendingDeleteIndex === null) return;

    const saved = getSaved();
    saved.splice(pendingDeleteIndex, 1);
    setSaved(saved);
    renderSavedColors();

    pendingDeleteIndex = null;
    deleteModal.classList.add("hidden");
});

cancelDeleteBtn.addEventListener("click", () => {
    pendingDeleteIndex = null;
    deleteModal.classList.add("hidden");
});

deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
        pendingDeleteIndex = null;
        deleteModal.classList.add("hidden");
    }
});

// ══════════════════════════════════════════
// COLOUR MATH UTILITIES
// ══════════════════════════════════════════

function rgbToHex(r, g, b) {
    return "#" + [r, g, b]
        .map(v => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function colorDistance(c1, c2) {
    // Weighted Euclidean distance (perceptual approximation)
    const rMean = (c1.r + c2.r) / 2;
    const dR = c1.r - c2.r;
    const dG = c1.g - c2.g;
    const dB = c1.b - c2.b;
    return Math.sqrt(
        (2 + rMean / 256) * dR * dR +
        4 * dG * dG +
        (2 + (255 - rMean) / 256) * dB * dB
    );
}

function getNearestColorName(hex) {
    const target = hexToRgb(hex);
    let nearest = colorDictionary[0];
    let minDistance = Infinity;

    for (const color of colorDictionary) {
        const rgb = hexToRgb(color.hex);
        const d = colorDistance(target, rgb);
        if (d < minDistance) {
            minDistance = d;
            nearest = color;
        }
    }

    return nearest.name;
}

// ══════════════════════════════════════════
// SERVICE WORKER
// ══════════════════════════════════════════

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}

// ── Init ──
renderSavedColors();
crosshair.style.display = "none";
