/* ═══════════════════════════════════════════
   Color Capture – script.js (v4 bugfix)
═══════════════════════════════════════════ */

// ── DOM refs (全てDOMContentLoaded後に取得) ──
let video, canvas, ctx;
let startCameraBtn, pauseCameraBtn, imageInput;
let colorPreview, hexValue, rgbValue, hslValue, colorNameEl;
let saveColorBtn, savedColorsContainer, sortSelect;
let paletteDisplay, tapMarker, crosshair, idleHint;
let deleteModal, deleteModalPreview, deleteModalHex, confirmDeleteBtn, cancelDeleteBtn;
let saveMemoModal, saveMemoPreview, saveMemoName, saveMemoInput, confirmSaveBtn, cancelSaveBtn;
let exportBtn, importInput;

// ── App state ──
let currentColor       = null;
let cameraStream       = null;
let cameraActive       = false;
let cameraPaused       = false;
let imageMode          = false;
let pendingDeleteIndex = null;
let animFrameId        = null;

// ══════════════════════════════════════════
// COLOUR DICTIONARY
// ══════════════════════════════════════════
const colorDictionary = [
    { name: "ピュアホワイト",          hex: "#FFFFFF" },
    { name: "スノーホワイト",          hex: "#FFFAFA" },
    { name: "アイボリー",              hex: "#FFFFF0" },
    { name: "クリーム",                hex: "#FFFDD0" },
    { name: "ホワイトスモーク",        hex: "#F5F5F5" },
    { name: "シーシェル",              hex: "#FFF5EE" },
    { name: "フローラルホワイト",      hex: "#FFFAF0" },
    { name: "ゴーストホワイト",        hex: "#F8F8FF" },
    { name: "ミルクホワイト",          hex: "#FDFBF6" },
    { name: "リネン",                  hex: "#FAF0E6" },
    { name: "オールドレース",          hex: "#FDF5E6" },
    { name: "ピーチパフ",              hex: "#FFDAB9" },
    { name: "ミスティローズ",          hex: "#FFE4E1" },
    { name: "ラベンダーブラッシュ",    hex: "#FFF0F5" },
    { name: "アリスブルー",            hex: "#F0F8FF" },
    { name: "アズール",                hex: "#F0FFFF" },
    { name: "ミントクリーム",          hex: "#F5FFFA" },
    { name: "ハニーデュー",            hex: "#F0FFF0" },
    { name: "ピュアブラック",          hex: "#000000" },
    { name: "チャコールブラック",      hex: "#1A1A1A" },
    { name: "ジェットブラック",        hex: "#0A0A0A" },
    { name: "オニキスブラック",        hex: "#353935" },
    { name: "オフブラック",            hex: "#242424" },
    { name: "ダークスレートグレー",    hex: "#2F4F4F" },
    { name: "チャコール",              hex: "#36454F" },
    { name: "ディムグレー",            hex: "#696969" },
    { name: "スレートグレー",          hex: "#708090" },
    { name: "ライトスレートグレー",    hex: "#778899" },
    { name: "グレー",                  hex: "#808080" },
    { name: "ダークグレー",            hex: "#A9A9A9" },
    { name: "シルバー",                hex: "#C0C0C0" },
    { name: "ライトグレー",            hex: "#D3D3D3" },
    { name: "プラチナ",                hex: "#E5E4E2" },
    { name: "アッシュグレー",          hex: "#B2BEB5" },
    { name: "スモークグレー",          hex: "#848884" },
    { name: "ガンメタル",              hex: "#2C3539" },
    { name: "スチールグレー",          hex: "#43464B" },
    { name: "パールグレー",            hex: "#C9C0BB" },
    { name: "ピュアレッド",            hex: "#FF0000" },
    { name: "スカーレット",            hex: "#FF2400" },
    { name: "クリムゾン",              hex: "#DC143C" },
    { name: "ファイアレッド",          hex: "#CE2029" },
    { name: "カーマイン",              hex: "#960018" },
    { name: "バーガンディ",            hex: "#800020" },
    { name: "ワインレッド",            hex: "#722F37" },
    { name: "マルーン",                hex: "#800000" },
    { name: "ブラッドレッド",          hex: "#660000" },
    { name: "ダークレッド",            hex: "#8B0000" },
    { name: "チェリーレッド",          hex: "#DE3163" },
    { name: "ルビーレッド",            hex: "#9B111E" },
    { name: "ガーネットレッド",        hex: "#733635" },
    { name: "ブリックレッド",          hex: "#CB4154" },
    { name: "テラコッタレッド",        hex: "#C0392B" },
    { name: "インディアンレッド",      hex: "#CD5C5C" },
    { name: "ライトコーラル",          hex: "#F08080" },
    { name: "サーモンレッド",          hex: "#FA8072" },
    { name: "トマトレッド",            hex: "#FF6347" },
    { name: "ホットピンク",            hex: "#FF69B4" },
    { name: "ディープピンク",          hex: "#FF1493" },
    { name: "ショッキングピンク",      hex: "#FC0FC0" },
    { name: "ネオンピンク",            hex: "#FF6EC7" },
    { name: "フューシャピンク",        hex: "#FF77FF" },
    { name: "ベビーピンク",            hex: "#F4C2C2" },
    { name: "ライトピンク",            hex: "#FFB6C1" },
    { name: "ペールピンク",            hex: "#FADADD" },
    { name: "ピンク",                  hex: "#FFC0CB" },
    { name: "コーラルピンク",          hex: "#F88379" },
    { name: "サーモンピンク",          hex: "#FF91A4" },
    { name: "カメオピンク",            hex: "#EFBBCC" },
    { name: "チェリーブロッサム",      hex: "#FFB7C5" },
    { name: "ダスティピンク",          hex: "#DCAE96" },
    { name: "ミレニアルピンク",        hex: "#F3CFC6" },
    { name: "ヌードピンク",            hex: "#E8C8B0" },
    { name: "プラムピンク",            hex: "#B03060" },
    { name: "ローズクォーツ",          hex: "#F7CAC9" },
    { name: "ローズ",                  hex: "#FF007F" },
    { name: "ピュアオレンジ",          hex: "#FFA500" },
    { name: "ダークオレンジ",          hex: "#FF8C00" },
    { name: "ディープオレンジ",        hex: "#FF5722" },
    { name: "バーントオレンジ",        hex: "#CC5500" },
    { name: "タンジェリン",            hex: "#F28500" },
    { name: "マンダリン",              hex: "#F37A48" },
    { name: "パーシモン",              hex: "#EC5800" },
    { name: "アンバー",                hex: "#FFBF00" },
    { name: "マリーゴールド",          hex: "#EAA221" },
    { name: "コーラルオレンジ",        hex: "#FF7F50" },
    { name: "テラコッタ",              hex: "#E2725B" },
    { name: "バーントシエナ",          hex: "#E97451" },
    { name: "アプリコット",            hex: "#FBCEB1" },
    { name: "ピュアイエロー",          hex: "#FFFF00" },
    { name: "ゴールデンイエロー",      hex: "#FFC200" },
    { name: "レモンイエロー",          hex: "#FFF44F" },
    { name: "バナナイエロー",          hex: "#FFE135" },
    { name: "カナリアイエロー",        hex: "#FFEF00" },
    { name: "ゴールド",                hex: "#FFD700" },
    { name: "ダークゴールド",          hex: "#B8860B" },
    { name: "ゴールデンロッド",        hex: "#DAA520" },
    { name: "サンフラワー",            hex: "#FFC512" },
    { name: "マスタードイエロー",      hex: "#FFDB58" },
    { name: "バターイエロー",          hex: "#FFFACD" },
    { name: "カーキイエロー",          hex: "#F0E68C" },
    { name: "イエローグリーン",        hex: "#9ACD32" },
    { name: "チャートリューズ",        hex: "#7FFF00" },
    { name: "ライムグリーン",          hex: "#32CD32" },
    { name: "ライム",                  hex: "#00FF00" },
    { name: "グリーンイエロー",        hex: "#ADFF2F" },
    { name: "スプリンググリーン",      hex: "#00FF7F" },
    { name: "オリーブグリーン",        hex: "#6B8E23" },
    { name: "ピュアグリーン",          hex: "#008000" },
    { name: "フォレストグリーン",      hex: "#228B22" },
    { name: "ダークグリーン",          hex: "#006400" },
    { name: "ジャングルグリーン",      hex: "#29AB87" },
    { name: "エメラルドグリーン",      hex: "#50C878" },
    { name: "オリーブ",                hex: "#808000" },
    { name: "ハンターグリーン",        hex: "#355E3B" },
    { name: "セージグリーン",          hex: "#8FBC8F" },
    { name: "ミントグリーン",          hex: "#98FF98" },
    { name: "ペールグリーン",          hex: "#98FB98" },
    { name: "ライトグリーン",          hex: "#90EE90" },
    { name: "ティーグリーン",          hex: "#D0F0C0" },
    { name: "アボカドグリーン",        hex: "#568203" },
    { name: "パイングリーン",          hex: "#01796F" },
    { name: "ボトルグリーン",          hex: "#006A4E" },
    { name: "シーグリーン",            hex: "#2E8B57" },
    { name: "ミディアムシーグリーン",  hex: "#3CB371" },
    { name: "ピュアシアン",            hex: "#00FFFF" },
    { name: "アクア",                  hex: "#00FFFF" },
    { name: "ライトシアン",            hex: "#E0FFFF" },
    { name: "ターコイズ",              hex: "#40E0D0" },
    { name: "ミディアムターコイズ",    hex: "#48D1CC" },
    { name: "ダークターコイズ",        hex: "#00CED1" },
    { name: "ティール",                hex: "#008080" },
    { name: "アクアマリン",            hex: "#7FFFD4" },
    { name: "ライトシーグリーン",      hex: "#20B2AA" },
    { name: "ピュアブルー",            hex: "#0000FF" },
    { name: "ミッドナイトブルー",      hex: "#191970" },
    { name: "ネイビーブルー",          hex: "#000080" },
    { name: "ダークネイビー",          hex: "#002147" },
    { name: "マリンブルー",            hex: "#01386A" },
    { name: "プルシアンブルー",        hex: "#003153" },
    { name: "サファイアブルー",        hex: "#0F52BA" },
    { name: "コバルトブルー",          hex: "#0047AB" },
    { name: "ロイヤルブルー",          hex: "#4169E1" },
    { name: "ドジャーブルー",          hex: "#1E90FF" },
    { name: "コーンフラワーブルー",    hex: "#6495ED" },
    { name: "スチールブルー",          hex: "#4682B4" },
    { name: "ライトスチールブルー",    hex: "#B0C4DE" },
    { name: "スカイブルー",            hex: "#87CEEB" },
    { name: "ライトスカイブルー",      hex: "#87CEFA" },
    { name: "ディープスカイブルー",    hex: "#00BFFF" },
    { name: "ベビーブルー",            hex: "#89CFF0" },
    { name: "ライトブルー",            hex: "#ADD8E6" },
    { name: "パウダーブルー",          hex: "#B0E0E6" },
    { name: "セルリアンブルー",        hex: "#2A52BE" },
    { name: "デニムブルー",            hex: "#1560BD" },
    { name: "カデットブルー",          hex: "#5F9EA0" },
    { name: "スレートブルー",          hex: "#6A5ACD" },
    { name: "ダークスレートブルー",    hex: "#483D8B" },
    { name: "ピュアパープル",          hex: "#800080" },
    { name: "バイオレット",            hex: "#8B00FF" },
    { name: "ダークバイオレット",      hex: "#9400D3" },
    { name: "ダークパープル",          hex: "#301934" },
    { name: "インディゴ",              hex: "#4B0082" },
    { name: "ミディアムパープル",      hex: "#9370DB" },
    { name: "ブルーバイオレット",      hex: "#8A2BE2" },
    { name: "ミディアムオーキッド",    hex: "#BA55D3" },
    { name: "オーキッド",              hex: "#DA70D6" },
    { name: "ダークオーキッド",        hex: "#9932CC" },
    { name: "プラム",                  hex: "#DDA0DD" },
    { name: "シスル",                  hex: "#D8BFD8" },
    { name: "ラベンダー",              hex: "#E6E6FA" },
    { name: "アメジスト",              hex: "#9966CC" },
    { name: "ウィステリア",            hex: "#C9A0DC" },
    { name: "ライラック",              hex: "#C8A2C8" },
    { name: "マゼンタ",                hex: "#FF00FF" },
    { name: "ダークマゼンタ",          hex: "#8B008B" },
    { name: "ムラサキ",                hex: "#6C3082" },
    { name: "ダークブラウン",          hex: "#3B1507" },
    { name: "チョコレートブラウン",    hex: "#3D1C02" },
    { name: "エスプレッソ",            hex: "#4A2512" },
    { name: "コーヒーブラウン",        hex: "#6F4E37" },
    { name: "シエナ",                  hex: "#A0522D" },
    { name: "サドルブラウン",          hex: "#8B4513" },
    { name: "バーントアンバー",        hex: "#8A3324" },
    { name: "ブラウン",                hex: "#A52A2A" },
    { name: "ライトブラウン",          hex: "#B5651D" },
    { name: "ペルー",                  hex: "#CD853F" },
    { name: "バーリーウッド",          hex: "#DEB887" },
    { name: "タン",                    hex: "#D2B48C" },
    { name: "サンディブラウン",        hex: "#F4A460" },
    { name: "ウィート",                hex: "#F5DEB3" },
    { name: "ベージュ",                hex: "#F5F5DC" },
    { name: "モカ",                    hex: "#967117" },
    { name: "カラメル",                hex: "#C68642" },
    { name: "マホガニー",              hex: "#C04000" },
    { name: "ローシエナ",              hex: "#D2691E" },
    { name: "コッパー",                hex: "#B87333" },
    { name: "ブロンズ",                hex: "#CD7F32" },
    { name: "ゴールドブラウン",        hex: "#996515" },
    { name: "ヘーゼルナッツ",          hex: "#8C6148" },
    { name: "ウォルナット",            hex: "#5C3317" },
    { name: "チェスナット",            hex: "#954535" },
    { name: "マッシュルーム",          hex: "#B5A08E" },
    { name: "タウプ",                  hex: "#483C32" },
    { name: "サンド",                  hex: "#C2B280" },
    // ── 和色 ──
    { name: "藍色",                   hex: "#165E83" },
    { name: "浅葱色",                 hex: "#00A3AF" },
    { name: "萌黄",                   hex: "#6DBB37" },
    { name: "山吹色",                 hex: "#FCB813" },
    { name: "朱色",                   hex: "#DF4040" },
    { name: "緋色",                   hex: "#CD2A1D" },
    { name: "鴇色",                   hex: "#F2A0A1" },
    { name: "桃色",                   hex: "#F2AACC" },
    { name: "茶色",                   hex: "#945116" },
    { name: "栗色",                   hex: "#7B3F00" },
    { name: "若草色",                 hex: "#7EC84B" },
    { name: "銀鼠",                   hex: "#97938A" },
    { name: "紅色",                   hex: "#E2041B" },
    { name: "橙色",                   hex: "#F08300" },
    { name: "水色",                   hex: "#A0D8EF" },
    { name: "抹茶色",                 hex: "#8DB255" },
    // ── 追加西洋色 ──
    { name: "バーミリオン",           hex: "#E34234" },
    { name: "ダークオリーブグリーン", hex: "#556B2F" },
    { name: "カーキ",                 hex: "#C3B091" },
    { name: "ペリウィンクル",         hex: "#CCCCFF" },
    { name: "ピスタチオ",             hex: "#93C572" },
    { name: "ウォームグレー",         hex: "#9B9390" },
    { name: "スモーキーグリーン",     hex: "#738276" },
    { name: "ロゼ",                   hex: "#FFAAB5" },
    { name: "ミルキーホワイト",       hex: "#F8F4E6" },
    { name: "ペールゴールド",         hex: "#E8D5A3" },
];

