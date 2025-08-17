// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";

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
    
    // নতুন রিপোর্টিং এবং গ্রাফিং উপাদান
    const dealerReportSelect = document.getElementById('dealer-report-select');
    const reportDateInput = document.getElementById('report-date-input');
    const reportDownloadBtn = document.getElementById('report-download-btn');
    const tokenHistoryBtn = document.getElementById('token-history-btn');
    const tokenHistoryContainer = document.getElementById('token-history-container');
    const graphViewBtn = document.getElementById('graph-view-btn');
    const graphContainer = document.getElementById('graph-container');

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
            await populateDealerReportSelect();
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
        const email = document.getElementById('dealer-email').value;
        const password = document.getElementById('dealer-password').value;

        const { user, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { role: 'dealer' }
            }
        });

        if (authError) {
            dealerMessage.textContent = 'Failed to create dealer user: ' + authError.message;
            dealerMessage.style.color = 'red';
            return;
        }

        const { data, error } = await supabase
            .from('dealers')
            .insert([{ user_id: user.id, name, phone_number: phone, token_balance: 0 }]);
        
        if (error) {
            dealerMessage.textContent = 'Failed to add dealer to database: ' + error.message;
            dealerMessage.style.color = 'red';
        } else {
            dealerMessage.textContent = 'Dealer added successfully!';
            dealerMessage.style.color = 'green';
            dealerForm.reset();
            await populateDealers();
            await populateDealerReportSelect();
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
            const { data: transactionData, error: transactionError } = await supabase
                .from('transactions')
                .insert([{ sender_id: (await supabase.auth.getSession()).data.session.user.id, receiver_id: dealerId, amount: amount, type: 'credit' }]);
            
            if (transactionError) {
                console.error('Failed to log transaction: ' + transactionError.message);
            }
            
            tokenMessage.textContent = 'Tokens transferred successfully!';
            tokenMessage.style.color = 'green';
            tokenTransferForm.reset();
            await populateDealers();
            await populateDealerReportSelect();
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
            option.textContent = `${dealer.name} (${dealer.token_balance || 0} tokens)`;
            dealerSelect.appendChild(option);
        });
    }

    // ডিলার রিপোর্ট ড্রপডাউন লোড করা
    async function populateDealerReportSelect() {
        const { data: dealers, error } = await supabase
            .from('dealers')
            .select('id, name');
        
        if (error) {
            console.error('Failed to load dealers for report:', error.message);
            return;
        }
        
        dealerReportSelect.innerHTML = '<option value="">ডিলার সিলেক্ট করুন</option>';
        dealers.forEach(dealer => {
            const option = document.createElement('option');
            option.value = dealer.id;
            option.textContent = dealer.name;
            dealerReportSelect.appendChild(option);
        });
    }

    // টোকেন হিস্টোরি দেখানোর বাটন
    tokenHistoryBtn.addEventListener('click', async () => {
        const dealerId = dealerReportSelect.value;
        if (!dealerId) {
            alert('অনুগ্রহ করে একটি ডিলার সিলেক্ট করুন।');
            return;
        }

        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, sender:sender_id(name), receiver:receiver_id(name)')
            .eq('receiver_id', dealerId)
            .order('created_at', { ascending: false });

        if (error) {
            alert('হিস্টোরি লোড করা সম্ভব হয়নি: ' + error.message);
            return;
        }
        
        tokenHistoryContainer.innerHTML = '';
        if (transactions.length === 0) {
            tokenHistoryContainer.innerHTML = '<p>কোনো টোকেন হিস্টোরি পাওয়া যায়নি।</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>পরিমাণ</th>
                    <th>ধরণ</th>
                    <th>প্রেরক</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        transactions.forEach(tx => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(tx.created_at).toLocaleString()}</td>
                <td>${tx.amount}</td>
                <td>${tx.type}</td>
                <td>${tx.sender ? tx.sender.name : 'অ্যাডমিন'}</td>
            `;
        });

        tokenHistoryContainer.appendChild(table);
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
    
    const today = new Date().toISOString().split('T')[0];

    let { data: results, error } = await supabase
        .from('results')
        .select('*')
        .lt('date', today)
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

// রিপোর্ট ডাউনলোড ফাংশন
async function generateReport(dealerId, reportDate) {
    const { data: dailyPlays, error } = await supabase
        .from('daily_plays')
        .select('*')
        .eq('dealer_id', dealerId)
        .eq('play_date', reportDate);

    if (error) {
        alert('রিপোর্ট লোড করা সম্ভব হয়নি: ' + error.message);
        return;
    }

    if (dailyPlays.length === 0) {
        alert('এই তারিখে কোনো রিপোর্ট পাওয়া যায়নি।');
        return;
    }

    // CSV ফাইল তৈরি করা
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Dealer Name,Play Time,Played Numbers,Winning Number,Total Tokens Spent,Total Prize Tokens\r\n";
    
    const dealerName = (await supabase.from('dealers').select('name').eq('id', dealerId).single()).data.name;

    dailyPlays.forEach(play => {
        const playedNumbers = Object.keys(play.plays).map(num => `${num}(${play.plays[num]})`).join('; ');
        
        // এখানে হাইলাইট করার লজিক দরকার। CSV-তে হাইলাইট করা যায় না, তাই একটি নোট যোগ করা হবে।
        const winningNumber = play.winning_number;
        
        csvContent += `${dealerName},${play.play_time},"${playedNumbers}",${winningNumber},${play.total_spent},${play.total_prize}\r\n`;
    });

    // ফাইল ডাউনলোড
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${dealerName}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
