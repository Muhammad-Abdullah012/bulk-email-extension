import { sendEmailsToContacts } from "@/utils/sendEmail";

export default defineContentScript({
  matches: ["*://*.outlook.live.com/mail/*"],
  main() {
    console.log("Hello content.");
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("message recieved => ", message.payload);
      sendEmailsToContacts(message.payload, 3000);
      return false;
    });
  },
});