// ══════════════════════════════════════════
// INIT – DOMContentLoaded後に全DOM参照を取得
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    // DOM refs
    video                = document.getElementById("video");
    canvas               = document.getElementById("captureCanvas");
    ctx                  = canvas.getContext("2d", { willReadFrequently: true });

    startCameraBtn       = document.getElementById("startCameraBtn");
    pauseCameraBtn       = document.getElementById("pauseCameraBtn");
    imageInput           = document.getElementById("imageInput");

    colorPreview         = document.getElementById("colorPreview");
    hexValue             = document.getElementById("hexValue");
    rgbValue             = document.getElementById("rgbValue");
    hslValue             = document.getElementById("hslValue");
    colorNameEl          = document.getElementById("colorName");

    saveColorBtn         = document.getElementById("saveColorBtn");
    savedColorsContainer = document.getElementById("savedColors");
    sortSelect           = document.getElementById("sortSelect");

    paletteDisplay       = document.getElementById("paletteDisplay");
    tapMarker            = document.getElementById("tapMarker");
    crosshair            = document.getElementById("crosshair");
    idleHint             = document.getElementById("idleHint");

    deleteModal          = document.getElementById("deleteModal");
    deleteModalPreview   = document.getElementById("deleteModalPreview");
    deleteModalHex       = document.getElementById("deleteModalHex");
    confirmDeleteBtn     = document.getElementById("confirmDeleteBtn");
    cancelDeleteBtn      = document.getElementById("cancelDeleteBtn");

    saveMemoModal        = document.getElementById("saveMemoModal");
    saveMemoPreview      = document.getElementById("saveMemoPreview");
    saveMemoName         = document.getElementById("saveMemoName");
    saveMemoInput        = document.getElementById("saveMemoInput");
    confirmSaveBtn       = document.getElementById("confirmSaveBtn");
    cancelSaveBtn        = document.getElementById("cancelSaveBtn");

    exportBtn            = document.getElementById("exportBtn");
    importInput          = document.getElementById("importInput");

    // null チェック（デバッグ用）
    const required = { startCameraBtn, pauseCameraBtn, imageInput, colorPreview,
        hexValue, rgbValue, hslValue, colorNameEl, saveColorBtn,
        savedColorsContainer, sortSelect, paletteDisplay, tapMarker,
        crosshair, idleHint, deleteModal, deleteModalPreview,
        deleteModalHex, confirmDeleteBtn, cancelDeleteBtn,
        saveMemoModal, saveMemoPreview, saveMemoName, saveMemoInput,
        confirmSaveBtn, cancelSaveBtn, exportBtn, importInput };

    for (const [name, el] of Object.entries(required)) {
        if (!el) console.error("Missing element:", name);
    }

    // 初期状態
    pauseCameraBtn.style.display = "none";
    crosshair.style.display      = "none";

    // イベント登録
    startCameraBtn.addEventListener("click", () => {
        if (cameraActive) stopCamera(); else startCamera();
    });

    pauseCameraBtn.addEventListener("click", () => {
        if (!cameraActive) return;
        if (cameraPaused) resumeCamera(); else pauseCamera();
    });

    imageInput.addEventListener("change", onImageSelected);
    saveColorBtn.addEventListener("click", onSaveColor);
    sortSelect.addEventListener("change", renderSavedColors);
    confirmDeleteBtn.addEventListener("click", onConfirmDelete);
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    deleteModal.addEventListener("click", e => { if (e.target === deleteModal) closeDeleteModal(); });

    confirmSaveBtn.addEventListener("click", onConfirmSave);
    cancelSaveBtn.addEventListener("click", closeSaveMemoModal);
    saveMemoModal.addEventListener("click", e => { if (e.target === saveMemoModal) closeSaveMemoModal(); });
    saveMemoInput.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirmSave(); } });

    exportBtn.addEventListener("click", exportColors);
    importInput.addEventListener("change", onImport);

    // 初期描画
    renderSavedColors();
});

