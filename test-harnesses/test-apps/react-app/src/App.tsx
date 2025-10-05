import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>React Test App</h1>
      <p>This is a test application for framework detection.</p>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <div>
        <p>Framework: React 18</p>
        <p>Build tool: Vite</p>
      </div>
    </div>
  )
}

export default App
