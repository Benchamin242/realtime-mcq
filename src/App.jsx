import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from './firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs
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
  const [responsesList, setResponsesList] = useState([])

  // ✅ NEW
  const [participants, setParticipants] = useState([])

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

  // ✅ NEW COUNTS
  const totalParticipants = participants.length
  const totalResponses = responsesList.length

  /* Load responses for selected question */
  useEffect(() => {
    if (!currentQuestion || !sessionId) return

    const unsub = onSnapshot(collection(db, "responses"), snapshot => {
      const counts = {}
      const list = []

      snapshot.docs.forEach(doc => {
        const data = doc.data()

        if (
          data.questionId === currentQuestion.id &&
          data.sessionId === sessionId
        ) {
          counts[data.selectedOption] =
            (counts[data.selectedOption] || 0) + 1

          list.push({
            studentId: data.studentId || "anon",
            selectedOption: data.selectedOption
          })
        }
      })

      setResults(counts)
      setResponsesList(list)
    })

    return () => unsub()
  }, [currentQuestion, sessionId])

  // ✅ NEW PARTICIPANTS LISTENER
  useEffect(() => {
    if (!sessionId) return

    const q = query(
      collection(db, "participants"),
      orderBy("joinedAt")
    )

    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs
        .map(doc => doc.data())
        .filter(p => p.sessionId === sessionId)

      setParticipants(data)
    })

    return () => unsub()
  }, [sessionId])

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
    setResponsesList([])
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
            setResponsesList([])
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

      {/* ✅ NEW RESPONSE COUNT */}
      {sessionId && (
        <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
          Responses: {totalResponses} / {totalParticipants}
        </div>
      )}

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

      {/* ===== BAR GRAPH ===== */}
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

      {/* ===== STUDENT RESPONSES ===== */}
      <h4 style={{ marginTop: "20px" }}>Student Responses</h4>

      {responsesList.length === 0 && (
        <p className="muted">No responses yet</p>
      )}

      {responsesList.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          {responsesList.map((r, i) => (
            <div key={i} style={{ fontSize: "13px" }}>
              {r.studentId} → {r.selectedOption}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Student() {
  const [sessionInput, setSessionInput] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [joined, setJoined] = useState(false)

  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState("")
  const [hasAnswered, setHasAnswered] = useState(false)

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

  /* Reset when question changes */
  useEffect(() => {
    setSelected("")
    setHasAnswered(false)
  }, [questionIndex])

  const submitAnswer = async () => {
    if (!sessionId || !selected) return

    try {
      const existingQuery = query(
        collection(db, "responses"),
        where("questionId", "==", question.id),
        where("studentId", "==", studentId)
      )

      const snapshot = await getDocs(existingQuery)

      if (!snapshot.empty) {
        alert("You already answered this question")
        setHasAnswered(true)
        return
      }

      await addDoc(collection(db, "responses"), {
        sessionId: sessionId,
        questionId: question.id,
        selectedOption: selected,
        studentId: studentId,
        createdAt: Date.now()
      })

      setHasAnswered(true)
      setSelected("")
    } catch (err) {
      console.error(err)
      alert("Error submitting answer")
    }
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

        <br /><br />

        <input
          placeholder="Enter your name or ID"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
        />

        <br /><br />

        <button
          onClick={async () => {
            if (!sessionInput || !studentId.trim()) {
              alert("Enter session code and name")
              return
            }

            try {
              // ✅ NEW: register participant
              await addDoc(collection(db, "participants"), {
                sessionId: sessionInput,
                studentId: studentId,
                joinedAt: Date.now()
              })

              setSessionId(sessionInput)
              setJoined(true)
            } catch (err) {
              console.error(err)
              alert("Error joining session")
            }
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
      <p>User: {studentId}</p>

      <button
        onClick={() => {
          setJoined(false)
          setSessionId("")
          setSessionInput("")
          setStudentId("")
          setQuestions([])
          setSelected("")
          setHasAnswered(false)
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
            disabled={hasAnswered}
            onChange={() => setSelected(opt)}
          />
          {opt}
        </label>
      ))}

      <button onClick={submitAnswer} disabled={!selected || hasAnswered}>
        Submit Answer
      </button>

      {hasAnswered && <p className="muted">Answer submitted</p>}
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