// ══════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        cameraStream  = stream;
        cameraActive  = true;
        cameraPaused  = false;
        imageMode     = false;

        video.srcObject      = stream;
        video.style.display  = "block";
        canvas.style.display = "none";
        canvas.onclick       = null;
        idleHint.style.display   = "none";
        crosshair.style.display  = "block";
        tapMarker.classList.add("hidden");

        startCameraBtn.innerHTML = '<span class="btn-icon">⏹</span><span class="btn-label">カメラ停止</span>';
        startCameraBtn.classList.add("stop");
        pauseCameraBtn.style.display = "flex";
        pauseCameraBtn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-label">一時停止</span>';
        pauseCameraBtn.classList.remove("active");

        video.addEventListener("loadedmetadata", startRealtimeSampling, { once: true });

    } catch (err) {
        alert("カメラ起動に失敗しました:\n" + err.message);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    cameraActive  = false;
    cameraPaused  = false;
    imageMode     = false;

    video.srcObject      = null;
    video.style.display  = "block";
    canvas.style.display = "none";
    canvas.onclick       = null;
    crosshair.style.display   = "none";
    tapMarker.classList.add("hidden");
    idleHint.style.display    = "flex";

    startCameraBtn.innerHTML = '<span class="btn-icon">📷</span><span class="btn-label">カメラ開始</span>';
    startCameraBtn.classList.remove("stop");
    pauseCameraBtn.style.display = "none";

    paletteDisplay.innerHTML = '<div class="palette-placeholder">画像を読み込むと<br>色の割合を表示します</div>';
}

