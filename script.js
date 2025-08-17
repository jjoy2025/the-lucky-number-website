// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";

// Supabase ক্লায়েন্ট তৈরি করা
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// বর্তমান পেজ অনুযায়ী ফাংশন কল করা
if (document.querySelector('#login-section')) {
    // এটি admin.html পেজের জন্য
    setupAdminPanel();
} else {
    // এটি index.html পেজের জন্য
    document.addEventListener('DOMContentLoaded', () => {
        fetchTodayResults();
        fetchOldResults();
        setupLoginButton();
        startLiveAnimation();
    });
}

// admin.html-এর জন্য ফাংশনালিটি
function setupAdminPanel() {
    const loginForm = document.getElementById('login-form');
    const resultForm = document.getElementById('result-form');
    const logoutBtn = document.getElementById('logout-btn');
    const authError = document.getElementById('auth-error');
    const resultMessage = document.getElementById('result-message');
    const loginSection = document.getElementById('login-section');
    const dataEntrySection = document.getElementById('data-entry-section');

    // লগইন ফর্ম সাবমিট হলে
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            authError.textContent = 'Login failed: ' + error.message;
        } else {
            loginSection.style.display = 'none';
            dataEntrySection.style.display = 'block';
        }
    });

    // রেজাল্ট ফর্ম সাবমিট হলে
    resultForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('date-input').value;
        const baji = parseInt(document.getElementById('baji-input').value);
        const patti = document.getElementById('patti-input').value;
        const single = parseInt(document.getElementById('single-input').value);

        const { data, error } = await supabase
            .from('results')
            .insert([{ date, slot_id: baji, patti_number: patti, single_number: single }]);

        if (error) {
            resultMessage.textContent = 'Failed to save result: ' + error.message;
            resultMessage.style.color = 'red';
        } else {
            resultMessage.textContent = 'Result saved successfully!';
            resultMessage.style.color = 'green';
            resultForm.reset();
        }
    });

    // লগআউট বাটনে ক্লিক হলে
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        window.location.reload();
    });
}

// index.html এর জন্য ফাংশনালিটি
function startLiveAnimation() {
    const liveAnimation = document.querySelector('.today-result .date-header');
    if (liveAnimation) {
        liveAnimation.classList.add('live-animation');
    }
}

async function fetchTodayResults() {
    const resultsContainer = document.querySelector('.results-grid');
    resultsContainer.innerHTML = '';
    
    const today = new Date().toISOString().split('T')[0];
    let { data: results, error } = await supabase
        .from('results')
        .select('*')
        .eq('date', today)
        .order('slot_id', { ascending: true });

    if (error) {
        console.error('Error fetching today\'s data:', error);
        return;
    }

    if (results.length > 0) {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `<div class="patti">${result.patti_number}</div><div class="single">${result.single_number}</div>`;
            resultsContainer.appendChild(resultItem);
        });
    } else {
        for (let i = 0; i < 8; i++) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `<div class="patti">---</div><div class="single">-</div>`;
            resultsContainer.appendChild(resultItem);
        }
    }
}

async function fetchOldResults() {
    const oldResultsContainer = document.querySelector('.old-results-container');
    oldResultsContainer.innerHTML = '';

    let { data: results, error } = await supabase
        .from('results')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching old data:', error);
        return;
    }
    
    const groupedResults = results.reduce((acc, curr) => {
        const date = curr.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(curr);
        return acc;
    }, {});
    
    for (const date in groupedResults) {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'old-results-day';
        dayContainer.innerHTML = `<div class="result-date">${date}</div>`;
        
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        groupedResults[date].sort((a, b) => a.slot_id - b.slot_id).forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `<div class="patti">${result.patti_number}</div><div class="single">${result.single_number}</div>`;
            resultsGrid.appendChild(resultItem);
        });
        
        dayContainer.appendChild(resultsGrid);
        oldResultsContainer.appendChild(dayContainer);
    }
}

function setupLoginButton() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'admin.html';
        });
    }
}
