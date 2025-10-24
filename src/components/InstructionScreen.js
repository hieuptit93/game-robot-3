import React from 'react';
import './InstructionScreen.css';

const InstructionScreen = ({ onStart }) => {
  return (
    <div className="instruction-screen screen">
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