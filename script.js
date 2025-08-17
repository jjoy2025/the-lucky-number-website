// Chart.js লাইব্রেরি লোড করা
import 'https://cdn.jsdelivr.net/npm/chart.js';

// Supabase ক্লায়েন্ট তৈরি করা (আপনার Supabase URL এবং Key এখানে থাকবে)
const SUPABASE_URL = "https://urjcuxavrkyqttwtqvjx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyamN1eGF2cmt5cXR0d3Rxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDI5NDIsImV4cCI6MjA3MDk3ODk0Mn0._HzIlEtRtwnsssFGonEqrHcqBm9WtXAx7bWa6S-9ErQ";
const { createClient } = window.Supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Admin প্যানেল বা পাবলিক সাইট যাচাই করা
    if (document.getElementById('login-form')) {
        setupAdminPanel();
    } else {
        fetchTodayResults();
        fetchOldResults();
        setupLoginButton();
        startLiveAnimation();
    }
});

function setupAdminPanel() {
    // আগের কোড
    // লগইন, রেজাল্ট, ডিলার, টোকেন ফর্মের লজিক...

    // নতুন কোড: রিপোর্ট এবং গ্রাফের জন্য ইভেন্ট লিসেনার
    const showReportBtn = document.getElementById('showReportBtn');
    const showGraphBtn = document.getElementById('showGraphBtn');
    const reportDealerSelect = document.getElementById('report-dealer-select');
    const reportDateInput = document.getElementById('report-date-input');
    const reportContainer = document.getElementById('reportContainer');
    const graphContainer = document.getElementById('graphContainer');

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
        const dealerId = reportDealerSelect.value;
        const reportDate = reportDateInput.value;
        if (dealerId && reportDate) {
            fetchAndDisplayGraph(dealerId, reportDate);
        } else {
            alert("অনুগ্রহ করে ডিলার এবং তারিখ সিলেক্ট করুন।");
        }
    });

    // ডিলারদের তালিকা লোড করা
    async function loadDealers() {
        const { data: dealers, error } = await supabase.from('dealers').select('*');
        if (error) {
            console.error('Failed to load dealers:', error.message);
            return;
        }
        
        // টোকেন আপডেটের ড্রপডাউন
        const dealerSelect = document.getElementById('dealerSelect');
        dealerSelect.innerHTML = '<option value="">ডিলার নির্বাচন করুন</option>';
        // রিপোর্টের ড্রপডাউন
        reportDealerSelect.innerHTML = '<option value="">ডিলার নির্বাচন করুন</option>';
        
        dealers.forEach(dealer => {
            // টোকেন আপডেটের জন্য
            const option1 = document.createElement('option');
            option1.value = dealer.id;
            option1.textContent = `${dealer.name} (${dealer.token || 0} টোকেন)`;
            dealerSelect.appendChild(option1);

            // রিপোর্টের জন্য
            const option2 = document.createElement('option');
            option2.value = dealer.id;
            option2.textContent = dealer.name;
            reportDealerSelect.appendChild(option2);
        });
    }

    // রিপোর্ট লোড এবং প্রদর্শন করার ফাংশন
    async function fetchAndDisplayReport(dealerId, reportDate) {
        // এখানে আপনার গেমপ্লে এবং ফলাফলের ডেটা আনতে হবে
        const { data: results, error } = await supabase
            .from('results') // এখানে আপনার গেমের রেজাল্ট টেবিলের নাম দিন
            .select('*')
            .eq('date', reportDate)
            .order('slot_id', { ascending: true });

        if (error || !results || results.length === 0) {
            reportContainer.innerHTML = '<p>এই তারিখে কোনো ডেটা পাওয়া যায়নি।</p>';
            return;
        }

        // এখানে আমরা একটি সাধারণ HTML টেবিল তৈরি করব
        let htmlContent = '<h2>' + reportDate + ' এর রিপোর্ট</h2>';
        htmlContent += '<table border="1" style="width:100%; text-align:center;">';
        htmlContent += '<thead><tr><th>বাজি</th><th>ফলাফল (পত্তি)</th><th>ফলাফল (সিঙ্গেল)</th></tr></thead>';
        htmlContent += '<tbody>';
        
        results.forEach(result => {
            htmlContent += `<tr>
                <td>${result.slot_id}</td>
                <td>${result.patti_number}</td>
                <td>${result.single_number}</td>
            </tr>`;
        });
        
        htmlContent += '</tbody></table>';
        reportContainer.innerHTML = htmlContent;
        graphContainer.innerHTML = '';
    }

    // গ্রাফ লোড এবং প্রদর্শন করার ফাংশন
    let myChartInstance = null;
    async function fetchAndDisplayGraph(dealerId, reportDate) {
        // এখানে আপনার গেমপ্লে ডেটা আনতে হবে
        const { data: plays, error } = await supabase
            .from('plays') // এখানে আপনার গেমের ডেটা টেবিলের নাম দিন
            .select('number, token_amount')
            .eq('dealer_id', dealerId)
            .eq('play_date', reportDate);

        if (error || !plays || plays.length === 0) {
            graphContainer.innerHTML = '<p>এই তারিখে কোনো ডেটা পাওয়া যায়নি।</p>';
            return;
        }

        // ডেটা প্রক্রিয়াকরণ
        const tokenData = {};
        plays.forEach(play => {
            if (tokenData[play.number]) {
                tokenData[play.number] += play.token_amount;
            } else {
                tokenData[play.number] = play.token_amount;
            }
        });

        const labels = Object.keys(tokenData);
        const data = Object.values(tokenData);

        // গ্রাফ তৈরি
        if (myChartInstance) {
            myChartInstance.destroy();
        }

        const ctx = document.getElementById('myChart').getContext('2d');
        myChartInstance = new Chart(ctx, {
            type: 'bar', // আপনি 'pie' বা 'line' ও ব্যবহার করতে পারেন
            data: {
                labels: labels,
                datasets: [{
                    label: 'টোকেন পড়েছে',
                    data: data,
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        reportContainer.innerHTML = '';
    }
}

// এই কোডগুলো আপনার আগের কোড থেকে সরাসরি কপি করা হয়েছে
// ... (fetchTodayResults, fetchOldResults, setupLoginButton, startLiveAnimation)
// আপনার আগের কোড থেকে এগুলো এখানে পেস্ট করুন।