function pauseCamera() {
    cameraPaused = true;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }

    // 現フレームをcanvasに焼き付け
    if (video.videoWidth > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    video.style.display  = "none";
    canvas.style.display = "block";
    crosshair.style.display = "none";

    canvas.onclick = function(ev) {
        const rect   = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        sampleColor((ev.clientX - rect.left) * scaleX, (ev.clientY - rect.top) * scaleY);
        showTapMarker(ev.clientX - rect.left, ev.clientY - rect.top);
    };

    pauseCameraBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-label">再開</span>';
    pauseCameraBtn.classList.add("active");

    analyzePalette();
}

function resumeCamera() {
    cameraPaused       = false;
    canvas.onclick     = null;
    tapMarker.classList.add("hidden");
    video.style.display  = "block";
    canvas.style.display = "none";
    crosshair.style.display = "block";

    pauseCameraBtn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-label">一時停止</span>';
    pauseCameraBtn.classList.remove("active");

    startRealtimeSampling();
}

function startRealtimeSampling() {
    function update() {
        if (!cameraActive || cameraPaused) return;
        if (video.videoWidth > 0) {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            sampleColor(canvas.width / 2, canvas.height / 2);
        }
        animFrameId = requestAnimationFrame(update);
    }
    update();
}

// ══════════════════════════════════════════
// IMAGE UPLOAD
// ══════════════════════════════════════════

function onImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    // カメラを完全停止
    if (cameraActive) stopCamera();

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            canvas.width  = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            imageMode            = true;
            video.style.display  = "none";
            canvas.style.display = "block";
            idleHint.style.display   = "none";
            crosshair.style.display  = "none";
            tapMarker.classList.add("hidden");

            startCameraBtn.innerHTML = '<span class="btn-icon">📷</span><span class="btn-label">カメラ開始</span>';
            startCameraBtn.classList.remove("stop");
            pauseCameraBtn.style.display = "none";

            analyzePalette();

            canvas.onclick = function(ev) {
                const rect   = canvas.getBoundingClientRect();
                const scaleX = canvas.width  / rect.width;
                const scaleY = canvas.height / rect.height;
                sampleColor((ev.clientX - rect.left) * scaleX, (ev.clientY - rect.top) * scaleY);
                showTapMarker(ev.clientX - rect.left, ev.clientY - rect.top);
            };
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
}

// ══════════════════════════════════════════
// TAP MARKER
// ══════════════════════════════════════════

function showTapMarker(cssX, cssY) {
    tapMarker.classList.add("hidden");
    requestAnimationFrame(() => {
        tapMarker.style.left = cssX + "px";
        tapMarker.style.top  = cssY + "px";
        tapMarker.classList.remove("hidden");
    });
}

