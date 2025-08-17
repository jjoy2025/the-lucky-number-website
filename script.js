// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";
// Supabase ক্লায়েন্ট তৈরি করা
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import 'https://cdn.jsdelivr.net/npm/chart.js'; // Chart.js লাইব্রেরি লোড করা

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
    const reportDealerSelect = document.getElementById('report-dealer-select');
    const reportDateInput = document.getElementById('report-date-input');
    const showReportBtn = document.getElementById('showReportBtn');
    const showGraphBtn = document.getElementById('showGraphBtn');
    const reportContainer = document.getElementById('reportContainer');
    const graphContainer = document.getElementById('graphContainer');
    let myChartInstance = null; // গ্রাফের জন্য ইনস্ট্যান্স

    // টাব পরিবর্তন করা
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            // ট্যাব পরিবর্তনের সময় গ্রাফ পরিষ্কার করা
            if (myChartInstance) {
                myChartInstance.destroy();
                myChartInstance = null;
            }
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
        
        reportDealerSelect.innerHTML = '<option value="">ডিলার সিলেক্ট করুন</option>';
        dealers.forEach(dealer => {
            const option = document.createElement('option');
            option.value = dealer.id;
            option.textContent = dealer.name;
            reportDealerSelect.appendChild(option);
        });
    }

    // রিপোর্ট দেখানোর বাটন
    showReportBtn.addEventListener('click', () => {
        const dealerId = reportDealerSelect.value;
        const reportDate = reportDateInput.value;
        if (dealerId && reportDate) {
            fetchAndDisplayReport(dealerId, reportDate);
        } else {
            alert("অনুগ্রহ করে ডিলার এবং তারিখ সিলেক্ট করুন।");
        }
    });

    // গ্রাফ দেখানোর বাটন
    showGraphBtn.addEventListener('click', () => {
        const dealerId = reportDealerSelect.value;
        const reportDate = reportDateInput.value;
        if (dealerId && reportDate) {
            fetchAndDisplayGraph(dealerId, reportDate);
        } else {
            alert("অনুগ্রহ করে ডিলার এবং তারিখ সিলেক্ট করুন।");
        }
    });

    // রিপোর্ট লোড এবং প্রদর্শন করার ফাংশন
    async function fetchAndDisplayReport(dealerId, reportDate) {
        const { data: plays, error } = await supabase
            .from('plays')
            .select('*')
            .eq('dealer_id', dealerId)
            .eq('play_date', reportDate);

        if (error || !plays || plays.length === 0) {
            reportContainer.innerHTML = '<p>এই তারিখে কোনো রিপোর্ট পাওয়া যায়নি।</p>';
            return;
        }

        const { data: results } = await supabase
            .from('results')
            .select('*')
            .eq('date', reportDate);
            
        reportContainer.innerHTML = '<h2>' + reportDate + ' এর রিপোর্ট</h2>';
        reportContainer.innerHTML += '<table border="1" style="width:100%; text-align:center;">';
        reportContainer.innerHTML += '<thead><tr><th>সময়</th><th>খেলার নম্বর</th><th>উইন নম্বর</th><th>খরচ</th><th>প্রাপ্তি</th><th>লাভ/ক্ষতি</th></tr></thead>';
        reportContainer.innerHTML += '<tbody>';
        
        let totalSpent = 0;
        let totalPrize = 0;

        plays.forEach(play => {
            const result = results.find(r => r.slot_id === play.baji_slot);
            const winningNumber = result ? result.single_number : '-';
            
            const playedNumbers = Object.keys(play.played_numbers).map(num => `${num}(${play.played_numbers[num]})`).join(', ');
            
            const prizeTokens = play.played_numbers[winningNumber] * 90; // প্রাইস টোকেন হিসাব
            const profitLoss = prizeTokens - play.total_spent_tokens;

            totalSpent += play.total_spent_tokens;
            totalPrize += prizeTokens;

            reportContainer.innerHTML += `
                <tr>
                    <td>${play.play_time}</td>
                    <td>${playedNumbers}</td>
                    <td>${winningNumber}</td>
                    <td>${play.total_spent_tokens}</td>
                    <td>${prizeTokens}</td>
                    <td>${profitLoss}</td>
                </tr>
            `;
        });
        
        reportContainer.innerHTML += `
            <tr>
                <td colspan="3">মোট</td>
                <td>${totalSpent}</td>
                <td>${totalPrize}</td>
                <td>${totalPrize - totalSpent}</td>
            </tr>
        `;
        reportContainer.innerHTML += '</tbody></table>';
        graphContainer.innerHTML = '';
    }

    // গ্রাফ লোড এবং প্রদর্শন করার ফাংশন
    async function fetchAndDisplayGraph(dealerId, reportDate) {
        const { data: plays, error } = await supabase
            .from('plays')
            .select('played_numbers')
            .eq('dealer_id', dealerId)
            .eq('play_date', reportDate);

        if (error || !plays || plays.length === 0) {
            graphContainer.innerHTML = '<p>এই তারিখে কোনো ডেটা পাওয়া যায়নি।</p>';
            if (myChartInstance) myChartInstance.destroy();
            return;
        }
        
        const tokenData = {};
        plays.forEach(play => {
            for (const number in play.played_numbers) {
                const amount = play.played_numbers[number];
                if (tokenData[number]) {
                    tokenData[number] += amount;
                } else {
                    tokenData[number] = amount;
                }
            }
        });

        const labels = Object.keys(tokenData).sort((a,b) => a - b);
        const data = labels.map(label => tokenData[label]);

        if (myChartInstance) {
            myChartInstance.destroy();
        }

        const ctx = document.getElementById('myChart').getContext('2d');
        myChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'সবচেয়ে বেশি টোকেন পড়েছে',
                    data: data,
                    backgroundColor: 'rgba(243, 156, 18, 0.7)',
                    borderColor: 'rgba(243, 156, 18, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'নম্বর' } },
                    y: { beginAtZero: true, title: { display: true, text: 'টোকেন' } }
                }
            }
        });
        reportContainer.innerHTML = '';
    }
    
    // লগআউট বাটনে ক্লিক হলে
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        window.location.reload();
    });
}
