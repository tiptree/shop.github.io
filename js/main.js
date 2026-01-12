const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');
const display = document.getElementById('itemDisplay');
const totalDisplay = document.getElementById('total');

const scanPage = document.getElementById('scanPage');
const paymentPage = document.getElementById('paymentPage');
const paymentTotal = document.getElementById('paymentTotal');

const beep = document.getElementById('beep-sound');

let audioEnabled = false;

document.getElementById('startBtn').addEventListener('click', () => {
  // 音の許可を取る
  beep.play().then(() => {
    beep.pause();
    beep.currentTime = 0;
    audioEnabled = true;
  }).catch(() => {});

  // 画面切り替え
  document.getElementById('startPage').style.display = 'none';
  document.getElementById('scanPage').style.display = 'flex';

  // カメラ開始
  startCamera();
});


let total = 0;
let scannedItems = {};
let lastScanTime = 0;
const scanDelay = 1000;
const scale = 0.5;

let itemsData = {}; // JSONデータ

// JSON読み込み
fetch('items.json')
  .then(res => res.json())
  .then(data => {
    itemsData = data;
  })
  .catch(err => alert('商品データを読み込めません:' + err));

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; requestAnimationFrame(scanFrame); })
    .catch(err => { alert("カメラが使えません: " + err); });
}

function scanFrame() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) handleScan(code.data);
    else requestAnimationFrame(scanFrame);
  } else {
    requestAnimationFrame(scanFrame);
  }
}

function getItemInfo(itemId) {
  return itemsData[itemId] || null;
}

function handleScan(itemId) {
  const now = Date.now();
  if (now - lastScanTime < scanDelay) {
    requestAnimationFrame(scanFrame);
    return;
  }
  lastScanTime = now;

  const item = getItemInfo(itemId);
  if (item) {
    addItem(item, itemId);

  const scanPage = document.getElementById('scanPage');

  scanPage.classList.add('flash');
  setTimeout(() => {
    scanPage.classList.remove('flash');
  }, 200);

    beep.currentTime = 0;
    beep.play().catch(e => console.log(e));
  } else {
    message.textContent = 'しょうひんが みつかりません';
    setTimeout(() => {
      message.textContent = '';
    }, 2000);
  }

  requestAnimationFrame(scanFrame);
}

function addItem(item, itemId) {
  if (!scannedItems[itemId]) scannedItems[itemId] = 0;
  scannedItems[itemId] += 1;
  total += parseInt(item.price, 10);
  totalDisplay.textContent = `ごうけい: ¥${total}`;

  display.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <p>しょうひん: ${item.name}</p>
    <p>おかね: ¥${item.price}</p>
    <p>この しょうひんは ${scannedItems[itemId]} こめ です</p>
  `;

  message.textContent = '';
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
  scanPage.style.display = 'none';
  paymentPage.style.display = 'block';
  paymentTotal.textContent = `¥${total}`;
});

document.getElementById('backBtn').addEventListener('click', () => {
  resetScan();
  paymentPage.style.display = 'none';
  scanPage.style.display = 'block';
  requestAnimationFrame(scanFrame);
});

document.getElementById('resetBtn').addEventListener('click', resetScan);

function resetScan() {
  total = 0;
  scannedItems = {};
  lastScanTime = 0;
  totalDisplay.textContent = 'ごうけい: ¥0';
  display.innerHTML = '';
}
