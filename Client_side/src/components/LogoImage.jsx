import React from 'react';
export function LogoImage() {
  return <div className="logo-container">
      <img src="/sahaaya-removebg-preview.png" alt="Sahaaya Logo" className="logo-image" />
      <style jsx>{`
        .logo-container {
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(0, 183, 255, 0.4))
            drop-shadow(0 0 12px rgba(68, 214, 144, 0.3));
        }
      `}</style>
    </div>;
}