// ══════════════════════════════════════════
// COLOUR SAMPLING
// ══════════════════════════════════════════

function sampleColor(x, y) {
    const size = 5, half = Math.floor(size / 2);
    const sx = Math.max(0, Math.round(x) - half);
    const sy = Math.max(0, Math.round(y) - half);
    const sw = Math.min(size, canvas.width  - sx);
    const sh = Math.min(size, canvas.height - sy);

    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
        rSum += data[i]; gSum += data[i+1]; bSum += data[i+2]; count++;
    }

    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);

    const hex  = rgbToHex(r, g, b);
    const hsl  = rgbToHsl(r, g, b);
    const name = getNearestColorName(hex);

    currentColor = { hex, rgb: `(${r}, ${g}, ${b})`, hsl: `(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, name, timestamp: Date.now() };
    updateUI(currentColor);
}

function updateUI(color) {
    colorPreview.style.background = color.hex;
    const lbl = colorPreview.querySelector(".preview-label");
    if (lbl) lbl.remove();
    hexValue.textContent    = color.hex;
    rgbValue.textContent    = color.rgb;
    hslValue.textContent    = color.hsl;
    colorNameEl.textContent = color.name;
}

// ══════════════════════════════════════════
// PALETTE ANALYSIS
// ══════════════════════════════════════════

function analyzePalette() {
    const w = canvas.width, h = canvas.height;
    const step = Math.max(1, Math.floor(Math.min(w, h) / 40));
    const freq = {};

    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const d   = ctx.getImageData(x, y, 1, 1).data;
            const key = `${Math.round(d[0]/16)*16},${Math.round(d[1]/16)*16},${Math.round(d[2]/16)*16}`;
            freq[key] = (freq[key] || 0) + 1;
        }
    }

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const total  = sorted.reduce((s, [, c]) => s + c, 0);

    paletteDisplay.innerHTML = "";
    const title = document.createElement("div");
    title.className   = "panel-title";
    title.textContent = "主要カラー";
    paletteDisplay.appendChild(title);

    for (const [key, count] of sorted) {
        const [r, g, b] = key.split(",").map(Number);
        const hex  = rgbToHex(r, g, b);
        const pct  = Math.round((count / total) * 100);
        const name = getNearestColorName(hex);

        const row  = document.createElement("div");
        row.className = "palette-bar-row";

        const bar  = document.createElement("div");
        bar.className        = "palette-bar-color";
        bar.style.background = hex;
        bar.style.width      = `${Math.max(pct, 8)}%`;
        bar.title            = `${name} – ${hex}`;
        bar.addEventListener("click", () => {
            const h2 = rgbToHsl(r, g, b);
            currentColor = { hex, rgb: `(${r}, ${g}, ${b})`, hsl: `(${h2.h}, ${h2.s}%, ${h2.l}%)`, name, timestamp: Date.now() };
            updateUI(currentColor);
        });

        const info = document.createElement("div");
        info.className   = "palette-bar-info";
        info.innerHTML   = `<span>${hex}</span><span class="palette-percentage">${pct}%</span>`;

        row.appendChild(bar);
        row.appendChild(info);
        paletteDisplay.appendChild(row);
    }
}

// ══════════════════════════════════════════
// SAVE / RENDER
// ══════════════════════════════════════════

function onSaveColor() {
    if (!currentColor) return;
    openSaveMemoModal();
}

function openSaveMemoModal() {
    saveMemoPreview.style.background = currentColor.hex;
    saveMemoName.textContent         = currentColor.name;
    saveMemoInput.value              = "";
    const saveMemoHexEl = document.getElementById("saveMemoHex");
    if (saveMemoHexEl) saveMemoHexEl.textContent = currentColor.hex;
    saveMemoModal.classList.remove("hidden");
    setTimeout(() => saveMemoInput.focus(), 100);
}

function closeSaveMemoModal() {
    saveMemoModal.classList.add("hidden");
    saveMemoInput.value = "";
}

function onConfirmSave() {
    if (!currentColor) return;
    const memo  = saveMemoInput.value.trim();
    const saved = getSaved();
    saved.unshift({ ...currentColor, memo, timestamp: Date.now() });
    setSaved(saved);
    renderSavedColors();
    closeSaveMemoModal();
}

function exportColors() {
    const saved = getSaved();
    if (saved.length === 0) { alert("保存された色がありません"); return; }
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `color-capture-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function onImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("フォーマットが正しくありません");
            const saved = getSaved();
            const existingTs = new Set(saved.map(c => c.timestamp));
            const newColors  = imported.filter(c => c.hex && !existingTs.has(c.timestamp));
            const merged     = [...newColors, ...saved];
            setSaved(merged);
            renderSavedColors();
            alert(`${newColors.length}件の色をインポートしました`);
        } catch (err) {
            alert("インポートに失敗しました: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

function saveMemo(index, memo) {
    const saved = getSaved();
    if (index >= 0 && index < saved.length) {
        saved[index].memo = memo;
        setSaved(saved);
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getSaved() { return JSON.parse(localStorage.getItem("savedColors") || "[]"); }
function setSaved(arr) { localStorage.setItem("savedColors", JSON.stringify(arr)); }

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
        renderGrouped(sorted, saved);
    } else {
        sorted.forEach(color => {
            const origIdx = saved.findIndex(s => s.hex === color.hex && s.timestamp === color.timestamp);
            savedColorsContainer.appendChild(makeCard(color, origIdx));
        });
    }
}

function sortColors(arr, mode) {
    const copy = [...arr];
    switch (mode) {
        case "date-asc":  return copy.sort((a, b) => (a.timestamp||0) - (b.timestamp||0));
        case "date-desc": return copy.sort((a, b) => (b.timestamp||0) - (a.timestamp||0));
        case "hue-asc":   return copy.sort((a, b) => getHue(a.hex) - getHue(b.hex));
        case "hue-desc":  return copy.sort((a, b) => getHue(b.hex) - getHue(a.hex));
        case "similar":   return copy.sort((a, b) => getHue(a.hex) - getHue(b.hex));
        default:          return copy;
    }
}

function getHue(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b).h;
}

function renderGrouped(sorted, saved) {
    const groups = {
        "🔴 レッド系":   [],
        "🩷 ピンク系":   [],
        "🟠 オレンジ系": [],
        "🤎 ブラウン系": [],
        "🟡 イエロー系": [],
        "🟢 グリーン系": [],
        "🔵 ブルー系":   [],
        "🟣 パープル系": [],
        "⬛ ダーク系":   [],
        "⬜ ライト系":   [],
    };

    for (const color of sorted) {
        const { r, g, b } = hexToRgb(color.hex);
        const { h, s, l } = rgbToHsl(r, g, b);

        if      (l < 18)                              groups["⬛ ダーク系"].push(color);
        else if (l > 82 || s < 12)                    groups["⬜ ライト系"].push(color);
        else if (h >= 10 && h < 40 && l < 55)         groups["🤎 ブラウン系"].push(color);
        else if ((h >= 340 || h < 10) && s > 30)      groups["🔴 レッド系"].push(color);
        else if (h >= 290 && h < 340)                 groups["🩷 ピンク系"].push(color);
        else if (h >= 10 && h < 45)                   groups["🟠 オレンジ系"].push(color);
        else if (h >= 45 && h < 75)                   groups["🟡 イエロー系"].push(color);
        else if (h >= 75 && h < 165)                  groups["🟢 グリーン系"].push(color);
        else if (h >= 165 && h < 260)                 groups["🔵 ブルー系"].push(color);
        else                                          groups["🟣 パープル系"].push(color);
    }

    for (const [groupName, colors] of Object.entries(groups)) {
        if (colors.length === 0) continue;
        const label = document.createElement("div");
        label.className   = "group-label";
        label.textContent = groupName;
        savedColorsContainer.appendChild(label);
        colors.forEach(color => {
            const origIdx = saved.findIndex(s => s.hex === color.hex && s.timestamp === color.timestamp);
            savedColorsContainer.appendChild(makeCard(color, origIdx));
        });
    }
}

function makeCard(color, originalIndex) {
    const card = document.createElement("div");
    card.className = "savedColorCard";

    const hslStr = color.hsl || (() => {
        const { r, g, b } = hexToRgb(color.hex);
        const { h, s, l } = rgbToHsl(r, g, b);
        return `(${h}, ${s}%, ${l}%)`;
    })();

    const memoText = color.memo ? escapeHtml(color.memo) : "";

    card.innerHTML = `
        <div class="savedColorPreview" style="background:${color.hex}" title="クリックで選択"></div>
        <div class="savedColorInfo">
            <div class="saved-color-name">${color.name}</div>
            <div class="card-info-row"><span class="card-label">HEX</span><span>${color.hex}</span></div>
            <div class="card-info-row"><span class="card-label">RGB</span><span class="card-val-muted">${color.rgb}</span></div>
            <div class="card-info-row"><span class="card-label">HSL</span><span class="card-val-muted">${hslStr}</span></div>
        </div>
        <div class="card-memo" contenteditable="false" data-placeholder="📝 メモを追加...">${memoText}</div>
        <button class="deleteBtn">削除</button>
    `;

    const memoEl = card.querySelector(".card-memo");

    memoEl.addEventListener("click", () => {
        memoEl.contentEditable = "true";
        memoEl.focus();
        const range = document.createRange();
        range.selectNodeContents(memoEl);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });

    memoEl.addEventListener("blur", () => {
        memoEl.contentEditable = "false";
        saveMemo(originalIndex, memoEl.textContent.trim());
    });

    memoEl.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); memoEl.blur(); }
        if (e.key === "Escape") { memoEl.blur(); }
    });

    card.querySelector(".savedColorPreview").addEventListener("click", () => {
        currentColor = { ...color };
        updateUI(currentColor);
    });

    card.querySelector(".deleteBtn").addEventListener("click", () => {
        openDeleteModal(originalIndex, color);
    });

    return card;
}

