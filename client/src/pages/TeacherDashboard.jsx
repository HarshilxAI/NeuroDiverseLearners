import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [contents, setContents] = useState([]);
    const [chatPartners, setChatPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [uploadForm, setUploadForm] = useState({ title: '', originalText: '', topicTag: '', difficulty: 'medium', recommendedFor: ['ADHD', 'Dyslexia', 'Typical'] });
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { loadStudents(); loadContents(); loadChatPartners(); }, []);
    useEffect(() => { if (selectedPartner) loadMessages(selectedPartner._id); }, [selectedPartner]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadStudents = async () => { try { const r = await api.get('/users/students'); setStudents(r.data.students || []); } catch (e) { } };
    const loadContents = async () => { try { const r = await api.get('/content'); setContents(r.data.contents || []); } catch (e) { } };
    const loadChatPartners = async () => { try { const r = await api.get('/users/parents'); setChatPartners(r.data.parents || []); } catch (e) { } };
    const loadMessages = async (id) => { try { const r = await api.get(`/chat/${id}`); setMessages(r.data.messages || []); } catch (e) { } };

    const handleUpload = async (e) => {
        e.preventDefault(); setUploading(true);
        try { await api.post('/content', uploadForm); setUploadForm({ title: '', originalText: '', topicTag: '', difficulty: 'medium', recommendedFor: ['ADHD', 'Dyslexia', 'Typical'] }); await loadContents(); } catch (e) { }
        finally { setUploading(false); }
    };

    const handleSend = async (e) => {
        e.preventDefault(); if (!newMessage.trim() || !selectedPartner) return;
        try { await api.post('/chat', { receiverId: selectedPartner._id, message: newMessage }); setNewMessage(''); await loadMessages(selectedPartner._id); } catch (e) { }
    };

    const handleDelete = async (id) => { try { await api.delete(`/content/${id}`); await loadContents(); } catch (e) { } };

    const pc = { ADHD: '#fbbf24', Dyslexia: '#f87171', Typical: '#34d399' };

    return (
        <div style={s.page}>
            <header style={s.header}>
                <div style={s.hLeft}><span style={{ fontSize: 28 }}>🧠</span><h1 style={s.logo}>NeuroAdapt</h1><span style={s.roleTag}>Teacher</span></div>
                <div style={s.hRight}><span style={s.uName}>{user?.name}</span><button onClick={logout} style={s.logoutBtn}>Logout</button></div>
            </header>
            <div style={s.tabs}>
                {[{ id: 'students', l: '👥 Classroom' }, { id: 'content', l: '📄 Content' }, { id: 'chat', l: '💬 Messages' }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...s.tab, ...(activeTab === t.id ? s.tabAct : {}) }}>{t.l}</button>
                ))}
            </div>

            {activeTab === 'students' && (
                <div className="animate-fade-in">
                    <h3 style={s.secTitle}>Classroom Overview</h3>
                    {students.length === 0 && <p style={s.empty}>No students yet.</p>}
                    <div style={s.sGrid}>
                        {students.map(st => (
                            <div key={st._id} style={s.sCard}>
                                <div style={s.sTop}>
                                    <div style={{ ...s.avatar, background: pc[st.cognitiveProfile] || '#34d399' }}>{st.name?.charAt(0)}</div>
                                    <div><h4 style={s.sName}>{st.name}</h4><span style={s.sEmail}>{st.email}</span></div>
                                </div>
                                <div style={s.sMeta}>
                                    <span className={`badge badge-${(st.cognitiveProfile || 'typical').toLowerCase()}`}>{st.cognitiveProfile || 'Typical'}</span>
                                    <div style={{ ...s.dot, background: st.onboardingComplete ? '#34d399' : '#fbbf24' }} /><span style={s.dotTxt}>{st.onboardingComplete ? 'Active' : 'Onboarding'}</span>
                                </div>
                                {st.interests?.length > 0 && <div style={s.iRow}>{st.interests.map((i, x) => <span key={x} style={s.iTag}>{i}</span>)}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'content' && (
                <div className="animate-fade-in" style={s.split}>
                    <div style={s.upPanel}>
                        <h3 style={s.secTitle}>Upload Content</h3>
                        <form onSubmit={handleUpload} style={s.form}>
                            <input className="input-field" placeholder="Title" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} required />
                            <input className="input-field" placeholder="Topic Tag" value={uploadForm.topicTag} onChange={e => setUploadForm({ ...uploadForm, topicTag: e.target.value })} required />
                            <div style={s.formRow}>
                                <label style={s.formLabel}>Difficulty</label>
                                <select
                                    className="input-field"
                                    value={uploadForm.difficulty}
                                    onChange={e => setUploadForm({ ...uploadForm, difficulty: e.target.value })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div style={s.formRow}>
                                <label style={s.formLabel}>Recommended for</label>
                                <div style={s.checkboxRow}>
                                    {['ADHD', 'Dyslexia', 'Typical'].map(profile => (
                                        <label key={profile} style={s.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={uploadForm.recommendedFor?.includes(profile)}
                                                onChange={e => {
                                                    const next = e.target.checked
                                                        ? [...(uploadForm.recommendedFor || []), profile]
                                                        : (uploadForm.recommendedFor || []).filter(p => p !== profile);
                                                    setUploadForm({ ...uploadForm, recommendedFor: next.length ? next : ['ADHD', 'Dyslexia', 'Typical'] });
                                                }}
                                            />
                                            {profile}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <textarea className="input-field" placeholder="Paste study material..." value={uploadForm.originalText} onChange={e => setUploadForm({ ...uploadForm, originalText: e.target.value })} required style={{ minHeight: 180, resize: 'vertical' }} />
                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>{uploading ? 'Uploading...' : '📤 Upload'}</button>
                        </form>
                    </div>
                    <div style={s.cListPanel}>
                        <h3 style={s.secTitle}>Uploaded ({contents.length})</h3>
                        {contents.map(c => (
                            <div key={c._id} style={s.cCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><span style={s.cTag}>{c.topicTag} · {(c.difficulty || 'medium').charAt(0).toUpperCase() + (c.difficulty || 'medium').slice(1)}</span><h4 style={s.cTitle}>{c.title}</h4></div>
                                    <button onClick={() => handleDelete(c._id)} style={s.delBtn}>🗑️</button>
                                </div>
                                <p style={s.cPrev}>{c.originalText?.substring(0, 120)}...</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="animate-fade-in" style={s.chatLay}>
                    <div style={s.chatSide}>
                        <h3 style={s.secTitle}>Parents</h3>
                        {chatPartners.map(p => (
                            <button key={p._id} onClick={() => setSelectedPartner(p)} style={{ ...s.chatP, ...(selectedPartner?._id === p._id ? s.chatPAct : {}) }}>
                                <div style={{ ...s.avatar, width: 36, height: 36, fontSize: '0.85rem', background: 'var(--accent-secondary)' }}>{p.name?.charAt(0)}</div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
                            </button>
                        ))}
                    </div>
                    <div style={s.chatMain}>
                        {!selectedPartner ? (
                            <div style={s.chatEmpty}><span style={{ fontSize: 48, opacity: 0.4 }}>💬</span><p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Select a parent</p></div>
                        ) : (
                            <>
                                <div style={s.chatHead}><h4>{selectedPartner.name}</h4></div>
                                <div style={s.chatMsgs}>
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ ...s.msg, ...(m.senderId === user?._id ? s.msgS : s.msgR) }}>
                                            <p style={{ fontSize: '0.9rem' }}>{m.message}</p>
                                            <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSend} style={s.chatIn}>
                                    <input className="input-field" placeholder="Type..." value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1 }} />
                                    <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Send</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    page: { maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    hLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    logo: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    roleTag: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' },
    hRight: { display: 'flex', alignItems: 'center', gap: 12 },
    uName: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
    logoutBtn: { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-primary)' },
    tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
    tab: { padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.3s' },
    tabAct: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    secTitle: { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16 },
    empty: { color: 'var(--text-muted)', fontSize: '0.88rem' },
    sGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 },
    sCard: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20 },
    sTop: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 },
    avatar: { width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 },
    sName: { fontWeight: 700, fontSize: '0.98rem', marginBottom: 2 }, sEmail: { fontSize: '0.78rem', color: 'var(--text-muted)' },
    sMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
    dot: { width: 8, height: 8, borderRadius: '50%' }, dotTxt: { fontSize: '0.78rem', color: 'var(--text-secondary)' },
    iRow: { display: 'flex', flexWrap: 'wrap', gap: 6 }, iTag: { background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '2px 10px', borderRadius: 100, fontSize: '0.72rem', color: 'var(--text-secondary)' },
    split: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    upPanel: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 },
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    formRow: { display: 'flex', flexDirection: 'column', gap: 6 },
    formLabel: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
    checkboxRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' },
    cListPanel: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24, overflowY: 'auto', maxHeight: '70vh' },
    cCard: { border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 12 },
    cTag: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', fontWeight: 700 },
    cTitle: { fontWeight: 700, fontSize: '0.92rem', marginTop: 4, marginBottom: 8 },
    cPrev: { fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
    delBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 4 },
    chatLay: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, minHeight: 500 },
    chatSide: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16 },
    chatP: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', textAlign: 'left', marginBottom: 4 },
    chatPAct: { background: 'rgba(124,92,252,0.1)', borderColor: 'var(--accent-primary)' },
    chatMain: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' },
    chatEmpty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 },
    chatHead: { padding: '16px 20px', borderBottom: '1px solid var(--border-color)' },
    chatMsgs: { flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350 },
    msg: { maxWidth: '70%', padding: '10px 16px', borderRadius: 'var(--radius-md)' },
    msgS: { alignSelf: 'flex-end', background: 'var(--accent-primary)', color: '#fff', borderBottomRightRadius: 4 },
    msgR: { alignSelf: 'flex-start', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderBottomLeftRadius: 4 },
    chatIn: { display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border-color)' },
};
