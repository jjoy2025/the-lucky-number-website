
// আপনার API Key এখানে বসান।
// দয়া করে YOUR_API_KEY_HERE লেখাটি মুছে আপনার আসল Key বসিয়ে দিন।
const API_KEY = "YOUR_API_KEY_HERE";
const API_URL = "https://example.com/api/v1/results"; // এটি একটি উদাহরণ URL

// DOMContentLoaded ইভেন্টটি নিশ্চিত করে যে HTML লোড হওয়ার পরেই এই কোডটি কাজ করা শুরু করবে।
document.addEventListener('DOMContentLoaded', () => {
    displayCurrentDate();
    fetchTodayResults();
    fetchOldResults();
    setupLoginButton();
});

// বর্তমান তারিখ দেখানোর জন্য ফাংশন
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = today.toLocaleDateString('bn-BD', options);
    }
}

// আজকের ফলাফল দেখানোর জন্য ফাংশন (এই ফাংশনে আপনার API কল হবে)
function fetchTodayResults() {
    const resultsContainer = document.querySelector('.results-grid');

    // এখানে আমরা একটি উদাহরণ ডেটা ব্যবহার করছি।
    // আসল কোডে, আপনি fetch() ব্যবহার করে API থেকে ডেটা নেবেন।
    const dummyResults = [
        { patti: '123', single: '6' },
        { patti: '456', single: '5' },
        { patti: '789', single: '4' },
        { patti: '135', single: '9' },
        { patti: '246', single: '2' },
        { patti: '357', single: '5' },
        { patti: '802', single: '3' },
        { patti: '913', single: '7' }
    ];

    resultsContainer.innerHTML = ''; // পুরোনো ডেটা মুছে ফেলা
    dummyResults.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-box-item';
        resultItem.innerHTML = `
            <div class="patti">${result.patti}</div>
            <div class="single">${result.single}</div>
        `;
        resultsContainer.appendChild(resultItem);
    });

    console.log('আজকের ফলাফল লোড হয়েছে।');
}

// পুরোনো ফলাফল দেখানোর জন্য ফাংশন (এই ফাংশনেও আপনার API কল হবে)
function fetchOldResults() {
    const oldResultsContainer = document.querySelector('.old-results-container');
    
    // এখানেও আমরা একটি উদাহরণ ডেটা ব্যবহার করছি।
    const dummyOldResults = [
        { date: '16 Aug 2025', results: [{ patti: '111', single: '3' }, { patti: '222', single: '6' }] },
        { date: '15 Aug 2025', results: [{ patti: '333', single: '9' }, { patti: '444', single: '2' }] }
    ];
    
    oldResultsContainer.innerHTML = '';
    dummyOldResults.forEach(dayResult => {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'old-results-day';
        dayContainer.innerHTML = `<div class="result-date">${dayResult.date}</div>`;
        
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';
        
        dayResult.results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-box-item';
            resultItem.innerHTML = `
                <div class="patti">${result.patti}</div>
                <div class="single">${result.single}</div>
            `;
            resultsGrid.appendChild(resultItem);
        });
        
        dayContainer.appendChild(resultsGrid);
        oldResultsContainer.appendChild(dayContainer);
    });
    
    console.log('পুরোনো ফলাফল লোড হয়েছে।');
}

// লগইন বাটনের জন্য ফাংশন
function setupLoginButton() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault(); // লিংকের ডিফল্ট আচরণ বন্ধ করা
            alert('লগইন পেজে যাচ্ছে...'); // এখানে আপনার লগইন পেজের কোড বা ফাংশনালিটি থাকবে
        });
    }
}
