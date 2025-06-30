import React, { useEffect, useRef } from "react";

const badgeStyle = `
.bolt-badge {
  transition: all 0.3s ease;
}
@keyframes badgeIntro {
  0% { transform: rotateY(-90deg); opacity: 0; }
  100% { transform: rotateY(0deg); opacity: 1; }
}
.bolt-badge-intro {
  animation: badgeIntro 0.8s ease-out 1s both;
}
.bolt-badge-intro.animated {
  animation: none;
}
@keyframes badgeHover {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(22deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.bolt-badge:hover {
  animation: badgeHover 0.6s ease-in-out;
}
`;

export default function BoltBadge() {
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    function handleAnimationEnd() {
      img.classList.add("animated");
    }
    img.addEventListener("animationend", handleAnimationEnd);
    return () => {
      img.removeEventListener("animationend", handleAnimationEnd);
    };
  }, []);

  return (
    <>
      <style>{badgeStyle}</style>
      <div className="fixed bottom-4 left-4 z-50">
        <a
          href="https://bolt.new/?rid=os72mi"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-all duration-300 hover:shadow-2xl"
        >
          <img
            ref={imgRef}
            src="https://storage.bolt.army/white_circle_360x360.png"
            alt="Built with Bolt.new badge"
            className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg bolt-badge bolt-badge-intro"
          />
        </a>
      </div>
    </>
  );
}