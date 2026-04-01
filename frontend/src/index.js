import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config/msalConfig';
import './styles/Global.css';
import './styles/index.css';
import App from './App';

// Initialize MSAL before rendering
msalInstance.initialize().then(() => {
  // Handle redirect promise (for redirect flow)
  msalInstance.handleRedirectPromise().catch(() => {});

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});
