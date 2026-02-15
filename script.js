let gameData = {};
let selectedGifts = [];
let giftsClaimed = false;
let wishesCompleted = false;

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            gameData = data;
            initUI();
        })
        .catch(err => alert("Lỗi: Hãy chạy bằng Live Server!"));

    const shop = document.getElementById('shop-container');
    if(shop) {
        shop.addEventListener('scroll', () => {
            const cards = document.querySelectorAll('.gift-card');
            const center = shop.scrollTop + shop.clientHeight / 2;
            cards.forEach(card => {
                const cardCenter = card.offsetTop + card.offsetHeight / 2;
                const dist = cardCenter - center;
                const angle = dist * 0.05;
                card.style.transform = `perspective(1000px) rotateX(${-Math.max(-30, Math.min(30, angle))}deg) scale(${1 - Math.abs(dist)*0.0005})`;
            });
        });
    }
});

function initUI() {
    if(gameData.system) document.getElementById('bg-music').src = gameData.system.music_url;
    
    // Load Animations (Kiểm tra element trước khi load)
    if(gameData.visuals) {
        const cakeCenter = document.getElementById('lottie-cake-center');
        if(cakeCenter) cakeCenter.load(gameData.visuals.cake_center);

        const touchEl = document.getElementById('lottie-touch');
        if(touchEl) touchEl.load(gameData.visuals.touch_hint);

        const candleEl = document.getElementById('lottie-candle');
        if(candleEl) candleEl.load(gameData.visuals.candle);

        const uocEl = document.getElementById('lottie-uoc');
        if(uocEl) uocEl.load(gameData.visuals.wishing);
    }
}

// 1. SCAN
function runScanner() {
    document.getElementById('bg-music').play().catch(()=>{});
    document.getElementById('btn-start-scan').style.display = 'none';
    const msg = document.getElementById('scan-msg');
    let i=0, txts=["ĐANG QUÉT...", "PHÂN TÍCH...", "THÀNH CÔNG!"];
    let itv = setInterval(()=>{
        msg.innerText=txts[i++];
        if(i>=3){ 
            clearInterval(itv); msg.style.color="#0f0"; 
            document.getElementById('btn-enter-system').style.display='block'; 
        }
    },800);
}
function enterSystem() { switchScreen('screen-start', 'screen-setup'); }

// 2. SETUP
function finishSetup() {
    const name = document.getElementById('inp-name').value || "Vân Anh";
    const slogan = document.getElementById('inp-slogan').value || "";
    const dob = document.getElementById('inp-dob').value || "01/01/2000";
    const file = document.getElementById('inp-photo').files[0];

    // FIX LỖI NULL: Đảm bảo phần tử tồn tại trước khi gán
    const nameEl = document.getElementById('display-name');
    if(nameEl) nameEl.innerText = name;
    
    const sloganEl = document.getElementById('display-slogan');
    if(sloganEl) sloganEl.innerText = `"${slogan}"`;
    
    const dobEl = document.getElementById('display-dob');
    if(dobEl) dobEl.innerText = dob;

    if(file) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById('avatar-img').src = e.target.result;
        reader.readAsDataURL(file);
    }
    switchScreen('screen-setup', 'screen-game');
}

// 3. WISHES
function sendWishes() {
    const w1 = document.getElementById('wish1').value;
    if(!w1) return alert("Hãy nhập ít nhất 1 điều ước!");

    const overlay = document.getElementById('overlay-wishing');
    overlay.style.display = 'flex';

    setTimeout(() => {
        overlay.style.display = 'none';
        document.getElementById('wish-group').style.display = 'none';
        document.getElementById('wish-locked').style.display = 'block';
        wishesCompleted = true;
        document.getElementById('gift-status-text').innerText = "ĐÃ MỞ KHÓA. HÃY CHỌN 3 MÓN!";
        document.getElementById('gift-status-text').style.color = "var(--neon-cyan)";
        alert("Gửi thành công! Hãy chọn quà.");
    }, 5000);
}

// 4. GIFT SHOP
function openGiftShop() {
    if(!wishesCompleted) return alert("Vui lòng gửi điều ước trước!");
    document.getElementById('overlay-gift-shop').style.display = 'flex';
    renderGiftList();
    if(giftsClaimed) {
        const btn = document.getElementById('btn-claim-gift');
        btn.innerText = "CHỈ XEM"; btn.classList.add('btn-disabled');
    }
}
function closeGiftShop() { document.getElementById('overlay-gift-shop').style.display = 'none'; }

