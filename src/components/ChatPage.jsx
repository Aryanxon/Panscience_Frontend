import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown' 
import './ChatPage.css'

const ChatPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [chatHistory, setChatHistory] = useState([]) // Store the conversation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('') // For status/errors

  const navigate = useNavigate()
  const scrollRef = useRef(null)

  useEffect(() => {
    const storedFile = localStorage.getItem('uploadedFile')
    if (storedFile) {
      setUploadedFile(JSON.parse(storedFile))
    } else {
      navigate('/')
    }
  }, [navigate])

  // Scroll to bottom whenever history updates or AI starts thinking
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isAsking])

  const handleRemoveFile = () => {
    localStorage.removeItem('uploadedFile')
    navigate('/')
  }

  async function askQuestion(e) {
    if (e && e.preventDefault) e.preventDefault()

    if (!uploadedFile?.fileId) {
      setChatMessage('No file selected.')
      return
    }

    const userQuery = question.trim()
    if (!userQuery) return

    // Clear input and start loading
    setQuestion('')
    setIsAsking(true)
    setChatMessage('')

    // 1. Add User Question to History
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery }])

    try {
      const resp = await fetch('https://coiffeurr-api.onrender.com/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadedFile.fileId,
          question: userQuery
        })
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => null)
        throw new Error(err?.message || resp.statusText)
      }

      const data = await resp.json()

      // 2. Parse Gemini Response
      let parsed = null
      let answerText = ''
      let usage = null

      try {
        parsed = JSON.parse(data.answer)
        answerText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        usage = parsed?.usageMetadata || null
      } catch (e) {
        answerText = data.answer || ''
      }

      // 3. Add AI Answer to History
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: answerText,
        usage: usage,
        raw: parsed || data
      }])

    } catch (err) {
      setChatMessage(`Error: ${err.message}`)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.message}` 
      }])
    } finally {
      setIsAsking(false)
    }
  }

  if (!uploadedFile) return null

  return (
    <div className="chat-layout">
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={handleRemoveFile}>
            <span>+</span> New Chat
          </button>
        </div>
        <div className="sidebar-bottom">
          <p className="user-label">Settings</p>
        </div>
      </aside>

      <main className="main-chat">
        <header className="mobile-header">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
          <span>Chat Interface</span>
          <div style={{ width: '24px' }}></div>
        </header>

        <div className="messages-list">
          {chatHistory.length === 0 && (
            <div className="welcome-screen">
              <div className="file-icon-large">📄</div>
              <h2>Analyzing {uploadedFile.fileName}</h2>
              <p>Ask a question about this file to get started.</p>
            </div>
          )}

          {/* Render History */}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`msg-row ${msg.role}`}>
              <div className={`msg-avatar ${msg.role === 'assistant' ? 'ai' : ''}`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className="msg-bubble">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                
                {/* Optional metadata for AI messages */}
                {msg.role === 'assistant' && msg.usage && (
                  <div className="msg-meta">
                    Tokens used: {msg.usage.totalTokenCount}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="msg-row assistant">
              <div className="msg-avatar ai">AI</div>
              <div className="msg-bubble typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="input-container-sticky">
          <div className="input-width-wrapper">
            
            {chatMessage && <div className="chat-error-toast">{chatMessage}</div>}

            <div className="file-status-tag">
              <span className="file-pill">
                <span className="clip">📎</span> {uploadedFile.fileName}
                <button className="remove-btn" onClick={handleRemoveFile}>×</button>
              </span>
            </div>

            <form className="chat-input-form" onSubmit={askQuestion}>
              <input
                type="text"
                placeholder="Ask anything about the file..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isAsking}
              />
              <button type="submit" disabled={!question.trim() || isAsking}>
                {isAsking ? '...' : '▲'}
              </button>
            </form>
            <p className="helper-text">Gemini may provide inaccurate info.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChatPage