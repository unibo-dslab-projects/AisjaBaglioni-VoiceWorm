<script setup>
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

</script>

<template>
<Header/>
<div class="page">
    <div class="page-title">
      <h1> Tutorial </h1>
      <div class="title-underline"></div>
    </div>
<div class="tutorial-layout">

<nav class="tutorial-index">
  <h2>Index</h2>
  <ul>
    <li><router-link :to="{ hash: '#voiceworm' }">What's VoiceWorm?</router-link></li>
    <li>
      <router-link :to="{ hash: '#abc-notation' }">ABC Notation</router-link>
      <ul>
        <li><router-link :to="{ hash: '#note-duration' }">Note Duration</router-link></li>
        <li><router-link :to="{ hash: '#accidentals' }">Accidentals</router-link></li>
        <li><router-link :to="{ hash: '#octaves' }">Octaves</router-link></li>
        <li><router-link :to="{ hash: '#tuplets-legatos-chords' }">Tuplets, Legatos, Chords</router-link></li>
        <li><router-link :to="{ hash: '#example' }">Example</router-link></li>
      </ul>
    </li>
  </ul>
</nav>


    <div class="tutorial-content section-container">
    <div id="voiceworm" class="section">
      <h2 >What's VoiceWorm?</h2>
      <p>VoiceWorm is a play on words for “Voice Warm (Up)”.
      The application is designed for creating vocal warm-up exercises. 
    </p>
    </div>

    <div id="abc-notation" class="section">
      <h2>ABC Notation</h2>
      <p>
        The backbone of VoiceWorm is ABC Notation. 
        This grammar allows music to be written not as notes on a score, but as a string of text. 
        As a grammar, abcnotation has well-defined rules.
        Let's take a look at the ones you will use.
    </p>
    <img class="tutorial-image" src="/public/TUTORIAL/header.svg">
    <p>
        This is the structure of an ABC text.
        As you can see, we can divide it into two parts: the header and the body.
        The header will contain information regarding the general rules of our score.
        The body is where we will write music, separating each bar with the "|" symbol.
        <ul>
          <li><code>X:1</code> → This is the identification number of the score. Since we work with only one score at a time, leave it as it is</li>
    <li><code>T: Aisja's</code> → This is the title</li>
    <li><code>K: C</code> → This is the key (C = Do) and determines the score alterations</li>
    <li><code>M: 4/4</code> → This is the time signature, which means that each bar should last 4/4</li>
    <li><code>L: 1/4</code> → This means that the default length of notes will be 1/4, and the default length of rests will be 1/8</li>
    <li><code>|C|</code> → Each bar is encapsulated in pipes, so this is one bar containing the note C</li>
  </ul>
    </p>
    </div>
    <div id="note-duration" class="section">
      <h2>Note Duration</h2>
      <p>
The duration of the notes, in the absence of the L parameter in the header, is 1/8 (quaver). 
If the L parameter is present, the notes will last exactly as long as L.
Rests, on the other hand, are worth half of L.
    </p>
    <img class="tutorial-image" src="/public/TUTORIAL/length.svg">
    <p>
      <ul>
        <li>To change the value of a note, multiply it by an integer or fractional value, or divide it by an integer (e.g., <code>C2</code>, <code>C/3</code>)</li>
    <li>Rest symbols are written as <code>z</code> and are worth half of <code>L</code>. They can also be multiplied or divided like notes</li>
      </ul>
    </p>
    </div>

    <div id="accidentals" class="section">
      <h2>Accidentals</h2>
    <p>Accidentals are alterations written before the notes inside of the score.</p>
    <img class="tutorial-image" src="/public/TUTORIAL/accidentals.svg">
    <p>
      
      <ul>
        <li>Sharps ♯ are written as <code>^</code> → They raise the note by a semitone</li>
    <li>Double sharps ♯♯ are written as <code>^^</code> → They raise the note by a tone</li>
    <li>Flats ♭ are written as <code>_</code> → They lower the note by a semitone</li>
    <li>Double flats ♭♭ are written as <code>__</code> → They lower the note by a tone</li>
    <li>Naturals ♮ are written as <code>=</code> → They restore the pitch of a previously altered note</li>
      </ul>
    </p>
    </div>


    <div id="octaves" class="section">
      <h2>Octaves</h2>
    <p> In ABC Notation, octaves determine the pitch range of the notes. Notes can be written in different octaves using commas and apostrophes.</p>
    <img class="tutorial-image" src="/public/TUTORIAL/octaves.svg">
    <p>
      
      <ul>
      <li>Uppercase and lowercase matter: <code>C</code> is C4 (middle C), <code>c</code> is C5 (one octave higher)</li>
    <li>Lower octaves: use commas after the note (<code>C,</code> = one octave below middle C)</li>
    <li>Higher octaves: use apostrophes after the note (<code>C'</code> = one octave above middle C, <code>C''</code> = two octaves above)</li>
      </ul>
    </p>
    </div>

    <div id="tuplets-legatos-chords" class="section">
      <h2>Tuplets, Legatos, Chords</h2>
    <img class="tutorial-image" src="/public/TUTORIAL/tupletschords.svg">
    <p>
      
      <ul>
    <li><strong>Chords:</strong> Multiple notes played at the same time. Enclosed in square brackets: <code>[CEG]</code> plays C, E, and G simultaneously.</li>
     <li><strong>Legatos (Slurs):</strong> Notes that should be played smoothly and connected. Indicated with parentheses around the notes: <code>(CDE)</code>.</li>
     <li><strong>Tuplets:</strong> Groups of notes that fit into a different rhythm than normal. For example, a triplet of three notes played in the time of two. Written with parentheses and a number: <code>(3CDE</code> for a triplet.</li>
      </ul>
    </p>
    </div>

<div id="example" class="section">
    <h2>Example</h2>
    <p>Below is an example of a two-bars score in A, with a default note length of 1/8. </p>
    <img class="tutorial-image" src="/public/TUTORIAL/example.svg">
    </div>
    </div>

    </div>
</div>
<Footer/>
</template>

<style scoped>
.section {
  padding: 20px;
  max-width: 900px;
}


strong {
  color: var(--text-color);
}

.section h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 12px;
}

.section p {
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 12px;
}

.section-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: left;
  width: 100%;
  gap: 20px;
}

.section ul {
  list-style:square;
  padding-left: 1.5em; 
}

.section ul li {
  position: relative;
  margin-bottom: 10px;
  padding-left: 20px; 
  font-size: 1rem;
}

.tutorial-image {
  margin-top: 30px;
  margin-bottom: 30px;
  border: 1px solid var(--accent-color);
}

.tutorial-layout {
  display: flex;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.tutorial-index {
  flex: 0 0 250px;
  position: sticky;
  top: 120px;
  height: fit-content;
  border: 1px solid var(--accent-color);
  border-radius: 10px;
  padding: 20px;
  background-color: var(--bg-color);
}

.tutorial-index h2 {
  font-size: 1.5rem;
  color: var(--accent-color);
  margin-bottom: 12px;
}

.tutorial-index ul {
  list-style: decimal;
  padding-left: 1.5em;
}

.tutorial-index ul ul {
  list-style: lower-alpha;
}

.tutorial-index a {
  text-decoration: none;
  color: var(--text-color);
  transition: 0.2s;
}

.tutorial-index a:hover {
  color: var(--accent-color);
  text-decoration: underline;
}

.tutorial-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}


</style>
