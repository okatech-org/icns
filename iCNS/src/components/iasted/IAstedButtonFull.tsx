import { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, Brain } from 'lucide-react';

interface IAstedButtonProps {
  voiceListening?: boolean;
  voiceSpeaking?: boolean;
  voiceProcessing?: boolean;
  pulsing?: boolean; // Visual feedback for sound events
  onClick?: () => void;
  onSingleClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  audioLevel?: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg'; // Button size variant
  isInterfaceOpen?: boolean;
  embedded?: boolean; // If true, button is relative and not draggable
}

interface Shockwave {
  id: number;
}

interface Position {
  x: number;
  y: number;
}

const styles = `
/* Styling de base avec perspective améliorée */
.perspective-container {
  perspective: 1500px;
  position: fixed;
  z-index: 9999;
}

.perspective-container.embedded-mode {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  transform: none !important;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}

.perspective-container.grabbing {
  cursor: grabbing !important;
}

.thick-matter-button.grabbing {
  cursor: grabbing !important;
}

.perspective {
  perspective: 1200px;
  position: relative;
  transform-style: preserve-3d;
}

/* Style pour le bouton avec matière épaisse et battement de cœur global AMÉLIORÉ */
.thick-matter-button {
  transform-style: preserve-3d;
  border-radius: 50%;
  will-change: transform, box-shadow, border-radius, filter;
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  animation: 
    global-heartbeat 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    rhythm-variation 15s ease-in-out infinite,
    micro-breathing 4s ease-in-out infinite,
    subtle-rotation 20s linear infinite;
}

/* Micro respiration pour effet plus organique */
@keyframes micro-breathing {
  0%, 100% { transform: scale(1) translateZ(0); }
  25% { transform: scale(1.02) translateZ(2px); }
  50% { transform: scale(0.98) translateZ(-2px); }
  75% { transform: scale(1.01) translateZ(1px); }
}

/* Rotation subtile continue */
@keyframes subtle-rotation {
  from { transform: rotateY(0deg) rotateX(0deg); }
  to { transform: rotateY(360deg) rotateX(10deg); }
}

/* État hover - intensification MAXIMALE des battements */
.thick-matter-button:hover {
  animation: 
    global-heartbeat-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    rhythm-variation 15s ease-in-out infinite,
    hover-glow 1.4s ease-in-out infinite,
    hover-expansion 2s ease-in-out infinite;
}

/* Expansion au survol */
@keyframes hover-expansion {
  0%, 100% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.05) translateZ(10px); }
}

/* État actif - contraction musculaire ORGANIQUE ET FLUIDE */
.thick-matter-button:active {
  animation: muscle-contraction-organic 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
}

@keyframes muscle-contraction-organic {
  0% { transform: scale3d(1, 1, 1); filter: brightness(1) saturate(1.7); border-radius: 50%; }
  15% { transform: scale3d(0.94, 0.92, 0.96) rotateX(2deg) rotateY(-1deg); filter: brightness(0.88) saturate(2) hue-rotate(5deg); border-radius: 54% 46% 47% 53% / 46% 54% 45% 55%; }
  35% { transform: scale3d(0.82, 0.78, 0.86) rotateX(4deg) rotateY(-3deg); filter: brightness(0.78) saturate(2.5) hue-rotate(12deg); border-radius: 62% 38% 41% 59% / 40% 60% 39% 61%; }
  65% { transform: scale3d(0.95, 0.94, 0.96) rotateX(1deg) rotateY(0deg); filter: brightness(0.98) saturate(2.3) hue-rotate(5deg); border-radius: 54% 46% 47% 53% / 46% 54% 45% 55%; }
  100% { transform: scale3d(1, 1, 1); filter: brightness(1) saturate(1.7); border-radius: 50%; }
}

@keyframes rhythm-variation {
  0%, 100% { animation-timing-function: cubic-bezier(0.68, -0.2, 0.265, 1.55); }
  15% { animation-timing-function: cubic-bezier(0.58, -0.1, 0.365, 1.45); }
  30% { animation-timing-function: cubic-bezier(0.78, -0.3, 0.165, 1.65); }
  45% { animation-timing-function: cubic-bezier(0.48, -0.15, 0.465, 1.35); }
  60% { animation-timing-function: cubic-bezier(0.88, -0.35, 0.065, 1.75); }
  75% { animation-timing-function: cubic-bezier(0.38, -0.05, 0.565, 1.25); }
  90% { animation-timing-function: cubic-bezier(0.98, -0.4, 0.265, 1.85); }
}

@keyframes hover-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(0, 170, 255, 0.5), 0 0 80px rgba(0, 170, 255, 0.3), 0 0 120px rgba(0, 170, 255, 0.2), 0 0 160px rgba(0, 170, 255, 0.1), 0 8px 16px rgba(0, 102, 255, 0.2), 0 4px 8px rgba(0, 170, 255, 0.15), inset 0 -5px 15px rgba(0, 102, 255, 0.2), inset 0 5px 15px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 60px rgba(0, 170, 255, 0.7), 0 0 120px rgba(0, 170, 255, 0.5), 0 0 180px rgba(0, 170, 255, 0.3), 0 0 240px rgba(0, 170, 255, 0.2), 0 12px 24px rgba(0, 102, 255, 0.3), 0 6px 12px rgba(0, 170, 255, 0.2), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
}

@keyframes global-heartbeat-intense {
  0% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1) saturate(1.7) hue-rotate(0deg); }
  3% { transform: scale3d(1.08, 1.1, 1.06) rotate(2deg); border-radius: 40% 60% 57% 43% / 44% 56% 44% 56%; filter: brightness(1.2) saturate(2.1) hue-rotate(5deg); }
  6% { transform: scale3d(1.22, 1.18, 1.26) rotate(-3deg); border-radius: 35% 65% 62% 38% / 58% 42% 60% 40%; filter: brightness(1.4) saturate(2.5) hue-rotate(10deg); }
  9% { transform: scale3d(1.3, 1.25, 1.35) rotate(1deg); border-radius: 32% 68% 65% 35% / 62% 38% 64% 36%; filter: brightness(1.5) saturate(2.8) hue-rotate(15deg); }
  12% { transform: scale3d(1.15, 1.12, 1.18) rotate(-1deg); border-radius: 38% 62% 58% 42% / 54% 46% 56% 44%; filter: brightness(1.3) saturate(2.3) hue-rotate(5deg); }
  15% { transform: scale3d(0.88, 0.91, 0.85) rotate(0deg); border-radius: 58% 42% 45% 55% / 42% 58% 44% 56%; filter: brightness(0.85) saturate(1.4) hue-rotate(-5deg); }
  18% { transform: scale3d(0.8, 0.84, 0.76) rotate(0.5deg); border-radius: 62% 38% 42% 58% / 38% 62% 40% 60%; filter: brightness(0.8) saturate(1.3) hue-rotate(-10deg); }
  25% { transform: scale3d(1.12, 1.08, 1.16) rotate(-0.5deg); border-radius: 41% 59% 56% 44% / 58% 42% 57% 43%; filter: brightness(1.2) saturate(2.2) hue-rotate(3deg); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1) saturate(1.7) hue-rotate(0deg); }
}

@keyframes shadow-pulse-intense {
  0%, 100% { box-shadow: 0 0 40px rgba(0, 170, 255, 0.4), 0 0 80px rgba(0, 170, 255, 0.3), 0 8px 16px rgba(0, 102, 255, 0.2), 0 4px 8px rgba(0, 170, 255, 0.15), inset 0 -5px 15px rgba(0, 102, 255, 0.2), inset 0 5px 15px rgba(255, 255, 255, 0.3); }
  6% { box-shadow: 0 0 60px rgba(0, 170, 255, 0.6), 0 0 120px rgba(0, 170, 255, 0.4), 0 16px 32px rgba(0, 102, 255, 0.3), 0 8px 16px rgba(0, 170, 255, 0.2), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
  12% { box-shadow: 0 0 80px rgba(0, 170, 255, 0.8), 0 0 160px rgba(0, 170, 255, 0.6), 0 20px 40px rgba(0, 102, 255, 0.4), 0 10px 20px rgba(0, 170, 255, 0.3), inset 0 -10px 25px rgba(0, 102, 255, 0.3), inset 0 10px 25px rgba(255, 255, 255, 0.5); }
}

@keyframes global-heartbeat {
  0% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1); }
  3% { transform: scale3d(1.05, 1.07, 1.03) rotate(1.5deg); border-radius: 42% 58% 55% 45% / 46% 54% 46% 54%; filter: brightness(1.08); }
  6% { transform: scale3d(1.14, 1.1, 1.18) rotate(-1.5deg); border-radius: 38% 62% 58% 42% / 55% 45% 58% 42%; filter: brightness(1.15); }
  9% { transform: scale3d(1.2, 1.16, 1.24) rotate(0.8deg); border-radius: 35% 65% 62% 38% / 58% 42% 60% 40%; filter: brightness(1.2); }
  12% { transform: scale3d(1.1, 1.07, 1.13) rotate(-0.8deg); border-radius: 40% 60% 55% 45% / 52% 48% 54% 46%; filter: brightness(1.1); }
  15% { transform: scale3d(0.93, 0.96, 0.9) rotate(0deg); border-radius: 55% 45% 48% 52% / 45% 55% 47% 53%; filter: brightness(0.92); }
  18% { transform: scale3d(0.86, 0.9, 0.82) rotate(0.4deg); border-radius: 58% 42% 45% 55% / 42% 58% 44% 56%; filter: brightness(0.86); }
  25% { transform: scale3d(1.07, 1.04, 1.1) rotate(-0.3deg); border-radius: 43% 57% 54% 46% / 56% 44% 55% 45%; filter: brightness(1.07); }
  30% { transform: scale3d(1.12, 1.09, 1.15) rotate(0.6deg); border-radius: 40% 60% 58% 42% / 59% 41% 57% 43%; filter: brightness(1.11); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1); }
}

/* Couche de profondeur pour effet 3D épais */
.depth-layer {
  position: absolute;
  top: 5%; left: 5%;
  width: 90%; height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(0, 102, 255, 0.1) 60%, rgba(0, 170, 255, 0.05) 80%);
  filter: blur(2px);
  opacity: 0.4;
  transform: translateZ(-10px);
}

/* Couche de brillance et reflets pour effet 3D avec pulsation */
.highlight-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 70%);
  transform: translateZ(15px) rotate(45deg);
  opacity: 0.4;
  filter: blur(2px);
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: highlight-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes highlight-pulse {
  0%, 100% { opacity: 0.4; transform: translateZ(15px) rotate(45deg) scale(1); }
  6% { opacity: 0.7; transform: translateZ(20px) rotate(45deg) scale(1.08); }
  12% { opacity: 0.85; transform: translateZ(25px) rotate(45deg) scale(1.12); }
  18% { opacity: 0.25; transform: translateZ(10px) rotate(45deg) scale(0.92); }
}

.satellite-particle {
  width: 8px; height: 8px;
  top: 15px; left: 50%; margin-left: -4px;
  border-radius: 50%;
  background: rgba(0, 170, 255, 0.8);
  box-shadow: 0 0 4px rgba(0, 170, 255, 0.6), 0 0 8px rgba(0, 170, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
  z-index: 20; position: absolute;
  animation: orbit-close 4s linear infinite;
  transform-style: preserve-3d;
  transform: translateZ(20px);
}

@keyframes orbit-close {
  0% { transform: translateZ(20px) rotate(0deg) translateX(30px) rotate(0deg); }
  100% { transform: translateZ(20px) rotate(360deg) translateX(30px) rotate(-360deg); }
}

/* Animations intensifiées pour l'écoute */
.thick-matter-button.voice-listening .organic-membrane {
  animation: membrane-palpitation-listening 0.6s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

.thick-matter-button.voice-listening .organic-membrane-secondary {
  animation: membrane-palpitation-listening-secondary 0.6s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  animation-delay: 0.1s;
}

.thick-matter-button.voice-listening .wave-emission {
  animation: wave-emission-listening 1s cubic-bezier(0.215, 0.61, 0.355, 1) infinite !important;
}

@keyframes membrane-palpitation-listening {
  0%, 100% { opacity: 0.8; transform: scale(1.2) translateZ(15px); filter: blur(2px); }
  50% { opacity: 1; transform: scale(1.5) translateZ(30px); filter: blur(5px); }
}

@keyframes membrane-palpitation-listening-secondary {
  0%, 100% { opacity: 0.6; transform: scale(1.3) translateZ(20px) rotate(0deg); filter: blur(3px); }
  50% { opacity: 0.9; transform: scale(1.6) translateZ(35px) rotate(10deg); filter: blur(6px); }
}

@keyframes wave-emission-listening {
  0% { transform: scale3d(0.9, 0.9, 1) translateZ(0px); opacity: 0.8; filter: blur(0px); }
  100% { transform: scale3d(2.5, 2.5, 1.5) translateZ(20px); opacity: 0; filter: blur(15px); }
}

/* Animations intensifiées pour la parole */
.thick-matter-button.voice-speaking .organic-membrane {
  animation: membrane-palpitation-speaking 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

.thick-matter-button.voice-speaking .organic-membrane-secondary {
  animation: membrane-palpitation-speaking-secondary 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  animation-delay: 0.05s;
}

.thick-matter-button.voice-speaking .wave-emission {
  animation: wave-emission-speaking 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite !important;
}

@keyframes membrane-palpitation-speaking {
  0%, 100% { opacity: 0.9; transform: scale(1.1) translateZ(10px); filter: blur(1px); }
  25% { opacity: 1; transform: scale(1.35) translateZ(25px); filter: blur(4px); }
  50% { opacity: 0.95; transform: scale(1.25) translateZ(20px); filter: blur(3px); }
  75% { opacity: 1; transform: scale(1.4) translateZ(28px); filter: blur(5px); }
}

@keyframes membrane-palpitation-speaking-secondary {
  0%, 100% { opacity: 0.7; transform: scale(1.2) translateZ(15px) rotate(0deg); filter: blur(2px); }
  25% { opacity: 0.95; transform: scale(1.45) translateZ(30px) rotate(8deg); filter: blur(5px); }
  50% { opacity: 0.85; transform: scale(1.35) translateZ(25px) rotate(-5deg); filter: blur(4px); }
  75% { opacity: 1; transform: scale(1.5) translateZ(32px) rotate(12deg); filter: blur(6px); }
}

@keyframes wave-emission-speaking {
  0% { transform: scale3d(1, 1, 1) translateZ(0px); opacity: 0.7; filter: blur(0px); }
  100% { transform: scale3d(2.2, 2.2, 1.4) translateZ(15px); opacity: 0; filter: blur(12px); }
}

/* Intensification du heartbeat pendant l'écoute */
.thick-matter-button.voice-listening {
  animation: 
    global-heartbeat-listening 0.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse-intense 0.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes global-heartbeat-listening {
  0%, 100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1.2) saturate(2); }
  25% { transform: scale3d(1.15, 1.18, 1.12) rotate(3deg); border-radius: 35% 65% 62% 38% / 58% 42% 60% 40%; filter: brightness(1.5) saturate(2.8); }
  50% { transform: scale3d(1.08, 1.05, 1.1) rotate(-2deg); border-radius: 45% 55% 52% 48% / 48% 52% 46% 54%; filter: brightness(1.3) saturate(2.3); }
  75% { transform: scale3d(1.12, 1.15, 1.1) rotate(2deg); border-radius: 40% 60% 58% 42% / 54% 46% 56% 44%; filter: brightness(1.4) saturate(2.5); }
}

/* Intensification du heartbeat pendant la parole - ANIMATIONS MAXIMALES */
.thick-matter-button.voice-speaking {
  animation: 
    global-heartbeat-speaking 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse-speaking 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    speaking-glow 0.4s ease-in-out infinite;
}

@keyframes global-heartbeat-speaking {
  0% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1.2) saturate(2); }
  20% { transform: scale3d(1.25, 1.28, 1.22) rotate(5deg); border-radius: 28% 72% 70% 30% / 68% 32% 70% 30%; filter: brightness(1.8) saturate(3.5); }
  40% { transform: scale3d(1.15, 1.12, 1.18) rotate(-4deg); border-radius: 38% 62% 60% 40% / 58% 42% 60% 40%; filter: brightness(1.4) saturate(2.8); }
  60% { transform: scale3d(1.22, 1.25, 1.2) rotate(4deg); border-radius: 32% 68% 65% 35% / 62% 38% 64% 36%; filter: brightness(1.7) saturate(3.2); }
  80% { transform: scale3d(1.12, 1.1, 1.15) rotate(-3deg); border-radius: 42% 58% 55% 45% / 52% 48% 54% 46%; filter: brightness(1.35) saturate(2.6); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1.2) saturate(2); }
}

@keyframes shadow-pulse-speaking {
  0%, 100% {
    box-shadow: 
      0 0 50px rgba(0, 170, 255, 0.8), 
      0 0 100px rgba(0, 170, 255, 0.6), 
      0 0 150px rgba(0, 170, 255, 0.4),
      0 0 200px rgba(0, 170, 255, 0.3),
      0 12px 30px rgba(0, 102, 255, 0.4),
      inset 0 0 30px rgba(0, 170, 255, 0.3);
  }
  50% {
    box-shadow: 
      0 0 80px rgba(0, 170, 255, 1), 
      0 0 150px rgba(0, 170, 255, 0.8), 
      0 0 220px rgba(0, 170, 255, 0.6),
      0 0 300px rgba(0, 170, 255, 0.4),
      0 16px 40px rgba(0, 102, 255, 0.6),
      inset 0 0 50px rgba(0, 170, 255, 0.5);
  }
}

@keyframes speaking-glow {
  0%, 100% { 
    filter: brightness(1.2) saturate(2) drop-shadow(0 0 20px rgba(0, 170, 255, 0.6));
  }
  50% { 
    filter: brightness(1.6) saturate(3) drop-shadow(0 0 40px rgba(0, 170, 255, 0.9));
  }
}

/* Pulsation pour feedback sonore */
.thick-matter-button.pulsing {
  animation: gentle-pulse-feedback 1s ease-in-out 3;
}

@keyframes gentle-pulse-feedback {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185,129, 0); }
}


.organic-membrane {
  position: absolute; inset: -5%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 20%, rgba(0, 170, 255, 0.03) 40%, rgba(0, 170, 255, 0.08) 60%, rgba(0, 170, 255, 0.04) 80%, transparent 95%);
  opacity: 0;
  animation: membrane-palpitation-intense 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  pointer-events: none;
}

@keyframes membrane-palpitation-intense {
  0%, 100% { opacity: 0; transform: scale(1) translateZ(0); filter: blur(0px); }
  3% { opacity: 0.3; transform: scale(0.95) translateZ(-5px); filter: blur(1px); }
  6% { opacity: 0.7; transform: scale(0.9) translateZ(-10px); filter: blur(0px); }
  9% { opacity: 0.9; transform: scale(1.15) translateZ(15px); filter: blur(2px); }
  12% { opacity: 0.95; transform: scale(1.25) translateZ(20px); filter: blur(3px); }
  18% { opacity: 0.4; transform: scale(1.12) translateZ(10px); filter: blur(1px); }
}

.organic-membrane-secondary {
  position: absolute; inset: -8%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 10%, rgba(255, 204, 0, 0.02) 30%, rgba(0, 170, 255, 0.05) 50%, rgba(255, 0, 255, 0.03) 70%, transparent 90%);
  opacity: 0;
  animation: membrane-palpitation-secondary 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  animation-delay: 0.2s;
  pointer-events: none;
}

@keyframes membrane-palpitation-secondary {
  0%, 100% { opacity: 0; transform: scale(1.05) translateZ(5px) rotate(0deg); filter: blur(2px); }
  5% { opacity: 0.4; transform: scale(0.98) translateZ(0px) rotate(5deg); filter: blur(3px); }
  10% { opacity: 0.8; transform: scale(0.88) translateZ(-15px) rotate(-5deg); filter: blur(1px); }
  15% { opacity: 1; transform: scale(1.2) translateZ(25px) rotate(3deg); filter: blur(4px); }
  20% { opacity: 0.7; transform: scale(1.3) translateZ(30px) rotate(-3deg); filter: blur(5px); }
}

.wave-emission {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(0, 170, 255, 0.3) 30%, transparent 70%);
  transform: scale3d(0.9, 0.9, 1); opacity: 0;
  transform-style: preserve-3d;
}

.wave-1 { animation: wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
.wave-2 { animation: wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; animation-delay: 0.3s; }
.wave-3 { animation: wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; animation-delay: 0.6s; }

@keyframes wave-emission-heartbeat {
  0%, 20%, 100% { transform: scale3d(0.9, 0.9, 1) translateZ(0px); opacity: 0; filter: blur(0px); }
  6% { transform: scale3d(1, 1, 1) translateZ(2px); opacity: 0.7; filter: blur(0px); }
  12% { transform: scale3d(1.8, 1.8, 1.2) translateZ(10px); opacity: 0; filter: blur(10px); }
}

.morphing-bg {
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 102, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 204, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 170, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.7) 0%, transparent 50%),
    linear-gradient(135deg, #0066ff 0%, #00aaff 8%, #00ffff 16%, #4400ff 24%, #ff00ff 32%, #ff0066 40%, #ffcc00 48%, #ffc125 56%, #ff6600 64%, #ff0099 72%, #9400d3 80%, #4b0082 88%, #0066ff 100%);
  background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 400% 400%;
  animation: fluid-mix-organic 25s ease-in-out infinite, bg-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite, fluid-wave 12s ease-in-out infinite, color-shift-continuous 30s linear infinite;
  filter: saturate(2) brightness(1.2);
  mix-blend-mode: lighten;
  box-shadow: inset 0 0 50px rgba(255, 255, 255, 0.3), inset 0 0 100px rgba(0, 170, 255, 0.3), inset 0 0 150px rgba(255, 204, 0, 0.2);
  transform-style: preserve-3d;
}

@keyframes color-shift-continuous {
  0%, 100% { filter: hue-rotate(0deg) saturate(2) brightness(1.2); }
  50% { filter: hue-rotate(180deg) saturate(2.5) brightness(1.3); }
}

@keyframes fluid-wave {
  0%, 100% { background-position: 0% 0%, 100% 100%, 100% 0%, 0% 100%, 50% 50%, 0% 0%; }
  25% { background-position: 50% 50%, 50% 50%, 0% 100%, 100% 0%, 25% 75%, 100% 30%; }
  50% { background-position: 100% 100%, 0% 0%, 0% 0%, 100% 100%, 75% 25%, 60% 100%; }
  75% { background-position: 50% 0%, 50% 100%, 100% 50%, 0% 50%, 50% 50%, 20% 50%; }
}

.thick-matter-button:hover .morphing-bg {
  animation-duration: 12s, 1.4s, 6s, 15s;
  filter: saturate(3) brightness(1.5) contrast(1.3);
}

.moving-highlights {
  position: absolute; inset: 0; border-radius: 50%;
  overflow: hidden; pointer-events: none;
}

.highlight-1, .highlight-2, .highlight-3 {
  position: absolute; width: 80%; height: 80%;
  border-radius: 50%; filter: blur(20px);
  mix-blend-mode: overlay;
}

.highlight-1 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
  animation: highlight-move-1 10s ease-in-out infinite;
}

.highlight-2 {
  background: radial-gradient(circle, rgba(0, 170, 255, 0.7) 0%, transparent 50%);
  animation: highlight-move-2 12s ease-in-out infinite;
}

.highlight-3 {
  background: radial-gradient(circle, rgba(255, 204, 0, 0.6) 0%, transparent 55%);
  animation: highlight-move-3 8s ease-in-out infinite;
}

@keyframes highlight-move-1 {
  0%, 100% { transform: translate(-40%, -40%) scale(0.7); opacity: 0.7; }
  25% { transform: translate(40%, -30%) scale(1.3); opacity: 0.9; }
  50% { transform: translate(30%, 40%) scale(1.1); opacity: 0.8; }
  75% { transform: translate(-30%, 30%) scale(0.9); opacity: 0.75; }
}

@keyframes highlight-move-2 {
  0%, 100% { transform: translate(50%, -50%) scale(1.1); opacity: 0.6; }
  33% { transform: translate(-30%, 50%) scale(1.5); opacity: 0.8; }
  66% { transform: translate(40%, 20%) scale(0.8); opacity: 0.7; }
}

@keyframes highlight-move-3 {
  0%, 100% { transform: translate(-30%, 50%) scale(1.2); opacity: 0.5; }
  20% { transform: translate(50%, 30%) scale(0.8); opacity: 0.7; }
  40% { transform: translate(30%, -50%) scale(1.4); opacity: 0.6; }
  60% { transform: translate(-50%, -30%) scale(0.7); opacity: 0.65; }
  80% { transform: translate(-20%, 20%) scale(1.1); opacity: 0.55; }
}

.fluid-waves {
  position: absolute; inset: -15%; border-radius: 50%;
  overflow: hidden; pointer-events: none;
}

.wave-layer {
  position: absolute; inset: 0;
  border-radius: inherit; opacity: 0.4;
}

.wave-layer-1 {
  background: conic-gradient(from 0deg, transparent, rgba(0, 102, 255, 0.4) 60deg, rgba(0, 170, 255, 0.3) 120deg, transparent 180deg, rgba(255, 204, 0, 0.4) 240deg, rgba(255, 215, 0, 0.3) 300deg, transparent);
  animation: wave-rotate-1 18s linear infinite;
}

.wave-layer-2 {
  background: conic-gradient(from 45deg, transparent, rgba(0, 170, 255, 0.4) 60deg, rgba(0, 102, 255, 0.3) 120deg, transparent 180deg, rgba(255, 215, 0, 0.4) 240deg, rgba(255, 204, 0, 0.3) 300deg, transparent);
  animation: wave-rotate-2 22s linear infinite reverse;
}

.wave-layer-3 {
  background: conic-gradient(from 90deg, transparent, rgba(255, 0, 255, 0.3) 60deg, rgba(138, 43, 226, 0.2) 120deg, transparent 180deg, rgba(0, 255, 255, 0.3) 240deg, rgba(30, 144, 255, 0.2) 300deg, transparent);
  animation: wave-rotate-3 26s linear infinite;
}

@keyframes wave-rotate-1 {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes wave-rotate-2 {
  from { transform: rotate(0deg) scale(1.15); opacity: 0.4; }
  50% { opacity: 0.6; }
  to { transform: rotate(-360deg) scale(1.15); opacity: 0.4; }
}

@keyframes wave-rotate-3 {
  from { transform: rotate(0deg) scale(0.85); }
  to { transform: rotate(360deg) scale(0.85); }
}

.thick-matter-button:hover .wave-layer-1 { animation-duration: 8s; opacity: 0.6; }
.thick-matter-button:hover .wave-layer-2 { animation-duration: 10s; opacity: 0.7; }
.thick-matter-button:hover .wave-layer-3 { animation-duration: 12s; opacity: 0.5; }

.substance-effect {
  position: absolute; inset: 0; border-radius: inherit;
  box-shadow: inset 0 -15px 30px rgba(0, 102, 255, 0.2);
  opacity: 0.4;
  background: radial-gradient(circle at 50% 120%, rgba(255, 255, 255, 0.3) 0%, rgba(0, 170, 255, 0.1) 50%, rgba(0, 102, 255, 0.05) 80%);
  transform-style: preserve-3d;
  animation: inner-fluid-movement 10s ease-in-out infinite alternate, substance-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes substance-pulse {
  0%, 100% { opacity: 0.4; transform: translateZ(5px) scale(1); }
  6% { opacity: 0.55; transform: translateZ(10px) scale(1.08); }
  12% { opacity: 0.65; transform: translateZ(15px) scale(1.12); }
  18% { opacity: 0.45; transform: translateZ(2px) scale(0.92); }
}

@keyframes inner-fluid-movement {
  0% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 60%; opacity: 0.4; transform: translateZ(5px) rotate(0deg); }
  25% { border-radius: 50% 50% 50% 50% / 60% 30% 70% 40%; opacity: 0.55; transform: translateZ(12px) rotate(90deg); }
  50% { border-radius: 60% 40% 30% 70% / 70% 50% 50% 30%; opacity: 0.6; transform: translateZ(18px) rotate(180deg); }
  75% { border-radius: 45% 55% 65% 35% / 40% 60% 40% 60%; opacity: 0.5; transform: translateZ(10px) rotate(270deg); }
  100% { border-radius: 50% 50% 40% 60% / 30% 60% 40% 70%; opacity: 0.4; transform: translateZ(5px) rotate(360deg); }
}

.living-matter {
  animation: living-matter-float 12s ease-in-out infinite alternate, living-matter-rotate 35s linear infinite, living-pulse 5s ease-in-out infinite;
}

@keyframes living-matter-float {
  0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
  20% { transform: translateY(-4px) translateX(3px) rotate(0.8deg); }
  40% { transform: translateY(-7px) translateX(5px) rotate(-0.5deg); }
  60% { transform: translateY(-3px) translateX(2px) rotate(0.3deg); }
  80% { transform: translateY(-5px) translateX(4px) rotate(-0.2deg); }
  100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
}

@keyframes living-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
}

.inner-fluid-layer {
  position: absolute; inset: 0; border-radius: 50%;
  opacity: 0.4; transform-style: preserve-3d;
  pointer-events: none;
}

.layer-1 {
  background: radial-gradient(circle at 30% 40%, rgba(0, 102, 255, 0.3) 0%, rgba(255, 204, 0, 0.2) 50%, transparent 80%);
  animation: fluid-layer-1 10s ease-in-out infinite alternate;
  filter: blur(3px); transform: translateZ(10px);
}

.layer-2 {
  background: radial-gradient(circle at 70% 30%, rgba(255, 204, 0, 0.3) 0%, rgba(0, 170, 255, 0.2) 50%, transparent 80%);
  animation: fluid-layer-2 14s ease-in-out infinite alternate-reverse;
  filter: blur(4px); transform: translateZ(15px);
}

.layer-3 {
  background: radial-gradient(circle at 50% 60%, rgba(0, 170, 255, 0.3) 0%, rgba(255, 215, 0, 0.2) 50%, transparent 80%);
  animation: fluid-layer-3 12s ease-in-out infinite alternate;
  filter: blur(5px); transform: translateZ(20px);
}

@keyframes fluid-layer-1 {
  0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translateZ(10px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: translateZ(15px) rotate(135deg) scale(1.1); opacity: 0.45; }
  100% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; transform: translateZ(18px) rotate(225deg) scale(1); opacity: 0.4; }
}

@keyframes fluid-layer-2 {
  0% { border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%; transform: translateZ(15px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 45% 55% 55% 45% / 45% 55% 55% 45%; transform: translateZ(25px) rotate(-180deg) scale(1.15); opacity: 0.45; }
  100% { border-radius: 50% 50% 70% 30% / 50% 70% 30% 50%; transform: translateZ(22px) rotate(-300deg) scale(1); opacity: 0.4; }
}

@keyframes fluid-layer-3 {
  0% { border-radius: 50% 50% 30% 70% / 60% 40% 60% 40%; transform: translateZ(20px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 65% 35% 40% 60% / 55% 45% 60% 40%; transform: translateZ(24px) rotate(180deg) scale(0.88); opacity: 0.32; }
  100% { border-radius: 40% 60% 60% 40% / 30% 60% 40% 70%; transform: translateZ(28px) rotate(360deg) scale(1); opacity: 0.4; }
}

.vortex-container {
  position: absolute; width: 100%; height: 100%;
  pointer-events: none; transform-style: preserve-3d;
  opacity: 0.4;
}

.vortex {
  position: absolute; inset: 0; border-radius: 50%;
  transform-style: preserve-3d; opacity: 0.3;
  filter: blur(4px);
}

.vortex-1 {
  background: conic-gradient(from 0deg, rgba(0, 102, 255, 0) 0%, rgba(0, 102, 255, 0.3) 20%, rgba(255, 204, 0, 0.4) 40%, rgba(0, 170, 255, 0.3) 60%, rgba(255, 215, 0, 0.2) 80%, rgba(0, 102, 255, 0) 100%);
  animation: vortex-spin-1 12s linear infinite;
  transform: translateZ(8px);
}

.vortex-2 {
  background: conic-gradient(from 180deg, rgba(255, 204, 0, 0) 0%, rgba(255, 204, 0, 0.3) 20%, rgba(0, 102, 255, 0.4) 40%, rgba(255, 215, 0, 0.3) 60%, rgba(0, 170, 255, 0.2) 80%, rgba(255, 204, 0, 0) 100%);
  animation: vortex-spin-2 8s linear infinite;
  transform: translateZ(12px);
}

@keyframes vortex-spin-1 {
  0% { transform: translateZ(8px) rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: translateZ(10px) rotate(180deg) scale(1); opacity: 0.4; }
  100% { transform: translateZ(8px) rotate(360deg) scale(1); opacity: 0.3; }
}

@keyframes vortex-spin-2 {
  0% { transform: translateZ(12px) rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: translateZ(16px) rotate(-180deg) scale(1.15); opacity: 0.5; }
  100% { transform: translateZ(12px) rotate(-360deg) scale(1); opacity: 0.3; }
}

.organic-texture {
  position: absolute; inset: 0; border-radius: 50%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 60% 20%, rgba(0, 170, 255, 0.06) 0%, transparent 25%),
    radial-gradient(circle at 80% 60%, rgba(255, 204, 0, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 30% 70%, rgba(0, 102, 255, 0.06) 0%, transparent 30%),
    radial-gradient(circle at 70% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.04) 0%, transparent 35%);
  opacity: 0.6;
  mix-blend-mode: overlay;
  animation: texture-shift 18s ease-in-out infinite, texture-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes texture-shift {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.08) rotate(90deg); }
  50% { transform: scale(0.92) rotate(180deg); }
  75% { transform: scale(1.05) rotate(270deg); }
}

@keyframes texture-pulse {
  0%, 100% { opacity: 0.6; }
  6% { opacity: 0.85; }
  12% { opacity: 0.95; }
  18% { opacity: 0.5; }
}

.organic-veins {
  position: absolute; inset: 5%; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(0, 102, 255, 0.15) 20deg, rgba(0, 170, 255, 0.1) 40deg, transparent 60deg, rgba(255, 204, 0, 0.12) 80deg, rgba(255, 215, 0, 0.08) 100deg, transparent 120deg, rgba(0, 170, 255, 0.18) 140deg, rgba(0, 102, 255, 0.1) 160deg, transparent 180deg, rgba(255, 215, 0, 0.15) 200deg, rgba(255, 204, 0, 0.1) 220deg, transparent 240deg, rgba(30, 144, 255, 0.13) 260deg, rgba(138, 43, 226, 0.08) 280deg, transparent 300deg, rgba(255, 193, 37, 0.16) 320deg, rgba(255, 127, 80, 0.1) 340deg, transparent 360deg);
  animation: organic-veins 4s ease-in-out infinite, vortex-spin-1 25s linear infinite reverse, vein-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  filter: blur(2px);
  mix-blend-mode: screen;
  pointer-events: none;
}

@keyframes organic-veins {
  0%, 100% { opacity: 0.15; filter: blur(3px); }
  25% { opacity: 0.35; filter: blur(2px); }
  50% { opacity: 0.2; filter: blur(2.5px); }
  75% { opacity: 0.4; filter: blur(1.5px); }
}

@keyframes vein-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.15; }
  6% { transform: scale(1.15) rotate(2deg); opacity: 0.25; }
  12% { transform: scale(1.2) rotate(-2deg); opacity: 0.3; }
  18% { transform: scale(0.85) rotate(1deg); opacity: 0.1; }
}

.breathing-bubble {
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.5));
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4), 0 0 12px rgba(0, 170, 255, 0.2), inset -1px -1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
}

@keyframes bubble-life-1 {
  0%, 100% { opacity: 0; transform: translate(-30px, 40px) scale(0); }
  10% { opacity: 0.7; transform: translate(-28px, 35px) scale(0.4); }
  30% { opacity: 1; transform: translate(-18px, 20px) scale(0.9); }
  50% { opacity: 0.6; transform: translate(0px, 0px) scale(1.2); }
  70% { opacity: 0; transform: translate(20px, -20px) scale(1.4); }
}

@keyframes bubble-life-2 {
  0%, 100% { opacity: 0; transform: translate(35px, -25px) scale(0); }
  15% { opacity: 0.6; transform: translate(32px, -22px) scale(0.3); }
  35% { opacity: 0.9; transform: translate(18px, -8px) scale(0.8); }
  55% { opacity: 0.5; transform: translate(-2px, 12px) scale(1.05); }
  75% { opacity: 0; transform: translate(-22px, 32px) scale(1.25); }
}

@keyframes bubble-life-3 {
  0%, 100% { opacity: 0; transform: translate(-15px, -35px) scale(0); }
  20% { opacity: 0.5; transform: translate(-13px, -30px) scale(0.25); }
  40% { opacity: 0.8; transform: translate(-2px, -12px) scale(0.7); }
  60% { opacity: 0.4; transform: translate(12px, 8px) scale(0.95); }
  80% { opacity: 0; transform: translate(25px, 28px) scale(1.15); }
}

.bubble-1 { animation: bubble-life-1 5s ease-out infinite; }
.bubble-2 { animation: bubble-life-2 5.5s ease-out infinite; animation-delay: 1.8s; }
.bubble-3 { animation: bubble-life-3 5.2s ease-out infinite; animation-delay: 3.4s; }

.thick-matter-button:hover .inner-fluid-layer {
  animation-duration: 5s, 7s, 6s;
  opacity: 0.6;
  filter: blur(2px) saturate(2);
}

.thick-matter-button:hover .vortex {
  opacity: 0.5;
  animation-duration: 6s, 4s;
}

.thick-matter-button:hover .organic-veins {
  opacity: 0.3;
  animation-duration: 2s, 12s, 1.4s;
}

.thick-matter-button:hover .substance-effect {
  opacity: 0.6;
  animation-duration: 5s, 1.4s;
}

.thick-matter-button:hover .organic-membrane {
  animation: membrane-contraction-hover 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

.thick-matter-button:hover .organic-membrane-secondary {
  animation: membrane-contraction-secondary-hover 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  animation-delay: 0.1s;
}

@keyframes membrane-contraction-hover {
  0%, 100% { opacity: 0.2; transform: scale(0.98) translateZ(0); filter: blur(1px); }
  10% { opacity: 0.9; transform: scale(0.85) translateZ(-20px); filter: blur(0px); }
  20% { opacity: 1; transform: scale(1.35) translateZ(30px); filter: blur(4px); }
  40% { opacity: 0.4; transform: scale(0.9) translateZ(-10px); filter: blur(2px); }
  60% { opacity: 0.7; transform: scale(1.15) translateZ(15px); filter: blur(2px); }
}

@keyframes membrane-contraction-secondary-hover {
  0%, 100% { opacity: 0.3; transform: scale(1.02) translateZ(5px) rotate(0deg); filter: blur(2px); }
  15% { opacity: 1; transform: scale(0.8) translateZ(-25px) rotate(-10deg); filter: blur(1px); }
  25% { opacity: 0.9; transform: scale(1.4) translateZ(35px) rotate(5deg); filter: blur(5px); }
  50% { opacity: 0.5; transform: scale(0.88) translateZ(-15px) rotate(3deg); filter: blur(2px); }
  70% { opacity: 0.8; transform: scale(1.18) translateZ(20px) rotate(-3deg); filter: blur(3px); }
}

.thick-matter-button:active .morphing-bg {
  filter: saturate(3) brightness(0.7) contrast(1.8);
}

.thick-matter-button:active .inner-fluid-layer {
  transform: scale(0.85);
  opacity: 0.8;
}

.thick-matter-button:active .organic-veins {
  transform: scale(1.2);
  opacity: 0.4;
}

.thick-matter-button::before {
  content: '';
  position: absolute; inset: 0; border-radius: 50%;
  animation: micro-movements 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes micro-movements {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  8% { transform: translate(0.8px, -0.5px) rotate(0.15deg); }
  16% { transform: translate(-0.5px, 0.7px) rotate(-0.08deg); }
  32% { transform: translate(-0.6px, -0.4px) rotate(-0.15deg); }
  64% { transform: translate(-0.4px, -0.5px) rotate(-0.08deg); }
  88% { transform: translate(0.6px, 0.4px) rotate(0.1deg); }
}

.cellular-layer {
  position: absolute; inset: -8%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 30%, rgba(0, 170, 255, 0.15) 50%, rgba(0, 102, 255, 0.1) 70%, transparent 85%);
  animation: cellular-breathing 5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cellular-breathing {
  0%, 100% { opacity: 0.08; transform: scale(0.96); }
  25% { opacity: 0.12; transform: scale(1.01); }
  50% { opacity: 0.2; transform: scale(1.04); }
  75% { opacity: 0.15; transform: scale(0.99); }
}

.shine-effect {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 65%);
  background-size: 200% 200%;
  animation: shine-movement 10s ease-in-out infinite;
  mix-blend-mode: overlay;
  pointer-events: none;
  opacity: 0.8;
}

@keyframes shine-movement {
  0%, 100% { background-position: -200% center; }
  50% { background-position: 200% center; }
}

.thick-matter-button:hover .shine-effect {
  animation-duration: 4s;
  opacity: 1;
}

@keyframes shadow-pulse {
  0%, 100% { box-shadow: 0 6px 12px rgba(0, 170, 255, 0.2), 0 3px 6px rgba(0, 170, 255, 0.15), 0 0 50px rgba(0, 170, 255, 0.15), 0 0 100px rgba(0, 170, 255, 0.08), inset 0 -4px 12px rgba(0, 102, 255, 0.15), inset 0 4px 12px rgba(255, 255, 255, 0.25); }
  6% { box-shadow: 0 8px 16px rgba(0, 170, 255, 0.25), 0 4px 8px rgba(0, 170, 255, 0.2), 0 0 80px rgba(0, 170, 255, 0.2), 0 0 140px rgba(0, 170, 255, 0.1), inset 0 -6px 16px rgba(0, 102, 255, 0.2), inset 0 6px 16px rgba(255, 255, 255, 0.3); }
  12% { box-shadow: 0 12px 28px rgba(0, 170, 255, 0.3), 0 6px 14px rgba(0, 170, 255, 0.25), 0 0 120px rgba(0, 170, 255, 0.3), 0 0 200px rgba(0, 170, 255, 0.15), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
}

.particle-container {
  position: absolute; width: 100%; height: 100%;
  pointer-events: none;
}

.floating-particle {
  position: absolute;
  width: 4px; height: 4px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
}

@keyframes particle-float-1 {
  0%, 100% { opacity: 0; transform: translate(0, 0) scale(0); }
  20% { opacity: 0.6; transform: translate(-20px, -30px) scale(1); }
  40% { opacity: 0.8; transform: translate(-40px, -20px) scale(1.2); }
  60% { opacity: 0.6; transform: translate(-30px, -40px) scale(0.8); }
  80% { opacity: 0.3; transform: translate(-10px, -50px) scale(0.5); }
}

@keyframes particle-float-2 {
  0%, 100% { opacity: 0; transform: translate(0, 0) scale(0); }
  25% { opacity: 0.5; transform: translate(30px, -25px) scale(0.8); }
  50% { opacity: 0.7; transform: translate(25px, -45px) scale(1.1); }
  75% { opacity: 0.4; transform: translate(35px, -35px) scale(0.6); }
}

.particle-float-1 { animation: particle-float-1 8s ease-out infinite; }
.particle-float-2 { animation: particle-float-2 10s ease-out infinite; animation-delay: 2s; }

.fixed-icons-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  pointer-events: none; z-index: 40;
  animation: icon-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  6% { transform: scale(0.92); }
  12% { transform: scale(0.88); }
  18% { transform: scale(1.08); }
  30% { transform: scale(0.96); }
  60% { transform: scale(0.91); }
  75% { transform: scale(1.04); }
}

.icon-container {
  position: relative; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
}

.alternating-element {
  position: absolute; opacity: 0;
  transform: translateY(10px) scale(0.9);
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
}

@keyframes fade-in-out {
  0%, 25%, 100% { opacity: 0; }
  5%, 20% { opacity: 1; }
}

.text-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, text-float-animation 3.5s ease-in-out infinite; }
.mic-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, mic-float-animation 3.5s ease-in-out infinite; animation-delay: 3s, 3s; }
.chat-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, chat-float-animation 3.5s ease-in-out infinite; animation-delay: 6s, 6s; }
.brain-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, brain-float-animation 3.5s ease-in-out infinite; animation-delay: 9s, 9s; }

@keyframes text-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7); } 50% { transform: translateY(-8px) scale(1.1); }}
@keyframes mic-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(-5deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(5deg); }}
@keyframes chat-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(5deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(-5deg); }}
@keyframes brain-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(-3deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(3deg); }}

.iasted-text {
  text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,170,255,0.6);
  font-size: var(--iasted-text-size, 20px) !important;
  font-weight: bold; line-height: 1;
}

.icon-svg {
  width: var(--iasted-icon-size, 48px) !important;
  height: var(--iasted-icon-size, 48px) !important;
}

.shockwave-effect {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(0, 102, 255, 0.7) 30%, rgba(0, 170, 255, 0.5) 50%, rgba(255, 204, 0, 0.3) 70%, transparent 90%);
  animation: shockwave 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  mix-blend-mode: screen; pointer-events: none;
}

@keyframes shockwave {
  0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; filter: blur(0px); }
  25% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.9; filter: blur(1px); }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; filter: blur(2px); }
  75% { transform: translate(-50%, -50%) scale(2.2); opacity: 0.4; filter: blur(4px); }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; filter: blur(8px); }
}

.color-shift {
  animation: color-shift-animation 1.5s ease-in-out;
}

@keyframes color-shift-animation {
  0% { filter: hue-rotate(0deg) saturate(2) brightness(1.2); }
  25% { filter: hue-rotate(90deg) saturate(3) brightness(1.4); }
  50% { filter: hue-rotate(180deg) saturate(3.5) brightness(1.6); }
  75% { filter: hue-rotate(270deg) saturate(2.5) brightness(1.3); }
  100% { filter: hue-rotate(360deg) saturate(2) brightness(1.2); }
}

.processing {
  animation: 
    processing-pulse 2s ease-in-out infinite,
    global-heartbeat-intense 1s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite !important;
}

@keyframes processing-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) brightness(1); }
  25% { transform: scale(1.1) rotate(90deg); filter: hue-rotate(90deg) brightness(1.2); }
  50% { transform: scale(0.9) rotate(180deg); filter: hue-rotate(180deg) brightness(0.8); }
  75% { transform: scale(1.05) rotate(270deg); filter: hue-rotate(270deg) brightness(1.1); }
}

/* Badge de mode vocal avec animation pulse améliorée */
.voice-mode-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 12px rgba(16, 185, 129, 0.4),
    0 0 20px rgba(16, 185, 129, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  z-index: 10;
  animation: badge-pulse 1.5s ease-in-out infinite;
  border: 2px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.voice-mode-badge svg {
  width: 16px;
  height: 16px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  animation: icon-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 
      0 4px 12px rgba(16, 185, 129, 0.4),
      0 0 20px rgba(16, 185, 129, 0.3),
      inset 0 1px 2px rgba(255, 255, 255, 0.3);
  }
  50% { 
    transform: scale(1.15);
    box-shadow: 
      0 6px 18px rgba(16, 185, 129, 0.6),
      0 0 35px rgba(16, 185, 129, 0.5),
      0 0 50px rgba(16, 185, 129, 0.3),
      inset 0 1px 3px rgba(255, 255, 255, 0.5);
  }
}

@keyframes icon-pulse {
  0%, 100% { 
    transform: scale(1);
  }
  50% { 
    transform: scale(1.2);
  }
}

.thick-matter-button.sm { width: 80px; height: 80px; }
.thick-matter-button.md { width: 128px; height: 128px; }
.thick-matter-button.lg { width: 160px; height: 160px; }

/* Responsive mobile - adaptation des tailles et optimisations AGRESSIVES */
@media (max-width: 768px) {
  .perspective-container {
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: none !important; /* Désactiver la 3D coûteuse */
  }
  
  .perspective {
    perspective: none !important;
    transform-style: flat !important;
  }

  /* 1. Réduction drastique des couches de rendu */
  .vortex-container,
  .organic-veins,
  .particle-container,
  .breathing-bubble,
  .organic-texture,
  .satellite-particle,
  .highlight-layer,
  .depth-layer,
  .inner-fluid-layer,
  .organic-membrane-secondary,
  .wave-2, 
  .wave-3 {
    display: none !important; /* Désactiver les couches coûteuses */
  }

  /* 2. Simplification du background morphing (le plus lourd) MAIS avec couleurs VIVES et CONTRASTÉES (Identique Desktop) */
  .morphing-bg {
    /* Reconstruction de l'aspect "Vibrant" (Image 1) */
    background: 
      /* Lumière centrale intense */
      radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.8) 0%, transparent 40%),
      /* Bleu électrique (Haut-Gauche) */
      radial-gradient(circle at 20% 20%, rgba(0, 102, 255, 0.95) 0%, transparent 50%),
      /* Or intense (Milieu-Droit) */
      radial-gradient(circle at 80% 40%, rgba(255, 204, 0, 0.95) 0%, transparent 50%),
      /* Cyan lumineux (Bas-Gauche) */
      radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.9) 0%, transparent 50%),
      /* Magenta vibrant (Bas-Droit) */
      radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.9) 0%, transparent 50%),
      /* Fond riche et saturé */
      linear-gradient(135deg, #0066ff 0%, #9400d3 100%);
      
    background-size: 200% 200%;
    animation: mobile-cloud-shift 8s ease-in-out infinite alternate !important;
    /* Rétablissement du filtre de saturation pour l'éclat */
    filter: saturate(1.8) brightness(1.2) contrast(1.1) !important;
    mix-blend-mode: normal !important;
    opacity: 1 !important; /* Opacité maximale */
    box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.4);
  }

  /* Animation douce de déplacement des couleurs */
  @keyframes mobile-cloud-shift {
    0% { background-position: 0% 0%; }
    100% { background-position: 100% 100%; }
  }

  /* 3. Simplification des ombres et de la forme */
  .thick-matter-button {
    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.3) !important;
    animation: mobile-breathing 4s ease-in-out infinite !important;
    transform: translateZ(0); /* Force GPU acceleration without 3D overhead */
    will-change: transform;
  }

  .thick-matter-button:hover {
    box-shadow: 0 12px 25px rgba(0, 102, 255, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.4) !important;
    transform: scale(1.05);
  }

  @keyframes mobile-breathing {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }

  /* 4. Simplification des membranes (garder une seule pour l'effet de vie) */
  .organic-membrane {
    animation: mobile-membrane 3s ease-in-out infinite !important;
    background: radial-gradient(circle, transparent 40%, rgba(0, 170, 255, 0.2) 80%);
    opacity: 0.6;
  }

  @keyframes mobile-membrane {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.1); opacity: 0.7; }
  }

  /* 5. Optimisation des émissions d'ondes */
  .wave-emission {
    background: rgba(0, 170, 255, 0.2);
    border: 1px solid rgba(0, 170, 255, 0.3);
    animation: mobile-wave 2s infinite !important;
  }

  @keyframes mobile-wave {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  /* 6. Gestion des états (Listening/Speaking) simplifiée */
  .thick-matter-button.voice-listening {
    box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.4), 0 0 20px rgba(0, 170, 255, 0.4) !important;
    animation: mobile-pulse-fast 1s infinite !important;
  }

  .thick-matter-button.voice-speaking {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.4) !important;
    animation: mobile-pulse-fast 0.5s infinite !important;
  }

  @keyframes mobile-pulse-fast {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* 7. Tailles Responsive */
  .thick-matter-button.sm { width: 60px; height: 60px; }
  .thick-matter-button.md { width: 90px; height: 90px; }
  .thick-matter-button.lg { width: 110px; height: 110px; }
  
  /* Badge */
  .voice-mode-badge {
    width: 22px; height: 22px;
    top: 0; right: 0;
    animation: none !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  .voice-mode-badge svg {
    width: 12px; height: 12px;
    animation: none !important;
  }
}

/* Adaptation pour très petits écrans (ajustements de taille uniquement) */
@media (max-width: 380px) {
  .thick-matter-button.sm { width: 50px; height: 50px; }
  .thick-matter-button.md { width: 75px; height: 75px; }
  .thick-matter-button.lg { width: 90px; height: 90px; }
  
  .voice-mode-badge {
    width: 18px; height: 18px;
    top: -2px; right: -2px;
  }
}
`;

