const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const fileName = document.getElementById("fileName");

const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const originalText = document.getElementById("originalText");
const resultText = document.getElementById("resultText");
const resultTitle = document.getElementById("resultTitle");

const bwMode = document.getElementById("bwMode");
const hdMode = document.getElementById("hdMode");
const mode2k = document.getElementById("2kMode");
const mode4k = document.getElementById("4kMode");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const sharpness = document.getElementById("sharpness");
const sharpnessBox = document.getElementById("sharpnessBox");

const resetBtn = document.getElementById("resetBtn");
const removeBtn = document.getElementById("removeBtn");
const downloadBtn = document.getElementById("downloadBtn");

let selectedImage = null;
let currentMode = null;

// ================================
// UPLOAD IMAGE
// ================================

uploadArea.addEventListener("click", function () {
imageInput.click();
});

imageInput.addEventListener("change", function (event) {

const file = event.target.files[0];

if (!file) {
    return;
}

if (!file.type.startsWith("image/")) {
    alert("Please select a valid image.");
    return;
}

selectedImage = file;

fileName.textContent = file.name;

const imageURL = URL.createObjectURL(file);

originalImage.src = imageURL;

originalImage.onload = function () {

    originalImage.classList.remove("hidden");
    originalText.classList.add("hidden");

    resultImage.src = imageURL;
    resultImage.classList.remove("hidden");
    resultText.classList.add("hidden");

    processImage();
};
});

// ================================
// MODE SELECTION
// ================================

function selectMode(mode, button) {

if (!selectedImage) {
    alert("Please upload an image first.");
    return;
}

currentMode = mode;

// Remove selected style from all buttons
document.querySelectorAll(".mode-btn").forEach(function (btn) {

    btn.classList.remove(
        "bg-blue-600",
        "text-white",
        "border-blue-600"
    );

    btn.classList.add(
        "bg-white",
        "text-gray-800",
        "border-gray-300"
    );

});


// Add selected style
button.classList.remove(
    "bg-white",
    "text-gray-800",
    "border-gray-300"
);

button.classList.add(
    "bg-blue-600",
    "text-white",
    "border-blue-600"
);


// Sharpness only for HD / 2K / 4K
if (mode === "bw") {

    sharpnessBox.classList.add("hidden");
    resultTitle.textContent = "Black & White Result";

} else {

    sharpnessBox.classList.remove("hidden");

    if (mode === "hd") {
        resultTitle.textContent = "HD 1080p Result";
    }

    if (mode === "2k") {
        resultTitle.textContent = "2K 1440p Result";
    }

    if (mode === "4k") {
        resultTitle.textContent = "4K 2160p Result";
    }

}


processImage();
}

// Buttons
bwMode.addEventListener("click", function () {
selectMode("bw", bwMode);
});

hdMode.addEventListener("click", function () {
selectMode("hd", hdMode);
});

mode2k.addEventListener("click", function () {
selectMode("2k", mode2k);
});

mode4k.addEventListener("click", function () {
selectMode("4k", mode4k);
});

// ================================
// PROCESS IMAGE
// ================================

function processImage() {

if (!selectedImage || !currentMode) {
    return;
}

const img = new Image();

img.onload = function () {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let targetWidth = img.naturalWidth;
    let targetHeight = img.naturalHeight;


    // ================================
    // HD / 2K / 4K
    // ================================

    if (currentMode !== "bw") {

        let targetHeightValue = 1080;

        if (currentMode === "2k") {
            targetHeightValue = 1440;
        }

        if (currentMode === "4k") {
            targetHeightValue = 2160;
        }


        const ratio = img.naturalWidth / img.naturalHeight;

        targetHeight = targetHeightValue;
        targetWidth = Math.round(targetHeight * ratio);

    }


    canvas.width = targetWidth;
    canvas.height = targetHeight;


    // Brightness + Contrast
    ctx.filter =
        `brightness(${brightness.value}%) contrast(${contrast.value}%)`;


    ctx.drawImage(
        img,
        0,
        0,
        targetWidth,
        targetHeight
    );


    // Reset filter
    ctx.filter = "none";


    // ================================
    // BLACK & WHITE
    // ================================

    if (currentMode === "bw") {

        const imageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const data = imageData.data;


        for (let i = 0; i < data.length; i += 4) {

            const gray =
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;

        }


        ctx.putImageData(imageData, 0, 0);

    }


    // ================================
    // SHARPEN HD / 2K / 4K
    // ================================

    if (currentMode !== "bw" && Number(sharpness.value) > 0) {

        applySharpen(
            ctx,
            canvas.width,
            canvas.height,
            Number(sharpness.value)
        );

    }


    resultImage.src = canvas.toDataURL("image/png");

    resultImage.classList.remove("hidden");
    resultText.classList.add("hidden");

};


img.src = URL.createObjectURL(selectedImage);

}

