import React from 'react';
import { useNavigate } from 'react-router-dom';

const Testpage = () => {
    const navigate = useNavigate();

    const handleDemoClick = () => {
        navigate('/demo');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            backgroundColor: '#f0f0f0' // Light background to differentiate
        }}>
            <h1>Welcome to the Test Page</h1>
            <p>Click the button below to go to the Scratch Editor</p>
            <button 
                onClick={handleDemoClick}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px',
                    transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
                Launch Scratch Editor
            </button>
        </div>
    );
};

export default Testpage;