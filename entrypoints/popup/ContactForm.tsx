import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
} from "react";
import {
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { ACTION } from "@/constants";

export interface Contact {
  id: string;
  name: string;
  email: string;
}

type Errors = Record<string, string | null>;

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

  const handleAddContactField = () => {
    setContacts([...contacts, { id: generateId(), name: "", email: "" }]);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.contacts;
      return updated;
    });
  };

  const handleRemoveContactField = (idToRemove: string) => {
    if (contacts.length <= 1) return;

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
    []
  );

  const handleMessageChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      if (errors.message) {
        setErrors((prev) => ({ ...prev, message: null }));
      }
    },
    []
  );

  const validateForm = (): boolean => {
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
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!validateForm()) return;

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
      setMessage("");
      setErrors({});
    } catch (err) {
      setSubmitStatus("error");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const listener = (
      message: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: any
    ) => {
      if (message.type === ACTION.ERROR) {
        setErrorMessage(message.payload);
      }
      return false;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 space-y-6"
      noValidate
    >
      <h2 className="text-2xl font-semibold text-sky-400 mb-6 border-b border-slate-700 pb-4">
        Contact Entries
      </h2>

      {contacts.map((contact, index) => (
        <div
          key={contact.id}
          className="p-4 border border-slate-700 rounded-md relative space-y-4 bg-slate-800/50"
        >
          {contacts.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveContactField(contact.id)}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
              aria-label={`Remove contact ${index + 1}`}
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

      <button
        type="button"
        onClick={handleAddContactField}
        className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-sky-600 text-sky-400 rounded-md hover:bg-sky-500/10 hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Another Contact
      </button>

      <div className="pt-6 border-t border-slate-700">
        <h2 className="text-2xl font-semibold text-sky-400 mb-6">Message</h2>
        <TextAreaField
          label="Message"
          id="message"
          value={message}
          onChange={handleMessageChange}
          error={errors.message}
          placeholder="Enter your message here..."
        />
      </div>

      {submitStatus === "success" && (
        <div
          className="p-3 mb-4 text-sm text-green-300 bg-green-500/20 rounded-md"
          role="alert"
        >
          Form submitted successfully! We'll be in touch.
        </div>
      )}
      {submitStatus === "error" && (
        <div
          className="p-3 mb-4 text-sm text-red-300 bg-red-500/20 rounded-md"
          role="alert"
        >
          There was an error submitting your form. Please try again.
        </div>
      )}
      {Object.keys(errors).length > 0 && submitStatus !== "success" && (
        <div
          className="p-3 mb-4 text-sm text-yellow-300 bg-yellow-500/20 rounded-md"
          role="alert"
        >
          Please correct the errors highlighted above.
        </div>
      )}

      {errorMessage ? (
        <div
          className="p-3 mb-4 text-sm text-red-300 bg-red-500/20 rounded-md"
          role="alert"
        >
          There was an error submitting your form. Please try again.
        </div>
      ) : (
        <></>
      )}
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
        autoComplete={type == "email" ? type : undefined}
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
}> = React.memo(
  ({
    label,
    id,
    value,
    onChange,
    error,
    placeholder,
    rows = 4,
    required = true,
  }) => (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
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
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
);
