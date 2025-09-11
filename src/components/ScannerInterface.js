import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ScannerInterface.css';
import { ReactComponent as UploadIcon } from './upload.svg';

const ScannerInterface = () => {
  const [theme, setTheme] = useState('dark');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [ocrResult, setOcrResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const filesRef = useRef([]);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);

  // --- NEW: Updated ResultDisplay component ---
  const ResultDisplay = ({ data }) => {
    if (isLoading) {
      return <p>Analyzing, please wait...</p>;
    }
    if (!data) {
      return <p>Scanned data will appear here.</p>;
    }
    if (data.error) {
      return <p className="error-text">{data.error}</p>;
    }
    const hasData = data.productName || data.quantity || (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0);
    if (!hasData) { return <p>No specific product data could be extracted from the image.</p> }
    return (
      <div className="structured-result">
        {data.productName && <h3>{data.productName}</h3>}
        {data.quantity && <p className="quantity-display"><strong>Quantity:</strong> {data.quantity}</p>}
        
        {data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0 && (
          <>
            <h4>Ingredients</h4>
            <ul className="ingredient-list">
              {data.ingredients.map((item, index) => (
                <li key={index}>
                  <span className="ingredient-name">{item.name}</span>
                  <span className="ingredient-quantity">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };
  
  // ... (the rest of your functions like handleScan, handleFileChange, etc., remain the same) ...
  const toggleTheme = () => { setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light')); };
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    if (newFiles.length) {
      filesRef.current = [...filesRef.current, ...newFiles];
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };
  const handleRemoveImage = (indexToRemove) => {
    filesRef.current = filesRef.current.filter((_, index) => index !== indexToRemove);
    setImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
  };
  const performOcrRequest = async (formData) => {
    const backendUrl = 'https://medalert-backend-ae9o.onrender.com/api/ocr';
    return axios.post(backendUrl, formData, { headers: { 'Content-Type': 'multipart/form-data', }, timeout: 90000, });
  };
  const handleScan = async () => {
    if (filesRef.current.length === 0) { alert('Please upload an image first.'); return; }
    setIsLoading(true); setOcrResult(null);
    const formData = new FormData();
    filesRef.current.forEach(file => { formData.append('files[]', file); });
    try {
      const response = await performOcrRequest(formData);
      setOcrResult(response.data);
    } catch (error) {
      if (error.response && error.response.status === 503) {
        console.log('Server is waking up (503 error). Retrying in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          const retryResponse = await performOcrRequest(formData);
          setOcrResult(retryResponse.data);
        } catch (retryError) {
          console.error('Error during retry OCR process:', retryError);
          setOcrResult({ error: 'The server is busy. Please try again in a minute.' });
        }
      } else {
        console.error('Error during OCR process:', error);
        setOcrResult({ error: 'Could not scan the image(s). Please try again.' });
      }
    } finally { setIsLoading(false); }
  };
  const clearImages = () => {
    setImagePreviews([]); setOcrResult(null); filesRef.current = [];
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="scanner-container">
        <div className="scanner-main">
            <div className="header">
                <h1>Product Scanner</h1>
                <button onClick={toggleTheme} className="theme-toggle-button">
                    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
            </div>
            <p>Upload images of the product description or use your camera to scan its contents.</p>
            <input type="file" accept="image/jpeg, image/png" multiple onChange={handleFileChange} ref={galleryInputRef} style={{ display: 'none' }} />
            <input type="file" accept="image/jpeg, image/png" capture="environment" onChange={handleFileChange} ref={cameraInputRef} style={{ display: 'none' }} />
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
                    <button className="remove-image-button" onClick={() => handleRemoveImage(index)}>
                      &times;
                    </button>
                </div>
                ))
            ) : (
                <div className="placeholder-text">
                <p>Your uploaded images will appear here.</p>
                </div>
            )}
        </div>
        <div className="ocr-result-container">
          <h2>Extracted Data</h2>
          <div className="ocr-result-box">
            <ResultDisplay data={ocrResult} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScannerInterface;