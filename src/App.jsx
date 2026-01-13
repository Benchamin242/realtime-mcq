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

/* ===================== TEACHER ===================== */

function Teacher() {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState(0)

  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [results, setResults] = useState({})

  /* Load all questions */
  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, snapshot => {
      const qs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setQuestions(qs)
      setQuestionIndex(0)
    })

    return () => unsub()
  }, [])

  const currentQuestion = questions[questionIndex]

  /* Load responses for selected question */
  useEffect(() => {
    if (!currentQuestion) return

    const unsub = onSnapshot(collection(db, "responses"), snapshot => {
      const counts = {}

      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.questionId === currentQuestion.id) {
          counts[data.selectedOption] =
            (counts[data.selectedOption] || 0) + 1
        }
      })

      setResults(counts)
    })

    return () => unsub()
  }, [currentQuestion])

  const handleOptionChange = (value, index) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const createQuestion = async () => {
    await addDoc(collection(db, "questions"), {
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
          <label>
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
            />
            Correct
          </label>
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

      {Object.entries(results).map(([option, count]) => (
        <p key={option}>
          <strong>{option}</strong>: {count}
        </p>
      ))}
    </>
  )
}

/* ===================== STUDENT ===================== */

function Student() {
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState("")

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, snapshot => {
      const qs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setQuestions(qs)
      setQuestionIndex(0)
    })

    return () => unsub()
  }, [])

  const question = questions[questionIndex]

  const submitAnswer = async () => {
    await addDoc(collection(db, "responses"), {
      questionId: question.id,
      selectedOption: selected,
      createdAt: Date.now()
    })

    setSelected("")
    alert("Answer submitted")
  }

  if (!question) return <p className="muted">Waiting for questions…</p>

  return (
    <>
      <h2>Student View</h2>

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

      {question.options.map(opt => (
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
