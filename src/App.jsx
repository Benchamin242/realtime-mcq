import { Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from './firebase'


function Teacher() {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState(0)

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
    </>
  )
}


function Student() {
  return <h2>Student page</h2>
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
