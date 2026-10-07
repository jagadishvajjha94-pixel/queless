import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { DEMO_MODE } from './config';
import { installMockApi } from './demo/mockApi';
import './index.css';

if (DEMO_MODE) {
  installMockApi();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
