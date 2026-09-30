import React from "react";
import styles from "./user-profile.css";

const UserProfile = ({ onClose }) => {
    // Get username from localStorage
    console.log("All localStorage items:", { ...localStorage });
    const username = localStorage.getItem("username");
    console.log("Retrieved username:", username);
    const userRole = localStorage.getItem("userRole");

    const handleDashboardClick = () => {
        // Redirect to respective dashboard based on role
        window.location.href = `http://localhost:5173/${userRole}-dashboard`;
    };

    return (
        <div 
            className={styles.overlay} 
            onClick={onClose}
        >
            <div className={styles.profilebox} onClick={(e) => e.stopPropagation()}>
                <h2>User Profile</h2>
                <p>
                    <strong>Username:</strong> {username || 'Guest'}
                </p>
                {/* Add Dashboard Button */}
                <button onClick={handleDashboardClick}>Go to LMS Dashboard</button>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default UserProfile;