"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./page.module.css";
import { QUESTIONS, type TriviaQuestion } from "./questions";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOTAL_SECONDS = 180;

interface TriviaRecord {
  id: number;
  nombre: string;
  puntuacion: number;
  racha_maxima: number;
  fecha: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Home screen
// ─────────────────────────────────────────────────────────────────────────────

function HomeScreen({
  records,
  onPlay,
}: {
  records: TriviaRecord[];
  onPlay: () => void;
}) {
  return (
    <>
      <div className={styles.homeHero}>
        <div className={styles.homeCard}>
          <span className={styles.homeLogo}>
            <span className={styles.homeLogoEl}>El</span>
            <span className={styles.homeLogoSim}>Simulador</span>
          </span>
          <h1 className={styles.homeTitle}>Trivia Mundial</h1>
          <p className={styles.homeSub}>
            70 preguntas · 3 minutos · ¿Cuánto sabes de la historia del Mundial?
          </p>
          <button className={styles.btnPlay} onClick={onPlay}>
            JUGAR
          </button>
        </div>
      </div>

      <div className={styles.recordsSection}>
        <div className={styles.recordsInner}>
          <p className={styles.recordsTitle}>Mejores puntuaciones</p>
          <div className={styles.recordsTable}>
            <div className={styles.recordsHead}>
              <span>#</span>
              <span>Nombre</span>
              <span style={{ textAlign: "center" }}>Pts</span>
              <span style={{ textAlign: "center" }}>Racha</span>
              <span style={{ textAlign: "right" }}>Fecha</span>
            </div>
            {records.length === 0 ? (
              <p className={styles.recordsEmpty}>
                Aún no hay récords. ¡Sé el primero en jugar!
              </p>
            ) : (
              records.map((r, i) => (
                <div key={r.id} className={styles.recordsRow}>
                  <span className={styles.recordPos}>{i + 1}</span>
                  <span className={styles.recordNombre}>{r.nombre}</span>
                  <span className={styles.recordPts}>{r.puntuacion}</span>
                  <span className={styles.recordRacha}>{r.racha_maxima}</span>
                  <span className={styles.recordFecha}>{fmtFecha(r.fecha)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Playing screen
// ─────────────────────────────────────────────────────────────────────────────

function PlayingScreen({
  questions,
  onFinish,
}: {
  questions: TriviaQuestion[];
  onFinish: (score: number, maxStreak: number, timeUsed: number) => void;
}) {
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [score, setScore]         = useState(0);
  const [streak, setStreak]       = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS);
  const [visible, setVisible]     = useState(true);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TOTAL_SECONDS);
  const lockedRef   = useRef(false);
  const scoreRef    = useRef(0);
  const maxRef      = useRef(0);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const finish = useCallback(() => {
    clearInterval(timerRef.current!);
    onFinish(scoreRef.current, maxRef.current, TOTAL_SECONDS - timeLeftRef.current);
  }, [onFinish]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(finish, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [finish]);

  function advance(nextIdx: number) {
    setVisible(false);
    setTimeout(() => {
      if (nextIdx >= questions.length) {
        finish();
        return;
      }
      setCurrent(nextIdx);
      setSelected(null);
      lockedRef.current = false;
      setVisible(true);
    }, 200);
  }

  function handleSelect(idx: number) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setSelected(idx);

    const q       = questions[current];
    const correct = idx === q.respuesta_correcta;

    setStreak(prev => {
      const ns = correct ? prev + 1 : 0;
      setMaxStreak(mx => {
        const nm = Math.max(mx, ns);
        maxRef.current = nm;
        return nm;
      });
      return ns;
    });

    if (correct) {
      setScore(s => {
        scoreRef.current = s + 1;
        return s + 1;
      });
    }

    setTimeout(() => advance(current + 1), correct ? 1000 : 1500);
  }

  const q      = questions[current];
  const pct    = (current / questions.length) * 100;
  const urgent = timeLeft < 60;

  function optClass(i: number) {
    if (selected === null) return styles.optionBtn;
    if (i === q.respuesta_correcta) return `${styles.optionBtn} ${styles.optionCorrect}`;
    if (i === selected)             return `${styles.optionBtn} ${styles.optionWrong}`;
    return `${styles.optionBtn} ${styles.optionDimmed}`;
  }

  return (
    <div className={styles.playScreen}>
      <div className={styles.timerWrap}>
        <div className={`${styles.timer} ${urgent ? styles.timerUrgent : ""}`}>
          {fmtTime(timeLeft)}
        </div>
      </div>

      <div className={styles.progress}>
        <span>Pregunta {current + 1} de {questions.length}</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        {streak >= 2 ? (
          <span className={styles.streakBadge}>🔥 Racha {streak}</span>
        ) : (
          <span style={{ visibility: "hidden" }}>·</span>
        )}
      </div>

      <div
        className={`${styles.questionCard} ${!visible ? styles.questionCardHidden : ""}`}
      >
        <span
          className={`${styles.diffBadge} ${
            q.dificultad === "fácil"
              ? styles.diffFacil
              : q.dificultad === "media"
              ? styles.diffMedia
              : styles.diffDificil
          }`}
        >
          {q.dificultad}
        </span>
        <p className={styles.questionText}>{q.pregunta}</p>
      </div>

      <div
        className={`${styles.optionsGrid} ${!visible ? styles.optionsGridHidden : ""}`}
      >
        {q.opciones.map((opt, i) => (
          <button
            key={i}
            className={optClass(i)}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result screen
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({
  score,
  maxStreak,
  timeUsed,
  records,
  onPlayAgain,
  onHome,
  onRecordSaved,
}: {
  score: number;
  maxStreak: number;
  timeUsed: number;
  records: TriviaRecord[];
  onPlayAgain: () => void;
  onHome: () => void;
  onRecordSaved: () => void;
}) {
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const qualifies =
    records.length < 10 || score > records[records.length - 1].puntuacion;

  async function handleSave() {
    if (!saveName.trim() || saving) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/v1/trivia/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: saveName.trim(),
          puntuacion: score,
          racha_maxima: maxStreak,
        }),
      });
      setSaved(true);
      onRecordSaved();
    } finally {
      setSaving(false);
    }
  }

  const pctCorrect = Math.round((score / QUESTIONS.length) * 100);

  return (
    <div className={styles.resultScreen}>
      <div className={styles.resultCard}>
        <p className={styles.resultTitle}>Resultado final</p>
        <div className={styles.resultScore}>{score}</div>
        <p className={styles.resultScoreSub}>
          respuestas correctas de 70 · {pctCorrect}% de acierto
        </p>

        <div className={styles.resultStats}>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Racha máxima</p>
            <p className={styles.statValue}>{maxStreak}</p>
          </div>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Tiempo usado</p>
            <p className={styles.statValue}>
              {fmtTime(Math.min(timeUsed, TOTAL_SECONDS))}
            </p>
          </div>
        </div>

        {qualifies && !saved && (
          <div className={styles.saveSection}>
            <p className={styles.saveTitle}>¡Entraste al top 10!</p>
            <p className={styles.saveSub}>
              Ingresa tu nombre para guardar tu récord
            </p>
            <div className={styles.saveForm}>
              <input
                className={styles.saveInput}
                type="text"
                placeholder="Tu nombre"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                maxLength={60}
              />
              <button
                className={styles.btnSaveRecord}
                onClick={handleSave}
                disabled={!saveName.trim() || saving}
              >
                {saving ? "…" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {saved && <p className={styles.savedMsg}>✓ Récord guardado</p>}

        <div className={styles.resultActions}>
          <button className={styles.btnPlayAgain} onClick={onPlayAgain}>
            JUGAR DE NUEVO
          </button>
          <button className={styles.btnHome} onClick={onHome}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────

type Screen = "home" | "playing" | "result";

export default function TriviaPage() {
  const [screen, setScreen]         = useState<Screen>("home");
  const [records, setRecords]       = useState<TriviaRecord[]>([]);
  const [questions, setQuestions]   = useState<TriviaQuestion[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [finalMax, setFinalMax]     = useState(0);
  const [finalTime, setFinalTime]   = useState(0);
  const gameKey = useRef(0);

  async function loadRecords() {
    try {
      const res = await fetch(`${API}/api/v1/trivia/records`);
      if (res.ok) setRecords(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadRecords();
  }, []);

  function startGame() {
    gameKey.current += 1;
    setQuestions(shuffle(QUESTIONS));
    setScreen("playing");
  }

  function handleFinish(score: number, maxStreak: number, timeUsed: number) {
    setFinalScore(score);
    setFinalMax(maxStreak);
    setFinalTime(timeUsed);
    setScreen("result");
  }

  if (screen === "playing") {
    return (
      <PlayingScreen
        key={gameKey.current}
        questions={questions}
        onFinish={handleFinish}
      />
    );
  }

  if (screen === "result") {
    return (
      <ResultScreen
        score={finalScore}
        maxStreak={finalMax}
        timeUsed={finalTime}
        records={records}
        onPlayAgain={startGame}
        onHome={() => {
          loadRecords();
          setScreen("home");
        }}
        onRecordSaved={loadRecords}
      />
    );
  }

  return <HomeScreen records={records} onPlay={startGame} />;
}
