import { useState, useRef, useEffect } from 'react' // Added useEffect
import { useNavigate } from 'react-router-dom'

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') 
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // --- NEW: AUTO-REDIRECT LOGIC ---
  useEffect(() => {
    const storedFile = localStorage.getItem('uploadedFile')
    if (storedFile) {
      // If a file session exists, skip the upload page
      navigate('/chat')
    }
  }, [navigate])
  // --------------------------------

  const supportedTypes = {
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'video/mp4': '.mp4'
  }

  const isValidFileType = (file) => {
    return Object.keys(supportedTypes).includes(file.type)
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!isValidFileType(file)) {
      setMessage('Please select a valid file type (PDF, MP3, WAV, or MP4)')
      setMessageType('error')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
    setMessage('')
    setMessageType('')
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage('Please select a file to upload')
      setMessageType('error')
      return
    }

    setIsUploading(true)
    setMessage('Uploading file...')
    setMessageType('')

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://coiffeurr-api.onrender.com/api/files/upload')
        xhr.responseType = 'json'

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setMessage(`Uploading... ${percent}%`)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = xhr.response || {}

            try {
              localStorage.setItem('uploadedFile', JSON.stringify({
                fileId: result.fileId || null,
                fileType: result.fileType || selectedFile.type,
                fileName: result.fileName || selectedFile.name
              }))
            } catch (e) {
              console.error("Local storage error:", e)
            }

            setMessage(`File "${(result.fileName || selectedFile.name)}" uploaded successfully!`)
            setMessageType('success')

            setTimeout(() => {
              navigate('/chat')
            }, 800) // Slightly faster transition

            resolve()
          } else {
            let errMessage = xhr.statusText || `Status ${xhr.status}`
            try {
              const body = xhr.response
              if (body && body.message) errMessage = body.message
            } catch (e) {}
            reject(new Error(errMessage))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.onabort = () => reject(new Error('Upload aborted'))

        const formData = new FormData()
        formData.append('file', selectedFile)
        xhr.send(formData)
      })

    } catch (error) {
      setMessage(`Upload failed: ${error.message}`)
      setMessageType('error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1>Upload a File</h1>
        <p className="subtitle">Choose a document or media file to start chatting</p>
        
        <div className="file-input-section">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.mp3,.wav,.mp4"
            onChange={handleFileChange}
            disabled={isUploading}
            className="file-input"
          />
          
          {selectedFile && (
            <div className="selected-file">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`upload-button ${
            isUploading ? 'uploading' : ''
          } ${!selectedFile ? 'disabled' : ''}`}
        >
          {isUploading ? 'Uploading...' : 'Upload & Chat'}
        </button>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="supported-formats">
          <h3>Supported Formats</h3>
          <div className="format-tags">
            <span>PDF</span>
            <span>MP3</span>
            <span>WAV</span>
            <span>MP4</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage