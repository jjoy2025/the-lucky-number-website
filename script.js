// আপনার Supabase URL এবং anon (public) Key এখানে বসান।
const SUPABASE_URL = "https://wjjhdmjqtvwmhhkuqinw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqamhkbWpxdHZ3bWhoa3VxaW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODg2ODQsImV4cCI6MjA3MDk2NDY4NH0.-Dy15M98Bsl4iWSxA_MRefXO6EfvZFk1bJZkqV3Tfzw";

// Supabase ক্লায়েন্ট তৈরি করা
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchTodayResults();
    fetchOldResults();
    setupLoginButton();
    startLiveAnimation();
});

// লাইভ অ্যানিমেশন শুরু করার ফাংশন
function startLiveAnimation() {
    const liveAnimation = document.querySelector('.today-result .date-header');
    if (liveAnimation) {
        liveAnimation.classList.add('live-animation');
    }
}

// আজকের ফলাফল দেখানোর জন্য ফাংশন
async function fetchTodayResults() {
    const resultsContainer = document.querySelector('.results-grid');
    resultsContainer.innerHTML = '';
    
    // আজকের তারিখ বের করা
    const today = new Date().toISOString().split('T')[0];

    // Supabase থেকে আজকের ডেটা লোড করা
    let { data: results, error } = await supabase
        .from('results')
        .select('*')
        .eq('date', today)
        .order('slot_id', { ascending: true }); // আপনার কলামের নাম `slot_id` ব্যবহার করা হয়েছে

    if (error) {
        console.error('আজকের ডেটা লোড করার সময় ভুল হয়েছে:', error);
        return;
    }

    // ডেটা লোড হলে তা প্রদর্শন করা
    if (results.length > 0) {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `
                <div class="patti">${result.patti_number}</div>
                <div class="single">${result.single_number}</div>
            `; // আপনার কলামের নাম ব্যবহার করা হয়েছে
            resultsContainer.appendChild(resultItem);
        });
    } else {
        // যদি কোনো ডেটা না থাকে
        for (let i = 0; i < 8; i++) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `
                <div class="patti">---</div>
                <div class="single">-</div>
            `;
            resultsContainer.appendChild(resultItem);
        }
    }

    console.log('আজকের ফলাফল লোড হয়েছে।');
}

// পুরোনো ফলাফল দেখানোর জন্য ফাংশন
async function fetchOldResults() {
    const oldResultsContainer = document.querySelector('.old-results-container');
    oldResultsContainer.innerHTML = '';

    // Supabase থেকে পুরোনো ডেটা লোড করা
    let { data: results, error } = await supabase
        .from('results')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('পুরোনো ডেটা লোড করার সময় ভুল হয়েছে:', error);
        return;
    }
    
    // ডেটা তারিখ অনুযায়ী গ্রুপ করা
    const groupedResults = results.reduce((acc, curr) => {
        const date = curr.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(curr);
        return acc;
    }, {});
    
    // গ্রুপ করা ডেটা প্রদর্শন করা
    for (const date in groupedResults) {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'old-results-day';
        dayContainer.innerHTML = `<div class="result-date">${date}</div>`;
        
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        // প্রতিটি দিনের ফলাফল প্রদর্শন
        groupedResults[date].sort((a, b) => a.slot_id - b.slot_id).forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `
                <div class="patti">${result.patti_number}</div>
                <div class="single">${result.single_number}</div>
            `;
            resultsGrid.appendChild(resultItem);
        });
        
        dayContainer.appendChild(resultsGrid);
        oldResultsContainer.appendChild(dayContainer);
    }
    
    console.log('পুরোনো ফলাফল লোড হয়েছে।');
}

// লগইন বাটনের জন্য ফাংশন
function setupLoginButton() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            alert('লগইন পেজে যাচ্ছে...');
        });
    }
}
