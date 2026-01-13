import { Routes, Route, Link } from 'react-router-dom'

function Teacher() {
  return <h2>Teacher page</h2>
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
