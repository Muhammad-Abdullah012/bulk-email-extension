import { ACTION } from "@/constants";
import { delay } from "@/utils/delay";
import { navigateCurrentTab, navigationRequired } from "@/utils/navigate";
import { sendMessageToCurrentTab } from "@/utils/sendMessageToCurrentTab";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const payload = message.payload;
    console.log("background.ts::payload => ", payload);
    if (message.action === ACTION.FORM_SUBMITTED) {
      const jsonUrl = browser.runtime.getURL("/outlook.json");
      fetch(jsonUrl).then(res => res.json()).then((outlook) => {
        console.log("parsed => ", outlook);
        const urlToNavigate = outlook.url;
        navigateCurrentTab(urlToNavigate)
          .then(() => delay(2000))
          .then(() => navigationRequired(urlToNavigate))
          .then((navigationRequired) => {
            if (navigationRequired) {
              browser.runtime.sendMessage({
                type: ACTION.ERROR,
                payload: "Browser could not navigate!",
              }).catch(console.error);
              return;
            }
            sendMessageToCurrentTab(message);
          })
          .catch(console.error);
      })
      return false;
    }
  });
});
