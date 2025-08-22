// Function to format date as D-M-YYYY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Display the current date
const dateDisplayElement = document.getElementById("current-date-display");
let today = new Date();
dateDisplayElement.textContent = formatDate(today);

// Betting times (example from index.html)
const betTimes = [
    "11:00", "12:30", "14:00", "15:30",
    "17:00", "18:30", "20:00", "21:00"
];

let dailyTips = null;

function generateDailyTips() {
    const seed = today.toDateString();
    const randomNumbers = [];

    for (let i = 0; i < betTimes.length; i++) {
        const nums = new Set();
        while (nums.size < 4) {
            nums.add(Math.floor(Math.random() * 10));
        }
        randomNumbers.push([...nums]);
    }

    dailyTips = randomNumbers;
}

function updateTipsDisplay() {
    const now = new Date();
    const isNewDay = now.toDateString() !== today.toDateString();

    if (isNewDay) {
        today = now;
        dateDisplayElement.textContent = formatDate(today);
        generateDailyTips(); // Reset tips for the new day
    }

    const tipsContainer = document.getElementById("tips-container");
    // Clear the container before re-drawing
    tipsContainer.innerHTML = '';

    const tipsListContainer = document.createElement("div");
    tipsListContainer.className = "tips-list-container";

    betTimes.forEach((time, index) => {
        const [hours, minutes] = time.split(":").map(Number);
        const betDate = new Date(today);
        betDate.setHours(hours, minutes, 0, 0);

        const showTipsTime = new Date(betDate.getTime() - 20 * 60000);

        const tipsListItem = document.createElement("div");
        tipsListItem.className = "tips-list-item";

        const bajiName = document.createElement("div");
        bajiName.className = "baji-name";
        bajiName.textContent = `${index + 1}st Baji Tips`;

        const tipsNumbers = document.createElement("div");
        tipsNumbers.className = "tips-numbers";

        if (now >= showTipsTime) {
            tipsNumbers.textContent = dailyTips[index].join(", ");
        } else {
            tipsNumbers.textContent = "Calculating...";
            tipsNumbers.classList.add("calculating");
        }

        tipsListItem.appendChild(bajiName);
        tipsListItem.appendChild(tipsNumbers);
        tipsListContainer.appendChild(tipsListItem);
    });

    tipsContainer.appendChild(tipsListContainer);
}

// Initial generation and display
generateDailyTips();
updateTipsDisplay();

// Check for updates every 10 seconds
setInterval(updateTipsDisplay, 10000);
