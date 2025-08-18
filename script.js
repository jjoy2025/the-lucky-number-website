// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";

// Supabase লাইব্রেরি সরাসরি লোড করা হচ্ছে
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // URL অনুযায়ী ফাংশন লোড করা
    if (window.location.pathname.endsWith('admin.html')) {
        setupAdminPanel();
    } else if (window.location.pathname.endsWith('dealer-dashboard.html')) {
        setupDealerDashboard();
    } else {
        setupPublicWebsite();
    }
});

// --- পাবলিক ওয়েবসাইটের জন্য ফাংশন ---
function setupPublicWebsite() {
    fetchTodayResults();
    fetchOldResults();
    setupLoginButton();
    startLiveAnimation();
    
    // রিয়েলটাইম সাবস্ক্রিপশন যোগ করুন
    supabase.channel('results_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'results' }, (payload) => {
            console.log('New result added:', payload.new);
            fetchTodayResults();
        })
        .subscribe();
}

// --- এডমিন প্যানেলের জন্য ফাংশন ---
function setupAdminPanel() {
    const loginForm = document.getElementById('common-login-form');
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
    
    const reportDealerSelect = document.getElementById('report-dealer-select');
    const reportDateInput = document.getElementById('report-date-input');
    const showReportBtn = document.getElementById('showReportBtn');
    const showGraphBtn = document.getElementById('showGraphBtn');
    const reportContainer = document.getElementById('reportContainer');
    const graphContainer = document.getElementById('graphContainer');
    let myChartInstance = null;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            if (myChartInstance) {
                myChartInstance.destroy();
                myChartInstance = null;
            }
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameOrEmail = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        // প্রথমে এডমিন হিসেবে Supabase Auth দিয়ে লগইন চেষ্টা
        const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
            email: nameOrEmail,
            password: password,
        });

        if (adminAuthData.session) {
            // এডমিন লগইন সফল হলে
            loginSection.style.display = 'none';
            dataEntrySection.style.display = 'block';
            await populateDealers();
            await populateDealerReportSelect();
        } else {
            // যদি এডমিন লগইন ব্যর্থ হয়, তবে ডিলার হিসেবে লগইন চেষ্টা
            const { data: dealerData, error: dealerError } = await supabase
                .from('dealers')
                .select('*')
                .eq('name', nameOrEmail)
                .eq('password', password)
                .single();

            if (dealerData) {
                // ডিলার লগইন সফল হলে
                localStorage.setItem('currentDealerId', dealerData.id);
                localStorage.setItem('currentDealerName', dealerData.name);
                window.location.href = 'dealer-dashboard.html';
            } else {
                authError.textContent = 'লগইন ব্যর্থ। অনুগ্রহ করে সঠিক নাম/ইমেইল এবং পাসওয়ার্ড দিন।';
            }
        }
    });

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

    dealerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('dealer-name').value;
        const phone = document.getElementById('dealer-phone').value;
        const password = document.getElementById('dealer-password').value;

        const { data, error } = await supabase
            .from('dealers')
            .insert([{ name: name, phone_number: phone, password: password, token_balance: 0 }]);
        
        if (error) {
            dealerMessage.textContent = 'Failed to add dealer: ' + error.message;
            dealerMessage.style.color = 'red';
        } else {
            dealerMessage.textContent = 'Dealer added successfully!';
            dealerMessage.style.color = 'green';
            dealerForm.reset();
            await populateDealers();
            await populateDealerReportSelect();
        }
    });

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

    showReportBtn.addEventListener('click', () => {
        const dealerId = reportDealerSelect.value;
        const reportDate = reportDateInput.value;
        if (dealerId && reportDate) {
            fetchAndDisplayReport(dealerId, reportDate);
        } else {
            alert("অনুগ্রহ করে ডিলার এবং তারিখ সিলেক্ট করুন।");
        }
    });

    showGraphBtn.addEventListener('click', () => {
        const reportDate = reportDateInput.value;
        if (reportDate) {
            fetchAndDisplayGraph(reportDate);
        } else {
            alert("অনুগ্রহ করে তারিখ সিলেক্ট করুন।");
        }
    });

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
            
            const prizeTokens = play.played_numbers[winningNumber] * 90;
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

    async function fetchAndDisplayGraph(reportDate) {
        const { data: plays, error } = await supabase
            .from('plays')
            .select('played_numbers')
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
    
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        window.location.reload();
    });

}

