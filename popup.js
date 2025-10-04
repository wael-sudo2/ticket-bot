document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleButton');
  
    // Load the current state from storage
    const { scraperEnabled } = await chrome.storage.local.get('scraperEnabled');
    toggleButton.textContent = scraperEnabled ? 'Turn OFF' : 'Turn ON';
  
    // Handle toggle button click
    toggleButton.addEventListener('click', async () => {
      const newState = !(scraperEnabled || false);
      await chrome.storage.local.set({ scraperEnabled: newState });
      toggleButton.textContent = newState ? 'Turn OFF' : 'Turn ON';
  
      // Notify the background script about the state change
      chrome.runtime.sendMessage({ action: 'toggleScraper', state: newState });
    });
  });
  