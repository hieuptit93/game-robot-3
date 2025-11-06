import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import StartScreen from './components/StartScreen';
import InstructionScreen from './components/InstructionScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import WinScreen from './components/WinScreen';
import SurveyModal from './components/SurveyModal';
import { usePronunciationScoring } from './hooks/usePronunciationScoring';
import { useGameSounds } from './hooks/useGameSounds';
import { supabase } from './lib/supabaseClient';
import { trackGameEvent, trackGameError, trackUserAction, trackGameMetrics, setUserContext, trackUserSession } from './utils/datadog';

const GAME_STATES = {
    START: 'start',
    INSTRUCTIONS: 'instructions',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

const INITIAL_ALTITUDE = 10000;
const ALTITUDE_GAIN = 1400; // Tăng lên 1200 để bay cao hơn khi trả lời đúng
const ALTITUDE_LOSS = 1400; // Tăng từ 1000 lên 1200 để lao xuống nhanh hơn
const WIN_SCORE = 10;
const INITIAL_TIME = 140; // 2 minutes

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


    // Easy aviation vocabulary with simple phonetic transcriptions
    const aviationWords = [
        { word: 'Plane', phonetic: '/pleɪn/' },
        { word: 'Fly', phonetic: '/flaɪ/' },
        { word: 'Sky', phonetic: '/skaɪ/' },
        { word: 'Wing', phonetic: '/wɪŋ/' },
        { word: 'Pilot', phonetic: '/ˈpaɪlət/' },
        { word: 'Cloud', phonetic: '/klaʊd/' },
        { word: 'High', phonetic: '/haɪ/' },
        { word: 'Fast', phonetic: '/fæst/' },
        { word: 'Blue', phonetic: '/blu/' },
        { word: 'Wind', phonetic: '/wɪnd/' },
        { word: 'Air', phonetic: '/ɛr/' },
        { word: 'Up', phonetic: '/ʌp/' },
        { word: 'Down', phonetic: '/daʊn/' },
        { word: 'Go', phonetic: '/goʊ/' },
        { word: 'Stop', phonetic: '/stɑp/' },
        { word: 'Safe', phonetic: '/seɪf/' },
        { word: 'Land', phonetic: '/lænd/' },
        { word: 'Take', phonetic: '/teɪk/' },
        { word: 'Off', phonetic: '/ɔf/' },
        { word: 'Big', phonetic: '/bɪg/' },
        { word: 'Small', phonetic: '/smɔl/' },
        { word: 'White', phonetic: '/waɪt/' },
        { word: 'Red', phonetic: '/rɛd/' },
        { word: 'Green', phonetic: '/grin/' },
        { word: 'Yellow', phonetic: '/ˈjɛloʊ/' },
        { word: 'Sun', phonetic: '/sʌn/' },
        { word: 'Moon', phonetic: '/mun/' },
        { word: 'Star', phonetic: '/stɑr/' },
        { word: 'Light', phonetic: '/laɪt/' },
        { word: 'Bright', phonetic: '/braɪt/' }
    ];
    const [currentWordData, setCurrentWordData] = useState(aviationWords[0]);
    const [checkpointsPassed, setCheckpointsPassed] = useState(0);
    const [gravity, setGravity] = useState(0); // Gravity effect
    const [isWaitingForPronunciation, setIsWaitingForPronunciation] = useState(false);

    // URL params and session management
    const [urlParams, setUrlParams] = useState({});
    const [userId, setUserId] = useState(null);
    const [age, setAge] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [gameSessionId, setGameSessionId] = useState(null);
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);

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
        playGameOverSound,
        playAltitudeWarning
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

    // Parse URL params once on mount
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const all = {};
            params.forEach((value, key) => {
                all[key] = value;
            });
            // Extract dedicated fields
            const extractedUserId = all.user_id ?? all.userId ?? null;
            const extractedAgeRaw = all.age ?? null;
            const extractedGameId = all.game_id ?? all.gameId ?? null;

            if (extractedUserId != null) setUserId(extractedUserId);
            if (extractedGameId != null) setGameId(extractedGameId);
            if (extractedAgeRaw != null) {
                const n = Number(extractedAgeRaw);
                setAge(Number.isFinite(n) ? n : extractedAgeRaw);
            }

            // Remove extracted keys from general params
            const { user_id, userId, age: ageKey, game_id, gameId, ...rest } = all;
            setUrlParams(rest);
        } catch (e) {
            // noop
        }
    }, []);

    // Set Datadog user context when userId is available
    useEffect(() => {
        if (userId) {
            const userProperties = {};
            
            // Add age if available
            if (age !== null) {
                userProperties.age = age;
            }
            
            // Add gameId if available
            if (gameId !== null) {
                userProperties.gameId = gameId;
            }
            
            // Add any additional URL params as user properties
            if (urlParams && Object.keys(urlParams).length > 0) {
                userProperties.urlParams = urlParams;
            }

            setUserContext(userId, userProperties);
            
            // Track user session start
            trackUserSession(userId, {
                age,
                gameId,
                urlParams,
                pageUrl: window.location.href,
                referrer: document.referrer
            });
        }
    }, [userId, age, gameId, urlParams]);

    // Create a game_session row only when game actually starts
    useEffect(() => {
        const createSession = async () => {
            if (gameState !== GAME_STATES.PLAYING) return;
            if (gameSessionId) return; // Already have a session
            if (!userId) return; // Need userId to create session

            const numericAge = Number.isFinite(Number(age)) ? Number(age) : null;
            const numericGameId = Number.isFinite(Number(gameId)) ? Number(gameId) : null;

            const payload = {
                user_id: userId,
                age: numericAge,
                game_id: numericGameId,
                start_time: new Date().toISOString(),
                score: 0,
                profile_data: urlParams || {}
            };

            try {
                const { data, error } = await supabase
                    .from('game_sessions')
                    .insert(payload)
                    .select('id')
                    .single();

                if (error) {
                    console.error('Failed to create game session:', error);
                    return;
                }

                setGameSessionId(data?.id || null);
                console.log('Created game session:', data?.id);
            } catch (err) {
                console.error('Unexpected error creating game session:', err);
            }
        };

        createSession();
    }, [gameState, userId, age, gameId, urlParams, gameSessionId]);

    // Open survey when game over ONLY if user hasn't completed survey for this game before
    useEffect(() => {
        const checkAndOpenSurvey = async () => {
            if (gameState !== GAME_STATES.WIN && gameState !== GAME_STATES.GAME_OVER) {
                setIsSurveyOpen(false);
                return;
            }
            
            console.log('🔍 Checking survey display:', { gameState, gameSessionId, userId, gameId, checkpointsPassed });
            
            try {
                const numericGameId = Number.isFinite(Number(gameId)) ? Number(gameId) : null;

                // If we know the user and game, check historical completion
                if (userId && numericGameId != null) {
                    const { data: history, error: historyError } = await supabase
                        .from('game_sessions')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('game_id', numericGameId)
                        .eq('survey_completed', true)
                        .limit(1);

                    if (!historyError && Array.isArray(history) && history.length > 0) {
                        // User already completed survey for this game before → do not show
                        console.log('❌ Survey already completed for this user and game. Not showing.');
                        setIsSurveyOpen(false);
                        return;
                    }
                }

                // Fallback to current session's completion flag if available
                if (gameSessionId) {
                    const { data, error } = await supabase
                        .from('game_sessions')
                        .select('survey_completed')
                        .eq('id', gameSessionId)
                        .single();
                    if (!error && data) {
                        const completed = Boolean(data?.survey_completed);
                        console.log('📊 Current session survey_completed:', completed, 'Setting isSurveyOpen to:', !completed);
                        setIsSurveyOpen(!completed);
                        return;
                    } else {
                        console.log('⚠️ Could not fetch current session, will show survey');
                    }
                } else {
                    console.log('⚠️ No gameSessionId, will show survey');
                }

                // Default: show if we couldn't verify completion
                console.log('✅ Showing survey (default - no restrictions found)');
                setIsSurveyOpen(true);
            } catch (e) {
                console.error('⚠️ Error checking survey completion:', e);
                console.log('✅ Showing survey (fallback due to error)');
                setIsSurveyOpen(true);
            }
        };

        // Add small delay to ensure end_time update completes first
        const timer = setTimeout(() => {
            checkAndOpenSurvey();
        }, 200);
        
        return () => clearTimeout(timer);
    }, [gameState, gameSessionId, userId, gameId, checkpointsPassed]);

    // When game ends, update end_time and final score on the session
    useEffect(() => {
        const markEndTime = async () => {
            if ((gameState !== GAME_STATES.WIN && gameState !== GAME_STATES.GAME_OVER) || !gameSessionId) return;
            try {
                await supabase
                    .from('game_sessions')
                    .update({ end_time: new Date().toISOString(), score: checkpointsPassed })
                    .eq('id', gameSessionId);
            } catch (e) {
                // noop
            }
        };
        markEndTime();
    }, [gameState, gameSessionId, checkpointsPassed]);

    // Handle pronunciation analysis manually
    const handleAnalyzePronunciation = useCallback(async (audioBlob) => {
        if (!audioBlob || !currentWordData.word) return;

        try {
            const result = await processPronunciation(currentWordData.word, audioBlob);
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
    }, [currentWordData.word, processPronunciation]);

    // Monitor recording state to trigger analysis
    useEffect(() => {
        if (recordingBlob && !isRecording && !isProcessing && isWaitingForPronunciation && gameState === GAME_STATES.PLAYING) {
            console.log('🎯 Auto-analyzing recorded audio for word:', currentWordData.word);
            handleAnalyzePronunciation(recordingBlob);
        }
    }, [recordingBlob, isRecording, isProcessing, isWaitingForPronunciation, gameState, currentWordData.word, handleAnalyzePronunciation]);

    // Timer effect
    useEffect(() => {
        let timer;
        if (gameState === GAME_STATES.PLAYING && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Stop background music and VAD when time runs out
                        stopBackgroundMusic();

                        // Track game over by timeout
                        trackGameEvent('game_over_timeout', {
                            gameId,
                            finalScore: checkpointsPassed,
                            finalAltitude: altitude,
                            collisionCount,
                            timestamp: Date.now()
                        });

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

    // Gravity effect - plane naturally falls down with smooth animation
    useEffect(() => {
        let gravityTimer;
        if (gameState === GAME_STATES.PLAYING) {
            gravityTimer = setInterval(() => {
                setAltitude(prev => {
                    const gravityForce = 15; // Much slower gravity for better gameplay
                    const newAltitude = Math.max(0, prev - gravityForce);
                    
                    // Add subtle rotation effect when falling
                    if (!isAnimating) {
                        setPlayerRotation(prevRotation => {
                            const targetRotation = Math.min(15, (INITIAL_ALTITUDE - newAltitude) / 500);
                            return prevRotation + (targetRotation - prevRotation) * 0.1;
                        });
                    }
                    
                    // Play altitude warning sound when low
                    if (newAltitude <= 1000 && newAltitude > 0 && prev > 1000) {
                        playAltitudeWarning();
                    }
                    
                    if (newAltitude <= 0) {
                        // Track game over by altitude
                        trackGameEvent('game_over_altitude', {
                            gameId,
                            finalScore: checkpointsPassed,
                            finalAltitude: 0,
                            collisionCount,
                            timeRemaining: timeLeft,
                            timestamp: Date.now()
                        });

                        // Stop background music and VAD when altitude reaches 0
                        stopBackgroundMusic();
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
            }, 150); // Smoother gravity updates
        }
        return () => clearInterval(gravityTimer);
    }, [gameState, isListening, stopListening, clearBlob, stopBackgroundMusic, playGameOverSound, isAnimating]);

    // Update player position based on altitude
    useEffect(() => {
        const newPosition = Math.max(10, Math.min(90, 90 - (altitude / INITIAL_ALTITUDE) * 80));
        setPlayerYPosition(newPosition);
    }, [altitude]);

    // Handle VAD listening
    const handleStartListening = useCallback(async () => {
        console.log('🎤 Attempting to start VAD listening for word:', currentWordData.word, {
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

        console.log('✅ Starting VAD listening for word:', currentWordData.word);
        setIsWaitingForPronunciation(true);
        clearBlob(); // Clear any previous recording

        try {
            await startListening();
        } catch (error) {
            console.error('Start listening error:', error);
            setIsWaitingForPronunciation(false);
        }
    }, [gameState, isListening, startListening, stopListening, clearBlob, currentWordData.word, isWaitingForPronunciation]);

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

        // Chờ đến khi power-up "va chạm" với máy bay (70% của animation = 0.56s)
        setTimeout(() => {
            // Play power-up sound
            playPowerUpSound();

            // Hiệu ứng ăn power-up
            setShowPowerUpEffect(true);
            setTimeout(() => setShowPowerUpEffect(false), 1000);

            // Cập nhật altitude và checkpoints khi ăn được power-up
            setAltitude(prev => prev + ALTITUDE_GAIN);
            setCheckpointsPassed(prev => {
                const newCheckpoints = prev + 1;
                
                // Track correct answer
                trackGameEvent('correct_answer', {
                    gameId,
                    word: currentWordData.word,
                    checkpointsPassed: newCheckpoints,
                    altitude: altitude + ALTITUDE_GAIN,
                    pronunciationScore: lastResult?.total_score,
                    timestamp: Date.now()
                });

                if (newCheckpoints >= WIN_SCORE) {
                    // Track game win
                    trackGameEvent('game_won', {
                        gameId,
                        finalScore: newCheckpoints,
                        finalAltitude: altitude + ALTITUDE_GAIN,
                        timeRemaining: timeLeft,
                        timestamp: Date.now()
                    });

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
                return newCheckpoints;
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
        }, 800);

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

            setCurrentWordData(aviationWords[Math.floor(Math.random() * aviationWords.length)]);
            clearBlob();
            setIsWaitingForPronunciation(false);

            // Wait then restart VAD
            setTimeout(() => {
                console.log('🎤 Auto-restarting VAD for next word');
                handleStartListening();
            }, 1000);
        }, 1200); // 560ms (collision) + 400ms (animation) + 240ms (buffer)
    }, [aviationWords, clearBlob, stopListening, handleStartListening]);

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

        // Chờ đến khi vật cản "va chạm" với máy bay (70% của animation = 0.56s)
        setTimeout(() => {
            // Tăng số lần va chạm
            setCollisionCount(prev => {
                const newCount = prev + 1;

                // Track wrong answer
                trackGameEvent('wrong_answer', {
                    gameId,
                    word: currentWordData.word,
                    collisionCount: newCount,
                    altitude: altitude - ALTITUDE_LOSS,
                    pronunciationScore: lastResult?.total_score,
                    timestamp: Date.now()
                });

                // Kiểm tra nếu đã va chạm 5 lần
                if (newCount >= 5) {
                    // Track game over by collision
                    trackGameEvent('game_over_collision', {
                        gameId,
                        finalScore: checkpointsPassed,
                        finalAltitude: altitude - ALTITUDE_LOSS,
                        collisionCount: newCount,
                        timeRemaining: timeLeft,
                        timestamp: Date.now()
                    });

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
                    // Don't reset checkpoints on wrong answer - keep progress

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
        }, 800);

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

                        setCurrentWordData(aviationWords[Math.floor(Math.random() * aviationWords.length)]);
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
        }, 1400); // 560ms (collision) + 500ms (animation) + 340ms (buffer)
    }, [aviationWords, clearBlob, stopListening, handleStartListening]);

    const startGame = () => {
        trackGameEvent('game_started', {
            gameId,
            age,
            timestamp: Date.now()
        });
        setGameState(GAME_STATES.INSTRUCTIONS);
    };

    const startPlaying = () => {
        // Reset gameSessionId to create a new session
        setGameSessionId(null);
        setGameState(GAME_STATES.PLAYING);
        setAltitude(INITIAL_ALTITUDE);
        setCheckpointsPassed(0);
        setTimeLeft(INITIAL_TIME);
        setPlayerRotation(0);
        setIsAnimating(false);
        setCollisionCount(0);
        setShowExplosion(false);
        setCurrentWordData(aviationWords[Math.floor(Math.random() * aviationWords.length)]);

        // Track game play start
        trackGameEvent('gameplay_started', {
            gameId,
            age,
            initialAltitude: INITIAL_ALTITUDE,
            timeLimit: INITIAL_TIME,
            timestamp: Date.now()
        });

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
                trackGameError(error, {
                    action: 'start_listening',
                    gameId
                });
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
        setCheckpointsPassed(0);
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

    const handleCloseSurvey = useCallback(() => {
        setIsSurveyOpen(false);
    }, []);

    const handlePlayAgain = useCallback(() => {
        setIsSurveyOpen(false);
        resetGame();
    }, []);

    const handleExitGame = useCallback(async () => {
        // Update game_sessions to mark that user exited via button
        if (gameSessionId) {
            try {
                await supabase
                    .from('game_sessions')
                    .update({ exited_via_button: true, end_time: new Date().toISOString(), score: checkpointsPassed })
                    .eq('id', gameSessionId);
            } catch (e) {
                console.error('Error updating exited_via_button:', e);
            }
        }
        // Redirect after updating
        window.location.href = 'https://robot-record-web.hacknao.edu.vn/games';
    }, [gameSessionId, checkpointsPassed]);

    return (
        <div className="App">
            {gameState === GAME_STATES.START && (
                <StartScreen onStart={startGame} onExit={handleExitGame} />
            )}

            {gameState === GAME_STATES.INSTRUCTIONS && (
                <InstructionScreen onStart={startPlaying} onExit={handleExitGame} />
            )}

            {gameState === GAME_STATES.PLAYING && (
                <GameScreen
                    altitude={altitude}
                    checkpointsPassed={checkpointsPassed}
                    timeLeft={formatTime(timeLeft)}
                    playerYPosition={playerYPosition}
                    playerRotation={playerRotation}
                    isAnimating={isAnimating}
                    currentWordData={currentWordData}
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
                    onExit={handleExitGame}
                />
            )}

            {gameState === GAME_STATES.GAME_OVER && (
                <>
                    <GameOverScreen
                        checkpointsPassed={checkpointsPassed}
                        altitude={altitude}
                        onRestart={resetGame}
                        onExit={handleExitGame}
                    />
                    <SurveyModal
                        isOpen={isSurveyOpen}
                        onClose={handleCloseSurvey}
                        onPlayAgain={handlePlayAgain}
                        gameSessionId={gameSessionId}
                        currentGameId={gameId}
                        userId={userId}
                        age={age}
                        urlParams={urlParams}
                    />
                </>
            )}

            {gameState === GAME_STATES.WIN && (
                <>
                    <WinScreen
                        checkpointsPassed={checkpointsPassed}
                        altitude={altitude}
                        onRestart={resetGame}
                        onExit={handleExitGame}
                    />
                    <SurveyModal
                        isOpen={isSurveyOpen}
                        onClose={handleCloseSurvey}
                        onPlayAgain={handlePlayAgain}
                        gameSessionId={gameSessionId}
                        currentGameId={gameId}
                        userId={userId}
                        age={age}
                        urlParams={urlParams}
                    />
                </>
            )}
        </div>
    );
}

export default App;