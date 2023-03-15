
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Core } from './core/setup';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Core>
      <App />
    </Core>
  </React.StrictMode>
);
