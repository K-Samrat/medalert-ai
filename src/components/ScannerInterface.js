import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ScannerInterface.css';
import { ReactComponent as UploadIcon } from './upload.svg';

const ScannerInterface = () => {
  const [imagePreviews, setImagePreviews] = useState([]);
  const [ocrResult, setOcrResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const filesRef = useRef([]);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    if (newFiles.length) {
      filesRef.current = [...filesRef.current, ...newFiles];
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const handleScan = async () => {
    if (filesRef.current.length === 0) {
      alert('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setOcrResult('');

    let combinedText = '';

    for (const file of filesRef.current) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('https://medalert-backend-ae9o.onrender.com/ocr', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        combinedText += response.data.text + '\n\n---\n\n'; // Add separator between results
      } catch (error) {
        console.error('Error scanning file:', file.name, error);
        combinedText += `Error scanning image: ${file.name}\n\n---\n\n`;
      }
    }

    setOcrResult(combinedText);
    setIsLoading(false);
  };

  const clearImages = () => {
    setImagePreviews([]);
    setOcrResult('');
    filesRef.current = [];
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="scanner-container">
      {/* ... rest of your JSX remains the same ... */}
      <div className="scanner-main">
        <h1>Product Scanner</h1>
        <p>Upload images of the product description or use your camera to scan its contents.</p>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={galleryInputRef} style={{ display: 'none' }} />
        <input type="file" capture="environment" onChange={handleFileChange} ref={cameraInputRef} style={{ display: 'none' }} />
        <div className="upload-box">
            <UploadIcon className="upload-icon" />
            <div className="button-group">
                <button className="upload-button" onClick={() => galleryInputRef.current.click()}>From Gallery</button>
                <button className="upload-button" onClick={() => cameraInputRef.current.click()}>Use Camera</button>
            </div>
        </div>
        {imagePreviews.length > 0 && (
          <div className="scan-button-container">
            <button className="scan-button" onClick={handleScan} disabled={isLoading}>
              {isLoading ? 'Scanning...' : `Scan ${imagePreviews.length} Image(s)`}
            </button>
          </div>
        )}
      </div>
      <div className="preview-main">
        <div className="preview-header">
          <h2>Image Previews ({imagePreviews.length})</h2>
          {imagePreviews.length > 0 && (<button onClick={clearImages} className="clear-button">Clear All</button>)}
        </div>
        <div className="image-preview-grid">
            {imagePreviews.length > 0 ? (
                imagePreviews.map((src, index) => (
                <div key={index} className="preview-image-container">
                    <img src={src} alt={`Preview ${index + 1}`} />
                </div>
                ))
            ) : (
                <div className="placeholder-text">
                <p>Your uploaded images will appear here.</p>
                </div>
            )}
        </div>
        <div className="ocr-result-container">
          <h2>Extracted Text</h2>
          <div className="ocr-result-box">
            {isLoading ? <p>Processing, please wait...</p> : <pre>{ocrResult || 'Scanned text will appear here.'}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerInterface;