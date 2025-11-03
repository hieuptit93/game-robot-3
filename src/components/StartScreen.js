import React from 'react';
import './StartScreen.css';

const StartScreen = ({ onStart, onExit }) => {
  return (
    <div className="start-screen screen">
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
      <div className="stars"></div>
      <div className="content">
        <h1 className="title float">🚀 SPACE ALTITUDE</h1>
        <h2 className="subtitle">Trò chơi bay lên độ cao vũ trụ</h2>
        <div className="game-info">
          <p>🎯 Mục tiêu: Đạt 10 câu trả lời đúng liên tiếp</p>
          <p>⏰ Thời gian: 2 phút</p>
          <p>🛸 Độ cao bắt đầu: 10,000 km</p>
        </div>
        <button className="btn pulse" onClick={onStart}>
          BẮT ĐẦU GAME
        </button>
      </div>
    </div>
  );
};

export default StartScreen;