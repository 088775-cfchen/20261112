// ===== 圖片精靈動畫：角色1（站立 stop / 行走 walk / 施法 magic1 / 跳躍 jump）＋ 魔法特效 =====

// ---------- 站立（stop）精靈圖設定 ----------
let stopSheet;                          // 宣告變數，用來存放角色1站立的精靈圖
const STOP_FRAMES = 10;                 // 站立精靈圖內共有10張小圖
const STOP_W = 1385;                    // 站立精靈圖的總寬度（像素）
const STOP_H = 212;                     // 站立精靈圖的高度（像素）

// ---------- 行走（walk）精靈圖設定 ----------
let walkSheet;                          // 宣告變數，用來存放角色1行走的精靈圖
const WALK_FRAMES = 9;                  // 行走精靈圖內共有9張小圖
const WALK_W = 1246;                    // 行走精靈圖的總寬度（像素）
const WALK_H = 198;                     // 行走精靈圖的高度（像素）

// ---------- 施法（magic1）精靈圖設定 ----------
let magicSheet;                         // 宣告變數，用來存放角色1施法的精靈圖
const MAGIC_FRAMES = 4;                 // 施法精靈圖內共有4張小圖
const MAGIC_W = 1039;                   // 施法精靈圖的總寬度（像素）
const MAGIC_H = 146;                    // 施法精靈圖的高度（像素）

// ---------- 跳躍（jump）精靈圖設定 ----------
let jumpSheet;                          // 宣告變數，用來存放角色1跳躍的精靈圖
const JUMP_FRAMES = 11;                 // 跳躍精靈圖內共有11張小圖
const JUMP_W = 1502;                    // 跳躍精靈圖的總寬度（像素）
const JUMP_H = 188;                     // 跳躍精靈圖的高度（像素）
const JUMP_V_RATIO = 0.03;              // 起跳速度 = 畫布高度 × 此比例（越大跳越高）
const GRAVITY_RATIO = 0.0012;           // 重力加速度 = 畫布高度 × 此比例（越大落得越快）
const JUMP_AIR_FRAMES = 2 * JUMP_V_RATIO / GRAVITY_RATIO; // 從起跳到落地總共經過的畫面數
let jumpY = 0;                          // 角色往上偏移量（以畫布高度比例表示，負數代表往上）
let jumpVY = 0;                         // 角色垂直速度（以畫布高度比例表示，負數代表往上）
let jumpTime = 0;                       // 起跳後經過的畫面數，用來決定跳躍動畫影格

// ---------- 魔法特效（magic_effect）精靈圖設定 ----------
let effectSheet;                        // 宣告變數，用來存放魔法特效的精靈圖
const EFFECT_FRAMES = 5;                // 特效精靈圖內共有5張小圖
const EFFECT_W = 740;                   // 特效精靈圖的總寬度（像素）
const EFFECT_H = 19;                    // 特效精靈圖的高度（像素）
const EFFECT_SPEED_RATIO = 0.015;       // 特效飛行速度 = 畫布寬度 × 此比例
let effects = [];                       // 陣列：存放畫面上所有正在飛行的特效

// ---------- 角色狀態 ----------
let charX;                              // 角色1中心點的x座標
let facing = 1;                         // 角色面向：1代表面向右，-1代表面向左
let state = 'stop';                     // 動作狀態：'stop'站立、'walk'行走、'magic'施法、'jump'跳躍
let currentFrame = 0;                   // 目前播放到第幾格影格（從0開始）
const FRAME_DELAY = 6;                  // 每隔幾個畫面切換下一格（數字越大動畫越慢）
const SPEED_RATIO = 0.006;              // 角色移動速度 = 畫布寬度 × 此比例

// 預先載入所有圖片，確保 setup() 執行前圖片都已讀取完成
function preload() {
  stopSheet   = loadImage('1/stop/stop.png');                 // 載入站立精靈圖
  walkSheet   = loadImage('1/walk/walk.png');                 // 載入行走精靈圖
  magicSheet  = loadImage('1/magic1/magic1.png');             // 載入施法精靈圖
  jumpSheet   = loadImage('1/jump/jump.png');                 // 載入跳躍精靈圖
  effectSheet = loadImage('1/magic_effect/magic_effect.png'); // 載入魔法特效精靈圖
}

// 初始化設定，只在程式開始時執行一次
function setup() {
  createCanvas(windowWidth, windowHeight); // 建立與瀏覽器視窗同大小的全螢幕畫布
  imageMode(CENTER);                       // 設定圖片以中心點作為繪製的定位基準
  noSmooth();                              // 關閉平滑處理，讓縮放後的圖片邊緣保持清晰
  charX = width * 2 / 3;                   // 角色1起始位置：畫布寬度的2/3
}

