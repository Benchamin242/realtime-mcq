import { Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { db } from './firebase'
import { useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore'



function Teacher() {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [results, setResults] = useState({})


  const handleOptionChange = (value, index) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  useEffect(() => {
  const unsub = onSnapshot(collection(db, "responses"), snapshot => {
    const counts = {}

    snapshot.docs.forEach(doc => {
      const opt = doc.data().selectedOption
      counts[opt] = (counts[opt] || 0) + 1
    })

    setResults(counts)
  })

  return () => unsub()
}, [])

  const createQuestion = async () => {
    await addDoc(collection(db, "questions"), {
      questionText: question,
      options: options.filter(o => o !== ""),
      correctOption: options[correctIndex],
      createdAt: Date.now()
    })

    alert("Question created")


  }

  return (
    <>
      <h2>Teacher page</h2>

      <input
        placeholder="Question"
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />

      {options.map((opt, i) => (
        <div key={i}>
          <input
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={e => handleOptionChange(e.target.value, i)}
          />
          <input
            type="radio"
            name="correct"
            checked={correctIndex === i}
            onChange={() => setCorrectIndex(i)}
          /> Correct
        </div>
      ))}

      <button onClick={createQuestion}>Create Question</button>
      <h3>Live Results</h3>

      {Object.keys(results).length === 0 && <p>No responses yet</p>}

      {Object.entries(results).map(([option, count]) => (
        <p key={option}>
          {option}: {count}
        </p>
      ))}

    </>
  )
}


function Student() {
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState("")

  useEffect(() => {
    const q = query(
      collection(db, "questions"),
      orderBy("createdAt", "desc"),
      limit(1)
    )

    const unsub = onSnapshot(q, snapshot => {
      if (!snapshot.empty) {
        setQuestion(snapshot.docs[0].data())
      }
    })

    return () => unsub()
  }, [])

  const submitAnswer = async () => {
    await addDoc(collection(db, "responses"), {
      selectedOption: selected,
      createdAt: Date.now()
    })

    alert("Answer submitted")
  }

  if (!question) return <p>Waiting for question...</p>

  return (
    <>
      <h2>Student page</h2>
      <p>{question.questionText}</p>

      {question.options.map(opt => (
        <div key={opt}>
          <input
            type="radio"
            name="answer"
            value={opt}
            checked={selected === opt}
            onChange={() => setSelected(opt)}
          />
          {opt}
        </div>
      ))}

      <button onClick={submitAnswer} disabled={!selected}>
        Submit
      </button>
    </>
  )
}


function App() {
  return (
    <>
      <nav>
        <Link to="/teacher">Teacher</Link> |{' '}
        <Link to="/student">Student</Link>
      </nav>

      <Routes>
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<Student />} />
      </Routes>
    </>
  )
}

export default App
