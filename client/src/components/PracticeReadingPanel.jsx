import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

// Sample texts by difficulty for ADHD (shorter, focused) and Dyslexia (simple vocabulary)
const SAMPLE_TEXTS = {
    easy: {
        ADHD: 'The dog runs fast. The cat sleeps. Birds fly high. Fish swim in water. I like to play.',
        Dyslexia: 'The sun is bright. We go to the park. Mom makes lunch. Dad reads a book. Good night.',
        Typical: 'The dog runs fast. The sun is bright. Birds fly high. We go to the park. Good night.'
    },
    medium: {
        ADHD: 'Dogs are loyal friends. They love to play and run. Many people have dogs at home. Dogs can learn tricks. They need food and water each day.',
        Dyslexia: 'The rain fell on the roof. We stayed inside. Mom made hot chocolate. We read stories together. It was a cozy afternoon.',
        Typical: 'Plants need sun and water to grow. They take in air through their leaves. Flowers bloom in spring. Trees give us shade. Nature is wonderful.'
    },
    hard: {
        ADHD: 'Electricity powers our homes and devices. It flows through wires like water through pipes. Thomas Edison invented the light bulb. Today we use solar panels to make clean energy. Saving electricity helps the planet.',
        Dyslexia: 'The ancient Egyptians built great pyramids. They used huge stones and clever tools. The pharaohs ruled the land. They believed in life after death. Their writing was called hieroglyphics.',
        Typical: 'The human brain contains billions of neurons. These cells communicate through electrical signals. Learning strengthens the connections between neurons. Sleep helps the brain process memories. Exercise boosts brain health.'
    }
};