// 依動作狀態回傳對應的精靈圖資料（圖片、影格數、每格寬高）
function getSheetInfo(s) {
  if (s === 'walk')  return { img: walkSheet,  frames: WALK_FRAMES,  fw: WALK_W / WALK_FRAMES,   fh: WALK_H };  // 行走資料
  if (s === 'magic') return { img: magicSheet, frames: MAGIC_FRAMES, fw: MAGIC_W / MAGIC_FRAMES, fh: MAGIC_H }; // 施法資料
  if (s === 'jump')  return { img: jumpSheet,  frames: JUMP_FRAMES,  fw: JUMP_W / JUMP_FRAMES,   fh: JUMP_H };  // 跳躍資料
  return { img: stopSheet, frames: STOP_FRAMES, fw: STOP_W / STOP_FRAMES, fh: STOP_H };                         // 站立資料
}

// 讀取左右鍵：回傳1(右)、-1(左)或0(沒按)，並同時更新角色面向
function readDirection() {
  if (keyIsDown(RIGHT_ARROW)) { facing = 1;  return 1;  } // 按住右鍵：面向右並回傳1
  if (keyIsDown(LEFT_ARROW))  { facing = -1; return -1; } // 按住左鍵：面向左並回傳-1
  return 0;                                               // 都沒按：回傳0
}

// 每一個畫面都會重複執行，負責更新與繪製動畫
function draw() {
  background('#87CEEB');                   // 將背景塗成天空色（Sky Blue）

  // ---------- 1. 依狀態處理鍵盤與移動 ----------
  let moveDir = 0;                         // 本畫面的水平移動方向（0代表不移動）
  if (state === 'jump') {                  // 如果正在跳躍
    moveDir = readDirection();             // 空中仍可用左右鍵控制方向與移動
    jumpVY += GRAVITY_RATIO;               // 重力讓垂直速度逐漸往下增加
    jumpY += jumpVY;                       // 依垂直速度更新角色高度
    jumpTime++;                            // 起跳後經過的畫面數加1
    currentFrame = min(JUMP_FRAMES - 1, floor(jumpTime / JUMP_AIR_FRAMES * JUMP_FRAMES)); // 依跳躍進度換算影格，起跳到落地剛好播完一輪
    if (jumpY >= 0) {                      // 如果已經落回地面（偏移量回到0以下）
      jumpY = 0;                           // 高度歸零，回到原本的位置
      jumpVY = 0;                          // 垂直速度歸零
      state = 'stop';                      // 回到站立狀態
      currentFrame = 0;                    // 影格歸零
    }
  } else if (state !== 'magic') {          // 不在跳躍也不在施法時（站立或行走）
    moveDir = readDirection();             // 讀取左右鍵
    let newState = (moveDir !== 0) ? 'walk' : 'stop'; // 有按方向鍵就行走，否則站立
    if (newState !== state) {              // 如果動作狀態改變了
      state = newState;                    // 更新為新的狀態
      currentFrame = 0;                    // 影格從第0格重新開始
    }
  }

  // ---------- 2. 取得目前狀態的精靈圖資料並計算顯示大小 ----------
  let info = getSheetInfo(state);          // 取得目前動作的精靈圖資料
  let displayH = height / 3;               // 角色顯示高度 = 畫布高度的1/3
  let scaleRatio = displayH / info.fh;     // 縮放比例 = 顯示高度 ÷ 原圖高度
  let displayW = info.fw * scaleRatio;     // 顯示寬度 = 原影格寬度 × 縮放比例（維持原比例）

  // ---------- 3. 水平移動並限制在畫布範圍內 ----------
  charX += moveDir * width * SPEED_RATIO;  // 依方向往左或往右移動
  charX = constrain(charX, displayW / 2, width - displayW / 2); // 到達左右邊界即停止移動

  let groundY = height - displayH / 2;     // 站在地面時的中心點y座標（角色底端貼齊畫布最底端）
  let y = groundY + jumpY * height;        // 實際y座標 = 地面位置 + 跳躍往上的偏移量

  // ---------- 4. 繪製角色（面向左時水平翻轉） ----------
  drawSprite(info.img, charX, y, displayW, displayH, currentFrame * info.fw, info.fw, info.fh, facing); // 畫出角色目前影格

  // ---------- 5. 更新角色影格（跳躍的影格已在上方依進度計算） ----------
  if (state !== 'jump' && frameCount % FRAME_DELAY === 0) { // 不是跳躍狀態，且每經過 FRAME_DELAY 個畫面時
    if (state === 'magic') {               // 如果正在施法（只播放一次）
      if (currentFrame < info.frames - 1) {// 還沒播到最後一格
        currentFrame++;                    // 前進到下一格
      } else {                             // 已經播完最後一格
        spawnEffect(displayH);             // 產生魔法特效
        state = 'stop';                    // 回到站立狀態
        currentFrame = 0;                  // 影格歸零
      }
    } else {                               // 站立或行走（循環播放）
      currentFrame = (currentFrame + 1) % info.frames; // 下一格，播完回到第0格
    }
  }

  // ---------- 6. 更新與繪製所有魔法特效 ----------
  for (let i = effects.length - 1; i >= 0; i--) {     // 由後往前檢查，方便刪除元素
    let e = effects[i];                               // 取出第i個特效
    e.x += e.dir * width * EFFECT_SPEED_RATIO;        // 依方向往左或往右移動
    let ew = (EFFECT_W / EFFECT_FRAMES) * e.scale;    // 特效顯示寬度
    let eh = EFFECT_H * e.scale;                      // 特效顯示高度
    drawSprite(effectSheet, e.x, e.y, ew, eh, e.frame * (EFFECT_W / EFFECT_FRAMES), EFFECT_W / EFFECT_FRAMES, EFFECT_H, e.dir); // 畫出特效目前影格
    if (frameCount % FRAME_DELAY === 0) {             // 每隔 FRAME_DELAY 個畫面
      e.frame = (e.frame + 1) % EFFECT_FRAMES;        // 特效切換下一格（循環播放）
    }
    if (e.x - ew / 2 > width || e.x + ew / 2 < 0) {   // 特效完全移出畫布右端或左端
      effects.splice(i, 1);                           // 從陣列中移除，特效消失
    }
  }
}

