import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { useMembersStore } from './features/members/store';
import { isSupabaseConfigured } from './services/supabase';
import ConfigError from './components/ConfigError';

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (!isSupabaseConfigured) {
  root.render(
    <React.StrictMode>
      <ConfigError />
    </React.StrictMode>,
  );
} else {
  const store = useMembersStore.getState();
  if (store.members.length === 0) {
    store.addMember('Moi', '👤');
    store.addMember('Enfant', '👶');
  }

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
