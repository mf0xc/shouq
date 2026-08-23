/**
 * شوق - تطبيق الاشتياق
 * Capacitor Hybrid App with Supabase Integration
 */

// ===== Configuration =====
const CONFIG = {
    SUPABASE_URL: 'https://nviviicpompmdokkritx.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aXZpaWNwb21wbWRva2tyaXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTc3NzQsImV4cCI6MjEwMjc5Mzc3NH0.hqqp-bqejHF7AlGhlfLcoyZ1MEhGGsqkfilZy1gaG6E',
    VALID_NAMES: ['فرات', 'فاطمة'],
    NOTIFICATION_TITLE: 'شوق',
    NOTIFICATION_TEXT: 'أنا مشتاق لك',
    VIBRATE_DURATION: 300
};

// ===== State =====
let state = {
    userName: null,
    otherName: null,
    otherCount: 0,
    supabase: null,
    isReady: false,
    selectedName: null
};

// ===== DOM Elements =====
const elements = {};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', init);

// Capacitor init - no deviceready needed!
if (typeof Capacitor !== 'undefined') {
    console.log('Capacitor detected');
}

function init() {
    cacheElements();
    initStars();
    initSupabase();
    bindEvents();
    checkSession();
    requestPermissions();
}

function cacheElements() {
    elements.splashScreen = document.getElementById('splash-screen');
    elements.mainScreen = document.getElementById('main-screen');
    elements.nameOptions = document.querySelectorAll('.name-option');
    elements.enterBtn = document.getElementById('enter-btn');
    elements.errorMsg = document.getElementById('error-msg');
    elements.userName = document.getElementById('user-name');
    elements.missBtn = document.getElementById('miss-btn');
    elements.counter = document.getElementById('counter');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.toast = document.getElementById('toast');
    elements.toastText = elements.toast.querySelector('.toast-text');
    elements.rippleContainer = document.querySelector('.ripple-container');
}

// ===== Supabase Setup =====
function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            state.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            console.log('Supabase initialized');
        } else {
            setTimeout(initSupabase, 1000);
        }
    } catch (e) {
        console.error('Supabase init error:', e);
    }
}

// ===== Stars Background =====
function initStars() {
    const canvas = document.getElementById('stars-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars();
    }

    function createStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 5000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.2 + 0.3,
                opacity: Math.random(),
                speed: Math.random() * 0.015 + 0.003,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.twinkle += star.speed;
            const alpha = 0.2 + Math.abs(Math.sin(star.twinkle)) * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha * star.opacity})`;
            ctx.fill();
            if (star.size > 0.9) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.05})`;
                ctx.fill();
            }
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
}

// ===== Event Binding =====
function bindEvents() {
    elements.nameOptions.forEach(option => {
        option.addEventListener('click', () => selectName(option));
    });
    elements.enterBtn.addEventListener('click', handleLogin);
    elements.missBtn.addEventListener('click', handleMissClick);
    elements.logoutBtn.addEventListener('click', handleLogout);
}

function selectName(option) {
    elements.nameOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    state.selectedName = option.dataset.name;
    elements.enterBtn.disabled = false;
    hideError();
}

// ===== Login Logic =====
function handleLogin() {
    if (!state.selectedName) {
        showError('الرجاء اختيار اسمك');
        return;
    }
    state.userName = state.selectedName;
    state.otherName = CONFIG.VALID_NAMES.find(n => n !== state.selectedName);
    localStorage.setItem('shouq_user', state.userName);
    hideError();
    showScreen('main');
    loadOtherCount();
    showToast('مرحباً ' + state.userName);
}

function showError(msg) {
    elements.errorMsg.textContent = msg;
    elements.errorMsg.classList.add('show');
}

function hideError() {
    elements.errorMsg.classList.remove('show');
}

function showScreen(screen) {
    if (screen === 'main') {
        elements.splashScreen.classList.remove('active');
        setTimeout(() => {
            elements.mainScreen.classList.add('active');
            elements.userName.textContent = state.userName;
        }, 300);
    } else {
        elements.mainScreen.classList.remove('active');
        setTimeout(() => {
            elements.splashScreen.classList.add('active');
            elements.nameOptions.forEach(opt => opt.classList.remove('selected'));
            state.selectedName = null;
            elements.enterBtn.disabled = true;
        }, 300);
    }
}

