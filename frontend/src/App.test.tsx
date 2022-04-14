import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

it('renders without crashing', () => {
  const div = document.createElement('div');

  ReactDOM.createRoot(div).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
