import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Router from './Router.jsx'
import InterviewApp from './InterviewApp.jsx'
import './index.css'
const savedTheme = localStorage.getItem('theme') === 'dark' ? 'theme-dark' : 'theme-light'
document.body.classList.remove('theme-light', 'theme-dark')
document.body.classList.add(savedTheme)
// Choose which component to render:
// - Router: Simple AI Interviewer with navigation (NEW - Interview + Config pages)
// - App: Original full-featured interview (existing)
// - InterviewApp: Alternative full-featured interview
const ComponentToRender = Router; // Change this to switch between components
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ComponentToRender/>
  </React.StrictMode>,
)
