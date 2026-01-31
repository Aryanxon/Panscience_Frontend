import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './Routes/Layout'
import UploadPage from './components/UploadPage'
import ChatPage from './components/ChatPage'

function App() {
  return (
    <Router>
      <Layout>
        {/* <div className="page-wrapper"> */}
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        {/* </div> */}
      </Layout>
    </Router>
  )
}

export default App
