// Your Supabase URL and anon (public) Key go here.
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";

// Supabase library is loaded directly.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Load functions based on URL.
    if (window.location.pathname.endsWith('admin.html')) {
        setupAdminPanel();
    } else if (window.location.pathname.endsWith('dealer-dashboard.html')) {
        setupDealerDashboard();
    } else {
        setupPublicWebsite();
    }
});

// --- Functions for Public Website ---
function setupPublicWebsite() {
    fetchTodayResults();
    fetchOldResults();
    setupLoginButton();
    startLiveAnimation();
    
    // Add realtime subscription.
    supabase.channel('results_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'results' }, (payload) => {
            console.log('New result added:', payload.new);
            fetchTodayResults();
        })
        .subscribe();
}

// --- Functions for Admin Panel ---
async function setupAdminPanel() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const loginForm = document.getElementById('common-login-form');
    const loginSection = document.getElementById('login-section');
    const dataEntrySection = document.getElementById('data-entry-section');
    const logoutBtn = document.getElementById('logout-btn');
    const authError = document.getElementById('auth-error');
    const resultForm = document.getElementById('result-form');
    const dealerForm = document.getElementById('dealer-form');
    const tokenTransferForm = document.getElementById('token-transfer-form');
    const bajiSelectAdmin = document.getElementById('baji-select');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const resultMessage = document.getElementById('result-message');
    const dealerMessage = document.getElementById('dealer-message');
    const tokenMessage = document.getElementById('token-message');
    const dealerSelect = document.getElementById('dealer-select');
    const reportDealerSelect = document.getElementById('report-dealer-select');
    const reportDateInput = document.getElementById('report-date-input');
    const showReportBtn = document.getElementById('showReportBtn');
    const showGraphBtn = document.getElementById('showGraphBtn');
    const reportContainer = document.getElementById('reportContainer');
    const graphContainer = document.getElementById('graphContainer');
    let myChartInstance = null;

    // Populate baji select for admin
    function populateBajiSelect() {
        bajiSelectAdmin.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Baji ${i}`;
            bajiSelectAdmin.appendChild(option);
        }
    }
    populateBajiSelect();

    // Check if admin is logged in
    if (session) {
        loginSection.style.display = 'none';
        dataEntrySection.style.display = 'block';
        logoutBtn.style.display = 'block';
        await populateDealers();
        await populateDealerReportSelect();
    } else {
        loginSection.style.display = 'block';
        dataEntrySection.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

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
        authError.textContent = '';

        // First, try to log in as an admin using Supabase Auth.
        const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
            email: nameOrEmail,
            password: password,
        });

        if (adminAuthData.session) {
            window.location.reload();
        } else {
            // If admin login fails, try to log in as a dealer.
            const { data: dealerData, error: dealerError } = await supabase
                .from('dealers')
                .select('*')
                .eq('name', nameOrEmail)
                .eq('password', password)
                .single();

            if (dealerData) {
                window.location.href = `dealer-dashboard.html?dealerId=${dealerData.id}`;
            } else {
                authError.textContent = 'Login failed. Please enter the correct name/email and password.';
            }
        }
    });

    resultForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('date-input').value;
        const baji = parseInt(bajiSelectAdmin.value);
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
                .insert([{ sender_id: session.user.id, receiver_id: dealerId, amount: amount, type: 'credit' }]);
            
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
        
        reportDealerSelect.innerHTML = '<option value="">Select Dealer</option>';
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
            alert("Please select a dealer and a date.");
        }
    });

    showGraphBtn.addEventListener('click', () => {
        const reportDate = reportDateInput.value;
        if (reportDate) {
            fetchAndDisplayGraph(reportDate);
        } else {
            alert("Please select a date.");
        }
    });

    async function fetchAndDisplayReport(dealerId, reportDate) {
        const { data: plays, error } = await supabase
            .from('plays')
            .select('*')
            .eq('dealer_id', dealerId)
            .eq('play_date', reportDate);

        if (error || !plays || plays.length === 0) {
            reportContainer.innerHTML = '<p>No report found for this date.</p>';
            return;
        }

        const { data: results } = await supabase
            .from('results')
            .select('*')
            .eq('date', reportDate);
            
        reportContainer.innerHTML = `<h2>Report for ${reportDate}</h2>`;
        reportContainer.innerHTML += '<table border="1" style="width:100%; text-align:center;">';
        reportContainer.innerHTML += '<thead><tr><th>Time</th><th>Played Numbers</th><th>Winning Number</th><th>Spent</th><th>Prize</th><th>Profit/Loss</th></tr></thead>';
        reportContainer.innerHTML += '<tbody>';
        
        let totalSpent = 0;
        let totalPrize = 0;

        plays.forEach(play => {
            const result = results.find(r => r.slot_id === play.baji_slot);
            const winningNumber = result ? result.single_number : '-';
            
            const playedNumbers = Object.keys(play.played_numbers).map(num => `${num}(${play.played_numbers[num]})`).join(', ');
            
            const prizeTokens = (winningNumber !== '-' && play.played_numbers[winningNumber]) ? play.played_numbers[winningNumber] * 90 : 0;
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
                <td colspan="3">Total</td>
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
            graphContainer.innerHTML = '<p>No data found for this date.</p>';
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
                    label: 'Most tokens placed on',
                    data: data,
                    backgroundColor: 'rgba(243, 156, 18, 0.7)',
                    borderColor: 'rgba(243, 156, 18, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Number' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Tokens' } }
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

// --- Functions for Dealer Dashboard ---
async function setupDealerDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const dealerId = urlParams.get('dealerId');
    
    const dealerNameDisplay = document.getElementById('dealer-name-display');
    const tokenBalanceDisplay = document.getElementById('current-token-balance');
    const logoutBtn = document.getElementById('logout-btn');
    const bettingForm = document.getElementById('betting-form');
    const betNumberInput = document.getElementById('bet-number');
    const betAmountInput = document.getElementById('bet-amount');
    const betMessage = document.getElementById('bet-message');
    const slipsContainer = document.getElementById('slips-container');
    const bajiSelect = document.getElementById('baji-select');
    const bettingClosedMessage = document.getElementById('betting-closed-message');

    if (!dealerId) {
        window.location.href = 'admin.html'; // Redirect to login page if dealerId is not in URL
        return;
    }

    const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('name')
        .eq('id', dealerId)
        .single();
    
    if (dealerData) {
        dealerNameDisplay.textContent = `Welcome, ${dealerData.name}!`;
    } else {
        dealerNameDisplay.textContent = `Welcome!`;
        console.error('Failed to fetch dealer name:', dealerError.message);
    }
    
    logoutBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    
    async function updateDealerBalance() {
        const { data, error } = await supabase
            .from('dealers')
            .select('token_balance')
            .eq('id', dealerId)
            .single();

        if (data) {
            tokenBalanceDisplay.textContent = `Your Token Balance: ${data.token_balance || 0} tokens`;
        } else {
            console.error('Failed to fetch dealer balance:', error.message);
        }
    }

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
    
    bettingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const baji = parseInt(bajiSelect.value);
        const number = parseInt(betNumberInput.value);
        const amount = parseInt(betAmountInput.value);

        if (isNaN(number) || number < 0 || number > 9 || isNaN(amount) || amount <= 0) {
            betMessage.textContent = 'Please enter a valid number (0-9) and amount.';
            betMessage.style.color = 'red';
            return;
        }

        const { data: dealer, error: fetchError } = await supabase
            .from('dealers')
            .select('token_balance')
            .eq('id', dealerId)
            .single();
        
        if (fetchError || dealer.token_balance < amount) {
            betMessage.textContent = 'You do not have enough tokens.';
            betMessage.style.color = 'red';
            return;
        }
        
        const newBalance = dealer.token_balance - amount;

        const { error: updateError } = await supabase
            .from('dealers')
            .update({ token_balance: newBalance })
            .eq('id', dealerId);

        if (updateError) {
            betMessage.textContent = 'Failed to update tokens: ' + updateError.message;
            betMessage.style.color = 'red';
            return;
        }

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
            betMessage.textContent = 'Failed to save bet: ' + playError.message;
            betMessage.style.color = 'red';
            await supabase.from('dealers').update({ token_balance: dealer.token_balance }).eq('id', dealerId);
            return;
        }

        betMessage.textContent = 'Bet placed successfully!';
        betMessage.style.color = 'green';
        bettingForm.reset();
        await updateDealerBalance();
        await fetchAndDisplaySlips(dealerId);
    });

    async function fetchAndDisplaySlips(dealerId) {
        const today = new Date().toISOString().split('T')[0];
        const { data: plays, error } = await supabase
            .from('plays')
            .select('*')
            .eq('dealer_id', dealerId)
            .eq('play_date', today)
            .order('baji_slot', { ascending: true });

        if (error || !plays || plays.length === 0) {
            slipsContainer.innerHTML = '<p style="text-align: center;">No bets placed today.</p>';
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
            const prize = won ? (betAmount * 90) : 0;
            const statusColor = won ? 'green' : 'red';
            const statusText = won ? 'Congratulations, you won!' : 'Sorry, you lost.';
            
            slip.innerHTML = `
                <h3>${play.baji_slot}th Baji - ${play.play_time}</h3>
                <p><strong>Your Number:</strong> ${playedNumber} (Tokens: ${betAmount})</p>
                <p><strong>Winning Number:</strong> ${winningNumber}</p>
                <p style="color: ${statusColor}; font-weight: bold;">${statusText}</p>
                <p><strong>Prize Tokens:</strong> ${prize}</p>
            `;
            slipsContainer.appendChild(slip);
        });
    }

    updateDealerBalance();
    setupBajiSchedule();
    fetchAndDisplaySlips(dealerId);
    
    setInterval(() => {
        updateDealerBalance();
        fetchAndDisplaySlips(dealerId);
    }, 10000);
}

// --- Common Functions for Both Panels ---
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
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US');
}

async function fetchOldResults() {
    const { data: results, error } = await supabase
        .from('old_results') // Changed to fetch from 'old_results' table
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
            <div class="result-date">${new Date(date).toLocaleDateString('en-US')}</div>
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
