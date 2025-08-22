// Show today's date
const dateElement = document.getElementById("current-date");
const today = new Date();
dateElement.textContent = today.toDateString();

// Betting times (example: 8 results per day)
const betTimes = [
  "10:30", "12:00", "01:30", "03:00",
  "04:30", "06:00", "07:30", "09:00"
];

// Generate daily random tips (different each day)
function generateDailyTips() {
  const seed = today.toDateString(); // unique per day
  const randomNumbers = [];

  for (let i = 0; i < betTimes.length; i++) {
    // Generate 4 unique numbers between 0–9
    const nums = new Set();
    while (nums.size < 4) {
      nums.add(Math.floor(Math.random() * 10));
    }
    randomNumbers.push([...nums]);
  }

  return randomNumbers;
}

const tips = generateDailyTips();
const container = document.getElementById("tips-container");

betTimes.forEach((time, index) => {
  const tipBox = document.createElement("div");
  tipBox.className = "tip-box";

  const timeElem = document.createElement("div");
  timeElem.className = "tip-time";
  timeElem.textContent = `Time: ${time}`;

  const resultElem = document.createElement("div");
  resultElem.className = "tip-result";

  // calculate the show time (40 min before bet time)
  const [hours, minutes] = time.split(":").map(Number);
  const betDate = new Date(today);
  betDate.setHours(hours, minutes, 0, 0);
  const showTime = new Date(betDate.getTime() - 40 * 60000);

  function updateResult() {
    const now = new Date();
    if (now >= showTime) {
      resultElem.textContent = `Tips: ${tips[index].join(", ")}`;
    } else {
      resultElem.textContent = "Calculating...";
    }
  }

  updateResult();
  setInterval(updateResult, 10000); // check every 10 sec

  tipBox.appendChild(timeElem);
  tipBox.appendChild(resultElem);
  container.appendChild(tipBox);
});
