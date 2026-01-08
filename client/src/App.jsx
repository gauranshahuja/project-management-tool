// client/src/App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    axios.get('http://localhost:5000/api/test')
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage('Error: ' + err.message));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Project Management Tool</h1>
      <p className="mt-2">Backend says: {message}</p>
    </div>
  );
}

export default App;
