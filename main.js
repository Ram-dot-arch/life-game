// 盤面サイズ
const ROWS = 40;
const COLS = 50;

// 現世代配列と近傍カウント配列
let a = new Array(ROWS * COLS).fill(false);
let b = new Array(ROWS * COLS).fill(0);

let generation = 0; // 世代カウンタ
let interval = null; // 自動更新用タイマー
let history = [];    // 棒グラフ用の生きセル履歴

// DOM要素
const boardEl = document.getElementById('board');
const genEl   = document.getElementById('generation');
const statsEl = document.getElementById('stats');
const speedEl = document.getElementById('speed');

// ==============================
// 盤面作成
// ==============================
(function buildBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 16px)`; // 正方形セルの列数指定
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const k = i * COLS + j;
      const cell = document.createElement('div');
      cell.className = 'cell';
      // クリックで生死反転
      cell.addEventListener('mousedown', () => {
        a[k] = !a[k];
        draw();
      });
      boardEl.appendChild(cell);
    }
  }
})();

// ==============================
// 盤面描画
// ==============================
function draw() {
  const cells = boardEl.children;
  for (let k = 0; k < a.length; k++) {
    cells[k].classList.toggle('alive', !!a[k]);
  }
  genEl.textContent = `世代: ${generation}`;
}

// 生きセル数をカウント
function countAlive() {
  return a.filter(c => c).length;
}

// ==============================
// 棒グラフ描画（0なら非表示）
// ==============================
function drawStats() {
  statsEl.innerHTML = ''; // 既存バーをクリア
  const max = Math.max(1, ...history, ROWS*COLS); // 正規化用最大値

  history.forEach((value, idx) => {
    if(value === 0) return; // 0のとき棒を描画しない
    const bar = document.createElement('div');
    bar.className = 'bar';
    const r = Math.min(255, Math.floor(255 * idx / Math.max(1, history.length-1)));
    const bcol = 255 - r;
    bar.style.backgroundColor = `rgb(${r},0,${bcol})`;
    bar.style.height = (value/max*100) + '%'; // 正規化して高さ決定
    statsEl.appendChild(bar);
  });
}

// ==============================
// 世代更新（8近傍・トーラス）
// ==============================
function update() {
  generation++;
  b.fill(0);

  for (let i=0; i<ROWS; i++){
    const im1=(i-1+ROWS)%ROWS, ip1=(i+1)%ROWS;
    for (let j=0; j<COLS; j++){
      const jm1=(j-1+COLS)%COLS, jp1=(j+1)%COLS;
      const k=i*COLS+j;
      if(!a[k]) continue;
      // 近傍8セルをカウント
      b[im1*COLS+jm1]++; b[im1*COLS+j]++; b[im1*COLS+jp1]++;
      b[i*COLS+jm1]++;                  b[i*COLS+jp1]++;
      b[ip1*COLS+jm1]++; b[ip1*COLS+j]++; b[ip1*COLS+jp1]++;
    }
  }

  // ライフゲームルール
  for(let k=0; k<a.length; k++){
    a[k] = (b[k]===3) || (a[k] && b[k]===2);
  }

  // 棒グラフ履歴に追加
  history.push(countAlive());
  if(history.length>50) history.shift(); // 最新50世代のみ

  draw();
  drawStats();
}

// ==============================
// 初期パターン設定
// ==============================
function setPattern(name){
  a.fill(false);
  generation=0;
  history=[];

  if(name==='random'){
    for(let k=0; k<a.length; k++) a[k] = Math.random()<0.33;
  }

  if(name==='gliderGun'){
    const row0=0, col0=0;
    const gun=[
      [5,1],[5,2],[6,1],[6,2],
      [3,13],[3,14],[4,12],[4,16],[5,11],[5,17],[6,11],[6,15],[6,17],[6,18],
      [7,11],[7,17],[8,12],[8,16],[9,13],[9,14],
      [1,25],[2,23],[2,25],[3,21],[3,22],[4,21],[4,22],[5,21],[5,22],[6,23],[6,25],[7,25],
      [3,35],[3,36],[4,35],[4,36]
    ];
    gun.forEach(([r,c])=>{
      const rr=row0+r;
      const cc=col0+c;
      if(rr<ROWS && cc<COLS) a[rr*COLS+cc]=true;
    });
  }

  if(name==='nebula'){
    const nebulaCoords=[
      [18,32],[12,25],[14,25],[12,26],[14,26],[12,28],[12,29],[15,25],[12,30],[15,26],
      [12,31],[15,32],[12,32],[12,33],[13,25],[13,26],[13,28],[13,29],[13,30],[13,31],
      [18,33],[19,25],[19,26],[19,27],[19,28],[19,29],[15,33],[19,30],[19,32],[16,25],
      [19,33],[16,26],[16,32],[20,25],[16,33],[20,26],[20,27],[17,25],[20,28],[17,26],
      [20,29],[13,32],[17,32],[20,30],[13,33],[17,33],[20,32],[20,33]
    ];

    const minRow=Math.min(...nebulaCoords.map(x=>x[0]));
    const maxRow=Math.max(...nebulaCoords.map(x=>x[0]));
    const minCol=Math.min(...nebulaCoords.map(x=>x[1]));
    const maxCol=Math.max(...nebulaCoords.map(x=>x[1]));
    const nebulaHeight=maxRow-minRow+1;
    const nebulaWidth=maxCol-minCol+1;
    const offsetRow=Math.floor((ROWS-nebulaHeight)/2)-minRow;
    const offsetCol=Math.floor((COLS-nebulaWidth)/2)-minCol;

    nebulaCoords.forEach(([r,c])=>{
      const rr=r+offsetRow;
      const cc=c+offsetCol;
      if(rr>=0 && rr<ROWS && cc>=0 && cc<COLS) a[rr*COLS+cc]=true;
    });
  }

  draw();
  drawStats();
}

// ==============================
// ボタン制御
// ==============================
document.getElementById('startBtn').addEventListener('click', ()=>{
  if(interval) return;
  const sp=Math.max(10, Number(speedEl.value)||200);
  interval=setInterval(update, sp);
});
document.getElementById('stopBtn').addEventListener('click', ()=>{
  clearInterval(interval); interval=null;
});
document.getElementById('stepBtn').addEventListener('click', ()=>{
  if(!interval) update();
});
document.getElementById('resetBtn').addEventListener('click', ()=>{
  clearInterval(interval); interval=null;
  setPattern(document.getElementById('patternSelect').value);
});
document.getElementById('patternSelect').addEventListener('change', (e)=>{
  clearInterval(interval); interval=null;
  setPattern(e.target.value);
});

// 初期起動
setPattern('blank');
