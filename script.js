/**
 * شوق - تطبيق الاشتياق
 * Cordova Hybrid App with Supabase Integration
 */

// ===== Configuration =====
const CONFIG = {
    SUPABASE_URL: 'https://nviviicpompmdokkritx.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aXZpaWNwb21wbWRva2tyaXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTc3NzQsImV4cCI6MjEwMjc5Mzc3NH0.hqqp-bqejHF7AlGhlfLcoyZ1MEhGGsqkfilZy1gaG6E',
    VALID_NAMES: ['فرات', 'فاطمة'],
    NOTIFICATION_TITLE: 'شوق',
    NOTIFICATION_TEXT: 'أنا مشتاق لك 🤍',
    VIBRATE_DURATION: 300
};

// ===== State =====
let state = {
    userName: null,
    pressCount: 0,
    supabase: null,
    isReady: false
};

// ===== DOM Elements =====
const elements = {};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('deviceready', () => {
    console.log('Cordova device ready');
    state.isReady = true;
    requestNotificationPermission();
}, false);

// Fallback for browser testing
document.addEventListener('deviceready', () => {}, false);

function init() {
    cacheElements();
    initStars();
    initSupabase();
    bindEvents();
    checkSession();
}

function cacheElements() {
    elements.splashScreen = document.getElementById('splash-screen');
    elements.mainScreen = document.getElementById('main-screen');
    elements.nameInput = document.getElementById('name-input');
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
            console.log('Supabase initialized successfully');
        } else {
            console.warn('Supabase SDK not loaded yet, will retry...');
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
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars();
    }

    function createStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 4000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random(),
                speed: Math.random() * 0.02 + 0.005,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        stars.forEach(star => {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.abs(Math.sin(star.twinkle)) * 0.7;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(232, 213, 163, ${alpha * star.opacity})`;
            ctx.fill();

            // Glow for larger stars
            if (star.size > 1.2) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(201, 168, 76, ${alpha * 0.1})`;
                ctx.fill();
            }
        });

        animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
}

// ===== Event Binding =====
function bindEvents() {
    // Enter button
    elements.enterBtn.addEventListener('click', handleLogin);
    elements.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Miss button
    elements.missBtn.addEventListener('click', handleMissClick);

    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Input focus effects
    elements.nameInput.addEventListener('focus', () => {
        hideError();
    });
}

// ===== Login Logic =====
function handleLogin() {
    const name = elements.nameInput.value.trim();

    if (!name) {
        showError('الرجاء إدخال اسمك');
        return;
    }

    if (!CONFIG.VALID_NAMES.includes(name)) {
        showError('هذا الاسم ليس لي، أنا أنتظر فقط فرات أو فاطمة');
        elements.nameInput.value = '';
        elements.nameInput.focus();
        return;
    }

    // Valid name - proceed
    state.userName = name;
    localStorage.setItem('shouq_user', name);

    hideError();
    showScreen('main');
    loadUserData();
    showToast(`مرحباً ${name} 💫`);
}

function showError(msg) {
    elements.errorMsg.textContent = msg;
    elements.errorMsg.classList.add('show');

    // Shake animation on input
    elements.nameInput.style.animation = 'none';
    elements.nameInput.offsetHeight; // trigger reflow
    elements.nameInput.style.animation = 'shake 0.5s ease';
}

function hideError() {
    elements.errorMsg.classList.remove('show');
}

// ===== Screen Management =====
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
            elements.nameInput.value = '';
            elements.nameInput.focus();
        }, 300);
    }
}

// ===== Session Check =====
function checkSession() {
    const savedName = localStorage.getItem('shouq_user');
    if (savedName && CONFIG.VALID_NAMES.includes(savedName)) {
        state.userName = savedName;
        showScreen('main');
        loadUserData();
    }
}

function handleLogout() {
    localStorage.removeItem('shouq_user');
    state.userName = null;
    state.pressCount = 0;
    elements.counter.textContent = '0';
    showScreen('splash');
}

