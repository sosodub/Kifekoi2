import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { useMembersStore } from './features/members/store';

const initializeDefaultMembers = () => {
  const store = useMembersStore.getState();
  if (store.members.length === 0) {
    store.addMember('Moi', '👤');
    store.addMember('Enfant', '👶');
  }
};

initializeDefaultMembers();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
