import './WordStyle.css';

export default function Word({ chars, guesses }: { chars: string[], guesses: number[] }) {
  return (
    <div className='char-wrapper'>
      {chars.map((char, i) => (
        <div key={i} data-guess={guesses[i] === 0 ? null : guesses[i]} className='char'>
          {char}
        </div>
      ))}
    </div>
  );
}