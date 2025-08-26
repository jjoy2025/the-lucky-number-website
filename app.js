// Register the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('Service Worker registration successful:', registration);
      },
      (err) => {
        console.log('Service Worker registration failed:', err);
      }
    );
  });
}

const installButton = document.getElementById('install-button');
let deferredPrompt;

// 'beforeinstallprompt' event to show the install button
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  installButton.style.display = 'block';

  // Listen for the button click
  installButton.addEventListener('click', () => {
    // Hide the button again
    installButton.style.display = 'none';
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  });
});

// 'appinstalled' event to hide the button after installation
window.addEventListener('appinstalled', () => {
  installButton.style.display = 'none';
  console.log('PWA was installed');
});

// Check if it's already installed on page load
// This helps if the user closes and reopens the app
window.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        installButton.style.display = 'none';
    }
});