// ================================
// SHARPEN
// ================================

function applySharpen(ctx, width, height, amount) {

const imageData = ctx.getImageData(
    0,
    0,
    width,
    height
);

const data = imageData.data;

const copy = new Uint8ClampedArray(data);

const strength = amount / 100;


for (let y = 1; y < height - 1; y++) {

    for (let x = 1; x < width - 1; x++) {

        const index = (y * width + x) * 4;

        const top = ((y - 1) * width + x) * 4;
        const bottom = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;


        for (let c = 0; c < 3; c++) {

            const sharpened =
                5 * copy[index + c]
                - copy[top + c]
                - copy[bottom + c]
                - copy[left + c]
                - copy[right + c];

            data[index + c] =
                copy[index + c] * (1 - strength)
                + sharpened * strength;

        }

    }

}

ctx.putImageData(imageData, 0, 0);

}

// ================================
// BRIGHTNESS / CONTRAST / SHARPNESS
// ================================

brightness.addEventListener("input", processImage);
contrast.addEventListener("input", processImage);
sharpness.addEventListener("input", processImage);

// ================================
// RESET
// ================================

resetBtn.addEventListener("click", function () {

brightness.value = 100;
contrast.value = 100;
sharpness.value = 30;

currentMode = null;

document.querySelectorAll(".mode-btn").forEach(function (btn) {

    btn.classList.remove(
        "bg-blue-600",
        "text-white",
        "border-blue-600"
    );

    btn.classList.add(
        "bg-white",
        "text-gray-800",
        "border-gray-300"
    );

});

sharpnessBox.classList.remove("hidden");

resultTitle.textContent = "Result";

if (selectedImage) {
    resultImage.src = originalImage.src;
}


});

// ================================
// REMOVE IMAGE
// ================================

removeBtn.addEventListener("click", function () {


selectedImage = null;
currentMode = null;

imageInput.value = "";

fileName.textContent = "No image selected";

originalImage.src = "";
resultImage.src = "";

originalImage.classList.add("hidden");
resultImage.classList.add("hidden");

originalText.classList.remove("hidden");
resultText.classList.remove("hidden");

resultTitle.textContent = "Result";

brightness.value = 100;
contrast.value = 100;
sharpness.value = 30;

document.querySelectorAll(".mode-btn").forEach(function (btn) {

    btn.classList.remove(
        "bg-blue-600",
        "text-white",
        "border-blue-600"
    );

    btn.classList.add(
        "bg-white",
        "text-gray-800",
        "border-gray-300"
    );

});

});

// ================================
// DOWNLOAD
// ================================

downloadBtn.addEventListener("click", function () {


if (!selectedImage) {
    alert("Please upload an image first.");
    return;
}

if (!currentMode) {
    alert("Please select a mode first.");
    return;
}

const link = document.createElement("a");

link.href = resultImage.src;


if (currentMode === "bw") {
    link.download = "MonoPix-Black-White.png";
}

if (currentMode === "hd") {
    link.download = "MonoPix-HD-1080p.png";
}

if (currentMode === "2k") {
    link.download = "MonoPix-2K-1440p.png";
}

if (currentMode === "4k") {
    link.download = "MonoPix-4K-2160p.png";
}


link.click();

});
