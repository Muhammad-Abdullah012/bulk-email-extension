import { ACTION } from "@/constants";
import { Contact } from "@/entrypoints/popup/ContactForm";

interface EmailInputData {
  contacts: Contact[];
  message: string;
}

export const waitForElement = (
  selector: string,
  timeout: number = 5000
): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(
          new Error(`Element "${selector}" not found within ${timeout}ms.`)
        );
      }
    }, 100); // Check every 100ms
  });
};

/**
 * Simulates sending an email via DOM manipulation.
 * WARNING: Highly dependent on the webmail's specific DOM structure and may break easily.
 *
 * @param recipientEmail - The email address for the 'To' field.
 * @param subjectText - The text for the 'Subject' field.
 * @param bodyText - The plain text content for the email body.
 * @param options - Optional configuration.
 * @param options.timeoutPerStep - Max time (ms) to wait for each element. Defaults to 5000.
 */
export const sendEmailViaDOM = async (
  recipientEmail: string,
  subjectText: string,
  bodyText: string,
  options: { timeoutPerStep?: number } = {}
): Promise<void> => {
  const { timeoutPerStep = 5000 } = options;
  console.log("Attempting to send email via DOM manipulation...");

  try {
    // Fetch json file
    const jsonUrl = browser.runtime.getURL("/outlook.json");
    const response = await fetch(jsonUrl);
    const outlook = await response.json();
    // Extract html selectors from json
    const { selectors } = outlook;
    // 1. Click "New mail" button
    console.log("Looking for 'New mail' button...");
    const newMailButton = await waitForElement(
      selectors.new_email,
      timeoutPerStep
    );
    console.log("Found 'New mail' button, clicking...");
    newMailButton.click();

    // --- Wait for compose elements to appear ---

    // 2. Fill "To" field
    console.log("Looking for 'To' field...");
    const toField = await waitForElement(selectors.to, timeoutPerStep);
    console.log("Found 'To' field, setting value...");
    toField.focus(); // Focus might be needed
    // For contenteditable divs, setting innerText is common
    toField.innerText = recipientEmail;
    // Dispatch an input event might be necessary for some frameworks
    toField.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    // Small delay sometimes helps frameworks process input
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. Fill "Subject" field
    console.log("Looking for 'Subject' field...");
    // Subject is often an input element
    const subjectField = (await waitForElement(
      selectors.subject,
      timeoutPerStep
    )) as HTMLInputElement;
    console.log("Found 'Subject' field, setting value...");
    subjectField.focus();
    subjectField.value = subjectText;
    // Dispatch events for frameworks
    subjectField.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    subjectField.dispatchEvent(
      new Event("change", { bubbles: true, cancelable: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4. Fill "Body" field
    console.log("Looking for 'Body' field...");
    // Using attribute contains selector '*' as specified
    const bodyField = await waitForElement(
      selectors.email_body,
      timeoutPerStep
    );
    console.log("Found 'Body' field, setting value...");
    bodyField.focus();
    // Setting innerText for contenteditable div
    bodyField.innerText = bodyText;
    // Dispatch input event
    bodyField.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 5. Click "Send" button
    console.log("Looking for 'Send' button...");
    const sendButton = await waitForElement(
      selectors.send_button,
      timeoutPerStep
    );
    console.log("Found 'Send' button, clicking...");
    sendButton.click();

    console.log("Email send sequence initiated successfully via DOM.");
  } catch (error) {
    console.error("Error during email DOM manipulation:", error);
    throw error;
  }
};

export const sendEmailsToContacts = async (
  data: EmailInputData,
  delayBetweenEmailsMs: number,
  options: { timeoutPerStep?: number } = {}
): Promise<void> => {
  console.log(
    `Starting bulk email process for ${data.contacts.length} contacts.`
  );

  if (!data || !data.contacts || data.contacts.length === 0) {
    console.warn("No contacts provided in the data. Exiting.");
    return;
  }

  for (let i = 0; i < data.contacts.length; i++) {
    const contact = data.contacts[i];
    console.log(
      `\n--- Processing contact ${i + 1}/${data.contacts.length}: ${
        contact.name
      } (${contact.email}) ---`
    );

    try {
      // Use the previously defined function to send the email
      await sendEmailViaDOM(
        contact.email,
        `Hi, ${contact.name}`,
        data.message,
        options
      );
      console.log(`Successfully initiated email send for ${contact.email}.`);
    } catch (error) {
      console.error(
        `Failed to send email to ${contact.email}. Continuing to next contact.`
      );
      browser.runtime
        .sendMessage({
          type: ACTION.ERROR,
          payload: `Failed to send email to ${contact.email}. Continuing to next contact.`,
        })
        .catch(console.error);
    }

    if (i < data.contacts.length - 1) {
      console.log(
        `Waiting for ${delayBetweenEmailsMs}ms before processing next contact...`
      );
      await delay(delayBetweenEmailsMs);
    }
  }

  console.log("\n--- Finished processing all contacts. ---");
};
