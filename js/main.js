const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const message = document.getElementById('message');
const display = document.getElementById('itemDisplay');
const totalDisplay = document.getElementById('total');

const scanPage = document.getElementById('scanPage');
const paymentPage = document.getElementById('paymentPage');
const startPage = document.getElementById('startPage');

const paymentTotal = document.getElementById('paymentTotal');
const beep = document.getElementById('beep-sound');

let total = 0;
let scannedItems = {};
let lastScanTime = 0;
const scanDelay = 1000;
const scale = 0.5;

let itemsData = {};
let audioEnabled = false;

/* ---------- 初期画面 ---------- */
startPage.style.display = 'flex';
scanPage.style.display = 'none';
paymentPage.style.display = 'none';

/* ---------- 商品データ読み込み ---------- */
fetch('items.json')
  .then(res => res.json())
  .then(data => {
    itemsData = data;
  })
  .catch(err => alert('商品データを読み込めません: ' + err));

/* ---------- スタートボタン ---------- */
document.getElementById('startBtn').addEventListener('click', () => {
  // iPhone用 音の許可取得
  if (!audioEnabled) {
    beep.play().then(() => {
      beep.pause();
      beep.currentTime = 0;
      audioEnabled = true;
    }).catch(() => {});
  }

  startPage.style.display = 'none';
  scanPage.style.display = 'flex';
  paymentPage.style.display = 'none';

  startCamera();
});

/* ---------- カメラ ---------- */
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      requestAnimationFrame(scanFrame);
    })
    .catch(err => alert("カメラが使えません: " + err));
}

function scanFrame() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) handleScan(code.data);
  }
  requestAnimationFrame(scanFrame);
}

/* ---------- スキャン処理 ---------- */
function handleScan(itemId) {
  const now = Date.now();
  if (now - lastScanTime < scanDelay) return;
  lastScanTime = now;

  const item = itemsData[itemId];
  if (!item) {
    message.textContent = 'しょうひんが みつかりません';
    setTimeout(() => message.textContent = '', 1500);
    return;
  }

  if (!scannedItems[itemId]) scannedItems[itemId] = 0;
  scannedItems[itemId]++;

  total += parseInt(item.price, 10);
  totalDisplay.textContent = `ごうけい: ¥${total}`;

  display.innerHTML = `
    <img src="${item.image}">
    <p>しょうひん: ${item.name}</p>
    <p>おかね: ¥${item.price}</p>
    <p>${scannedItems[itemId]} こめ</p>
  `;

  scanPage.classList.add('flash');
  setTimeout(() => scanPage.classList.remove('flash'), 200);

  if (audioEnabled) {
    beep.currentTime = 0;
    beep.play().catch(() => {});
  }
}

/* ---------- しはらい ---------- */
document.getElementById('checkoutBtn').addEventListener('click', () => {
  startPage.style.display = 'none';
  scanPage.style.display = 'none';
  paymentPage.style.display = 'flex';
  paymentTotal.textContent = `¥${total}`;
});

/* ---------- もどる ---------- */
document.getElementById('backBtn').addEventListener('click', () => {
  resetScan();
  paymentPage.style.display = 'none';
  startPage.style.display = 'none';
  scanPage.style.display = 'flex';
});

/* ---------- リセット ---------- */
document.getElementById('resetBtn').addEventListener('click', resetScan);

function resetScan() {
  total = 0;
  scannedItems = {};
  lastScanTime = 0;
  totalDisplay.textContent = 'ごうけい: ¥0';
  display.innerHTML = '';
  message.textContent = '';
}
