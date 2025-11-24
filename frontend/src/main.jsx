import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from './Router.jsx'
import './index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import 'sweetalert2/dist/sweetalert2.min.css'

// Add all FontAwesome icons to the library
library.add(fas, far, fab)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
