import React, {useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import BrowserModalComponent from '../components/browser-modal/browser-modal.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import supportedBrowser from '../lib/supported-browser';
import './index.css';

function ScratchHost({ which = 'main' }) {
  const mountRef = useRef(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (supportedBrowser()) {
      const render = which === 'one'
        ? require('./render-gui-one.jsx').default
        : require('./render-gui.jsx').default;
      render(mountRef.current);          // mount into our single, stable node
    } else {
      const Wrapped = AppStateHOC(BrowserModalComponent, true);
      // Render the browser modal into the same container
      ReactDOM.render(<Wrapped onBack={() => {}} />, mountRef.current);
    }
  }, [which]);

  return <div id="scratch-root" ref={mountRef} />; // single mount point
}

const App = () => (
  <Router>
    <Routes>
      <Route path="/demo" element={<ScratchHost which="one" />} />
      {/* you’re passing ?id=... so this route is enough */}
      <Route path="/" element={<ScratchHost which="main" />} />
      {/* If you truly need /:projectId, keep only ONE of these two routes active at a time */}
      {/* <Route path="/:projectId" element={<ScratchHost which="main" />} /> */}
    </Routes>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));