// --- ডিলার ড্যাশবোর্ডের জন্য ফাংশন ---
function setupDealerDashboard() {
    const dealerId = localStorage.getItem('currentDealerId');
    const dealerName = localStorage.getItem('currentDealerName');
    
    const dealerNameDisplay = document.getElementById('dealer-name-display');
    const tokenBalanceDisplay = document.getElementById('current-token-balance');
    const logoutBtn = document.getElementById('logout-btn');
    const bettingForm = document.getElementById('betting-form');
    const betNumberInput = document.getElementById('bet-number');
    const betAmountInput = document.getElementById('bet-amount');
    const betMessage = document.getElementById('bet-message');
    const slipsContainer = document.getElementById('slips-container');
    const bajiSelect = document.getElementById('baji-select');
    const placeBetBtn = document.getElementById('place-bet-btn');
    const bettingClosedMessage = document.getElementById('betting-closed-message');

    if (!dealerId) {
        window.location.href = 'admin.html'; // যদি ডিলার লগইন না থাকে, লগইন পেজে ফিরিয়ে দিন
        return;
    }

    dealerNameDisplay.textContent = `স্বাগতম, ${dealerName}!`;
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentDealerId');
        localStorage.removeItem('currentDealerName');
        window.location.href = 'admin.html';
    });
    
    // টোকেন ব্যালেন্স আপডেট করা
    async function updateDealerBalance() {
        const { data, error } = await supabase
            .from('dealers')
            .select('token_balance')
            .eq('id', dealerId)
            .single();

        if (data) {
            tokenBalanceDisplay.textContent = `আপনার টোকেন ব্যালেন্স: ${data.token_balance || 0} টোকেন`;
        } else {
            console.error('Failed to fetch dealer balance:', error.message);
        }
    }

    // বাজি সিলেক্ট অপশন পপুলেট করা এবং বেটিং বন্ধ করার লজিক
    async function setupBajiSchedule() {
        const bajiSlots = [
            { id: 1, time: '11:00 AM', hour: 11, minute: 0 },
            { id: 2, time: '12:30 PM', hour: 12, minute: 30 },
            { id: 3, time: '2:00 PM', hour: 14, minute: 0 },
            { id: 4, time: '3:30 PM', hour: 15, minute: 30 },
            { id: 5, time: '5:00 PM', hour: 17, minute: 0 },
            { id: 6, time: '6:30 PM', hour: 18, minute: 30 },
            { id: 7, time: '8:00 PM', hour: 20, minute: 0 },
            { id: 8, time: '9:00 PM', hour: 21, minute: 0 }
        ];

        bajiSelect.innerHTML = '';
        const now = new Date();
        const nextBaji = bajiSlots.find(baji => {
            const bajiTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), baji.hour, baji.minute);
            const timeDifference = (bajiTime.getTime() - now.getTime()) / (1000 * 60);
            return timeDifference > 20;
        });

        if (nextBaji) {
            const option = document.createElement('option');
            option.value = nextBaji.id;
            option.textContent = `${nextBaji.id}th Baji - ${nextBaji.time}`;
            bajiSelect.appendChild(option);
        } else {
            bettingForm.style.display = 'none';
            bettingClosedMessage.style.display = 'block';
        }
    }
    
    // বেটিং ফর্ম জমা দেওয়া
    bettingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const baji = parseInt(bajiSelect.value);
        const number = parseInt(betNumberInput.value);
        const amount = parseInt(betAmountInput.value);

        if (isNaN(number) || number < 0 || number > 9 || isNaN(amount) || amount <= 0) {
            betMessage.textContent = 'অনুগ্রহ করে সঠিক নম্বর (0-9) এবং পরিমাণ লিখুন।';
            betMessage.style.color = 'red';
            return;
        }

        const { data: dealer, error: fetchError } = await supabase
            .from('dealers')
            .select('token_balance')
            .eq('id', dealerId)
            .single();
        
        if (fetchError || dealer.token_balance < amount) {
            betMessage.textContent = 'আপনার পর্যাপ্ত টোকেন নেই।';
            betMessage.style.color = 'red';
            return;
        }
        
        const newBalance = dealer.token_balance - amount;

        // ডিলারের টোকেন ব্যালেন্স আপডেট করা
        const { error: updateError } = await supabase
            .from('dealers')
            .update({ token_balance: newBalance })
            .eq('id', dealerId);

        if (updateError) {
            betMessage.textContent = 'টোকেন আপডেটে ব্যর্থ: ' + updateError.message;
            betMessage.style.color = 'red';
            return;
        }

        // বেটিং ডেটা সেভ করা
        const { error: playError } = await supabase
            .from('plays')
            .insert([{ 
                dealer_id: dealerId,
                played_numbers: { [number]: amount },
                total_spent_tokens: amount,
                play_date: new Date().toISOString().split('T')[0],
                play_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                baji_slot: baji
            }]);

        if (playError) {
            betMessage.textContent = 'বেট সেভ করতে ব্যর্থ: ' + playError.message;
            betMessage.style.color = 'red';
            await supabase.from('dealers').update({ token_balance: dealer.token_balance }).eq('id', dealerId); // যদি সেভ না হয়, টোকেন ফিরিয়ে দিন
            return;
        }

        betMessage.textContent = 'বেট সফল হয়েছে!';
        betMessage.style.color = 'green';
        bettingForm.reset();
        await updateDealerBalance(); // নতুন ব্যালেন্স ডিসপ্লে করা
        await fetchAndDisplaySlips(); // নতুন স্লিপ ডিসপ্লে করা
    });

    // ডিলারের স্লিপগুলো ডিসপ্লে করা
    async function fetchAndDisplaySlips() {
        const today = new Date().toISOString().split('T')[0];
        const { data: plays, error } = await supabase
            .from('plays')
            .select('*')
            .eq('dealer_id', dealerId)
            .eq('play_date', today)
            .order('baji_slot', { ascending: true });

        if (error || !plays || plays.length === 0) {
            slipsContainer.innerHTML = '<p style="text-align: center;">আজকে কোনো বেট করা হয়নি।</p>';
            return;
        }

        const { data: results } = await supabase
            .from('results')
            .select('*')
            .eq('date', today);

        slipsContainer.innerHTML = '';
        plays.forEach(play => {
            const slip = document.createElement('div');
            slip.className = 'admin-section';
            const result = results.find(r => r.slot_id === play.baji_slot);
            const winningNumber = result ? result.single_number : '-';
            const playedNumber = Object.keys(play.played_numbers)[0];
            const betAmount = play.played_numbers[playedNumber];
            const won = (winningNumber !== '-') && (parseInt(playedNumber) === winningNumber);
            const prize = won ? (betAmount * 9) : 0;
            const statusColor = won ? 'green' : 'red';
            const statusText = won ? 'অভিনন্দন, আপনি জিতেছেন!' : 'দুঃখিত, আপনি হেরেছেন।';
            
            slip.innerHTML = `
                <h3>${play.baji_slot}th Baji - ${play.play_time}</h3>
                <p><strong>আপনার নম্বর:</strong> ${playedNumber} (টোকেন: ${betAmount})</p>
                <p><strong>বিজয়ী নম্বর:</strong> ${winningNumber}</p>
                <p style="color: ${statusColor}; font-weight: bold;">${statusText}</p>
                <p><strong>প্রাপ্ত টোকেন:</strong> ${prize}</p>
            `;
            slipsContainer.appendChild(slip);
        });
    }

    // ড্যাশবোর্ড লোড হওয়ার সাথে সাথে ফাংশনগুলো কল করা
    updateDealerBalance();
    setupBajiSchedule();
    fetchAndDisplaySlips();
    
    // প্রতি 10 সেকেন্ডে ব্যালেন্স এবং স্লিপ আপডেট করা
    setInterval(() => {
        updateDealerBalance();
        fetchAndDisplaySlips();
    }, 10000);
}