export const IAstedButtonFull: React.FC<IAstedButtonProps> = ({
  onClick,
  onDoubleClick,
  className = '',
  voiceListening = false,
  voiceSpeaking = false,
  voiceProcessing = false,
  pulsing = false,
  audioLevel = 0,
  size = 'md', // Default size
  embedded = false
}) => {
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [isClicked, setIsClicked] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const buttonPosition = useRef<Position>({ x: 0, y: 0 });
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);

  useEffect(() => {
    if (embedded) return; // Skip positioning logic if embedded

    // Restaurer la position sauvegardée ou utiliser la position par défaut
    const savedPosition = localStorage.getItem('iasted-button-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
      buttonPosition.current = pos;
    } else {
      // Position par défaut (bas à droite) - on calcule dynamiquement selon la taille
      const getSize = () => {
        if (window.innerWidth <= 380) {
          return size === 'sm' ? 56 : size === 'lg' ? 100 : 80;
        } else if (window.innerWidth <= 640) {
          return size === 'sm' ? 64 : size === 'lg' ? 120 : 96;
        } else if (window.innerWidth <= 1024) {
          return size === 'sm' ? 72 : size === 'lg' ? 140 : 112;
        }
        return size === 'sm' ? 80 : size === 'lg' ? 160 : 128;
      };

      const btnSize = getSize();
      const defaultPos = {
        x: window.innerWidth - btnSize - 40,
        y: window.innerHeight - btnSize - 40
      };
      setPosition(defaultPos);
      buttonPosition.current = defaultPos;
    }
  }, []);

  useEffect(() => {
    if (embedded) return;
    if (containerRef.current) {
      containerRef.current.style.left = `${position.x}px`;
      containerRef.current.style.top = `${position.y}px`;
    }
  }, [position, embedded]);

  const voiceStateClass = voiceListening ? 'voice-listening' : voiceSpeaking ? 'voice-speaking' : '';

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging && !embedded) {
      return;
    }

    const shockwaveId = Date.now();
    setShockwaves([...shockwaves, { id: shockwaveId }]);
    setIsClicked(true);

    setIsProcessing(true);

    setTimeout(() => {
      setShockwaves(prev => prev.filter(r => r.id !== shockwaveId));
    }, 1000);

    setTimeout(() => {
      setIsClicked(false);
    }, 1500);

    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    // Gestion des clics simples vs doubles avec délai de 300ms
    clickCount.current += 1;

    if (clickCount.current === 1) {
      // Premier clic - attendre pour voir s'il y a un double clic
      clickTimer.current = setTimeout(() => {
        // Simple clic confirmé
        onClick();
        clickCount.current = 0;
      }, 300); // Délai de 300ms pour détecter le double clic
    } else if (clickCount.current === 2) {
      // Double clic détecté - ouvrir le modal de chat texte
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      onDoubleClick();
      clickCount.current = 0;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (embedded) return;
    setIsActive(true);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseUp = () => {
    setIsActive(false);
    setIsDragging(false);

    if (containerRef.current) {
      const pos = buttonPosition.current;
      localStorage.setItem('iasted-button-position', JSON.stringify(pos));
    }
  };

  const handleMouseLeave = () => {
    setIsActive(false);
    setIsDragging(false);

    if (containerRef.current) {
      const pos = buttonPosition.current;
      localStorage.setItem('iasted-button-position', JSON.stringify(pos));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive) return;

    const deltaX = e.movementX;
    const deltaY = e.movementY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setIsDragging(true);
    }

    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
      buttonPosition.current = { x: constrainedX, y: constrainedY };
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div
        ref={containerRef}
        className={`perspective-container ${isDragging ? 'grabbing' : ''} ${embedded ? 'embedded-mode' : ''}`}
        onMouseMove={handleMouseMove}
      >
        <div className="perspective">
          <button
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`thick-matter-button living-matter ${size} ${isClicked ? 'color-shift' : ''} ${isActive ? 'active' : ''} ${isProcessing ? 'processing' : ''} ${isDragging ? 'grabbing' : ''} ${pulsing ? 'pulsing' : ''} ${voiceStateClass} relative cursor-grab focus:outline-none overflow-hidden border-0 ${className}`}
            style={{
              '--iasted-icon-size': size === 'sm' ? 'clamp(24px, 5vw, 32px)' : size === 'lg' ? 'clamp(48px, 10vw, 64px)' : 'clamp(36px, 7vw, 48px)',
              '--iasted-text-size': size === 'sm' ? 'clamp(12px, 2.5vw, 14px)' : size === 'lg' ? 'clamp(20px, 4vw, 28px)' : 'clamp(16px, 3vw, 20px)',
            } as React.CSSProperties}
          >
            {/* Couche de profondeur */}
            <div className="depth-layer"></div>

            {/* Petite sphère satellite */}
            <div className="satellite-particle"></div>

            {/* Couche cellulaire respirante */}
            <div className="cellular-layer"></div>

            {/* Vagues de fluide organique */}
            <div className="fluid-waves">
              <div className="wave-layer wave-layer-1"></div>
              <div className="wave-layer wave-layer-2"></div>
              <div className="wave-layer wave-layer-3"></div>
            </div>

            {/* Membrane organique palpitante */}
            <div className="organic-membrane"></div>

            {/* Membrane secondaire pour plus de profondeur */}
            <div className="organic-membrane-secondary"></div>

            {/* Background morphing */}
            <div className="absolute inset-0 morphing-bg rounded-full"></div>

            {/* Reflets mobiles */}
            <div className="moving-highlights">
              <div className="highlight-1"></div>
              <div className="highlight-2"></div>
              <div className="highlight-3"></div>
            </div>

            {/* Effet de brillance mobile */}
            <div className="shine-effect"></div>

            {/* Effet de substance épaisse */}
            <div className="substance-effect"></div>

            {/* Couches de fluide interne */}
            <div className="inner-fluid-layer layer-1"></div>
            <div className="inner-fluid-layer layer-2"></div>
            <div className="inner-fluid-layer layer-3"></div>

            {/* Effet de tourbillons */}
            <div className="vortex-container">
              <div className="vortex vortex-1"></div>
              <div className="vortex vortex-2"></div>
            </div>

            {/* Particules additionnelles */}
            <div className="particle-container">
              <div className="floating-particle particle-float-1"></div>
              <div className="floating-particle particle-float-2"></div>
            </div>

            {/* Veines organiques */}
            <div className="organic-veins"></div>

            {/* Émissions d'ondes synchronisées avec le battement */}
            <div className="wave-emission wave-1"></div>
            <div className="wave-emission wave-2"></div>
            <div className="wave-emission wave-3"></div>

            {/* Texture organique de surface */}
            <div className="organic-texture"></div>

            {/* Couche de brillance */}
            <div className="highlight-layer"></div>

            {/* Bulles respiratoires */}
            <div className="breathing-bubble bubble-1"></div>
            <div className="breathing-bubble bubble-2"></div>
            <div className="breathing-bubble bubble-3"></div>

            {/* Effets d'onde de choc au clic */}
            {shockwaves.map(shockwave => (
              <div key={shockwave.id} className="shockwave-effect"></div>
            ))}

            {/* Badge de mode vocal actif */}

            {/* Conteneur des icônes au centre - À l'intérieur du bouton */}
            <div className="fixed-icons-container">
              <div className="icon-container">
                {voiceListening ? (
                  <Mic className="text-white icon-svg" style={{ opacity: 1, transform: 'scale(1.3)' }} />
                ) : voiceSpeaking ? (
                  <span className="text-white iasted-text" style={{ opacity: 1, transform: 'scale(1.2)', fontSize: 'var(--iasted-text-size)' }}>
                    iAsted
                  </span>
                ) : voiceProcessing ? (
                  <Brain className="text-white icon-svg" style={{ opacity: 1, transform: 'scale(1.2)' }} />
                ) : (
                  <>
                    <span className="alternating-element text-element text-white iasted-text">
                      iAsted
                    </span>
                    <Mic className="alternating-element mic-element text-white icon-svg" />
                    <MessageCircle className="alternating-element chat-element text-white icon-svg" />
                    <Brain className="alternating-element brain-element text-white icon-svg" />
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default IAstedButtonFull;
