/* =========================
   DOM取得
========================= */
const startPage   = document.getElementById('startPage');
const scanPage    = document.getElementById('scanPage');
const paymentPage = document.getElementById('paymentPage');

const startBtn    = document.getElementById('startBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const backBtn     = document.getElementById('backBtn');
const resetBtn    = document.getElementById('resetBtn');

const video   = document.getElementById('video');
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const message = document.getElementById('message');
const display = document.getElementById('itemDisplay');
const totalDisplay = document.getElementById('total');
const paymentTotal = document.getElementById('paymentTotal');

const beep = document.getElementById('beepSound');


/* =========================
   状態変数
========================= */
let stream = null;
let scanning = false;

let total = 0;
let scannedItems = {};
let lastScanTime = 0;
const scanDelay = 1000;
const scale = 0.5;

let itemsData = {};


/* =========================
   画面遷移
========================= */
function showPage(page) {
  startPage.style.display = 'none';
  scanPage.style.display = 'none';
  paymentPage.style.display = 'none';

  page.style.display = 'block';
}


/* =========================
   カメラ制御
========================= */
function startCamera() {
  if (stream) return; // 二重起動防止

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  })
  .then(s => {
    stream = s;
    video.srcObject = stream;
    scanning = true;
    requestAnimationFrame(scanFrame);
  })
  .catch(err => {
    alert("カメラが使えません: " + err);
  });
}

function stopCamera() {
  if (!stream) return;

  stream.getTracks().forEach(track => track.stop());
  stream = null;
  scanning = false;
}


/* =========================
   QRスキャン
========================= */
function scanFrame() {
  if (!scanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width  = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(
      0, 0, canvas.width, canvas.height
    );

    const code = jsQR(
      imageData.data,
      imageData.width,
      imageData.height
    );

    if (code) {
      handleScan(code.data);
    }
  }

  requestAnimationFrame(scanFrame);
}


function handleScan(itemId) {
  const now = Date.now();
  if (now - lastScanTime < scanDelay) return;

  lastScanTime = now;
  const item = itemsData[itemId];

  if (!item) {
    message.textContent = 'しょうひんが みつかりません';
    setTimeout(() => message.textContent = '', 2000);
    return;
  }

  addItem(item, itemId);

  beep.currentTime = 0;
  beep.play().catch(() => {});
}

function addItem(item, itemId) {
  if (!scannedItems[itemId]) scannedItems[itemId] = 0;
  scannedItems[itemId]++;

  total += parseInt(item.price, 10);
  totalDisplay.textContent = `ごうけい: ¥${total}`;

  display.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <p>しょうひん: ${item.name}</p>
    <p>おかね: ¥${item.price}</p>
    <p>${scannedItems[itemId]} こめ です</p>
  `;

  message.textContent = '';
}


/* =========================
   リセット
========================= */
function resetScan() {
  total = 0;
  scannedItems = {};
  lastScanTime = 0;

  totalDisplay.textContent = 'ごうけい: ¥0';
  display.innerHTML = '';
  message.textContent = '';
}


/* =========================
   初期化
========================= */
window.addEventListener('DOMContentLoaded', () => {
  showPage(startPage);

  fetch('items.json')
    .then(res => res.json())
    .then(data => {
      itemsData = data;
    })
    .catch(err => {
      alert('商品データを読み込めません: ' + err);
    });
});


/* =========================
   ボタン動作
========================= */

// ▶ スタート → スキャン画面
startBtn.addEventListener('click', () => {
  // 音声アンロック
  beep.play().then(() => {
    beep.pause();
    beep.currentTime = 0;
  }).catch(() => {});

  showPage(scanPage);
  startCamera();
});

// ▶ 支払いへ
checkoutBtn.addEventListener('click', () => {
  stopCamera();
  showPage(paymentPage);
  paymentTotal.textContent = `¥${total}`;
});

// ▶ もどる → スキャン画面
backBtn.addEventListener('click', () => {
  resetScan();
  showPage(scanPage);
  startCamera();
});

// ▶ リセット
resetBtn.addEventListener('click', () => {
  resetScan();
});
