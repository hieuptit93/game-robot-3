import React from 'react';
import './InstructionScreen.css';

const InstructionScreen = ({ onStart, onExit }) => {
  return (
    <div className="instruction-screen screen">
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
        <h1 className="title">📋 HƯỚNG DẪN CHƠI</h1>
        
        <div className="instructions-container">
          <div className="instruction-item">
            <div className="instruction-text">
              <h3>NGHE TỰ ĐỘNG</h3>
              <p>• Nhấn <span className="key">Space</span> để bắt đầu nghe</p>
              <p>• Hệ thống tự động ghi âm khi bạn nói</p>
              <p>• Tự động dừng khi bạn im lặng</p>
            </div>
          </div>
        </div>

        <button className="btn pulse" onClick={onStart}>
          BẮT ĐẦU CHƠI
        </button>
      </div>
    </div>
  );
};

export default InstructionScreen;