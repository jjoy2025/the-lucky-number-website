 // আপনার API Key এখানে বসান।
 // দয়া করে YOUR_API_KEY_HERE লেখাটি মুছে আপনার আসল Key বসিয়ে দিন।
 const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqamhkbWpxdHZ3bWhoa3VxaW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODg2ODQsImV4cCI6MjA3MDk2NDY4NH0.-Dy15M98Bsl4iWSxA_MRefXO6EfvZFk1bJZkqV3Tfzw";
 const API_URL = "https://example.com/api/v1/results"; // এটি একটি উদাহরণ URL

 // DOMContentLoaded ইভেন্টটি নিশ্চিত করে যে HTML লোড হওয়ার পরেই এই কোডটি কাজ করা শুরু করবে।
 document.addEventListener('DOMContentLoaded', () => {
     // displayCurrentDate(); // বাংলা তারিখ দেখানো বন্ধ করা হলো
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

 // বর্তমান তারিখ দেখানোর জন্য ফাংশন (বন্ধ করা হয়েছে)
 // function displayCurrentDate() {
 //     const dateElement = document.getElementById('current-date');
 //     if (dateElement) {
 //         const today = new Date();
 //         const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
 //         dateElement.textContent = today.toLocaleDateString('bn-BD', options);
 //     }
 // }

 // আজকের ফলাফল দেখানোর জন্য ফাংশন (এই ফাংশনে আপনার API কল হবে)
 function fetchTodayResults() {
     const resultsContainer = document.querySelector('.results-grid');

     // এখানে আমরা একটি উদাহরণ ডেটা ব্যবহার করছি।
     // আসল কোডে, আপনি fetch() ব্যবহার করে API থেকে ডেটা নেবেন।
     const dummyResults = [
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' },
         { patti: '---', single: '-' }
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

     // এখানে আমরা উদাহরণ ডেটা ব্যবহার করছি, 15 তারিখের ফলাফল ফাঁকা এবং 16 তারিখের ফলাফল দেওয়া হলো।
     const dummyOldResults = [
         { date: '16 Aug 2025', results: [{ patti: '777', single: '1' }, { patti: '550', single: '0' }, { patti: '568', single: '9' }, { patti: '379', single: '9' }, { patti: '114', single: '6' }, { patti: '599', single: '3' }, { patti: '227', single: '1' }, { patti: '570', single: '2' }] },
         { date: '15 Aug 2025', results: [] }
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