// Normalize word for comparison (case-insensitive, remove punctuation)
function normalizeWord(w) {
    return w.toLowerCase().replace(/[^a-z0-9']/g, '');
}

// Compare transcript with original text and return word-level mistakes
function computeMistakes(originalText, transcript) {
    const expectedWords = originalText.trim().split(/\s+/).filter(Boolean);
    const saidWords = transcript.trim().split(/\s+/).filter(Boolean);
    const mistakes = [];
    let saidIdx = 0;

    for (let i = 0; i < expectedWords.length; i++) {
        const expected = expectedWords[i];
        const said = saidWords[saidIdx];
        const expectedNorm = normalizeWord(expected);
        const saidNorm = said ? normalizeWord(said) : '';

        if (!saidNorm) {
            mistakes.push({ expectedWord: expected, saidWord: '(skipped)', position: i });
            continue;
        }

        // Allow minor variations (plural, tense, common mishears)
        const match = expectedNorm === saidNorm
            || (expectedNorm.length > 4 && saidNorm.length > 4 && expectedNorm.slice(0, 4) === saidNorm.slice(0, 4))
            || (expectedNorm.endsWith('s') && expectedNorm.slice(0, -1) === saidNorm)
            || (saidNorm.endsWith('s') && saidNorm.slice(0, -1) === expectedNorm);

        if (!match) {
            mistakes.push({ expectedWord: expected, saidWord: said, position: i });
        }
        saidIdx++;
    }

    // Extra words said beyond the text
    while (saidIdx < saidWords.length) {
        mistakes.push({ expectedWord: '(extra)', saidWord: saidWords[saidIdx], position: expectedWords.length });
        saidIdx++;
    }

    return { mistakes, wordCount: expectedWords.length };
}

export default function PracticeReadingPanel({ user }) {
    const [customText, setCustomText] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const startTimeRef = useRef(null);
    const transcriptRef = useRef('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startReading = () => {
        if (!customText.trim()) {
            setError('Please paste or type some text to read.');
            return;
        }
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
            return;
        }

        setError(null);
        setResult(null);
        setTranscript('');
        transcriptRef.current = '';
        setIsRecording(true);
        startTimeRef.current = Date.now();

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcriptRef.current += (transcriptRef.current ? ' ' : '') + chunk;
                }
            }
            setTranscript(transcriptRef.current);
        };

        recognition.onerror = (e) => {
            if (e.error !== 'no-speech') {
                setError(`Speech error: ${e.error}`);
                setIsRecording(false);
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                // Recognition ended but we might still want to keep going - restart if needed
                // For now we'll just stop
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopReading = async () => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);

        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalTranscript = transcriptRef.current || transcript;
        const { mistakes, wordCount } = computeMistakes(customText, finalTranscript);
        const accuracy = wordCount > 0 ? Math.round(((wordCount - mistakes.length) / wordCount) * 100) : 0;

        setResult({
            transcript: finalTranscript,
            mistakes,
            accuracy,
            durationSeconds,
            wordCount
        });

        setSaving(true);
        try {
            await api.post('/reading-practice', {
                originalText: customText,
                transcript: finalTranscript,
                mistakes,
                accuracy,
                durationSeconds,
                difficulty
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Render text with highlighted mistakes
    const renderTextWithMistakes = () => {
        if (!result) return null;
        const words = customText.trim().split(/\s+/);
        const mistakePositions = new Set(result.mistakes.map(m => m.position));
        return (
            <div style={styles.highlightedText}>
                {words.map((word, i) => (
                    <span
                        key={i}
                        style={{
                            ...styles.word,
                            ...(mistakePositions.has(i) ? styles.wordMistake : styles.wordCorrect)
                        }}
                    >
                        {word}{' '}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div style={styles.panel} className="animate-fade-in">
            <h3 style={styles.sectionTitle}>Practice Reading — Paste Your Own Text</h3>
            <p style={styles.hint}>
                Paste any text below, then click "Start Reading" to read it aloud. We'll track where you make mistakes.
            </p>

            <div style={styles.difficultyRow}>
                <span style={styles.label}>Difficulty:</span>
                {['easy', 'medium', 'hard'].map(d => (
                    <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        style={{ ...styles.diffBtn, ...(difficulty === d ? styles.diffBtnActive : {}) }}
                    >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>

            <div style={styles.sampleRow}>
                <span style={styles.label}>Try sample text:</span>
                <button
                    type="button"
                    onClick={() => {
                        const profile = user?.cognitiveProfile || 'Typical';
                        setCustomText(SAMPLE_TEXTS[difficulty][profile] || SAMPLE_TEXTS[difficulty].Typical);
                        setResult(null);
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                    Load sample for {(user?.cognitiveProfile || 'Typical')}
                </button>
            </div>

            <textarea
                className="input-field"
                placeholder="Paste or type text here to practice reading..."
                value={customText}
                onChange={e => { setCustomText(e.target.value); setResult(null); }}
                style={styles.textarea}
                disabled={isRecording}
            />

            {error && <div style={styles.errorMsg}>{error}</div>}

            {!result ? (
                <div style={styles.buttonRow}>
                    {!isRecording ? (
                        <button onClick={startReading} className="btn-primary" disabled={!customText.trim()}>
                            🎤 Start Reading
                        </button>
                    ) : (
                        <button onClick={stopReading} className="btn-primary" style={{ background: '#ef4444' }}>
                            ⏹ Stop & See Results
                        </button>
                    )}
                </div>
            ) : (
                <div style={styles.results}>
                    <h4 style={styles.resultsTitle}>Results</h4>
                    <div style={styles.statsRow}>
                        <div style={styles.stat}>
                            <span style={styles.statVal}>{result.accuracy}%</span>
                            <span style={styles.statLbl}>Accuracy</span>
                        </div>
                        <div style={styles.stat}>
                            <span style={styles.statVal}>{result.mistakes.length}</span>
                            <span style={styles.statLbl}>Mistakes</span>
                        </div>
                        <div style={styles.stat}>
                            <span style={styles.statVal}>{result.durationSeconds}s</span>
                            <span style={styles.statLbl}>Duration</span>
                        </div>
                    </div>
                    <div style={styles.legend}>
                        <span><span style={{ ...styles.legendSwatch, background: 'rgba(16,185,129,0.3)' }} /> Correct</span>
                        <span><span style={{ ...styles.legendSwatch, background: 'rgba(239,68,68,0.3)' }} /> Mistake</span>
                    </div>
                    {renderTextWithMistakes()}
                    {result.mistakes.length > 0 && (
                        <div style={styles.mistakesList}>
                            <h5 style={styles.mistakesTitle}>Mistakes:</h5>
                            {result.mistakes.slice(0, 10).map((m, i) => (
                                <div key={i} style={styles.mistakeItem}>
                                    Expected "<strong>{m.expectedWord}</strong>"
                                    {m.saidWord !== '(skipped)' && m.saidWord !== '(extra)' && <> — said "<strong>{m.saidWord}</strong>"</>}
                                </div>
                            ))}
                            {result.mistakes.length > 10 && (
                                <span style={styles.more}>+{result.mistakes.length - 10} more</span>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => { setResult(null); setTranscript(''); }}
                        className="btn-secondary"
                        style={{ marginTop: 16 }}
                    >
                        Practice Again
                    </button>
                </div>
            )}

            {isRecording && (
                <div style={styles.liveTranscript}>
                    <span style={styles.liveLabel}>Live transcript:</span>
                    <p style={styles.liveText}>{transcript || '(listening...)'}</p>
                </div>
            )}
        </div>
    );
}

const styles = {
    panel: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 },
    sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 },
    hint: { color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 },
    difficultyRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
    label: { fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 },
    diffBtn: { padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: '0.85rem' },
    diffBtnActive: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    sampleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
    textarea: { minHeight: 180, resize: 'vertical', marginBottom: 16 },
    errorMsg: { background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.88rem' },
    buttonRow: { marginBottom: 20 },
    results: { marginTop: 20 },
    resultsTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: 16 },
    statsRow: { display: 'flex', gap: 20, marginBottom: 16 },
    stat: { display: 'flex', flexDirection: 'column', gap: 4 },
    statVal: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' },
    statLbl: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' },
    legend: { display: 'flex', gap: 20, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' },
    legendSwatch: { display: 'inline-block', width: 16, height: 16, borderRadius: 4, marginRight: 6, verticalAlign: 'middle' },
    highlightedText: { lineHeight: 2, fontSize: '1rem', marginBottom: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' },
    word: { padding: '2px 0' },
    wordCorrect: { background: 'rgba(16,185,129,0.3)', borderRadius: 2 },
    wordMistake: { background: 'rgba(239,68,68,0.3)', borderRadius: 2 },
    mistakesList: { marginTop: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' },
    mistakesTitle: { fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 },
    mistakeItem: { fontSize: '0.88rem', marginBottom: 6, color: 'var(--text-secondary)' },
    more: { fontSize: '0.82rem', color: 'var(--text-muted)' },
    liveTranscript: { marginTop: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' },
    liveLabel: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'block', marginBottom: 8 },
    liveText: { fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0 },
};
