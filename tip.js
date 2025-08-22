<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today Tips - The Lucky Number</title>

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081004120797990" crossorigin="anonymous"></script>

  <link rel="stylesheet" href="tip.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #1a1a1a;
      color: #fff;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
      background-color: #2a2a2a;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      background-color: #f5c400;
      color: #111;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.3s ease;
    }

    .back-btn:hover {
      background-color: #e0b300;
    }

    .live-section {
      text-align: center;
      padding: 15px;
      background-color: #2a2a2a;
      margin-top: 10px;
      border-radius: 8px;
    }

    .live-section h2 {
      margin: 0;
      font-size: 1.5em;
      color: #fff;
    }

    .live-section .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background-color: #00ff00;
      border-radius: 50%;
      margin-left: 8px;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }

    #current-date {
      font-size: 0.9em;
      color: #ccc;
      margin: 5px 0 0;
    }

    .lucky-title {
      text-align: center;
      padding: 20px;
    }

    .lucky-title h1 {
      margin: 0;
      font-size: 2em;
      color: #f5c400;
    }

    .tips-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .tip-card {
      background-color: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      text-align: center;
    }

    .tip-card h3 {
      color: #f5c400;
      margin-top: 0;
    }

    .tip-card .numbers {
      font-size: 2em;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 15px 0;
    }

    .tip-card .numbers span {
      background-color: #3a3a3a;
      padding: 8px 15px;
      border-radius: 5px;
      display: inline-block;
      margin: 5px;
    }

    /* Media Queries for Mobile Responsiveness */
    @media (max-width: 768px) {
      .header {
        padding: 10px;
      }
      .back-btn {
        padding: 8px 15px;
        font-size: 14px;
      }
      .lucky-title h1 {
        font-size: 1.5em;
      }
      .tips-container {
        padding: 10px;
      }
      .tip-card {
        padding: 15px;
      }
      .tip-card .numbers {
        font-size: 1.5em;
      }
      .tip-card .numbers span {
        padding: 6px 12px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <button class="back-btn" onclick="window.location.href='index.html'">← Back to Results</button>
  </div>

  <div class="live-section">
    <h2>LIVE <span class="dot"></span></h2>
    <p id="current-date"></p>
  </div>

  <div class="lucky-title">
    <h1>The Lucky Number</h1>
  </div>

  <div class="tips-container" id="tips-container">
    </div>

  <script src="tip.js"></script>
</body>
</html>
