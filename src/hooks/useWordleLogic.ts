import { useEffect, useReducer } from 'react';

const ROWS = 6;
const WORD_LENGTH = 5;

const GUESS_EMPTY = 0;
const GUESS_CORRECT = 1;
const GUESS_WRONG_POSITION = 2;
const GUESS_WRONG = 3;

interface WordClass {
  words: string[][];
  guesses: number[][];
  activeRow: number;
  correctWord: string;
  gameState: 'active' | 'won' | 'lost';
}

interface Action {
  type: 'newGame' | 'input' | 'backspace' | 'enter' | 'newWord';
  char?: string;
  newWord?:string;
}

// Initialization function which runs on every new game
const initWordle = () => {
  const correctWord = '' // this is initialized in useEffect

  // We use these 2 arrays to represent words and guesses
  const emptyWordArr = new Array(WORD_LENGTH).fill('');
  const emptyGuessArr = new Array(WORD_LENGTH).fill(GUESS_EMPTY);
  
  // And now we create 2 new arrays which represent words and guesses for each row
  const words = new Array(ROWS).fill([...emptyWordArr]);
  const guesses = new Array(ROWS).fill([...emptyGuessArr]);
  
  // We also return the active row to keep track of which attempt the user is on
  return {words, guesses, correctWord, activeRow: 0, gameState: 'active'} as WordClass;
};

// This function updates the word array based on the active row and the new character
// If newChar is not defined, it removes the last character from the active row
// If newChar is defined, it adds the new character to the first empty position in the active row
const updateWordArr = (wordArr: string[][], activeRow: number, newChar?: string) =>
  wordArr.map((curWord, rowIndex) => {
    if (rowIndex === activeRow) { // Check if the current row is the active row
      const newArr = [...curWord]; // Create a new array to store the updated characters
      if (newChar === undefined) { // If newChar is not defined, remove the last character
        let lastIndex = newArr.length - 1;
        while (lastIndex >= 0 && newArr[lastIndex] === '') {
          lastIndex--;
        }
        newArr[lastIndex] = '';
      } else { // If newChar is defined, add it to the first empty position
        let firstEmptyIndex = newArr.indexOf('');
        if (firstEmptyIndex !== -1) {
          newArr[firstEmptyIndex] = newChar;
        }
      }
      return newArr; // Return the updated character array
    } else {
      return curWord; // Return the original character array for other rows
    }
  });

// Self explanatory, using length & regex to check if char is a letter
const charIsLetter = (char: string) => char.length === 1 && char.match(/[a-z]/i);

// This function checks if the has no empty chars
// and checks if a word exist by useing a dictionary api,
// the api returns an array if the word has a defenition, else it returns an object
const wordIsValid = async (charArr: string[], correctWord:string) =>
  charArr.join('')==correctWord || // sometimes the dictionary api is missing the word that the random word api has
  (charArr[WORD_LENGTH]!='' && // a word is valid only if it has no empty chars
  await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${charArr.join('')}`)
    .then(res => res.json())
      .then(data => Array.isArray(data)))

const removeCharIfExists = (charArr:string[], char:string) => {
  // we loop through the char arr and find the char
  // and when we do, we replace it with an empty char and return true
  // if we dont, we return false
  for(let i = 0; i < charArr.length; i++) {
    if (charArr[i]==char) {
      charArr[i]=''
      return(true)
    }
  }
  return(false)
}
const evalGuess = (guess: string[], correctWord: string): number[] => {
  const guessArr = new Array(WORD_LENGTH).fill(GUESS_EMPTY); // Initialize the guess array with empty values
  let correctWordArr = correctWord.split(''); // Convert the correct word into an array of characters

  // Check for correct guesses and mark them in the guess array
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === correctWord[i]) {
      guessArr[i] = GUESS_CORRECT; // Mark the guess as correct
      correctWordArr[i] = ''; // Remove the found character from the correct word array
    }
  }

  // Check for misplaced or wrong guesses and mark them in the guess array
  for (let i = 0; i < guess.length; i++) {
    if (guessArr[i] === GUESS_CORRECT) {
      continue; // Skip already marked correct guesses
    }

    if (removeCharIfExists(correctWordArr, guess[i])) {
      guessArr[i] = GUESS_WRONG_POSITION; // Mark the guess as misplaced
    } else {
      guessArr[i] = GUESS_WRONG; // Mark the guess as wrong
    }
  }

  return guessArr; // Return the updated guess array
};

// This is the function that handles the logic for the wordle,
// whenever an input is detected (and iti s valid), we run this reducer function
const wordleLogic = (state: WordClass, action: Action) => {
  let newState = {...state}

  if (action.type==='newGame') {
    newState = initWordle()
  }else if (action.type === 'newWord') {
    newState.correctWord=action.newWord as string
  }else if (action.type === 'enter') {
    newState.guesses[newState.activeRow] = evalGuess(newState.words[newState.activeRow], newState.correctWord);
    // if all the guesses are correct
    if (newState.guesses[newState.activeRow]
        .every((guess) => guess===GUESS_CORRECT)) {
      newState.gameState = 'won'
    }else if (newState.activeRow > ROWS) { // if all guesses are wrong
      newState.gameState = 'lost';
    }else { newState.activeRow++ } 

  } else {
    // if input is detected, we add the char to the first empty position
    // if backspace is detected, we remove the last char
    const newChar = action.type === 'input' ? action.char?.toUpperCase() : undefined;
    newState.words = updateWordArr(state.words, state.activeRow, newChar);
  }
  return {...newState};
};

export default function useWordleLogic():[WordClass, () => void] {
  const [state, dispatch] = useReducer(wordleLogic, null, initWordle);
  const newGame = () => dispatch({type: 'newGame'});

  useEffect(() => {
    if (state.gameState!='active') {
      // if the game is lost or won we halt all logic
      // and wait for the player to start a new game
      return;
    }

    if (state.correctWord==='') {
      // This function uses a free random word api to get a random word
      const getRandomWord = async ():Promise<string> => 
      await fetch('https://random-word-api.herokuapp.com/word?length=5&lang=en')
        .then(res => res.json())
          .then(data => data[0].toUpperCase())

      // get random word & dispatch it to the reducer
      getRandomWord().then((newWord) => dispatch({type: 'newWord', newWord}))
    }

    const handleInput = async (e: KeyboardEvent) => {
      const char = e.key;
      let type: null | 'input' | 'backspace' | 'enter' = null;

      // if enter is pressed, we need to check if the correctWord is generated
      // since it is empty at the beginning of the game which is generated using an api call
      // and if it is generated then we also gotta check if its valid using another api call
      if (char === 'Enter' && state.correctWord!='' && await wordIsValid(state.words[state.activeRow], state.correctWord)) {
        type = 'enter';
      } else if (char === 'Backspace') {
        type = 'backspace';
      } else if (charIsLetter(char)) {
        type = 'input';
      }
      if (type === null) return; // this runs on any input that isnt enter, backspace or letter

      dispatch({ type, char });
    };

    document.addEventListener('keyup', handleInput);

    return () => document.removeEventListener('keyup', handleInput);
  }, [state]);

  return [state, newGame];
}