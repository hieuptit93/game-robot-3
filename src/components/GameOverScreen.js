import React from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({ checkpointsPassed, altitude, onRestart, onExit }) => {
  const getGameOverReason = () => {
    if (altitude <= 0) {
      return {
        title: "💥 MÁY BAY ĐÃ RƠI!",
        reason: "Độ cao đã xuống 0km",
        icon: "🛬"
      };
    } else {
      return {
        title: "⏰ GAME OVER!",
        reason: "",
        icon: "⏱️"
      };
    }
  };

  const gameOverInfo = getGameOverReason();

  return (
    <div className="game-over-screen screen">
      {onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            border: '1px solid #0ea5e9',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        >
          ← Thoát game
        </button>
      )}
      <div className="explosion-bg"></div>
      <div className="content">
        <div className="game-over-icon">{gameOverInfo.icon}</div>
        <h1 className="title">{gameOverInfo.title}</h1>
        <p className="reason">{gameOverInfo.reason}</p>
        
        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Trạm đã qua:</span>
            <span className="stat-value">{checkpointsPassed}/10</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Độ cao cuối:</span>
            <span className="stat-value">{altitude.toLocaleString()} km</span>
          </div>
        </div>

        <button className="btn pulse" onClick={onRestart}>
          CHƠI LẠI
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;