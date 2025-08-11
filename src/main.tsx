import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure global React is available for libraries expecting it
// @ts-ignore
;(window as any).React = React

createRoot(document.getElementById("root")!).render(<App />);
