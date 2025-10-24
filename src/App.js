import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import StartScreen from './components/StartScreen';
import InstructionScreen from './components/InstructionScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import WinScreen from './components/WinScreen';
import { usePronunciationScoring } from './hooks/usePronunciationScoring';
import { useGameSounds } from './hooks/useGameSounds';

const GAME_STATES = {
    START: 'start',
    INSTRUCTIONS: 'instructions',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

const INITIAL_ALTITUDE = 10000;
const ALTITUDE_GAIN = 800; // Tăng từ 500 lên 800 để bay nhanh hơn
const ALTITUDE_LOSS = 1200; // Tăng từ 1000 lên 1200 để lao xuống nhanh hơn
const WIN_SCORE = 10;
const INITIAL_TIME = 120; // 2 minutes

function App() {
    const [gameState, setGameState] = useState(GAME_STATES.START);
    const [altitude, setAltitude] = useState(INITIAL_ALTITUDE);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [playerYPosition, setPlayerYPosition] = useState(50); // percentage from top
    const [playerRotation, setPlayerRotation] = useState(0); // rotation angle for plane
    const [isAnimating, setIsAnimating] = useState(false);
    const [obstacles, setObstacles] = useState([]); // Array of obstacles
    const [powerUps, setPowerUps] = useState([]); // Array of power-ups
    const [showCollision, setShowCollision] = useState(false); // Collision effect
    const [showPowerUpEffect, setShowPowerUpEffect] = useState(false); // Power-up effect
    const [collisionCount, setCollisionCount] = useState(0); // Đếm số lần va chạm
    const [showExplosion, setShowExplosion] = useState(false); // Hiệu ứng nổ tung


    // Pronunciation words for the game
    const words = [
        'Landscape', 'Position', 'Indicator', 'Effect', 'Computer',
        'Programming', 'Development', 'Technology', 'Explosion', 'Future'
    ];
    const [currentWord, setCurrentWord] = useState(words[0]);
    const [isWaitingForPronunciation, setIsWaitingForPronunciation] = useState(false);

    // Initialize pronunciation scoring hook with manual mode for better control
    const {
        isRecording,
        recordingBlob,
        isListening,
        isProcessing,
        lastResult,
        error: pronunciationError,
        startListening,
        stopListening,
        processPronunciation,
        clearBlob
    } = usePronunciationScoring({
        mode: 'vad',
        autoAnalyze: false, // We'll handle analysis manually for better control
        enableLogging: true
    });

    // Initialize game sounds
    const {
        playPowerUpSound,
        playCollisionSound,
        playExplosionSound,
        playBackgroundMusic,
        stopBackgroundMusic,
        playWinSound,
        playGameOverSound
    } = useGameSounds();

    // Force cleanup microphone function
    const forceCleanupMicrophone = useCallback(async () => {
        console.log('🎤 Force cleanup microphone - stopping all media streams');
        
        try {
            // Stop VAD listening
            if (isListening) {
                await stopListening();
            }
            
            // Clear all states
            setIsWaitingForPronunciation(false);
            clearBlob();
            
            // Force stop all media streams
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Get all active media streams and stop them
                const devices = await navigator.mediaDevices.enumerateDevices();
                console.log('🎤 Available devices:', devices.length);
            }
            
            console.log('✅ Microphone cleanup completed');
        } catch (error) {
            console.error('❌ Error during microphone cleanup:', error);
        }
    }, [isListening, stopListening, clearBlob]);



    // Handle pronunciation analysis manually
    const handleAnalyzePronunciation = useCallback(async (audioBlob) => {
        if (!audioBlob || !currentWord) return;

        try {
            const result = await processPronunciation(currentWord, audioBlob);
            if (result && result.total_score !== undefined) {
                if (result.total_score * 100 >= 50) {
                    handleCorrectAnswer();
                } else {
                    handleWrongAnswer();
                }
            } else {
                handleWrongAnswer();
            }
        } catch (error) {
            console.error('Error analyzing pronunciation:', error);
            handleWrongAnswer();
        }
        setIsWaitingForPronunciation(false);
    }, [currentWord, processPronunciation]);

    // Monitor recording state to trigger analysis
    useEffect(() => {
        if (recordingBlob && !isRecording && !isProcessing && isWaitingForPronunciation && gameState === GAME_STATES.PLAYING) {
            console.log('🎯 Auto-analyzing recorded audio for word:', currentWord);
            handleAnalyzePronunciation(recordingBlob);
        }
    }, [recordingBlob, isRecording, isProcessing, isWaitingForPronunciation, gameState, currentWord, handleAnalyzePronunciation]);

    // Timer effect
    useEffect(() => {
        let timer;
        if (gameState === GAME_STATES.PLAYING && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Stop background music and VAD when time runs out
                        stopBackgroundMusic();

                        // Force stop VAD immediately
                        if (isListening) {
                            console.log('🛑 Force stopping VAD due to time out');
                            stopListening().catch(error => {
                                console.log('VAD stop error on timeout:', error);
                            });
                        }
                        setIsWaitingForPronunciation(false);
                        clearBlob();

                        setTimeout(() => {
                            playGameOverSound();
                        }, 500);
                        setGameState(GAME_STATES.GAME_OVER);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    // Update player position based on altitude
    useEffect(() => {
        const newPosition = Math.max(10, Math.min(90, 90 - (altitude / INITIAL_ALTITUDE) * 80));
        setPlayerYPosition(newPosition);
    }, [altitude]);

    // Handle VAD listening
    const handleStartListening = useCallback(async () => {
        console.log('🎤 Attempting to start VAD listening for word:', currentWord, {
            gameState,
            isListening,
            isWaitingForPronunciation
        });

        if (gameState !== GAME_STATES.PLAYING) {
            console.log('❌ Cannot start VAD: Game not playing');
            return;
        }

        // Force stop any existing VAD first
        if (isListening) {
            console.log('⚠️ VAD already listening, stopping first...');
            try {
                await stopListening();
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.log('Stop error (expected):', error);
            }
        }

        console.log('✅ Starting VAD listening for word:', currentWord);
        setIsWaitingForPronunciation(true);
        clearBlob(); // Clear any previous recording

        try {
            await startListening();
        } catch (error) {
            console.error('Start listening error:', error);
            setIsWaitingForPronunciation(false);
        }
    }, [gameState, isListening, startListening, stopListening, clearBlob, currentWord, isWaitingForPronunciation]);

    const handleStopListening = useCallback(async () => {
        if (!isListening) return;

        await stopListening();
        setIsWaitingForPronunciation(false);
    }, [isListening, stopListening]);

    // Cleanup VAD when game ends - Enhanced cleanup
    useEffect(() => {
        if (gameState !== GAME_STATES.PLAYING && isListening) {
            console.log('🛑 Game state changed to', gameState, '- stopping VAD');
            stopListening().catch(error => {
                console.log('VAD cleanup error:', error);
            });
            setIsWaitingForPronunciation(false);
            clearBlob();
        }
    }, [gameState, isListening, stopListening, clearBlob]);

    // Auto-start VAD when game begins (alternative approach)
    useEffect(() => {
        if (gameState === GAME_STATES.PLAYING && !isListening && !isWaitingForPronunciation) {
            const timer = setTimeout(() => {
                console.log('🎮 Game state is PLAYING, auto-starting VAD...');
                handleStartListening();
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [gameState, isListening, isWaitingForPronunciation, handleStartListening]);

    // No manual controls needed - VAD is fully automatic

    const handleCorrectAnswer = useCallback(() => {
        // Tạo bình năng lượng hướng về máy bay với một chút biến thể
        const powerUpId = Date.now();
        const variation = (Math.random() - 0.5) * 8; // Biến thể ±4%
        const targetY = Math.max(15, Math.min(85, playerYPosition + variation)); // Giới hạn trong màn hình
        setPowerUps(prev => [...prev, {
            id: powerUpId,
            x: 100, // Bắt đầu từ bên phải
            y: targetY, // Hướng về vị trí máy bay với biến thể
            targetY: targetY, // Lưu vị trí đích
            collected: false
        }]);

        // Chờ đến khi power-up "va chạm" với máy bay (70% của animation = 1.05s)
        setTimeout(() => {
            // Play power-up sound
            playPowerUpSound();

            // Hiệu ứng ăn power-up
            setShowPowerUpEffect(true);
            setTimeout(() => setShowPowerUpEffect(false), 1000);

            // Cập nhật altitude và score khi ăn được power-up
            setAltitude(prev => prev + ALTITUDE_GAIN);
            setScore(prev => {
                const newScore = prev + 1;
                if (newScore >= WIN_SCORE) {
                    // Stop background music and play win sound
                    stopBackgroundMusic();
                    setTimeout(() => {
                        playWinSound();
                    }, 1500);
                    setTimeout(() => {
                        // Force stop VAD when winning
                        if (isListening) {
                            console.log('🛑 Force stopping VAD due to win');
                            stopListening().catch(error => {
                                console.log('VAD stop error on win:', error);
                            });
                        }
                        setIsWaitingForPronunciation(false);
                        clearBlob();

                        setGameState(GAME_STATES.WIN);
                    }, 1500);
                }
                return newScore;
            });

            // Plane animation - realistic climb with physics
            setIsAnimating(true);
            setPlayerRotation(-25); // Góc nhẹ hơn, thực tế hơn

            // Tạo hiệu ứng bay lên với gia tốc
            setTimeout(() => {
                setPlayerRotation(-15); // Giảm dần góc nghiêng
            }, 200);

            setTimeout(() => {
                setPlayerRotation(-5); // Tiếp tục giảm
            }, 400);

            setTimeout(() => {
                setPlayerRotation(0); // Về vị trí bình thường
                setIsAnimating(false);
            }, 600);
        }, 1050); // 70% của 1.5s = 1.05s

        // Animation bình năng lượng di chuyển và biến mất
        setTimeout(() => {
            setPowerUps(prev => prev.filter(p => p.id !== powerUpId));
        }, 1500);

        // Reset for next word - chờ sau khi animation hoàn thành
        setTimeout(async () => {
            console.log('✅ Correct answer! Resetting for next word...');

            // Always stop VAD first (don't check isListening state)
            console.log('🛑 Stopping VAD before next word');
            try {
                await stopListening();
            } catch (error) {
                console.log('VAD stop error (expected):', error);
            }

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));

            setCurrentWord(words[Math.floor(Math.random() * words.length)]);
            clearBlob();
            setIsWaitingForPronunciation(false);

            // Wait then restart VAD
            setTimeout(() => {
                console.log('🎤 Auto-restarting VAD for next word');
                handleStartListening();
            }, 1000);
        }, 2200); // 1050ms (collision) + 600ms (animation) + 550ms (buffer)
    }, [words, clearBlob, stopListening, handleStartListening]);

    const handleWrongAnswer = useCallback(() => {
        // Tạo vật cản hướng về máy bay với một chút biến thể
        const obstacleId = Date.now();
        const variation = (Math.random() - 0.5) * 10; // Biến thể ±5%
        const targetY = Math.max(15, Math.min(85, playerYPosition + variation)); // Giới hạn trong màn hình
        setObstacles(prev => [...prev, {
            id: obstacleId,
            x: 100, // Bắt đầu từ bên phải
            y: targetY, // Hướng về vị trí máy bay với biến thể
            targetY: targetY, // Lưu vị trí đích
            hit: false
        }]);

        // Chờ đến khi vật cản "va chạm" với máy bay (70% của animation = 1.05s)
        setTimeout(() => {
            // Tăng số lần va chạm
            setCollisionCount(prev => {
                const newCount = prev + 1;

                // Kiểm tra nếu đã va chạm 5 lần
                if (newCount >= 5) {
                    // Stop background music and play explosion sound
                    stopBackgroundMusic();
                    playExplosionSound();

                    // Hiệu ứng nổ tung
                    setShowExplosion(true);

                    // Game over sau hiệu ứng nổ
                    setTimeout(() => {
                        // Force stop VAD when exploding
                        if (isListening) {
                            console.log('🛑 Force stopping VAD due to explosion');
                            stopListening().catch(error => {
                                console.log('VAD stop error on explosion:', error);
                            });
                        }
                        setIsWaitingForPronunciation(false);
                        clearBlob();

                        playGameOverSound();
                        setGameState(GAME_STATES.GAME_OVER);
                    }, 2000);

                    return newCount;
                } else {
                    // Play collision sound for non-fatal hits
                    playCollisionSound();
                }

                return newCount;
            });

            // Hiệu ứng va chạm
            setShowCollision(true);
            setTimeout(() => setShowCollision(false), 1000);

            // Cập nhật altitude và score khi va chạm (chỉ khi chưa nổ tung)
            setCollisionCount(currentCount => {
                if (currentCount < 4) { // Chỉ cập nhật nếu chưa đến lần va chạm thứ 5
                    setAltitude(prev => {
                        const newAltitude = prev - ALTITUDE_LOSS;
                        if (newAltitude <= 0) {
                            // Stop background music and VAD when altitude reaches 0
                            stopBackgroundMusic();

                            // Force stop VAD immediately
                            if (isListening) {
                                console.log('🛑 Force stopping VAD due to altitude = 0');
                                stopListening().catch(error => {
                                    console.log('VAD stop error on altitude 0:', error);
                                });
                            }
                            setIsWaitingForPronunciation(false);
                            clearBlob();

                            setTimeout(() => {
                                playGameOverSound();
                            }, 500);
                            setGameState(GAME_STATES.GAME_OVER);
                            return 0;
                        }
                        return newAltitude;
                    });
                    setScore(0); // Reset score for consecutive correct answers

                    // Plane animation - realistic nose dive with physics
                    setIsAnimating(true);
                    setPlayerRotation(15); // Bắt đầu nghiêng nhẹ

                    // Tạo hiệu ứng lao xuống với gia tốc
                    setTimeout(() => {
                        setPlayerRotation(35); // Tăng góc nghiêng
                    }, 150);

                    setTimeout(() => {
                        setPlayerRotation(55); // Lao xuống mạnh hơn
                    }, 300);

                    setTimeout(() => {
                        setPlayerRotation(35); // Bắt đầu kéo lại
                    }, 450);

                    setTimeout(() => {
                        setPlayerRotation(10); // Tiếp tục kéo lại
                    }, 600);

                    setTimeout(() => {
                        setPlayerRotation(0); // Về vị trí bình thường
                        setIsAnimating(false);
                    }, 750);
                }
                return currentCount;
            });
        }, 1050); // 70% của 1.5s = 1.05s

        // Animation vật cản di chuyển và biến mất
        setTimeout(() => {
            setObstacles(prev => prev.filter(o => o.id !== obstacleId));
        }, 1500);

        // Reset for next word - chờ sau khi animation hoàn thành (chỉ khi chưa nổ tung)
        setTimeout(async () => {
            // Kiểm tra nếu máy bay chưa nổ tung thì mới reset từ tiếp theo
            setCollisionCount(currentCount => {
                if (currentCount < 5) {
                    console.log('❌ Wrong answer! Resetting for next word...');

                    // Always stop VAD first (don't check isListening state)
                    console.log('🛑 Stopping VAD before next word');
                    stopListening().catch(error => {
                        console.log('VAD stop error (expected):', error);
                    });

                    // Wait for cleanup and reset
                    setTimeout(async () => {
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        setCurrentWord(words[Math.floor(Math.random() * words.length)]);
                        clearBlob();
                        setIsWaitingForPronunciation(false);

                        // Wait then restart VAD
                        setTimeout(() => {
                            console.log('🎤 Auto-restarting VAD for next word');
                            handleStartListening();
                        }, 1000);
                    }, 100);
                }
                return currentCount;
            });
        }, 2550); // 1050ms (collision) + 750ms (animation) + 750ms (buffer)
    }, [words, clearBlob, stopListening, handleStartListening]);

    const startGame = () => {
        setGameState(GAME_STATES.INSTRUCTIONS);
    };

    const startPlaying = () => {
        setGameState(GAME_STATES.PLAYING);
        setAltitude(INITIAL_ALTITUDE);
        setScore(0);
        setTimeLeft(INITIAL_TIME);
        setPlayerRotation(0);
        setIsAnimating(false);
        setCollisionCount(0);
        setShowExplosion(false);
        setCurrentWord(words[Math.floor(Math.random() * words.length)]);

        // Start background music
        setTimeout(() => {
            playBackgroundMusic();
        }, 1000);

        // Auto-start VAD when game begins - use a ref or direct call
        setTimeout(async () => {
            console.log('🎮 Game started, auto-starting VAD...');
            setIsWaitingForPronunciation(true);
            clearBlob();

            try {
                await startListening();
            } catch (error) {
                console.error('Start listening error:', error);
                setIsWaitingForPronunciation(false);
            }
        }, 1000);
    };

    const resetGame = () => {
        // Force stop VAD if running
        if (isListening) {
            console.log('🛑 Force stopping VAD on game reset');
            stopListening().catch(error => {
                console.log('VAD stop error on reset:', error);
            });
        }
        // Stop background music
        stopBackgroundMusic();

        setGameState(GAME_STATES.START);
        setAltitude(INITIAL_ALTITUDE);
        setScore(0);
        setTimeLeft(INITIAL_TIME);
        setPlayerRotation(0);
        setIsAnimating(false);
        setIsWaitingForPronunciation(false);
        setObstacles([]);
        setPowerUps([]);
        setShowCollision(false);
        setShowPowerUpEffect(false);
        setCollisionCount(0);
        setShowExplosion(false);
        clearBlob();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="App">
            {gameState === GAME_STATES.START && (
                <StartScreen onStart={startGame} />
            )}

            {gameState === GAME_STATES.INSTRUCTIONS && (
                <InstructionScreen onStart={startPlaying} />
            )}

            {gameState === GAME_STATES.PLAYING && (
                <GameScreen
                    altitude={altitude}
                    score={score}
                    timeLeft={formatTime(timeLeft)}
                    playerYPosition={playerYPosition}
                    playerRotation={playerRotation}
                    isAnimating={isAnimating}
                    currentWord={currentWord}
                    isRecording={isRecording}
                    isListening={isListening}
                    isProcessing={isProcessing}
                    isWaitingForPronunciation={isWaitingForPronunciation}
                    pronunciationError={pronunciationError}
                    lastResult={lastResult}
                    obstacles={obstacles}
                    powerUps={powerUps}
                    showCollision={showCollision}
                    showPowerUpEffect={showPowerUpEffect}
                    collisionCount={collisionCount}
                    showExplosion={showExplosion}

                />
            )}

            {gameState === GAME_STATES.GAME_OVER && (
                <GameOverScreen
                    score={score}
                    altitude={altitude}
                    onRestart={resetGame}
                />
            )}

            {gameState === GAME_STATES.WIN && (
                <WinScreen
                    score={score}
                    altitude={altitude}
                    onRestart={resetGame}
                />
            )}
        </div>
    );
}

export default App;