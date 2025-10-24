import React from 'react';
import './GameScreen.css';
import spaceshipImage from '../assets/images/spaceship.png';

const GameScreen = ({
  altitude,
  score,
  timeLeft,
  playerYPosition,
  playerRotation,
  isAnimating,
  currentWord,
  isRecording,
  isListening,
  isProcessing,
  isWaitingForPronunciation,
  pronunciationError,
  lastResult,
  obstacles,
  powerUps,
  showCollision,
  showPowerUpEffect,
  collisionCount,
  showExplosion,

}) => {
  return (
    <div className={`game-screen ${showCollision ? 'collision-screen' : ''}`}>
      {/* Header */}
      <div className="game-header">
        <div className="altitude-indicator">
          <span className="label">Độ cao:</span>
          <span className="value">{altitude.toLocaleString()} km</span>
        </div>
        <div className="timer">
          <span className="label">Thời gian:</span>
          <span className="value">{timeLeft}</span>
        </div>
        <div className="score">
          <span className="label">Điểm:</span>
          <span className="value">{score}/10</span>
        </div>
        <div className="collision-counter">
          <span className="label">Va chạm:</span>
          <span className={`value ${collisionCount >= 4 ? 'danger' : collisionCount >= 3 ? 'warning' : ''}`}>
            {collisionCount}/5
          </span>
        </div>

      </div>

      {/* Body - Game Area */}
      <div className="game-body">
        <div className="space-background">
          <div className="stars moving-stars"></div>
          <div className="clouds moving-clouds"></div>
          <div className="planet"></div>
        </div>

        <div
          className={`player-ship ${isAnimating ? 'animating' : ''} ${score === 10 ? 'final-flight' : ''} ${showCollision ? 'collision' : ''} ${showPowerUpEffect ? 'power-up-boost' : ''} ${showExplosion ? 'exploding' : ''}`}
          style={{
            top: `${playerYPosition}%`,
            transform: `rotate(${playerRotation}deg)`,
            transition: isAnimating ? 'transform 0.15s ease-out' : 'top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.15s ease-out'
          }}
        >
          <img src={spaceshipImage} alt="Spaceship" className="spaceship-image" />
        </div>

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className="obstacle"
            style={{
              top: `${obstacle.y}%`,
              right: `${100 - obstacle.x}%`
            }}
          >
            🌪️
          </div>
        ))}

        {/* Power-ups */}
        {powerUps.map(powerUp => (
          <div
            key={powerUp.id}
            className="power-up"
            style={{
              top: `${powerUp.y}%`,
              right: `${100 - powerUp.x}%`
            }}
          >
            ⚡
          </div>
        ))}

        {/* Collision Effect Text */}
        {showCollision && (
          <div className="effect-text collision-text">
            💥 VA CHẠM!
          </div>
        )}

        {/* Power-up Effect Text */}
        {showPowerUpEffect && (
          <div className="effect-text power-up-text">
            ⚡ TĂNG TỐC!
          </div>
        )}

        {/* Explosion Effect */}
        {showExplosion && (
          <div className="explosion-container">
            <div className="explosion-effect">💥</div>
            <div className="explosion-particles">
              <div className="particle particle-1">🔥</div>
              <div className="particle particle-2">💨</div>
              <div className="particle particle-3">⚡</div>
              <div className="particle particle-4">🔥</div>
              <div className="particle particle-5">💨</div>
              <div className="particle particle-6">⚡</div>
            </div>
            <div className="explosion-text">
              💥 MÁY BAY NỔ TUNG! 💥
            </div>
          </div>
        )}

        {/* Finish Line - appears when score reaches 9 */}
        {score >= 9 && (
          <div className="finish-line">
            <div className="finish-flag">🏁</div>
            <div className="finish-text">ĐÍCH</div>
          </div>
        )}

        <div className="altitude-visual">
          <div className="altitude-bar">
            <div
              className="altitude-fill"
              style={{
                height: `${Math.max(0, Math.min(100, (altitude / 15000) * 100))}%`
              }}
            ></div>
          </div>
          <div className="altitude-markers">
            <div className="marker">15km</div>
            <div className="marker">10km</div>
            <div className="marker">5km</div>
            <div className="marker">0km</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="game-footer">
        <div className="footer-content">
          <div className="word-display">
            <span className="current-word">{currentWord}</span>
          </div>

          <div className="status-display">
            <span className={`status-indicator ${isListening && isRecording ? 'recording' : isListening ? 'listening' : isProcessing ? 'processing' : isWaitingForPronunciation ? 'waiting' : 'ready'}`}>
              {isListening && isRecording ? '🎤 Ghi âm' :
                isListening ? '👂 Nghe' :
                  isProcessing ? '⏳ Xử lý' :
                    isWaitingForPronunciation ? '⏳ Chờ' :
                      '✅ Sẵn sàng'}
            </span>

            {lastResult && (
              <span className={`pronunciation-score ${lastResult.total_score * 100 >= 50 ? 'correct' : 'incorrect'}`}>
                {Math.round(lastResult.total_score * 100)}đ
              </span>
            )}
          </div>

          {pronunciationError && (
            <div className="error-display">
              <span className="error-text">{pronunciationError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;