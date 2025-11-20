import { DungeonCanvas } from './components/dungeon/DungeonCanvas';
import './App.css';

function App() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      <DungeonCanvas />
    </div>
  );
}

export default App;
