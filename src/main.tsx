import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ===== FlixHub Console Manager =====
// Limita logs no console e renomeia script identifier
(() => {
  const MAX_LOGS = 100;
  let logCount = 0;
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const limitedLog = (level: string, fn: Function) => {
    return (...args: any[]) => {
      if (logCount < MAX_LOGS) {
        logCount++;
        fn(...args);
      }
    };
  };

  console.log = limitedLog('log', originalLog);
  console.warn = limitedLog('warn', originalWarn);
  console.error = limitedLog('error', originalError);
  console.info = limitedLog('info', originalInfo);

  // Renomear identificador da aplicação
  (window as any).__flixhub_version = 'FlixHub — v1.0.0';
  console.log('%cFlixHub v1.0.0', 'color: #e50914; font-weight: bold; font-size: 14px;');
})();

createRoot(document.getElementById("root")!).render(<App />);
