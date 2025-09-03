import React from 'react';
export function HeartbeatAnimation() {
  return <div className="heartbeat-container">
      <svg className="heartbeat-svg" width="300" height="60" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
        <path className="heartbeat-line" d="M0,30 L30,30 L45,10 L60,50 L75,10 L90,50 L105,30 L300,30" fill="none" strokeWidth="2" />
      </svg>
      <style jsx>{`
        .heartbeat-container {
          width: 300px;
          height: 60px;
          position: relative;
          margin: 20px auto 0;
          overflow: hidden;
        }
        .heartbeat-svg {
          position: absolute;
          left: 0;
          top: 0;
        }
        .heartbeat-line {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          stroke: url(#heartbeatGradient);
          animation: pulse-line 2s infinite linear;
        }
        @keyframes pulse-line {
          0% {
            stroke-dashoffset: 400;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }
      `}</style>
      <svg width="0" height="0">
        <defs>
          <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2980b9" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#27ae60" />
          </linearGradient>
        </defs>
      </svg>
    </div>;
}