// --- উভয় প্যানেলের জন্য কমন ফাংশন ---
function setupLoginButton() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.href = 'admin.html';
    }
}

async function fetchTodayResults() {
    const today = new Date().toISOString().split('T')[0];
    const { data: results, error } = await supabase
        .from('results')
        .select('*')
        .eq('date', today)
        .order('slot_id', { ascending: true });

    if (error) {
        console.error('Error fetching today\'s results:', error.message);
        return;
    }

    const resultsGrid = document.querySelector('.today-result .results-grid');
    resultsGrid.innerHTML = '';

    const slotMap = new Map();
    results.forEach(result => {
        slotMap.set(result.slot_id, result);
    });

    for (let i = 1; i <= 8; i++) {
        const result = slotMap.get(i);
        const patti = result ? result.patti_number : '- - -';
        const single = result ? result.single_number : '-';

        const resultBox = document.createElement('div');
        resultBox.className = 'result-box-item';
        resultBox.innerHTML = `
            <div class="patti">${patti}</div>
            <div class="single">${single}</div>
        `;
        resultsGrid.appendChild(resultBox);
    }
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('bn-IN');
}

async function fetchOldResults() {
    const { data: results, error } = await supabase
        .from('results')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching old results:', error.message);
        return;
    }

    const groupedResults = results.reduce((acc, result) => {
        const date = result.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(result);
        return acc;
    }, {});

    const oldResultsContainer = document.querySelector('.old-results-container');
    oldResultsContainer.innerHTML = '';

    for (const date in groupedResults) {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'old-results-day';
        dayContainer.innerHTML = `
            <div class="result-date">${new Date(date).toLocaleDateString('bn-IN')}</div>
            <div class="results-grid"></div>
        `;
        oldResultsContainer.appendChild(dayContainer);

        const resultsGrid = dayContainer.querySelector('.results-grid');
        const dayResults = groupedResults[date].sort((a, b) => a.slot_id - b.slot_id);

        for (let i = 1; i <= 8; i++) {
            const result = dayResults.find(r => r.slot_id === i);
            const patti = result ? result.patti_number : '- - -';
            const single = result ? result.single_number : '-';

            const resultBox = document.createElement('div');
            resultBox.className = 'result-box-item';
            resultBox.innerHTML = `
                <div class="patti">${patti}</div>
                <div class="single">${single}</div>
            `;
            resultsGrid.appendChild(resultBox);
        }
    }
}

function startLiveAnimation() {
    const dateHeader = document.querySelector('.today-result .date-header');
    dateHeader.classList.add('live-animation');
}
