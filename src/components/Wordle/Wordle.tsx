import './WordleStyles.css';
import Word from '../Word/Word';
import useWordleLogic from '../../hooks/useWordleLogic';

export default function Wordle() {
  const [wordleState, newGame] = useWordleLogic();

  return (
    <div className='wordle-wrapper'>
      <h1>Wordle</h1>
      <p>Guess the word in {wordleState.words.length} tries</p>
      <div className='word-wrapper'>
        {wordleState.words.map((curWord, i) => (
          <Word key={i} guesses={wordleState.guesses[i]} chars={curWord} />
        ))}
      </div>
      <button className='wordle-new-game' onClick={newGame}>New game</button>
    </div>
  );
}