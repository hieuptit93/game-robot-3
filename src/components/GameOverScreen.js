import React from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({ score, altitude, onRestart }) => {
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
      <div className="explosion-bg"></div>
      <div className="content">
        <div className="game-over-icon">{gameOverInfo.icon}</div>
        <h1 className="title">{gameOverInfo.title}</h1>
        <p className="reason">{gameOverInfo.reason}</p>
        
        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Điểm cuối cùng:</span>
            <span className="stat-value">{score}/10</span>
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