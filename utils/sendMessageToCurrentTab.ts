export const sendMessageToCurrentTab = async (payload: any) => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs.length > 0 && tabs[0].id) {
      const currentTabId = tabs[0].id;
      console.log(
        `Attempting to send message to tab ID: ${currentTabId}, message: ${payload}`
      );

      await browser.tabs.sendMessage(currentTabId, payload);
      console.log(`Tab ${currentTabId} message sent to ${payload}`);
    } else {
      console.warn("No active tab found in the current window.");
    }
  } catch (error) {
    console.error("Error sending message to tab:", error);
  }
};
