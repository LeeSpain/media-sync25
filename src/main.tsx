import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById("root")!

;(async () => {
  const React = await import('react')
  // Expose React globally for libraries expecting it
  ;(window as any).React = React

  const { default: App } = await import('./App.tsx')
  createRoot(rootEl).render(<App />)
})()

