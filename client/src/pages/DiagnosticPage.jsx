import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DIAGNOSTIC_TEXT = `The universe is a vast and mysterious expanse that has captivated human imagination for millennia. From the earliest civilizations gazing at the stars to modern astronomers peering through powerful telescopes, our quest to understand the cosmos has been relentless and transformative.

At the heart of our solar system lies the Sun, a medium-sized star burning at temperatures exceeding 15 million degrees Celsius in its core. This nuclear furnace converts hydrogen into helium through fusion, releasing enormous amounts of energy that travels across 150 million kilometers to warm our planet. Without this constant stream of light and heat, life as we know it would be impossible.

Beyond our solar system, the Milky Way galaxy contains an estimated 100 to 400 billion stars, many with their own planetary systems. Recent discoveries by missions like Kepler and TESS have revealed thousands of exoplanets, some orbiting within their star's habitable zone where liquid water could exist on the surface.

The concept of dark matter and dark energy represents one of the greatest mysteries in modern physics. While ordinary matter makes up only about 5 percent of the universe's total mass-energy content, dark matter accounts for approximately 27 percent, and dark energy comprises the remaining 68 percent. Despite their dominant presence, neither has been directly detected or fully understood.

Space exploration continues to push boundaries. Mars rovers like Curiosity and Perseverance send detailed photographs and scientific data back to Earth, while the James Webb Space Telescope reveals galaxies formed just hundreds of millions of years after the Big Bang. These achievements remind us that the frontier of knowledge is always expanding, inspiring new generations of scientists and dreamers to look upward and wonder about our place in this grand cosmic tapestry.`;

const PARAGRAPHS = DIAGNOSTIC_TEXT.split('\n\n');

