/**
 * Navigates the currently active tab in the current window to a new URL.
 * @param newUrl The URL to navigate to.
 */
export const navigateCurrentTab = async (newUrl: string) => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs.length > 0 && tabs[0].id) {
      const currentTabId = tabs[0].id;
      console.log(
        `Attempting to navigate tab ID: ${currentTabId} to ${newUrl}`
      );

      const shouldNavigate = await navigationRequired(newUrl);

      if (!shouldNavigate) return;

      await browser.tabs.update(currentTabId, { url: newUrl });
      console.log(`Tab ${currentTabId} navigated to ${newUrl}`);
    } else {
      console.warn("No active tab found in the current window.");
    }
  } catch (error) {
    console.error("Error navigating tab:", error);
  }
};

export const getCurrentTabUrl = async () => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs.length > 0 && tabs[0].id) {
      const currentTabId = tabs[0].id;
      console.log(`Attempting to find url in tab ID: ${currentTabId}`);

      return tabs[0].url;
    } else {
      console.warn("No active tab found in the current window.");
    }
  } catch (error) {
    console.error("Error getting curretn tab url: ", error);
  }
};

export const navigationRequired = async (targetUrl: string) => {
  const currentUrlString = await getCurrentTabUrl();
  if (currentUrlString) {
    const currentDomain = new URL(currentUrlString).hostname.toLowerCase();
    const targetDomain = new URL(targetUrl).hostname.toLowerCase();
    return currentDomain !== targetDomain;
  }
  return true;
};
