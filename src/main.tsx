import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DevModeWrapper } from './components/DevModeWrapper';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DevModeWrapper>
        <App />
      </DevModeWrapper>
    </BrowserRouter>
  </StrictMode>
);