export default function DiagnosticPage() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [phase, setPhase] = useState('intro'); // intro, reading, results
    const [startTime, setStartTime] = useState(null);
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [mediaGranted, setMediaGranted] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [micLevel, setMicLevel] = useState(0);

    // Tracking state
    const trackingRef = useRef({
        mouseMovements: 0,
        rapidClicks: 0,
        scrollReversals: 0,
        reReadingCount: 0,
        paragraphDwellTimes: new Array(PARAGRAPHS.length).fill(0),
        lastScrollY: 0,
        lastScrollDirection: 'down',
        scrollPositionHistory: [],
        lastClickTime: 0,
        lastMouseMoveTime: 0,
        currentParagraph: 0,
        paragraphStartTime: Date.now(),
        cameraMotionSamples: [],
        audioLevelSamples: [],
    });

    // Mouse movement tracking (Metric A - Volatility)
    const handleMouseMove = useCallback(() => {
        const now = Date.now();
        const t = trackingRef.current;
        if (now - t.lastMouseMoveTime < 50) {
            t.mouseMovements++;
        }
        t.lastMouseMoveTime = now;
    }, []);

    // Rapid click tracking (Metric A - Volatility)
    const handleClick = useCallback(() => {
        const now = Date.now();
        const t = trackingRef.current;
        if (now - t.lastClickTime < 300) {
            t.rapidClicks++;
        }
        t.lastClickTime = now;
    }, []);

    // Scroll tracking (Metric B - Friction + Paragraph detection)
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const t = trackingRef.current;
        const currentY = el.scrollTop;
        const direction = currentY > t.lastScrollY ? 'down' : 'up';

        // Detect scroll reversals (re-reading)
        if (direction !== t.lastScrollDirection) {
            t.scrollReversals++;
            if (direction === 'up' && t.lastScrollY - currentY > 100) {
                t.reReadingCount++;
            }
        }

        // Track which paragraph is visible
        const paragraphEls = el.querySelectorAll('[data-paragraph]');
        paragraphEls.forEach((pEl, idx) => {
            const rect = pEl.getBoundingClientRect();
            const containerRect = el.getBoundingClientRect();
            if (rect.top >= containerRect.top && rect.top < containerRect.top + containerRect.height / 2) {
                if (idx !== t.currentParagraph) {
                    // Record dwell time for previous paragraph
                    t.paragraphDwellTimes[t.currentParagraph] += Date.now() - t.paragraphStartTime;
                    t.currentParagraph = idx;
                    t.paragraphStartTime = Date.now();
                }
            }
        });

        t.lastScrollY = currentY;
        t.lastScrollDirection = direction;
        t.scrollPositionHistory.push({ y: currentY, time: Date.now() });
    }, []);

    // Request camera and microphone access
    const requestMediaAccess = useCallback(async () => {
        setMediaLoading(true);
        setMediaError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaStreamRef.current = stream;
            setMediaGranted(true);

            // Setup audio level visualization for microphone
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateMicLevel = () => {
                if (!analyserRef.current || !mediaStreamRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setMicLevel(Math.min(100, avg * 2));
                trackingRef.current.audioLevelSamples.push(avg);
                if (trackingRef.current.audioLevelSamples.length > 300) trackingRef.current.audioLevelSamples.shift();
                animationFrameRef.current = requestAnimationFrame(updateMicLevel);
            };
            updateMicLevel();
            return true;
        } catch (err) {
            setMediaError(err.name === 'NotAllowedError'
                ? 'Please allow camera and microphone access to continue the test. They are required for behavior tracking.'
                : 'Could not access camera or microphone. Please check your device permissions.');
            return false;
        } finally {
            setMediaLoading(false);
        }
    }, []);

    // Cleanup media streams on unmount or when leaving reading phase
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (phase !== 'reading') return;
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('click', handleClick);
        el.addEventListener('scroll', handleScroll);

        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('click', handleClick);
            el.removeEventListener('scroll', handleScroll);
        };
    }, [phase, handleMouseMove, handleClick, handleScroll]);

    const startTest = async () => {
        if (!mediaGranted) {
            const granted = await requestMediaAccess();
            if (!granted) return;
        }
        setPhase('reading');
        setStartTime(Date.now());
        trackingRef.current.paragraphStartTime = Date.now();
    };

    const finishTest = async () => {
        setSaving(true);
        setApiError(null);
        const t = trackingRef.current;

        // Record final paragraph dwell time
        t.paragraphDwellTimes[t.currentParagraph] += Date.now() - t.paragraphStartTime;
        const totalTimeMs = Date.now() - startTime;

        // Compute camera motion score (avg of samples, higher = more fidgeting/restlessness)
        const camSamples = t.cameraMotionSamples || [];
        const cameraMotionScore = camSamples.length > 0
            ? camSamples.reduce((a, b) => a + b, 0) / camSamples.length
            : 0;

        // Compute audio variability (std dev of levels - erratic speech patterns)
        const audSamples = t.audioLevelSamples || [];
        let audioVariabilityScore = 0;
        if (audSamples.length > 10) {
            const mean = audSamples.reduce((a, b) => a + b, 0) / audSamples.length;
            const variance = audSamples.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / audSamples.length;
            audioVariabilityScore = Math.min(1, Math.sqrt(variance) / 30);
        }

        const behaviorData = {
            mouseMovements: t.mouseMovements,
            rapidClicks: t.rapidClicks,
            scrollReversals: t.scrollReversals,
            reReadingCount: t.reReadingCount,
            paragraphDwellTimes: t.paragraphDwellTimes,
            totalTimeMs,
            cameraMotionScore,
            audioVariabilityScore,
        };

        try {
            const res = await api.post('/test-sessions', {
                rawBehaviorData: behaviorData,
                textContent: DIAGNOSTIC_TEXT,
            });

            updateUser({ cognitiveProfile: res.data.resultProfile, onboardingComplete: true });
            setResult(res.data);
            setPhase('results');
            // Stop camera/mic after test
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            }
        } catch (err) {
            console.error('Error saving session:', err);
            setApiError(err.response?.data?.error || 'Failed to save results. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Attach video stream when entering reading phase
    useEffect(() => {
        if (phase === 'reading' && videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
        }
    }, [phase]);

    // Camera motion detection - sample video frames and compute pixel difference
    useEffect(() => {
        if (phase !== 'reading' || !videoRef.current || !mediaStreamRef.current) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let lastFrameData = null;
        const motionInterval = setInterval(() => {
            const video = videoRef.current;
            if (!video || video.readyState < 2 || video.videoWidth === 0) return;
            canvas.width = 80;
            canvas.height = 60;
            ctx.drawImage(video, 0, 0, 80, 60);
            const imageData = ctx.getImageData(0, 0, 80, 60);
            const data = imageData.data;
            if (lastFrameData) {
                let diff = 0;
                for (let i = 0; i < data.length; i += 4) {
                    diff += Math.abs(data[i] - lastFrameData[i]) + Math.abs(data[i + 1] - lastFrameData[i + 1]) + Math.abs(data[i + 2] - lastFrameData[i + 2]);
                }
                const motionScore = Math.min(1, diff / 50000);
                trackingRef.current.cameraMotionSamples.push(motionScore);
                if (trackingRef.current.cameraMotionSamples.length > 60) trackingRef.current.cameraMotionSamples.shift();
            }
            lastFrameData = new Uint8ClampedArray(data);
        }, 500);
        return () => clearInterval(motionInterval);
    }, [phase]);

    // === INTRO PHASE ===
    if (phase === 'intro') {
        return (
            <div style={styles.wrapper}>
                <div style={styles.centered} className="animate-slide-up">
                    <div style={styles.introCard}>
                        <span style={{ fontSize: 64 }}>🧪</span>
                        <h1 style={styles.introTitle}>Baseline Diagnostic Test</h1>
                        <p style={styles.introDesc}>
                            You'll read a passage about the universe. While you read, we track your natural reading behavior
                            (including camera and microphone) to understand your learning style. Camera and microphone access are required.
                        </p>
                        <div style={styles.infoGrid}>
                            <div style={styles.infoItem}><span style={styles.infoIcon}>📖</span><span>~500 words</span></div>
                            <div style={styles.infoItem}><span style={styles.infoIcon}>⏱️</span><span>Read at least 45 sec</span></div>
                            <div style={styles.infoItem}><span style={styles.infoIcon}>🎥</span><span>Camera & Mic Required</span></div>
                        </div>
                        {mediaError && (
                            <div style={styles.mediaError}>
                                <span style={styles.mediaErrorIcon}>⚠️</span>
                                {mediaError}
                            </div>
                        )}
                        {mediaGranted && (
                            <div style={styles.mediaGranted}>
                                <span style={{ color: 'var(--success)' }}>✓</span> Camera & microphone ready
                            </div>
                        )}
                        <button
                            id="start-diagnostic"
                            onClick={startTest}
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginTop: 12 }}
                            disabled={mediaLoading}
                        >
                            {mediaLoading ? 'Requesting camera & microphone...' : 'Begin Reading'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // === READING PHASE ===
    if (phase === 'reading') {
        return (
            <div style={styles.wrapper}>
                {/* Camera & Microphone preview - fixed in corner */}
                <div style={styles.mediaPreview}>
                    <div style={styles.mediaPreviewHeader}>
                        <span>🎥 Live</span>
                        <div style={styles.micIndicator}>
                            <span style={{ fontSize: '0.7rem', marginRight: 4 }}>🎤</span>
                            <div style={styles.micBar}>
                                <div style={{ ...styles.micBarFill, width: `${micLevel}%` }} />
                            </div>
                        </div>
                    </div>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={styles.previewVideo}
                    />
                </div>

                <div style={styles.readingContainer}>
                    <div style={styles.readingHeader}>
                        <h2 style={styles.readingTitle}>Read the passage below at your own pace</h2>
                        <div style={styles.timer}>
                            <TimerDisplay startTime={startTime} />
                        </div>
                    </div>

                    <div ref={containerRef} style={styles.textContainer} id="diagnostic-reader">
                        {PARAGRAPHS.map((para, idx) => (
                            <p key={idx} data-paragraph={idx} style={styles.paragraph}>
                                {para}
                            </p>
                        ))}
                    </div>

                    {apiError && (
                        <div style={styles.mediaError}>
                            <span style={styles.mediaErrorIcon}>⚠️</span>
                            {apiError}
                        </div>
                    )}
                    <button
                        id="finish-diagnostic"
                        onClick={finishTest}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginTop: 20 }}
                        disabled={saving}
                    >
                        {saving ? 'Analyzing your reading behavior...' : 'I\'m Done Reading'}
                    </button>
                </div>
            </div>
        );
    }

    // === RESULTS PHASE ===
    if (phase === 'results' && result) {
        const profileInfo = {
            ADHD: {
                icon: '⚡',
                color: '#333333',
                title: 'You are having ADHD',
                desc: 'Based on your camera, microphone, and reading behavior analysis, patterns consistent with ADHD were detected.',
                symptoms: [
                    'Restlessness or fidgeting during reading',
                    'Rapid or impulsive mouse movements and clicks',
                    'Difficulty sustaining focus on one task',
                    'Frequent shifts in attention',
                    'High energy interaction patterns',
                ],
            },
            Dyslexia: {
                icon: '📖',
                color: '#4A3F35',
                title: 'You are having Dyslexia',
                desc: 'Based on your camera, microphone, and reading behavior analysis, patterns consistent with dyslexia were detected.',
                symptoms: [
                    'Frequent re-reading and backtracking',
                    'Uneven pacing across paragraphs',
                    'Scroll reversals (going back to previous text)',
                    'Difficulty with sustained word decoding',
                    'More time on challenging sections',
                ],
            },
            Typical: {
                icon: '✨',
                color: '#333333',
                title: 'Typical Reading Pattern',
                desc: 'Your reading behavior shows a steady, balanced pattern. Your dashboard will feature the standard adaptive interface.',
                symptoms: [],
            },
        };
        const info = profileInfo[result.resultProfile] || profileInfo.Typical;

        return (
            <div style={styles.wrapper}>
                <div style={styles.centered} className="animate-slide-up">
                    <div style={styles.resultCard}>
                        <span style={{ fontSize: 72 }}>{info.icon}</span>
                        <h1 style={{ ...styles.introTitle, marginTop: 16 }}>{info.title}</h1>

                        <div style={{ ...styles.profileBadge, borderColor: info.color, background: `${info.color}12` }}>
                            <span style={{ color: info.color, fontWeight: 800, fontSize: '1.1rem' }}>Analysis Complete</span>
                        </div>

                        <p style={styles.introDesc}>{info.desc}</p>

                        {info.symptoms.length > 0 && (
                            <div style={styles.symptomsBox}>
                                <h4 style={styles.symptomsTitle}>Behaviors observed during the test:</h4>
                                <ul style={styles.symptomsList}>
                                    {info.symptoms.map((s, i) => (
                                        <li key={i} style={styles.symptomItem}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={styles.statsGrid}>
                            <div style={styles.statItem}>
                                <span style={styles.statValue}>{(result.cli * 100).toFixed(0)}%</span>
                                <span style={styles.statLabel}>Cognitive Load Index</span>
                            </div>
                            <div style={styles.statItem}>
                                <span style={styles.statValue}>{(result.session.rawBehaviorData.totalTimeMs / 1000).toFixed(0)}s</span>
                                <span style={styles.statLabel}>Reading Time</span>
                            </div>
                            <div style={styles.statItem}>
                                <span style={styles.statValue}>{result.session.rawBehaviorData.reReadingCount}</span>
                                <span style={styles.statLabel}>Re-reads</span>
                            </div>
                        </div>

                        <button
                            id="go-to-dashboard"
                            onClick={() => navigate('/dashboard/student')}
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginTop: 8 }}
                        >
                            Go to My Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

function TimerDisplay({ startTime }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

const styles = {
    wrapper: { minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    mediaError: { background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: '#dc2626', fontSize: '0.88rem', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 },
    mediaErrorIcon: { fontSize: '1.2rem' },
    mediaGranted: { background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 'var(--radius-md)', padding: '10px 16px', color: 'var(--success)', fontSize: '0.88rem', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 },
    mediaPreview: { position: 'fixed', bottom: 24, right: 24, width: 200, background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', zIndex: 1000 },
    mediaPreviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' },
    micIndicator: { display: 'flex', alignItems: 'center', gap: 4 },
    micBar: { width: 40, height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' },
    micBarFill: { height: '100%', background: 'var(--accent-primary)', borderRadius: 3, transition: 'width 0.1s ease' },
    previewVideo: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' },
    centered: { width: '100%', maxWidth: 560 },
    introCard: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '48px 40px', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' },
    introTitle: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: 16 },
    introDesc: { color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, margin: '16px 0 24px' },
    infoGrid: { display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 8 },
    infoItem: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.88rem' },
    infoIcon: { fontSize: '1.2rem' },
    readingContainer: { width: '100%', maxWidth: 700, margin: '0 auto' },
    readingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    readingTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' },
    timer: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 20px', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' },
    textContainer: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '36px 40px', maxHeight: '60vh', overflowY: 'auto', scrollBehavior: 'smooth' },
    paragraph: { marginBottom: 24, lineHeight: 1.9, fontSize: '1.05rem', color: 'var(--text-primary)' },
    resultCard: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '48px 40px', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' },
    profileBadge: { display: 'inline-block', padding: '12px 28px', borderRadius: 'var(--radius-lg)', border: '2px solid', marginTop: 16 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24, marginBottom: 8 },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' },
    statValue: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' },
    statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    symptomsBox: { textAlign: 'left', marginTop: 20, padding: '16px 20px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' },
    symptomsTitle: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 },
    symptomsList: { margin: 0, paddingLeft: 20 },
    symptomItem: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.8 },
};
