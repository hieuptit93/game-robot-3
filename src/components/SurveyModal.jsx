import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Inline styles for SurveyModal (no Tailwind dependency)
const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },
    modal: {
        position: 'relative',
        zIndex: 10000,
        width: '92%',
        maxWidth: '36rem',
        margin: '0 auto',
        backgroundColor: '#111827',
        border: '1px solid #0891b2',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '1.5rem',
        color: '#cffafe',
        fontFamily: 'monospace'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#67e8f9',
        marginBottom: '1.5rem',
        textAlign: 'center'
    },
    stepIndicator: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        gap: '0.5rem'
    },
    stepDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%'
    },
    question: {
        textAlign: 'center',
        fontSize: '1.25rem',
        color: '#fde047',
        marginBottom: '1rem',
        fontFamily: 'monospace'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
    },
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        border: '1px solid #0891b2',
        backgroundColor: '#1f2937',
        color: '#cffafe',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '1rem',
        transition: 'all 0.2s'
    },
    buttonSelected: {
        border: '1px solid #22d3ee',
        backgroundColor: 'rgba(6, 182, 212, 0.3)'
    },
    buttonGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
    },
    textarea: {
        width: '100%',
        backgroundColor: '#1f2937',
        border: '1px solid #0891b2',
        borderRadius: '0.375rem',
        padding: '0.75rem',
        color: '#cffafe',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        minHeight: '80px',
        resize: 'vertical'
    },
    required: {
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#9ca3af',
        marginTop: '1rem'
    },
    emojiButton: {
        fontSize: '2rem',
        padding: '1rem 1.5rem'
    },
    loading: {
        textAlign: 'center',
        color: '#67e8f9',
        fontFamily: 'monospace'
    },
    gameLink: {
        display: 'block',
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        border: '1px solid #0891b2',
        backgroundColor: '#1f2937',
        color: '#cffafe',
        textDecoration: 'none',
        marginBottom: '0.75rem',
        fontFamily: 'monospace'
    },
    gameLinkInner: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    gameImage: {
        width: '40px',
        height: '40px',
        objectFit: 'cover',
        borderRadius: '0.25rem'
    },
    gameInfo: {
        flex: 1,
        textAlign: 'left'
    },
    gameTitle: {
        color: '#a5f3fc',
        fontSize: '1rem'
    },
    gameKey: {
        fontSize: '0.75rem',
        color: '#9ca3af'
    },
    actionButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1.25rem',
        gap: '0.5rem'
    },
    actionButton: {
        padding: '0.5rem 1.25rem',
        backgroundColor: '#0891b2',
        color: 'white',
        border: 'none',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '0.875rem'
    },
    noGames: {
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#9ca3af'
    }
};

