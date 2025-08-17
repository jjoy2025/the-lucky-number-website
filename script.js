// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";

// Supabase ক্লায়েন্ট তৈরি করা
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// বর্তমান পেজ অনুযায়ী ফাংশন কল করা
if (document.querySelector('#login-section')) {
    setupAdminPanel();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        fetchTodayResults();
        fetchOldResults();
        setupLoginButton();
        startLiveAnimation();
    });
}

function setupAdminPanel() {
    const loginForm = document.getElementById('login-form');
    const resultForm = document.getElementById('result-form');
    const dealerForm = document.getElementById('dealer-form');
    const tokenTransferForm = document.getElementById('token-transfer-form');
    const logoutBtn = document.getElementById('logout-btn');
    const authError = document.getElementById('auth-error');
    const resultMessage = document.getElementById('result-message');
    const dealerMessage = document.getElementById('dealer-message');
    const tokenMessage = document.getElementById('token-message');
    const loginSection = document.getElementById('login-section');
    const dataEntrySection = document.getElementById('data-entry-section');
    const dealerSelect = document.getElementById('dealer-select');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // টাব পরিবর্তন করা
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

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
            await populateDealers();
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

    // নতুন ডিলার যোগ করার ফর্ম সাবমিট হলে
    dealerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('dealer-name').value;
        const phone = document.getElementById('dealer-phone').value;

        const { data, error } = await supabase
            .from('dealers')
            .insert([{ name, phone_number: phone, token_balance: 0 }]);
        
        if (error) {
            dealerMessage.textContent = 'Failed to add dealer: ' + error.message;
            dealerMessage.style.color = 'red';
        } else {
            dealerMessage.textContent = 'Dealer added successfully!';
            dealerMessage.style.color = 'green';
            dealerForm.reset();
            await populateDealers(); // ডিলার তালিকা আপডেট করা
        }
    });

    // টোকেন ট্রান্সফার ফর্ম সাবমিট হলে
    tokenTransferForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dealerId = document.getElementById('dealer-select').value;
        const amount = parseInt(document.getElementById('token-amount').value);

        if (!dealerId || isNaN(amount) || amount <= 0) {
            tokenMessage.textContent = 'Please enter a valid amount and select a dealer.';
            tokenMessage.style.color = 'red';
            return;
        }
        
        // টোকেন ট্রান্সফার লজিক
        const { data: dealer, error: fetchError } = await supabase
            .from('dealers')
            .select('token_balance')
            .eq('id', dealerId)
            .single();

        if (fetchError) {
            tokenMessage.textContent = 'Failed to fetch dealer balance: ' + fetchError.message;
            tokenMessage.style.color = 'red';
            return;
        }

        const newBalance = dealer.token_balance + amount;
        
        const { data: updateData, error: updateError } = await supabase
            .from('dealers')
            .update({ token_balance: newBalance })
            .eq('id', dealerId);

        if (updateError) {
            tokenMessage.textContent = 'Failed to transfer tokens: ' + updateError.message;
            tokenMessage.style.color = 'red';
        } else {
            // লেনদেনের রেকর্ড রাখা
            const { data: transactionData, error: transactionError } = await supabase
                .from('transactions')
                .insert([{ sender_id: (await supabase.auth.getSession()).data.session.user.id, receiver_id: dealerId, amount: amount }]);
            
            if (transactionError) {
                console.error('Failed to log transaction: ' + transactionError.message);
            }
            
            tokenMessage.textContent = 'Tokens transferred successfully!';
            tokenMessage.style.color = 'green';
            tokenTransferForm.reset();
            await populateDealers(); // ডিলার তালিকা আপডেট করা
        }
    });

    // ডিলার তালিকা লোড করা
    async function populateDealers() {
        const { data: dealers, error } = await supabase
            .from('dealers')
            .select('*');
        
        if (error) {
            console.error('Failed to load dealers:', error.message);
            return;
        }
        
        dealerSelect.innerHTML = '<option value="">Select Dealer</option>';
        dealers.forEach(dealer => {
            const option = document.createElement('option');
            option.value = dealer.id;
            option.textContent = `${dealer.name} (${dealer.token_balance} tokens)`;
            dealerSelect.appendChild(option);
        });
    }

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