function renderGiftList() {
    const container = document.getElementById('shop-container');
    container.innerHTML = "";
    gameData.gift_pool.forEach(gift => {
        const div = createCardHTML(gift);
        div.id = `card-${gift.id}`;
        div.onclick = () => toggleGift(gift.id);
        if(selectedGifts.includes(gift.id)) div.classList.add('selected');
        container.appendChild(div);
    });
}

function createCardHTML(gift) {
    const div = document.createElement('div');
    div.className = `gift-card rarity-${gift.rarity}`;
    div.innerHTML = `
        <div class="card-header">
            <span style="color:${getRarityColor(gift.rarity)}">${gift.rarity}</span>
            <span><i class="fas fa-cube"></i></span>
        </div>
        <div class="card-watermark">GAME SINH NHẬT</div>
        <div class="card-anim-area">
            <lottie-player src="${gift.json_file}" background="transparent" speed="1" loop autoplay></lottie-player>
        </div>
        <div class="card-footer">
            <div class="card-name">${gift.name}</div>
            <div class="card-value">${gift.value}</div>
            <div class="card-vip">VIP ${gift.vip}</div>
        </div>
    `;
    return div;
}

function toggleGift(id) {
    if(giftsClaimed) return;
    if(selectedGifts.includes(id)) {
        selectedGifts = selectedGifts.filter(g => g !== id);
        document.getElementById(`card-${id}`).classList.remove('selected');
    } else {
        if(selectedGifts.length >= 3) return alert("Chỉ được chọn 3 món!");
        selectedGifts.push(id);
        document.getElementById(`card-${id}`).classList.add('selected');
    }
    document.getElementById('shop-counter').innerText = `Đã chọn: ${selectedGifts.length}/3`;
}

function confirmGifts() {
    if(selectedGifts.length === 0) return alert("Hãy chọn ít nhất 1 món!");
    giftsClaimed = true;
    closeGiftShop();
    document.getElementById('gift-status-text').innerText = "Đã nhận quà";
    
    const row = document.getElementById('gift-icons-row');
    row.innerHTML = "";
    selectedGifts.forEach(id => {
        const gift = gameData.gift_pool.find(g => g.id === id);
        const icon = document.createElement('div');
        icon.className = "small-gift-icon";
        icon.innerHTML = `<i class="fas fa-gift"></i>`;
        icon.style.borderColor = getRarityColor(gift.rarity);
        icon.onclick = () => showSingleGift(gift);
        row.appendChild(icon);
    });
}

function showSingleGift(gift) {
    const container = document.getElementById('single-gift-container');
    container.innerHTML = "";
    const card = createCardHTML(gift);
    card.style.pointerEvents = "none";
    container.appendChild(card);
    document.getElementById('overlay-single-gift').style.display = 'flex';
}

function getRarityColor(r) {
    const c = {"COMMON":"#888", "RARE":"#0f0", "EPIC":"#bd00ff", "LEGEND":"#fa0", "MYTHIC":"#f05"};
    return c[r] || "#fff";
}

// 5. MAIN RITUAL
function interactWithCandle(){
    document.getElementById('overlay-candle').style.display='flex';
    let t=5, el=document.getElementById('timer');
    el.innerText=t; el.style.display='block';
    document.getElementById('btn-confirm-blow').style.display='none';
    let itv = setInterval(()=>{
        t--; el.innerText=t;
        if(t<=0){ clearInterval(itv); el.style.display='none'; document.getElementById('btn-confirm-blow').style.display='block'; }
    },1000);
}

function finishBlowCandle(){
    document.getElementById('overlay-candle').style.display='none';
    const d = gameData.letter;
    document.getElementById('letter-title').innerText = d.title;
    document.getElementById('letter-body').innerHTML = d.content.map(p => `<p>${p}</p>`).join('');
    document.getElementById('overlay-letter').style.display='flex';
}

function closeLetter() { document.getElementById('overlay-letter').style.display='none'; }
function switchScreen(f,t) { document.getElementById(f).classList.remove('active'); document.getElementById(t).classList.add('active'); }