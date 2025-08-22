// Baji Times
const bajiTimes = [
  { name: "1st Baji", time: "11:00" },
  { name: "2nd Baji", time: "12:30" },
  { name: "3rd Baji", time: "14:00" },
  { name: "4th Baji", time: "15:30" },
  { name: "5th Baji", time: "17:00" },
  { name: "6th Baji", time: "18:30" },
  { name: "7th Baji", time: "20:00" },
  { name: "8th Baji", time: "21:00" }
];

// Utility: generate 4 random numbers 0–9
function generateNumbers(seed) {
  let nums = new Set();
  while (nums.size < 4) {
    nums.add(Math.floor((Math.random() * 10 + seed) % 10));
  }
  return Array.from(nums);
}

// Daily seed to ensure new numbers each day
const todaySeed = new Date().getDate() + new Date().getMonth();

function renderTips() {
  const container = document.getElementById("tipsGrid");
  const now = new Date();

  bajiTimes.forEach((baji, index) => {
    const card = document.createElement("div");
    card.className = "tip-card";

    const title = document.createElement("h3");
    title.textContent = baji.name;
    card.appendChild(title);

    const result = document.createElement("div");
    result.className = "tip-result";

    // Parse baji time
    const [hours, minutes] = baji.time.split(":").map(Number);
    const bajiDate = new Date();
    bajiDate.setHours(hours, minutes, 0, 0);

    const showTime = new Date(bajiDate.getTime() - 40 * 60000); // 40 minutes before

    if (now >= showTime) {
      result.textContent = generateNumbers(todaySeed + index).join(", ");
    } else {
      result.className = "calculating";
      result.textContent = "Calculating...";
    }

    card.appendChild(result);
    container.appendChild(card);
  });
}

// Show today’s date
document.getElementById("today-date").textContent = new Date().toLocaleDateString();

// Render
renderTips();
