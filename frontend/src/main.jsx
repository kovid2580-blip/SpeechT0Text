import React from 'react';
import { createRoot } from 'react-dom/client';
import { Download, LogOut, Mic, MicOff, Trash2, UploadCloud } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '');

function displayAudioName(audioFile) {
  return audioFile?.replace(/^(Recording \d+)\.webm$/i, '$1') || '';
}

function nextRecordingNumber(history) {
  const highest = history.reduce((max, item) => {
    const match = item.audioFile?.match(/^Recording (\d+)\.webm$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return highest + 1;
}

function api(path, options = {}) {
  const token = localStorage.getItem('stt_token');
  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    return res;
  });
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const data = await api(path, { method: 'POST', body: JSON.stringify(body) }).then((res) => res.json());
      localStorage.setItem('stt_token', data.token);
      localStorage.setItem('stt_user', JSON.stringify(data));
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Java Speech-to-Text</p>
          <h1>Convert audio into saved transcripts.</h1>
        </div>

        <div className="segmented" aria-label="Authentication mode">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'register' && (
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [history, setHistory] = React.useState([]);
  const [current, setCurrent] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [liveTranscript, setLiveTranscript] = React.useState('');
  const mediaRecorder = React.useRef(null);
  const speechRecognition = React.useRef(null);
  const finalTranscript = React.useRef('');
  const liveTranscriptRef = React.useRef('');
  const chunks = React.useRef([]);

  React.useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await api('/api/speech/history').then((res) => res.json());
      setHistory(data);
      setCurrent((existing) => existing || data[0] || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendAudio(file, endpoint = '/api/speech/upload', transcript = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (transcript.trim()) formData.append('transcript', transcript.trim());
    setLoading(true);
    setError('');
    try {
      const data = await api(endpoint, { method: 'POST', body: formData }).then((res) => res.json());
      setCurrent(data);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    setError('');
    setLiveTranscript('');
    finalTranscript.current = '';
    liveTranscriptRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const text = event.results[index][0].transcript;
          if (event.results[index].isFinal) {
            finalTranscript.current = `${finalTranscript.current} ${text}`.trim();
          } else {
            interimTranscript = `${interimTranscript} ${text}`.trim();
          }
        }
        liveTranscriptRef.current = `${finalTranscript.current} ${interimTranscript}`.trim();
        setLiveTranscript(liveTranscriptRef.current);
      };
      recognition.onerror = () => {
        speechRecognition.current = null;
      };
      recognition.start();
      speechRecognition.current = recognition;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunks.current = [];
    recorder.ondataavailable = (event) => chunks.current.push(event.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      const transcript = (finalTranscript.current || liveTranscriptRef.current).trim();
      const recordingName = `Recording ${nextRecordingNumber(history)}.webm`;
      sendAudio(new File([blob], recordingName, { type: 'audio/webm' }), '/api/speech/record', transcript);
    };
    mediaRecorder.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    speechRecognition.current?.stop();
    speechRecognition.current = null;
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  function downloadTranscript(item) {
    const blob = new Blob([item.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${item.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteTranscript(item) {
    setError('');
    try {
      await api(`/api/speech/${item.id}`, { method: 'DELETE' });
      const nextHistory = history.filter((historyItem) => historyItem.id !== item.id);
      setHistory(nextHistory);
      if (current?.id === item.id) {
        setCurrent(nextHistory[0] || null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Speech-to-Text MVP</p>
          <h1>Welcome, {user.name}</h1>
        </div>
        <button className="icon-text" onClick={onLogout}><LogOut size={18} /> Logout</button>
      </header>

      <section className="workspace">
        <aside className="panel history">
          <h2>Transcript History</h2>
          <div className="history-list">
            {history.length === 0 && <p className="muted">No transcripts yet.</p>}
            {history.map((item) => (
              <div key={item.id} className={current?.id === item.id ? 'history-item active' : 'history-item'}>
                <button className="history-select" onClick={() => setCurrent(item)}>
                  <strong>{displayAudioName(item.audioFile)}</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </button>
                <button className="icon-button danger-text" aria-label={`Delete ${displayAudioName(item.audioFile)}`} onClick={() => deleteTranscript(item)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="main-column">
          <div className="panel controls">
            <label className="upload-target">
              <UploadCloud size={24} />
              <span>Upload audio</span>
              <input type="file" accept="audio/*" onChange={(event) => event.target.files[0] && sendAudio(event.target.files[0])} />
            </label>
            <button className={recording ? 'danger' : 'secondary'} onClick={recording ? stopRecording : startRecording}>
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
              {recording ? 'Stop recording' : 'Record audio'}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {loading && <p className="status">Transcribing audio...</p>}

          <article className="panel transcript">
            <div className="transcript-head">
              <div>
                <p className="eyebrow">Transcript</p>
                <h2>{current ? displayAudioName(current.audioFile) : 'No audio selected'}</h2>
              </div>
              {current && (
                <button className="icon-text" onClick={() => downloadTranscript(current)}>
                  <Download size={18} /> Download
                </button>
              )}
            </div>
            <textarea readOnly value={recording && liveTranscript ? liveTranscript : current?.transcript || ''} placeholder="Your converted text will appear here." />
          </article>
        </section>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = React.useState(() => {
    const saved = localStorage.getItem('stt_user');
    return saved ? JSON.parse(saved) : null;
  });

  function logout() {
    localStorage.removeItem('stt_token');
    localStorage.removeItem('stt_user');
    setUser(null);
  }

  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthForm onAuthenticated={setUser} />;
}

createRoot(document.getElementById('root')).render(<App />);
