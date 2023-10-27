import React from 'react'
import ReactDOM from 'react-dom/client'
import Wordle from './components/Wordle/Wordle.tsx'
import './globalStyles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Wordle />
  </React.StrictMode>,
)
