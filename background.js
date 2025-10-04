let intervalId = null;
let previousList = []; // Persist previous results here

chrome.runtime.onMessage.addListener((message) => {
  console.log('Received message:', message);

  if (message.action === 'toggleScraper') {
    if (message.state) {
      console.log('Starting Scraping...');
      startScraping();
    } else {
      console.log('Stopping Scraping...');
      stopScraping();
    }

    // Update the extension icon
    const iconPath = message.state
      ? { 16: 'icons/icon-on-16.png' }
      : { 16: 'icons/icon-off-16.png' };
    chrome.action.setIcon({ path: iconPath });
  }
});

async function startScraping() {
  stopScraping(); // Avoid duplicate intervals
  intervalId = setInterval(async () => {
    console.log('Refreshing page and executing scrapePage...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.id) {
      // Refresh the page before scraping
      chrome.tabs.reload(tab.id, {}, async () => {
        console.log('Page reloaded.');

        // Delay scraping slightly to allow page content to load
        setTimeout(() => {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              function: scrapePage,
              args: [previousList],
            },
            ([results]) => {
              console.log('ExecuteScript Results:', results);

              if (chrome.runtime.lastError) {
                console.error('Error in executeScript:', chrome.runtime.lastError.message);
              } else if (results && results.result) {
                console.log('Updating Previous List with:', results.result);
                previousList = results.result;
              } else {
                console.warn('No result received from content script.');
              }
            }
          );
        }, 3000); // Wait 3 seconds after refresh
      });
    }
  }, 9000); // Scrape every 9 seconds
}

function stopScraping() {
  if (intervalId !== null) {
    console.log('Clearing Interval...');
    clearInterval(intervalId);
    intervalId = null;
  }
}

function scrapePage(previousList) {
  const currentList = [...document.querySelectorAll('.menu h3.name')].map((el) =>
    el.textContent.trim()
  );

  console.log('ScrapePage Executed');
  console.log('Previous List:', previousList);
  console.log('Current List:', currentList);

  if (previousList.length > 0) {
    const newItems = currentList.filter((item) => !previousList.includes(item));
    if (newItems.length > 0) {
      console.log('New Items Found:', newItems);

      fetch('https://ntfy.sh/testmanu', {
        method: 'POST',
        body: `New seats available:\n${newItems.join('\n')}`,
      })
        .then((res) => console.log('Notification sent:', res))
        .catch((err) => console.error('Error sending notification:', err));
    }
  }

  return currentList; // Return the current list for next comparison
}