function checkSession() {
    const savedName = localStorage.getItem('shouq_user');
    if (savedName && CONFIG.VALID_NAMES.includes(savedName)) {
        state.userName = savedName;
        state.otherName = CONFIG.VALID_NAMES.find(n => n !== savedName);
        showScreen('main');
        loadOtherCount();
    } else {
        elements.enterBtn.disabled = true;
    }
}

function handleLogout() {
    localStorage.removeItem('shouq_user');
    state.userName = null;
    state.otherName = null;
    state.otherCount = 0;
    elements.counter.textContent = '0';
    showScreen('splash');
}

// ===== Miss Button Logic =====
async function handleMissClick() {
    triggerVibration();
    showNotification();
    createRipple();
    animateCounter();
    await saveToSupabase();
    elements.missBtn.style.transform = 'scale(0.93)';
    setTimeout(() => { elements.missBtn.style.transform = ''; }, 150);
    showToast('تم إرسال اشتياقك');
}

// ===== Capacitor Vibration =====
async function triggerVibration() {
    try {
        if (typeof Capacitor !== 'undefined') {
            const { Haptics } = await import('@capacitor/haptics');
            await Haptics.vibrate({ duration: CONFIG.VIBRATE_DURATION });
        } else if (navigator.vibrate) {
            navigator.vibrate(CONFIG.VIBRATE_DURATION);
        }
    } catch (e) {
        console.log('Vibration error:', e);
        if (navigator.vibrate) navigator.vibrate(CONFIG.VIBRATE_DURATION);
    }
}

// ===== Capacitor Local Notification =====
async function showNotification() {
    try {
        if (typeof Capacitor !== 'undefined') {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
                notifications: [{
                    id: Date.now(),
                    title: CONFIG.NOTIFICATION_TITLE,
                    body: CONFIG.NOTIFICATION_TEXT,
                    schedule: { at: new Date(Date.now() + 100) }
                }]
            });
        } else {
            showToast(CONFIG.NOTIFICATION_TEXT);
        }
    } catch (e) {
        console.log('Notification error:', e);
        showToast(CONFIG.NOTIFICATION_TEXT);
    }
}

// ===== Request Permissions =====
async function requestPermissions() {
    try {
        if (typeof Capacitor !== 'undefined') {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.requestPermissions();
        }
    } catch (e) {
        console.log('Permission request error:', e);
    }
}

function createRipple() {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    elements.rippleContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
}

function animateCounter() {
    elements.counter.classList.add('pop');
    setTimeout(() => elements.counter.classList.remove('pop'), 400);
}

// ===== Supabase Operations =====
async function saveToSupabase() {
    if (!state.supabase || !state.userName) return;
    try {
        const { error } = await state.supabase
            .from('miss_clicks')
            .insert([{ user_name: state.userName, timestamp: new Date().toISOString() }]);
        if (error) console.error('Supabase insert error:', error);
        else console.log('Click saved for:', state.userName);
    } catch (e) {
        console.error('Supabase save error:', e);
    }
}

async function loadOtherCount() {
    if (!state.supabase || !state.otherName) return;
    try {
        const { count, error } = await state.supabase
            .from('miss_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('user_name', state.otherName);
        if (error) {
            console.error('Supabase count error:', error);
            state.otherCount = parseInt(localStorage.getItem(`shouq_count_${state.otherName}`)) || 0;
        } else {
            state.otherCount = count || 0;
            localStorage.setItem(`shouq_count_${state.otherName}`, state.otherCount);
        }
        elements.counter.textContent = state.otherCount;
    } catch (e) {
        state.otherCount = parseInt(localStorage.getItem(`shouq_count_${state.otherName}`)) || 0;
        elements.counter.textContent = state.otherCount;
    }
}

// Real-time updates every 10 seconds
setInterval(() => {
    if (state.userName && state.otherName) loadOtherCount();
}, 10000);

// ===== Toast =====
let toastTimeout;
function showToast(message) {
    elements.toastText.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => elements.toast.classList.remove('show'), 2500);
}

// ===== Prevent double-tap zoom =====
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
}, false);

console.log('شوق - loaded and ready');