// ══════════════════════════════════════════
// DELETE MODAL
// ══════════════════════════════════════════

function openDeleteModal(index, color) {
    pendingDeleteIndex               = index;
    deleteModalPreview.style.background = color.hex;
    deleteModalHex.textContent       = `${color.hex}　${color.name}`;
    deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
    pendingDeleteIndex = null;
    deleteModal.classList.add("hidden");
}

function onConfirmDelete() {
    if (pendingDeleteIndex === null) return;
    const saved = getSaved();
    saved.splice(pendingDeleteIndex, 1);
    setSaved(saved);
    renderSavedColors();
    closeDeleteModal();
}

// ══════════════════════════════════════════
// COLOUR MATH
// ══════════════════════════════════════════

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function hexToRgb(hex) {
    const c = hex.replace("#", "");
    return { r: parseInt(c.substring(0,2),16), g: parseInt(c.substring(2,4),16), b: parseInt(c.substring(4,6),16) };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g-b)/d + (g<b?6:0); break;
            case g: h = (b-r)/d + 2; break;
            case b: h = (r-g)/d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function colorDistance(c1, c2) {
    const rMean = (c1.r + c2.r) / 2;
    const dR = c1.r-c2.r, dG = c1.g-c2.g, dB = c1.b-c2.b;
    return Math.sqrt((2+rMean/256)*dR*dR + 4*dG*dG + (2+(255-rMean)/256)*dB*dB);
}

function getNearestColorName(hex) {
    const target = hexToRgb(hex);
    let nearest = colorDictionary[0], minDist = Infinity;
    for (const color of colorDictionary) {
        const d = colorDistance(target, hexToRgb(color.hex));
        if (d < minDist) { minDist = d; nearest = color; }
    }
    return nearest.name;
}

// ── Service Worker ──
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}