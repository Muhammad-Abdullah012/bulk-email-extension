import React from 'react';
import ContactForm from './ContactForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-sky-400">Bulk Email Sender</h1>
        <ContactForm />
      </div>
      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; AliSquare</p>
      </footer>
    </div>
  );
}

export default App;