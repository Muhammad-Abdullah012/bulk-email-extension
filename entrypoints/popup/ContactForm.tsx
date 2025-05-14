import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
} from "react";
import { storage } from "#imports";
import {
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { ACTION, STORAGE_KEYS } from "@/constants";

export interface Contact {
  id: string;
  name: string;
  email: string;
}

type Errors = Record<string, string | null>;
type Tab = "contacts" | "message";

const generateId = (): string =>
  `id_${Math.random().toString(36).substring(2, 9)}`;

const ContactForm: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: generateId(), name: "", email: "" },
  ]);
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<Tab>(
    "contacts"
  );

  const handleAddContactField = () => {
    setContacts((prev) => [{ id: generateId(), name: "", email: "" }, ...prev]);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.contacts;
      return updated;
    });
  };

  const handleRemoveContactField = (idToRemove: string) => {
    if (contacts.length <= 1 && activeTab === "contacts") return;

    setContacts((prev) => prev.filter((contact) => contact.id !== idToRemove));

    setErrors((prevErrors) => {
      const updated = { ...prevErrors };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`contact-${idToRemove}`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const handleContactChange = useCallback(
    (id: string, field: keyof Omit<Contact, "id">, value: string) => {
      console.log("handleContactChange called with: ", id, field, value);
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === id ? { ...contact, [field]: value } : contact
        )
      );

      const errorKey = `contact-${id}-${field}`;
      if (errors[errorKey]) {
        setErrors((prev) => ({ ...prev, [errorKey]: null }));
      }
    },
    [errors]
  );

  const handleMessageChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      if (errors.message) {
        setErrors((prev) => ({ ...prev, message: null }));
      }
    },
    [errors]
  );

  const validateForm = (): { isValid: boolean; newErrors: Errors } => {
    const newErrors: Errors = {};
    let isValid = true;

    contacts.forEach((contact) => {
      if (!contact.name.trim()) {
        newErrors[`contact-${contact.id}-name`] = "Name is required.";
        isValid = false;
      }
      if (!contact.email.trim()) {
        newErrors[`contact-${contact.id}-email`] = "Email is required.";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
        newErrors[`contact-${contact.id}-email`] = "Email is invalid.";
        isValid = false;
      }
    });

    if (!message.trim()) {
      newErrors.message = "Message is required.";
      isValid = false;
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
      isValid = false;
    }

    setErrors(newErrors);
    return { isValid, newErrors };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus(null);
    setErrorMessage(""); // Clear previous general error messages

    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      const errors = newErrors;
      const hasContactErrors = Object.keys(errors).some(
        (key) => key.startsWith("contact-") || key === "contacts"
      );
      if (hasContactErrors && activeTab !== "contacts") {
        setActiveTab("contacts");
      }
      // If validation fails and there's a message error, switch to message tab
      else if (errors.message && activeTab !== "message") {
        setActiveTab("message");
      }
      return;
    }

    setIsSubmitting(true);
    const formData = {
      contacts,
      message,
    };

    try {
      await browser.runtime.sendMessage({
        action: ACTION.FORM_SUBMITTED,
        payload: formData,
      });
      setSubmitStatus("success");
      setContacts([{ id: generateId(), name: "", email: "" }]);
      setErrors({});
    } catch (err: any) {
      setSubmitStatus("error");
      setErrorMessage(
        err.message || "An unexpected error occurred during submission."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      const template = (await storage.getItem(
        `local:${STORAGE_KEYS.MESSAGE_TEMPLATE}`
      )) as string;
      if (template) setMessage(template);
      const csvData = (await storage.getItem(
        `local:${STORAGE_KEYS.CSV_CONTACTS}`
      )) as Contact[] | null;
      if (csvData && csvData.length > 0) {
        setContacts(csvData);
      }
    })();

    const listener = (
      message: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: any
    ) => {
      console.log("ContactForm.tsx::message => ", message);
      if (message.type === ACTION.ERROR) {
        setErrorMessage(message.payload);
        setSubmitStatus("error");
      }
      return false;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const openOptionsPage = () => {
    browser.runtime.openOptionsPage();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 space-y-6"
      noValidate
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center justify-center space-x-2 px-4 py-3 w-1/2 font-medium text-sm focus:outline-none transition-colors
            ${
              activeTab === "contacts"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-slate-400 hover:text-sky-400 hover:bg-slate-700/50"
            }`}
        >
          <UserGroupIcon className="h-5 w-5" />
          <span>Contacts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("message")}
          className={`flex items-center justify-center space-x-2 px-4 py-3 w-1/2 font-medium text-sm focus:outline-none transition-colors
            ${
              activeTab === "message"
                ? "border-b-2 border-sky-500 text-sky-400"
                : "text-slate-400 hover:text-sky-400 hover:bg-slate-700/50"
            }`}
        >
          <EnvelopeIcon className="h-5 w-5" />
          <span>Message</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "contacts" && (
          <div className="space-y-6 animate-fadeIn">
            <button
              type="button"
              onClick={openOptionsPage}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
            >
              Upload CSV file
            </button>

            <button
              type="button"
              onClick={handleAddContactField}
              className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-sky-600 text-sky-400 rounded-md hover:bg-sky-500/10 hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Contact
            </button>

            {errors.contacts && (
              <p className="mt-1 text-xs text-red-400 text-center">
                {errors.contacts}
              </p>
            )}

            {contacts.length === 0 && (
              <div className="text-center text-slate-400 py-4">
                No contacts added yet. Click "Add Contact" to begin.
              </div>
            )}

            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="p-4 border border-slate-700 rounded-md relative space-y-4 bg-slate-800/50"
              >
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveContactField(contact.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove contact ${index + 1}`}
                    disabled={contacts.length <= 1}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact #{index + 1}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Name"
                    id={`contact-${contact.id}-name`}
                    value={contact.name}
                    onChange={(e) =>
                      handleContactChange(contact.id, "name", e.target.value)
                    }
                    error={errors[`contact-${contact.id}-name`]}
                    placeholder="e.g., Jane Doe"
                  />
                  <InputField
                    label="Email"
                    type="email"
                    id={`contact-${contact.id}-email`}
                    value={contact.email}
                    onChange={(e) =>
                      handleContactChange(contact.id, "email", e.target.value)
                    }
                    error={errors[`contact-${contact.id}-email`]}
                    placeholder="e.g., jane.doe@example.com"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "message" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <TextAreaField
                label="Message"
                id="message"
                value={message}
                onChange={handleMessageChange}
                error={errors.message}
                placeholder="Enter your message here..."
                showLabel={false} // Hide the explicit label if heading is sufficient
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2 transform -rotate-45" />
                  Send Message
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Global Status/Error Messages - Displayed below tab content */}
      <div className="mt-6 space-y-3">
        {submitStatus === "success" && (
          <div
            className="p-3 text-sm text-green-300 bg-green-500/20 rounded-md animate-fadeIn"
            role="alert"
          >
            Form submitted successfully! Your messages are being processed.
          </div>
        )}
        {/* Show general submission error or specific error from background */}
        {submitStatus === "error" && errorMessage && (
          <div
            className="p-3 text-sm text-red-300 bg-red-500/20 rounded-md animate-fadeIn"
            role="alert"
          >
            {errorMessage}
          </div>
        )}
        {submitStatus === "error" && !errorMessage && (
          <div
            className="p-3 text-sm text-red-300 bg-red-500/20 rounded-md animate-fadeIn"
            role="alert"
          >
            There was an error submitting your form. Please try again.
          </div>
        )}

        {/* Validation summary (only if not success and errors exist) */}
        {Object.keys(errors).length > 0 &&
          submitStatus !== "success" &&
          !errors.contacts /* Don't show if specific contacts error is already shown */ &&
          (activeTab === "message" ||
            (activeTab === "contacts" &&
              !Object.keys(errors).some((k) =>
                k.startsWith("contact-")
              ))) /* Show only if relevant errors are not field specific or if on message tab */ && (
            <div
              className="p-3 text-sm text-yellow-300 bg-yellow-500/20 rounded-md animate-fadeIn"
              role="alert"
            >
              Please correct the errors highlighted in the form.
              {/* Optionally list errors:
              <ul>
                {Object.entries(errors).map(([key, value]) => value && <li key={key}>- {value}</li>)}
              </ul>
              */}
            </div>
          )}
      </div>
    </form>
  );
};

export default ContactForm;

const InputField: React.FC<{
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
}> = React.memo(
  ({
    label,
    id,
    type = "text",
    value,
    onChange,
    error,
    placeholder,
    required = true,
  }) => (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        autoComplete={type === "email" ? "email" : undefined}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-slate-700 border ${
          error ? "border-red-500" : "border-slate-600"
        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-100`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
);

const TextAreaField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string | null;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  showLabel?: boolean; // Added prop
}> = React.memo(
  ({
    label,
    id,
    value,
    onChange,
    error,
    placeholder,
    rows = 6,
    required = true,
    showLabel = true,
  }) => (
    <div className="mb-0">
      {" "}
      {/* Adjusted mb from mb-6 to mb-0 */}
      {showLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 bg-slate-700 border ${
          error ? "border-red-500" : "border-slate-600"
        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-100`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-label={!showLabel ? label : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
);
