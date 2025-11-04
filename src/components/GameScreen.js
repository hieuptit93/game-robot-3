import React, { useEffect, useRef } from 'react';
import './GameScreen.css';
import spaceshipImage from '../assets/images/spaceship.png';
import useTextToSpeech from '../hooks/useTextToSpeech';

const GameScreen = ({
  altitude,
  checkpointsPassed,
  timeLeft,
  playerYPosition,
  playerRotation,
  isAnimating,
  currentWordData,
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
  audioLevel,
  streak,
  onExit

}) => {
  const { speak, isPlaying, isSupported, stop } = useTextToSpeech();
  const previousWordRef = useRef(null);

  // Kiểm tra xem VAD có đang hoạt động không
  const isVADActive = isListening || isRecording || isProcessing || isWaitingForPronunciation;

  // Tự động phát âm khi từ mới xuất hiện
  useEffect(() => {
    if (currentWordData.word && 
        currentWordData.word !== previousWordRef.current && 
        isSupported && 
        !isVADActive) {
      
      // Delay nhỏ để đảm bảo UI đã render xong
      const timer = setTimeout(() => {
        speak(currentWordData.word, {
          lang: 'en-US',
          rate: 0.7,
          pitch: 1
        });
      }, 500);

      previousWordRef.current = currentWordData.word;
      
      return () => clearTimeout(timer);
    }
  }, [currentWordData.word, isSupported, isVADActive, speak]);

  // Dừng TTS khi VAD bắt đầu hoạt động
  useEffect(() => {
    if (isVADActive && isPlaying) {
      stop();
    }
  }, [isVADActive, isPlaying, stop]);

  const handlePlayTTS = () => {
    if (currentWordData.word && isSupported && !isVADActive) {
      speak(currentWordData.word, {
        lang: 'en-US',
        rate: 0.7,
        pitch: 1
      });
    }
  };
  return (
    <div className={`game-screen ${showCollision ? 'collision-screen' : ''}`}>
      {onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'fixed',
            top: '90px',
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
      {/* Header */}
      <div className="game-header">
        <div className={`altitude-indicator ${altitude <= 2000 ? 'low-altitude' : ''}`}>
          <span className="label">Độ cao:</span>
          <span className="value">{altitude.toLocaleString()} km</span>
          {altitude <= 2000 && <span className="warning-icon">⚠️</span>}
        </div>
        <div className="timer">
          <span className="label">Thời gian:</span>
          <span className="value">{timeLeft}</span>
        </div>
        <div className="checkpoints">
          <span className="label">Trạm:</span>
          <span className="value">{checkpointsPassed}/10</span>
          <div className="checkpoint-progress">
            <div 
              className="checkpoint-fill" 
              style={{ width: `${(checkpointsPassed / 10) * 100}%` }}
            ></div>
          </div>
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
          className={`player-ship ${isAnimating ? 'animating' : ''} ${checkpointsPassed === 10 ? 'final-flight' : ''} ${showCollision ? 'collision' : ''} ${showPowerUpEffect ? 'power-up-boost' : ''} ${showExplosion ? 'exploding' : ''}`}
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

        {/* Ground Proximity Warning */}
        {altitude <= 1000 && altitude > 0 && (
          <div className="ground-warning">
            <div className="warning-text">⚠️ CẢNH BÁO ĐỘ CAO THẤP! ⚠️</div>
            <div className="warning-subtext">Nói to để máy bay bốc lên!</div>
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

        {/* Finish Line - appears when checkpoints reaches 9 */}
        {checkpointsPassed >= 9 && (
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
            {isSupported && (
              <button 
                className={`tts-button ${isPlaying ? 'playing' : ''} ${isVADActive ? 'disabled' : ''}`}
                onClick={handlePlayTTS}
                disabled={isPlaying || isVADActive}
                title={isVADActive ? "Không thể phát âm khi đang nhận diện giọng nói" : "Nghe phát âm từ"}
              >
                {isVADActive ? '🔇' : isPlaying ? '🔊' : '🔉'}
              </button>
            )}
            <div className="word-container">
              <span className="current-word">{currentWordData.word}</span>
              <span className="phonetic-transcription">{currentWordData.phonetic}</span>
            </div>
          </div>

          <div className="status-display">
            <span className={`status-indicator ${isListening && isRecording ? 'recording' : isListening ? 'listening' : isProcessing ? 'processing' : isWaitingForPronunciation ? 'waiting' : 'ready'}`}>
              {isListening && isRecording ? '🎤 Ghi âm' :
                isListening ? '👂 Nghe' :
                  isProcessing ? '⏳ Xử lý' :
                    isWaitingForPronunciation ? '⏳ Chờ' :
                      '✅ Sẵn sàng'}
            </span>

            {/* Real-time Audio Visualizer */}
            {(isListening || isRecording) && (
              <div className="audio-visualizer">
                <div className="audio-bars">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`audio-bar ${isRecording ? 'active' : ''}`}
                      style={{
                        height: `${Math.max(20, Math.min(100, (audioLevel || 0) + (i * 10) + Math.random() * 20))}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

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