import React, { useEffect, useState } from 'react';

const BackToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            display: isVisible ? 'inline' : 'none',
            zIndex: 1000 // Ensure the button is above other elements
        }}>
            <button onClick={scrollToTop} style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#007BFF',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                outline: 'none'
            }}>
                Back to Top
            </button>
        </div>
    );
};

export default BackToTopButton;