// 共用繪圖函式：從精靈圖裁切一格並畫出，dir為-1時水平翻轉
function drawSprite(img, x, y, w, h, sx, sw, sh, dir) {
  push();                                  // 儲存目前的繪圖設定
  translate(x, y);                         // 把座標原點移到圖片中心點
  scale(dir, 1);                           // dir為-1時水平翻轉（面向左）
  image(img, 0, 0, w, h, sx, 0, sw, sh);   // 從精靈圖裁切(sx,0,sw,sh)並畫成w×h大小
  pop();                                   // 還原繪圖設定
}

// 產生一個魔法特效，從角色面向的那一側發射
function spawnEffect(displayH) {
  let s = displayH / MAGIC_H;              // 特效縮放比例：與施法角色相同，大小才協調
  let charHalfW = (MAGIC_W / MAGIC_FRAMES) * s / 2; // 施法角色顯示寬度的一半
  effects.push({                           // 把新特效加入陣列
    x: charX + facing * charHalfW,         // 起始x：角色面向那一側的邊緣
    y: height - displayH / 2,              // 起始y：角色身體中間高度
    dir: facing,                           // 飛行方向：與角色面向相同
    scale: s,                              // 特效的縮放比例
    frame: 0                               // 特效影格從第0格開始
  });
}

// 按下按鍵的瞬間執行一次（適合觸發只做一次的動作）
function keyPressed() {
  if (state === 'magic' || state === 'jump') return false; // 施法或跳躍中不接受新的動作
  if (key === ' ') {                       // 按下空白鍵
    state = 'magic';                       // 切換為施法狀態
    currentFrame = 0;                      // 施法動畫從第0格開始播放
    return false;                          // 阻止空白鍵讓網頁捲動的預設行為
  }
  if (keyCode === UP_ARROW) {              // 按下上方向鍵
    state = 'jump';                        // 切換為跳躍狀態
    jumpVY = -JUMP_V_RATIO;                // 給予往上的起跳速度
    jumpY = 0;                             // 從地面開始起跳
    jumpTime = 0;                          // 跳躍計時歸零
    currentFrame = 0;                      // 跳躍動畫從第0格開始
    return false;                          // 阻止上鍵讓網頁捲動的預設行為
  }
}

// 當瀏覽器視窗大小改變時自動執行（手機旋轉、視窗縮放）
function windowResized() {
  let ratio = charX / width;               // 記錄角色在畫布寬度中的相對位置比例
  for (let e of effects) {                 // 逐一處理每個特效
    e.xr = e.x / width;                    // 記錄特效x的相對位置比例
  }
  resizeCanvas(windowWidth, windowHeight); // 重新調整畫布為新的視窗大小
  charX = ratio * width;                   // 依比例換算角色新位置（跳躍高度本來就是比例，不需換算）
  for (let e of effects) {                 // 逐一處理每個特效
    e.x = e.xr * width;                    // 依比例換算特效新位置
  }
}