// ===== Miss Button Logic =====
async function handleMissClick() {
    // 1. Vibrate
    triggerVibration();

    // 2. Show notification
    showLocalNotification();

    // 3. Visual effects
    createRipple();
    animateCounter();

    // 4. Update counter
    state.pressCount++;
    elements.counter.textContent = state.pressCount;

    // 5. Save to Supabase
    await saveToSupabase();

    // 6. Button animation
    elements.missBtn.style.transform = 'scale(0.92)';
    setTimeout(() => {
        elements.missBtn.style.transform = '';
    }, 150);
}

function triggerVibration() {
    try {
        if (navigator.vibrate) {
            navigator.vibrate(CONFIG.VIBRATE_DURATION);
        } else if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.vibration) {
            cordova.plugins.vibration.vibrate(CONFIG.VIBRATE_DURATION);
        }
    } catch (e) {
        console.log('Vibration not available');
    }
}

function showLocalNotification() {
    try {
        // Try Cordova local notification
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.notification && cordova.plugins.notification.local) {
            cordova.plugins.notification.local.schedule({
                id: Date.now(),
                title: CONFIG.NOTIFICATION_TITLE,
                text: CONFIG.NOTIFICATION_TEXT,
                foreground: true,
                vibrate: false,
                sound: false,
                smallIcon: 'res://icon',
                icon: 'res://icon'
            });
        } else {
            // Fallback: show in-app toast
            showToast(CONFIG.NOTIFICATION_TEXT);
        }
    } catch (e) {
        console.log('Notification error:', e);
        showToast(CONFIG.NOTIFICATION_TEXT);
    }
}

function createRipple() {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    elements.rippleContainer.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 1000);
}

function animateCounter() {
    elements.counter.classList.add('pop');
    setTimeout(() => {
        elements.counter.classList.remove('pop');
    }, 400);
}

// ===== Supabase Operations =====
async function saveToSupabase() {
    if (!state.supabase || !state.userName) return;

    try {
        const { error } = await state.supabase
            .from('miss_clicks')
            .insert([{
                user_name: state.userName,
                timestamp: new Date().toISOString()
            }]);

        if (error) {
            console.error('Supabase insert error:', error);
        } else {
            console.log('Click saved to Supabase');
        }
    } catch (e) {
        console.error('Supabase save error:', e);
    }
}

async function loadUserData() {
    if (!state.supabase || !state.userName) return;

    try {
        const { count, error } = await state.supabase
            .from('miss_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('user_name', state.userName);

        if (error) {
            console.error('Supabase count error:', error);
            // Fallback: count from local
            state.pressCount = parseInt(localStorage.getItem(`shouq_count_${state.userName}`)) || 0;
        } else {
            state.pressCount = count || 0;
            localStorage.setItem(`shouq_count_${state.userName}`, state.pressCount);
        }

        elements.counter.textContent = state.pressCount;
    } catch (e) {
        console.error('Load data error:', e);
        state.pressCount = parseInt(localStorage.getItem(`shouq_count_${state.userName}`)) || 0;
        elements.counter.textContent = state.pressCount;
    }
}

// ===== Notification Permission (Android 13+) =====
function requestNotificationPermission() {
    try {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
            const permissions = cordova.plugins.permissions;
            const notificationPermission = permissions.POST_NOTIFICATIONS;

            permissions.checkPermission(notificationPermission, (status) => {
                if (!status.hasPermission) {
                    permissions.requestPermission(notificationPermission, (status) => {
                        console.log('Notification permission:', status.hasPermission ? 'granted' : 'denied');
                    }, (error) => {
                        console.error('Permission request error:', error);
                    });
                }
            }, (error) => {
                console.error('Permission check error:', error);
            });
        }
    } catch (e) {
        console.log('Permission plugin not available');
    }
}

// ===== Toast =====
let toastTimeout;
function showToast(message) {
    elements.toastText.textContent = message;
    elements.toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===== Shake Animation (CSS injection) =====
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// ===== Prevent double-tap zoom =====
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// ===== Console log =====
console.log('🌙 شوق - loaded and ready');
