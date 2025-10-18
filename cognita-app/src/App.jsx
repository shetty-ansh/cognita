import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react'
import './App.css'
import Auth from "./pages/Auth";

function App() {

  return (
    <>
      <Routes>
        <Route path="/auth/login" element={<Auth />} />
      </Routes>
    </>
  )
}

export default App
