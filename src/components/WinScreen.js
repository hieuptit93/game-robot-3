import React from 'react';
import './WinScreen.css';

const WinScreen = ({ score, altitude, onRestart }) => {
  return (
    <div className="win-screen screen">
      <div className="celebration-bg"></div>
      <div className="content">
        <div className="trophy">🏆</div>
        <h1 className="title">🎉 CHÚC MỪNG!</h1>
        <p className="win-message">Bạn đã hoàn thành thử thách!</p>
        
        <div className="achievement-stats">
          <div className="achievement-item">
            <div className="achievement-icon">🎯</div>
            <div className="achievement-text">
              <h3>Điểm hoàn hảo</h3>
              <p>{score}/10 câu trả lời đúng liên tiếp</p>
            </div>
          </div>
          
          <div className="achievement-item">
            <div className="achievement-icon">🚀</div>
            <div className="achievement-text">
              <h3>Độ cao cuối cùng</h3>
              <p>{altitude.toLocaleString()} km</p>
            </div>
          </div>
          
          <div className="achievement-item">
            <div className="achievement-icon">⭐</div>
            <div className="achievement-text">
              <h3>Thành tích</h3>
              <p>Phi công vũ trụ xuất sắc!</p>
            </div>
          </div>
        </div>

        <div className="celebration-message">
          <p>🌟 Bạn đã chứng minh kỹ năng phát âm tuyệt vời!</p>
          <p>🛸 Máy bay của bạn đã bay thành công vào vũ trụ!</p>
        </div>

        <button className="btn pulse" onClick={onRestart}>
          CHƠI LẠI
        </button>
      </div>
    </div>
  );
};

export default WinScreen;