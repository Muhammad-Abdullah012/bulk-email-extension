export interface Contact {
  id: string;
  name: string;
  email: string;
}

export interface EmailInputData {
  contacts: Contact[];
  message: string;
}