import React from 'react';
export function GlowingHeart() {
  return <div className="heart-container">
      <div className="heart">
        <div className="heart-lines"></div>
      </div>
      <style jsx>{`
        .heart-container {
          width: 100px;
          height: 100px;
          position: relative;
          transform-style: preserve-3d;
          perspective: 1000px;
          animation: pulse 2s infinite ease-in-out;
        }
        .heart {
          width: 100%;
          height: 100%;
          background: transparent;
          position: relative;
          transform: rotate(-45deg);
        }
        .heart:before,
        .heart:after {
          content: '';
          width: 100%;
          height: 100%;
          position: absolute;
          background: rgba(255, 88, 88, 0.3);
          border-radius: 50%;
          box-shadow: 0 0 30px rgba(255, 88, 88, 0.8);
        }
        .heart:before {
          top: -50%;
        }
        .heart:after {
          left: 50%;
        }
        .heart-lines {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(255, 88, 88, 0.5);
          border-radius: 20%;
          box-shadow:
            0 0 20px rgba(255, 88, 88, 0.5),
            inset 0 0 20px rgba(255, 88, 88, 0.3);
          animation: rotate 10s infinite linear;
        }
        .heart-lines:before,
        .heart-lines:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(22, 189, 202, 0.5);
          border-radius: 20%;
          box-shadow:
            0 0 20px rgba(22, 189, 202, 0.5),
            inset 0 0 20px rgba(22, 189, 202, 0.3);
          animation: rotate-reverse 7s infinite linear;
        }
        .heart-lines:before {
          transform: rotate(60deg);
        }
        .heart-lines:after {
          transform: rotate(-60deg);
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes rotate-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
      `}</style>
    </div>;
}