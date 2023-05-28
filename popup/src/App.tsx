import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Client as NotionClient } from "@notionhq/client"

const notionClient = new NotionClient({
  auth: import.meta.env.NOTION_ACCESS_TOKEN,
});

function App() {
  const [count, setCount] = useState(0)
  
  const getDatabase = async () => {
    const dbId = "b7585f4bb96348f88d7c7869fb70f267"
    const response = await notionClient.databases.query({
      database_id: dbId,
    });
    console.log(response);
  }

  useEffect(() => {
    getDatabase()
  }, [])

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
