import React from "react";
import styles from "./full-screen-instructions.css";

const FullScreenInstructions = ({ text, onClose }) => {
  return (
    <div className={styles.fullScreenBackdrop}>
      <div className={styles.fullScreenContent}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close full screen"
        >
          ✖
        </button>
        <h2 className={styles.header}>Instructions</h2>
        <div className={styles.body}>{text || "No instructions available."}</div>
      </div>
    </div>
  );
};

export default FullScreenInstructions;