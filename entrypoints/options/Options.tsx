import React, {
  useState,
  ChangeEvent,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Papa from "papaparse";
import { storage } from "#imports";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ACTION, STORAGE_KEYS } from "@/constants";
import type { Contact } from "@/entrypoints/popup/ContactForm";

function OptionsPage() {
  const [messageTemplate, setMessageTemplate] = useState<string>("");
  const [csvFeedback, setCsvFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [messageSaveFeedback, setMessageSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoadingCsv, setIsLoadingCsv] = useState<boolean>(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);
  const [contactsCount, setContactsCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = (await storage.getItem(
          `local:${STORAGE_KEYS.MESSAGE_TEMPLATE}`
        )) as string;
        if (result) setMessageTemplate(result);
        const csv = (await storage.getItem(
          `local:${STORAGE_KEYS.CSV_CONTACTS}`
        )) as Contact[];
        if (csv && csv.length) setContactsCount(csv.length);
      } catch (error) {
        console.error("Error loading data from storage:", error);
        setCsvFeedback({
          type: "error",
          message: "Could not load saved settings.",
        });
      }
    };
    loadData();
  }, []);

  const handleMessageTemplateChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageTemplate(e.target.value);
    if (messageSaveFeedback) setMessageSaveFeedback(null); // Clear feedback on change
  };

  const handleSaveMessageTemplate = async () => {
    setIsLoadingMessage(true);
    setMessageSaveFeedback(null);
    try {
      await storage.setItem(
        `local:${STORAGE_KEYS.MESSAGE_TEMPLATE}`,
        messageTemplate
      );
      setMessageSaveFeedback({
        type: "success",
        message: "Message template saved successfully!",
      });
    } catch (error) {
      console.error("Error saving message template:", error);
      setMessageSaveFeedback({
        type: "error",
        message: "Failed to save message template.",
      });
    } finally {
      setIsLoadingMessage(false);
      setTimeout(() => setMessageSaveFeedback(null), 3000);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCsvFeedback(null);

    if (!file) {
      return;
    }
    if (file.type !== "text/csv") {
      setCsvFeedback({
        type: "error",
        message: "Invalid file type. Please upload a CSV file.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsLoadingCsv(true);
    setCsvFeedback({ type: "info", message: "Processing CSV..." });

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedContacts: Contact[] = [];
        let parseErrorMsg = "";

        if (results.errors.length > 0) {
          console.warn("CSV parsing errors:", results.errors);
          parseErrorMsg = `CSV parsing issues: ${results.errors[0].message}. `;
        }

        if (results.data && results.data.length > 0) {
          const headerMap = {
            name: [
              "name",
              "contact name",
              "full name",
              "recipient name",
              "first name",
            ],
            email: ["email", "email address", "recipient email", "e-mail"],
          };
          const findHeader = (
            actualHeaders: string[],
            possibleHeaders: string[]
          ): string | undefined => {
            for (const pHeader of possibleHeaders) {
              const found = actualHeaders.find(
                (ah) => ah.toLowerCase().trim() === pHeader.toLowerCase().trim()
              );
              if (found) return found;
            }
            return undefined;
          };

          const actualHeaders = Object.keys(results.data[0]).map((h) =>
            h.toLowerCase().trim()
          );
          const nameHeaderInFile = findHeader(
            Object.keys(results.data[0]),
            headerMap.name
          );
          const emailHeaderInFile = findHeader(
            Object.keys(results.data[0]),
            headerMap.email
          );

          if (!emailHeaderInFile) {
            // Email is mandatory
            parseErrorMsg +=
              "CSV must contain an 'email' column (or similar variations like 'Email Address'). ";
          } else {
            results.data.forEach((row: any, index: number) => {
              const email = row[emailHeaderInFile]?.trim();
              let name = nameHeaderInFile ? row[nameHeaderInFile]?.trim() : "";

              if (email) {
                if (!name) name = email.split("@")[0]; // Use part of email if name is missing
                parsedContacts.push({
                  id: `csv_${Date.now()}_${index}`,
                  name,
                  email,
                });
              }
            });
          }
        } else if (results.errors.length === 0) {
          parseErrorMsg += "CSV file is empty or not structured correctly. ";
        }

        if (parsedContacts.length > 0 && !parseErrorMsg) {
          try {
            await storage.setItem(
              `local:${STORAGE_KEYS.CSV_CONTACTS}`,
              parsedContacts
            );
            setContactsCount(parsedContacts.length);
            browser.runtime
              .sendMessage({
                action: ACTION.CSV_DATA_PARSED,
                payload: {},
              })
              .catch((e) =>
                console.debug(
                  "Failed to send CSV_DATA_PARSED message, perhaps no listener.",
                  e
                )
              );

            setCsvFeedback({
              type: "success",
              message: `${parsedContacts.length} contacts loaded and saved from ${file.name}.`,
            });
          } catch (storageError) {
            console.error("Error saving contacts to storage:", storageError);
            setCsvFeedback({
              type: "error",
              message: "Contacts parsed but failed to save to storage.",
            });
          }
        } else if (parsedContacts.length === 0 && !parseErrorMsg) {
          setCsvFeedback({
            type: "error",
            message: "No valid contacts with email addresses found in CSV.",
          });
        } else {
          setCsvFeedback({
            type: "error",
            message: parseErrorMsg || "Could not process CSV.",
          });
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
        }
        setIsLoadingCsv(false);
      },
      error: (err) => {
        console.error("CSV parsing failed:", err);
        setCsvFeedback({
          type: "error",
          message: `Error parsing CSV: ${err.message}`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsLoadingCsv(false);
      },
    });
  };

  const renderFeedbackIcon = (type: "success" | "error" | "info") => {
    if (type === "success")
      return <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />;
    if (type === "error")
      return <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-400" />;
    return <InformationCircleIcon className="h-5 w-5 mr-2 text-sky-400" />;
  };

  const clearContacts = async () => {
    try {
      await storage.removeItem(`local:${STORAGE_KEYS.CSV_CONTACTS}`);
      setContactsCount(0);
      setCsvFeedback({
        type: "info",
        message: "Stored contacts have been cleared.",
      });
    } catch (error) {
      console.error(error);
      setCsvFeedback({ type: "error", message: "Failed to clear contacts." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-10">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-sky-400">
            Extension Settings
          </h1>
          <p className="text-slate-400 mt-2">
            Manage your bulk email preferences.
          </p>
        </header>

        {/* Contacts Section */}
        <section className="bg-slate-800 shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-sky-500 mb-1">
            Manage Contacts
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Upload a CSV file with contact details. Required column: "email".
            Optional: "name".
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="csv-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors
                            ${
                              isLoadingCsv
                                ? "border-slate-600 text-slate-500 bg-slate-700 cursor-not-allowed"
                                : "border-sky-600 text-sky-400 hover:bg-sky-700/30 hover:border-sky-500"
                            }`}
              >
                <ArrowUpTrayIcon className="h-6 w-6 mr-2" />
                <span>
                  {isLoadingCsv ? "Processing..." : "Choose CSV File"}
                </span>
              </label>
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoadingCsv}
              />
            </div>

            {csvFeedback && (
              <div
                className={`flex items-center p-3 rounded-md text-sm bg-opacity-20
                ${
                  csvFeedback.type === "success"
                    ? "bg-green-500 text-green-300"
                    : csvFeedback.type === "error"
                    ? "bg-red-500 text-red-300"
                    : "bg-sky-500 text-sky-300"
                }`}
              >
                {renderFeedbackIcon(csvFeedback.type)}
                <span>{csvFeedback.message}</span>
              </div>
            )}
          </div>
          <p>
            Stored contacts:{" "}
            <span className="font-medium text-sky-400">{contactsCount}</span>
          </p>
          <button
            onClick={clearContacts}
            className="text-xs text-red-400 hover:text-red-300 hover:underline"
            disabled={isLoadingCsv}
          >
            Clear Stored Contacts
          </button>
        </section>

        {/* Message Template Section */}
        <section className="bg-slate-800 shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-sky-500 mb-1">
            Email Message Template
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Compose your default email message.
          </p>
          <textarea
            rows={8}
            value={messageTemplate}
            onChange={handleMessageTemplateChange}
            placeholder="Hello! We're excited to share...Best regards, Your Team"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-100 resize-y"
            disabled={isLoadingMessage}
          />
          <button
            onClick={handleSaveMessageTemplate}
            disabled={isLoadingMessage || !messageTemplate?.trim()}
            className="mt-4 w-full flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingMessage ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Message Template"
            )}
          </button>
          {messageSaveFeedback && (
            <div
              className={`flex items-center mt-3 p-3 rounded-md text-sm bg-opacity-20
              ${
                messageSaveFeedback.type === "success"
                  ? "bg-green-500 text-green-300"
                  : "bg-red-500 text-red-300"
              }`}
            >
              {renderFeedbackIcon(messageSaveFeedback.type)}
              <span>{messageSaveFeedback.message}</span>
            </div>
          )}
        </section>

        <footer className="text-center text-sm text-slate-500 pt-8">
          <p>&copy; {new Date().getFullYear()} Email Automation. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default OptionsPage;
