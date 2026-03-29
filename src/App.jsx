import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from './firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import './App.css'

function Teacher() {
  const [sessionInput, setSessionInput] = useState("")
  const [sessionId, setSessionId] = useState("")

  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState(0)

  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [results, setResults] = useState({})

  /* Load questions for session */
  useEffect(() => {
    if (!sessionId) return

    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, snapshot => {
      const qs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(q => q.sessionId === sessionId)

      setQuestions(qs)
      setQuestionIndex(0)
    })

    return () => unsub()
  }, [sessionId])

  const currentQuestion = questions[questionIndex]

  /* Load responses for selected question */
  useEffect(() => {
    if (!currentQuestion || !sessionId) return

    const unsub = onSnapshot(collection(db, "responses"), snapshot => {
      const counts = {}

      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (
          data.questionId === currentQuestion.id &&
          data.sessionId === sessionId
        ) {
          counts[data.selectedOption] =
            (counts[data.selectedOption] || 0) + 1
        }
      })

      setResults(counts)
    })

    return () => unsub()
  }, [currentQuestion, sessionId])

  const handleOptionChange = (value, index) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const createQuestion = async () => {
    if (!sessionId) {
      alert("Join a session first")
      return
    }

    await addDoc(collection(db, "questions"), {
      sessionId: sessionId,
      questionText: question,
      options: options.filter(o => o !== ""),
      correctOption: options[correctIndex],
      createdAt: Date.now()
    })

    setQuestion("")
    setOptions(["", "", "", ""])
    setCorrectIndex(0)
    setResults({})
    alert("Question created")
  }

  return (
    <>
      <h2>Teacher View</h2>

      {/* SESSION JOIN */}
      <input
        type="text"
        placeholder="Enter code (session)"
        value={sessionInput}
        onChange={e => setSessionInput(e.target.value.toLowerCase().trim())}
      />

      <button onClick={() => setSessionId(sessionInput)}>
        Join Session
      </button>

      {sessionId && <p>Current session: {sessionId}</p>}

      {sessionId && (
        <button
          onClick={() => {
            setSessionId("")
            setSessionInput("")
            setQuestions([])
            setResults({})
          }}
        >
          Leave Session
        </button>
      )}

      <h3>Create Question</h3>

      <input
        type="text"
        placeholder="Enter question"
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />

      {options.map((opt, i) => (
        <div className="option-row" key={i}>
          <input
            type="text"
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={e => handleOptionChange(e.target.value, i)}
          />

          <input
            type="radio"
            name="correct"
            checked={correctIndex === i}
            onChange={() => setCorrectIndex(i)}
          />

          {correctIndex === i && (
            <span className="correct-tag">Correct</span>
          )}
        </div>
      ))}

      <button onClick={createQuestion}>Create Question</button>

      <h3>View Results</h3>

      {currentQuestion && (
        <div className="stepper">
          <button
            disabled={questionIndex === questions.length - 1}
            onClick={() => setQuestionIndex(i => i + 1)}
          >
            ◀
          </button>

          <span className="stepper-text">
            {currentQuestion.questionText}
          </span>

          <button
            disabled={questionIndex === 0}
            onClick={() => setQuestionIndex(i => i - 1)}
          >
            ▶
          </button>
        </div>
      )}

      {Object.keys(results).length === 0 && (
        <p className="muted">No responses yet</p>
      )}

      

      {/* ===== SIMPLE BAR GRAPH ===== */}
      
      {Object.keys(results).length > 0 && (
  <div style={{ marginTop: "20px" }}>
    {Object.entries(results).map(function(entry) {
      var option = entry[0]
      var count = entry[1]

      var values = Object.values(results)
      var max = Math.max.apply(null, values)

      var total = 0
      values.forEach(function(v) {
        total += v
      })

      var percentage = total === 0 ? 0 : Math.round((count / total) * 100)

      return (
        <div key={option} style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "14px" }}>{option}</div>

          <div
            style={{
              height: "20px",
              width: (count / max) * 100 + "%",
              background:
                currentQuestion &&
                option === currentQuestion.correctOption
                  ? "#4caf50"
                  : "#ccc",
              transition: "0.3s"
            }}
          ></div>

          <div style={{ fontSize: "12px" }}>
            {count} ({percentage}%)
          </div>
        </div>
      )
    })}
  </div>
)}
    </>
  )
}

/* ===================== STUDENT ===================== */

function Student() {
  const [sessionInput, setSessionInput] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [joined, setJoined] = useState(false)

  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState("")

  /* Load questions for session */
  useEffect(() => {
    if (!sessionId) return

    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, snapshot => {
      const qs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(q => q.sessionId === sessionId)

      setQuestions(qs)
      setQuestionIndex(0)
    })

    return () => unsub()
  }, [sessionId])

  const question = questions[questionIndex]

  

  const submitAnswer = async () => {
    if (!sessionId) return

    await addDoc(collection(db, "responses"), {
      sessionId: sessionId,
      questionId: question.id,
      selectedOption: selected,
      createdAt: Date.now()
    })

    setSelected("")
  }

  /* JOIN SCREEN */
  if (!joined) {
    return (
      <>
        <h2>Enter Code to Join Session</h2>

        <input
          placeholder="Enter session code"
          value={sessionInput}
          onChange={e =>
            setSessionInput(e.target.value.toLowerCase().trim())
          }
        />

        <button
          onClick={() => {
            if (!sessionInput) return
            setSessionId(sessionInput)
            setJoined(true)
          }}
        >
          Join Session
        </button>
      </>
    )
  }

  /* WAITING STATE */
  if (!question) return <p className="muted">Waiting for questions…</p>

  return (
    <>
      <h2>Student View</h2>

      <p>Session: {sessionId}</p>

      {/* LEAVE BUTTON */}
      <button
        onClick={() => {
          setJoined(false)
          setSessionId("")
          setSessionInput("")
          setQuestions([])
          setSelected("")
        }}
      >
        Leave Session
      </button>

      <div className="stepper">
        <button
          disabled={questionIndex === questions.length - 1}
          onClick={() => setQuestionIndex(i => i + 1)}
        >
          ◀
        </button>

        <span className="stepper-text">{question.questionText}</span>

        <button
          disabled={questionIndex === 0}
          onClick={() => setQuestionIndex(i => i - 1)}
        >
          ▶
        </button>
      </div>

      {Array.from(new Set(question.options)).map(opt => (
        <label className="option-row" key={opt}>
          <input
            type="radio"
            name="answer"
            checked={selected === opt}
            onChange={() => setSelected(opt)}
          />
          {opt}
        </label>
      ))}

      <button onClick={submitAnswer} disabled={!selected}>
        Submit Answer
      </button>
    </>
  )
}

/* ===================== APP ===================== */

function App() {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/teacher">Teacher</Link>
        <Link to="/student">Student</Link>
      </nav>

      <div className="page">
        <Routes>
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/student" element={<Student />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