function SurveyModal({ isOpen, onClose, onPlayAgain, gameSessionId, currentGameId, userId, age, urlParams }) {
    const [step, setStep] = useState(1);
    const [likeAnswer, setLikeAnswer] = useState(null); // 😊 | 😐 | 😞
    const [difficultyAnswer, setDifficultyAnswer] = useState(null); // easy | normal | hard
    const [comment, setComment] = useState('');
    const [wantsReplay, setWantsReplay] = useState(null); // yes | no
    const [isLoadingGames, setIsLoadingGames] = useState(false);
    const [shuffledGames, setShuffledGames] = useState([]);
    const [hasLoadedGames, setHasLoadedGames] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setLikeAnswer(null);
            setDifficultyAnswer(null);
            setComment('');
            setWantsReplay(null);
            setHasLoadedGames(false);
        }
    }, [isOpen]);

    // Fetch games once when modal opens (hooks must not be conditional)
    useEffect(() => {
        const fetchGames = async () => {
            try {
                setIsLoadingGames(true);
                const { data, error } = await supabase
                    .from('games')
                    .select('id, title, key, image, href, is_active')
                    .eq('is_active', true)
                    .order('id');

                if (error) throw error;

                const fetched = (data || []).map((g) => ({
                    id: g.id,
                    title: g.title,
                    key: g.key,
                    image: g.image,
                    href: g.href,
                }));

                const numericCurrentId = Number.isFinite(Number(currentGameId)) ? Number(currentGameId) : currentGameId;
                const filtered = fetched.filter((g) => (numericCurrentId != null ? g.id !== numericCurrentId : true));

                const shuffled = [...filtered];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                setShuffledGames(shuffled);
            } catch (err) {
                console.error('Error fetching games:', err);
                setShuffledGames([]);
            } finally {
                setIsLoadingGames(false);
            }
        };

        if (isOpen && !hasLoadedGames) {
            fetchGames();
            setHasLoadedGames(true);
        }
    }, [isOpen, hasLoadedGames, currentGameId]);

    if (!isOpen) return null;

    const handleNextFromStep1 = async (value) => {
        setLikeAnswer(value);
        try {
            const mapping = {
                happy: 'rat-thich',
                neutral: 'binh-thuong',
                sad: 'khong-thich'
            };
            if (gameSessionId) {
                await supabase
                    .from('game_sessions')
                    .update({ level_of_liking: mapping[value] })
                    .eq('id', gameSessionId);
            }
        } catch (e) {
            console.error('Update level_of_liking failed', e);
        }
        setStep(2);
    };

    const handleNextFromStep2 = async (value) => {
        setDifficultyAnswer(value);
        try {
            const mapping = {
                easy: 'de',
                normal: 'binh-thuong',
                hard: 'kho'
            };
            if (gameSessionId) {
                await supabase
                    .from('game_sessions')
                    .update({ difficuly: mapping[value] })
                    .eq('id', gameSessionId);
            }
        } catch (e) {
            console.error('Update difficuly failed', e);
        }
        setStep(3);
    };

    const handleSubmitComment = async () => {
        try {
            if (gameSessionId) {
                await supabase
                    .from('game_sessions')
                    .update({ comment })
                    .eq('id', gameSessionId);
            }
        } catch (e) {
            console.error('Update comment failed', e);
        }
        setStep(4);
    };

    const handleReplayChoice = async (value) => {
        setWantsReplay(value);
        if (value === 'yes') {
            try {
                if (gameSessionId) {
                    // Read current number_of_replays then increment
                    const { data, error } = await supabase
                        .from('game_sessions')
                        .select('number_of_replays')
                        .eq('id', gameSessionId)
                        .single();
                    if (!error) {
                        const current = Number.isFinite(Number(data?.number_of_replays)) ? Number(data.number_of_replays) : 0;
                        await supabase
                            .from('game_sessions')
                            .update({ number_of_replays: current + 1 })
                            .eq('id', gameSessionId);
                    }
                }
                // mark survey completed
                await supabase
                    .from('game_sessions')
                    .update({ survey_completed: true })
                    .eq('id', gameSessionId);
            } catch (e) {
                console.error('Increment number_of_replays failed', e);
            }
            onPlayAgain?.();
        } else {
            // Stay in modal and show suggestions
            setStep(5);
            try {
                if (gameSessionId) {
                    await supabase
                        .from('game_sessions')
                        .update({ survey_completed: true })
                        .eq('id', gameSessionId);
                }
            } catch (e) {
                console.error('Mark survey completed failed', e);
            }
        }
    };

    return (
        <div style={modalStyles.overlay}>
            {/* Backdrop (no close on click until finished) */}
            <div style={modalStyles.backdrop} />

            {/* Modal */}
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.title}>KHẢO SÁT NHANH</h3>

                {/* Step indicator */}
                <div style={modalStyles.stepIndicator}>
                    {[1,2,3,4].map((s) => (
                        <div 
                            key={s} 
                            style={{
                                ...modalStyles.stepDot,
                                backgroundColor: step === s ? '#22d3ee' : '#374151'
                            }} 
                        />
                    ))}
                </div>

                {/* Step 1: Like */}
                {step === 1 && (
                    <div>
                        <p style={modalStyles.question}>Bạn có thích trò chơi này không?</p>
                        <div style={modalStyles.buttonGroup}>
                            <button 
                                onClick={() => handleNextFromStep1('sad')} 
                                style={{
                                    ...modalStyles.button,
                                    ...modalStyles.emojiButton,
                                    ...(likeAnswer === 'sad' ? modalStyles.buttonSelected : {})
                                }}
                                aria-label="Không thích"
                            >
                                😞
                            </button>
                            <button 
                                onClick={() => handleNextFromStep1('neutral')} 
                                style={{
                                    ...modalStyles.button,
                                    ...modalStyles.emojiButton,
                                    ...(likeAnswer === 'neutral' ? modalStyles.buttonSelected : {})
                                }}
                                aria-label="Bình thường"
                            >
                                😐
                            </button>
                            <button 
                                onClick={() => handleNextFromStep1('happy')} 
                                style={{
                                    ...modalStyles.button,
                                    ...modalStyles.emojiButton,
                                    ...(likeAnswer === 'happy' ? modalStyles.buttonSelected : {})
                                }}
                                aria-label="Rất thích"
                            >
                                😊
                            </button>
                        
                        </div>
                        <p style={modalStyles.required}>(Bắt buộc)</p>
                    </div>
                )}

                {/* Step 2: Difficulty */}
                {step === 2 && (
                    <div>
                        <p style={modalStyles.question}>Trò chơi này dễ hay khó?</p>
                        <div style={modalStyles.buttonGrid}>
                            <button 
                                onClick={() => handleNextFromStep2('easy')} 
                                style={{
                                    ...modalStyles.button,
                                    ...(difficultyAnswer === 'easy' ? modalStyles.buttonSelected : {})
                                }}
                            >
                                Dễ
                            </button>
                            <button 
                                onClick={() => handleNextFromStep2('normal')} 
                                style={{
                                    ...modalStyles.button,
                                    ...(difficultyAnswer === 'normal' ? modalStyles.buttonSelected : {})
                                }}
                            >
                                Bình thường
                            </button>
                            <button 
                                onClick={() => handleNextFromStep2('hard')} 
                                style={{
                                    ...modalStyles.button,
                                    ...(difficultyAnswer === 'hard' ? modalStyles.buttonSelected : {})
                                }}
                            >
                                Khó
                            </button>
                        </div>
                        <p style={modalStyles.required}>(Bắt buộc)</p>
                    </div>
                )}

                {/* Step 3: Optional comment */}
                {step === 3 && (
                    <div>
                        <p style={modalStyles.question}>Bạn có góp ý gì cho trò chơi này không?</p>
                        <textarea
                            style={modalStyles.textarea}
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Nhập bình luận ngắn (tùy chọn)"
                        />
                        <div style={modalStyles.actionButtons}>
                            <button 
                                onClick={handleSubmitComment} 
                                style={modalStyles.actionButton}
                            >
                                Tiếp tục
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Replay? */}
                {step === 4 && (
                    <div>
                        <p style={modalStyles.question}>Bạn có muốn chơi lại không?</p>
                        <div style={modalStyles.buttonGrid}>
                            <button 
                                onClick={() => handleReplayChoice('yes')} 
                                style={{
                                    ...modalStyles.button,
                                    ...(wantsReplay === 'yes' ? { border: '1px solid #4ade80', backgroundColor: 'rgba(16, 185, 129, 0.2)' } : {})
                                }}
                            >
                                Có
                            </button>
                            <button 
                                onClick={() => handleReplayChoice('no')} 
                                style={{
                                    ...modalStyles.button,
                                    ...(wantsReplay === 'no' ? { border: '1px solid #f87171', backgroundColor: 'rgba(220, 38, 38, 0.2)' } : {})
                                }}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Suggestions */}
                {step === 5 && (
                    <div>
                        <p style={modalStyles.question}>Gợi ý trò chơi tiếp theo</p>
                        {isLoadingGames ? (
                            <div style={modalStyles.loading}>Đang tải gợi ý...</div>
                        ) : (
                            <div>
                                {(shuffledGames).map((g) => {
                                    const baseHref = g.href || '#';
                                    const initial = { ...(urlParams || {}) };
                                    const params = {
                                        ...initial,
                                        user_id: userId ?? initial.user_id,
                                        age: age ?? initial.age,
                                        game_id: g.id,
                                    };
                                    const query = new URLSearchParams(
                                        Object.fromEntries(
                                            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' )
                                        )
                                    ).toString();
                                    const fullHref = query ? `${baseHref}?${query}` : baseHref;

                                    return (
                                        <a 
                                            key={g.id} 
                                            href={fullHref}
                                            style={modalStyles.gameLink}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                                        >
                                            <div style={modalStyles.gameLinkInner}>
                                                {g.image ? (
                                                    <img src={g.image} alt={g.title} style={modalStyles.gameImage} />
                                                ) : (
                                                    <div style={{...modalStyles.gameImage, backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>🎮</div>
                                                )}
                                                <div style={modalStyles.gameInfo}>
                                                    <div style={modalStyles.gameTitle}>{g.title || g.key}</div>
                                                    {g.key && <div style={modalStyles.gameKey}>{g.key}</div>}
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                                {shuffledGames.length === 0 && (
                                    <div style={modalStyles.noGames}>Chưa có gợi ý phù hợp</div>
                                )}
                            </div>
                        )}
                        <div style={modalStyles.actionButtons}>
                            <button 
                                onClick={onClose} 
                                style={modalStyles.actionButton}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SurveyModal;

