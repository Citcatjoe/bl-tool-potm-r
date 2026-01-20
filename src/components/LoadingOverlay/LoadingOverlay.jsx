import React from 'react';
import s from './LoadingOverlay.module.scss'; // Import des styles spécifiques au composant via CSS Modules

function LoadingOverlay({ show = true }) {
  if (!show) return null;
  
  return (
    <div className={s.overlay}>
      <div className={s.spinnerContainer}>
        <div className={s.spinner}></div>
      </div>
    </div>
  );
}

export default LoadingOverlay;