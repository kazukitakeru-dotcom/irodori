const video = document.getElementById("video");
const canvas = document.getElementById("captureCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const startCameraBtn = document.getElementById("startCameraBtn");
const imageInput = document.getElementById("imageInput");

const colorPreview = document.getElementById("colorPreview");
const hexValue = document.getElementById("hexValue");
const rgbValue = document.getElementById("rgbValue");
const hslValue = document.getElementById("hslValue");
const colorName = document.getElementById("colorName");

const saveColorBtn = document.getElementById("saveColorBtn");
const savedColorsContainer = document.getElementById("savedColors");

let currentColor = null;

const colorDictionary = [
    { name: "ブラック", hex: "#000000" },
    { name: "ホワイト", hex: "#FFFFFF" },
    { name: "レッド", hex: "#FF0000" },
    { name: "グリーン", hex: "#00FF00" },
    { name: "ブルー", hex: "#0000FF" },
    { name: "イエロー", hex: "#FFFF00" },
    { name: "オレンジ", hex: "#FFA500" },
    { name: "ピンク", hex: "#FFC0CB" },
    { name: "パープル", hex: "#800080" },
    { name: "ブラウン", hex: "#8B4513" },
    { name: "ネイビー", hex: "#000080" },
    { name: "ダークブルー", hex: "#003366" },
    { name: "スカイブルー", hex: "#87CEEB" },
    { name: "ライトグリーン", hex: "#90EE90" },
    { name: "グレー", hex: "#808080" }
];

startCameraBtn.addEventListener("click", startCamera);

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            }
        });

        video.srcObject = stream;

        video.addEventListener("loadedmetadata", () => {
            startRealtimeSampling();
        });

    } catch (error) {
        alert("カメラ起動に失敗しました");
        console.error(error);
    }
}

function startRealtimeSampling() {

    function update() {

        if (video.videoWidth > 0) {

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const x = canvas.width / 2;
            const y = canvas.height / 2;

            sampleColor(x, y);
        }

        requestAnimationFrame(update);
    }

    update();
}

function sampleColor(x, y) {

    const pixel = ctx.getImageData(x, y, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    const nearestName = getNearestColorName(hex);

    currentColor = {
        hex,
        rgb: `(${r}, ${g}, ${b})`,
        hsl: `(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        name: nearestName
    };

    updateUI(currentColor);
}

function updateUI(color) {

    colorPreview.style.background = color.hex;

    hexValue.textContent = color.hex;
    rgbValue.textContent = color.rgb;
    hslValue.textContent = color.hsl;
    colorName.textContent = color.name;
}

function rgbToHex(r, g, b) {

    return "#" + [r, g, b]
        .map(v => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function rgbToHsl(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h, s, l;

    l = (max + min) / 2;

    if (max === min) {

        h = s = 0;

    } else {

        const d = max - min;

        s = l > 0.5
            ? d / (2 - max - min)
            : d / (max + min);

        switch (max) {

            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;

            case g:
                h = (b - r) / d + 2;
                break;

            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hexToRgb(hex) {

    const clean = hex.replace("#", "");

    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function colorDistance(c1, c2) {

    return Math.sqrt(
        (c1.r - c2.r) ** 2 +
        (c1.g - c2.g) ** 2 +
        (c1.b - c2.b) ** 2
    );
}

function getNearestColorName(hex) {

    const target = hexToRgb(hex);

    let nearest = colorDictionary[0];
    let minDistance = Infinity;

    for (const color of colorDictionary) {

        const rgb = hexToRgb(color.hex);

        const distance = colorDistance(target, rgb);

        if (distance < minDistance) {

            minDistance = distance;
            nearest = color;
        }
    }

    return nearest.name;
}

saveColorBtn.addEventListener("click", () => {

    if (!currentColor) return;

    const saved = JSON.parse(localStorage.getItem("savedColors") || "[]");

    saved.unshift(currentColor);

    localStorage.setItem("savedColors", JSON.stringify(saved));

    renderSavedColors();
});

function renderSavedColors() {

    const saved = JSON.parse(localStorage.getItem("savedColors") || "[]");

    savedColorsContainer.innerHTML = "";

    saved.forEach((color, index) => {

        const card = document.createElement("div");
        card.className = "savedColorCard";

        card.innerHTML = `
            <div class="savedColorPreview" style="background:${color.hex}"></div>

            <div class="savedColorInfo">
                <div>${color.name}</div>
                <div>${color.hex}</div>
                <div>${color.rgb}</div>
            </div>

            <button class="deleteBtn">削除</button>
        `;

        card.querySelector(".deleteBtn").addEventListener("click", () => {

            saved.splice(index, 1);

            localStorage.setItem("savedColors", JSON.stringify(saved));

            renderSavedColors();
        });

        savedColorsContainer.appendChild(card);
    });
}

imageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const img = new Image();

        img.onload = function() {

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            video.style.display = "none";
            canvas.style.display = "block";

            canvas.onclick = function(ev) {

                const rect = canvas.getBoundingClientRect();

                const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
                const y = (ev.clientY - rect.top) * (canvas.height / rect.height);

                sampleColor(x, y);
            };
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
});

if ("serviceWorker" in navigator) {

    navigator.serviceWorker.register("service-worker.js");
}

renderSavedColors();
