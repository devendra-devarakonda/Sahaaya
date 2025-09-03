import React from 'react';
export function NetworkBackground() {
  return <div className="network-background">
      <style jsx>{`
        .network-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-image:
            radial-gradient(
              circle at 20% 35%,
              rgba(0, 183, 255, 0.06) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 75% 44%,
              rgba(68, 214, 144, 0.06) 0%,
              transparent 50%
            ),
            linear-gradient(to bottom, #0a1929, #000913);
        }
        .network-background:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgba(0, 183, 255, 0.03) 40px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(68, 214, 144, 0.03) 40px
            );
          opacity: 0.4;
        }
        .network-background:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(
              circle at 15% 25%,
              rgba(0, 183, 255, 0.08) 0%,
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 65%,
              rgba(68, 214, 144, 0.08) 0%,
              transparent 30%
            );
          animation: shift 15s infinite alternate ease-in-out;
        }
        @keyframes shift {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 30% 30%;
          }
        }
      `}</style>
    </div>;
}