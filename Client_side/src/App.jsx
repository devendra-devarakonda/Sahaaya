import React from 'react'
import { Routes,Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { LoaderScreen } from './components/LoaderScreen.jsx'


const App = () => {
  return (
    <>
    

    <Routes>

      <Route path="/" element={<LoaderScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
    
    </>
  )
}

export default App