import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, RefreshCcw } from 'lucide-react';

const PrintSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15);
  
  // Auto redirect to home after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Redirect to home when countdown reaches 0
      navigate('/', { replace: true });
    }
  }, [countdown, navigate]);
  
  const handleNewSession = () => {
    // Clear session data
    localStorage.removeItem("selectedTemplate");
    localStorage.removeItem("selectedFilter");
    // Redirect to home
    navigate('/', { replace: true });
  };
  
  const handlePrintAgain = () => {
    // Go back to print preview
    navigate('/print-preview');
  };
  
  return (
    <div className="container min-h-screen flex flex-col items-center justify-center w-full min-w-screen bg-gray-50 p-4">
      <div className="success-card bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="success-icon text-green-500 mb-4">
          <CheckCircle size={80} className="mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pencetakan Berhasil!</h1>
        <p className="text-gray-600 mb-8">Foto Anda telah berhasil dicetak. Terima kasih telah menggunakan layanan kami.</p>
        
        <div className="buttons-container grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={handlePrintAgain}
            className="print-again-button bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center"
          >
            <RefreshCcw size={20} className="mr-2" />
            Cetak Lagi
          </button>
          
          <button
            onClick={handleNewSession}
            className="new-session-button bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <Home size={20} className="mr-2" />
            Sesi Baru
          </button>
        </div>
        
        <div className="countdown-container">
          <p className="text-gray-500">
            Kembali ke halaman utama dalam <span className="font-bold text-pink-500">{countdown}</span> detik
          </p>
          <div className="progress-bar h-2 mt-2 bg-gray-200 rounded-full">
            <div 
              className="progress bg-pink-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 15) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSuccess;