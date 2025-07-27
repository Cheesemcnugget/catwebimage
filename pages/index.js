import { useState } from 'react';

export default function Home() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/image-to-text', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setOutput(data.text);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setNotification(true);
    setTimeout(() => setNotification(false), 2000);
  };

  return (
    <div style={{ margin: '20px', maxWidth: '800px' }}>
      <h1>Image to Text Converter</h1>
      <input 
        type="file" 
        id="imgInput" 
        accept="image/*" 
        onChange={handleImageUpload}
        disabled={loading}
      />
      
      <textarea
        style={{
          width: '100%',
          height: '300px',
          fontFamily: 'monospace',
          marginTop: '10px',
          whiteSpace: 'pre',
        }}
        value={output}
        readOnly
      />
      
      <button 
        onClick={copyToClipboard} 
        disabled={!output || loading}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: output && !loading ? '#4CAF50' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: output && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Processing...' : 'Copy to Clipboard'}
      </button>
      
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
        }}>
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
