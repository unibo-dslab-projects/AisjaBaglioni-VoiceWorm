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
    <li><router-link :to="{ hash: '#exname' }">How To Use VoiceWorm</router-link></li>
    <ul>
      <li><router-link :to="{ hash: '#exname' }">Exercise Name</router-link></li>
      <li><router-link :to="{ hash: '#abcinput' }">ABC Input</router-link></li>
      <li><router-link :to="{ hash: '#controls' }">Controls</router-link></li>
      <li><router-link :to="{ hash: '#bpm' }">BPM</router-link></li>
      <li><router-link :to="{ hash: '#steps' }">Steps</router-link></li>
      <li><router-link :to="{ hash: '#transpose' }">Transpose</router-link></li>
      <li><router-link :to="{ hash: '#tags' }">Tags and Visibility</router-link></li>
    </ul>
  </ul>
</nav>


    <div class="tutorial-content section-container">
    <div id="voiceworm" class="section">
      <h2 >What's VoiceWorm?</h2>
      <p>VoiceWorm is a play on words for “Voice Warm (Up)”.
      The application is designed for creating <strong>vocal warm-up exercises</strong>. 
    </p>
    </div>

    <div id="abc-notation" class="section">
      <h2>ABC Notation</h2>
      <p>
        The backbone of VoiceWorm is <strong>ABC Notation. </strong>
        This grammar allows music to be written not as notes on a score, but as a <strong>string of text. </strong>
        As a grammar, abcnotation has well-defined rules.
        Let's take a look at the ones you will use.
    </p>
    <img class="tutorial-image" src="/public/TUTORIAL/header.svg">
    <p>
        This is the structure of an ABC text.
        As you can see, we can divide it into two parts: the <strong>header</strong> and the <strong>body</strong>. <br>
        The header will contain information regarding the general rules of our score. <br>
        The body is where we will write music, separating each bar with the "|" symbol.
        <ul>
          <li><code>X:1</code> → This is the <strong>identification number</strong> of the score. Since we work with only one score at a time, leave it as it is</li>
    <li><code>T: Aisja's</code> → This is the <strong>title</strong></li>
    <li><code>K: C</code> → This is the key (C = Do) and determines the score <strong>alterations</strong></li>
    <li><code>M: 4/4</code> → This is the <strong>time signature</strong>, which means that each bar should last 4/4</li>
    <li><code>L: 1/4</code> → This means that the <strong>default length</strong> of notes will be 1/4, and the default length of rests will be 1/8</li>
    <li><code>|C|</code> → Each <strong>bar</strong> is encapsulated in pipes, so this is one bar containing the note C</li>
  </ul>
    </p>
    </div>
    <div id="note-duration" class="section">
      <h2>Note Duration</h2>
      <p>
The <strong>duration</strong> of the notes, in the absence of the L parameter in the header, is 1/8 (quaver). 
If the L parameter is present, the notes will last exactly as long as L.
<strong>Rests</strong>, on the other hand, are worth half of L.
    </p>
    <img class="tutorial-image" src="/public/TUTORIAL/length.svg">
    <p>
      <ul>
        <li>To <strong>change the value</strong> of a note, multiply it by an integer or fractional value, or divide it by an integer (e.g., <code>C2</code>, <code>C/3</code>)</li>
    <li><strong>Rest symbols</strong> are written as <code>z</code> and are worth half of <code>L</code>. In terms of duration, they behave like notes</li>
      </ul>
    </p>
    </div>

    <div id="accidentals" class="section">
      <h2>Accidentals</h2>
    <p>Accidentals are <strong>alterations</strong> written before the notes inside of the score.</p>
    <img class="tutorial-image" src="/public/TUTORIAL/accidentals.svg">
    <p>
      
      <ul>
    <li><strong>Sharps ♯</strong> are written as <code>^</code> → They raise the note by a semitone</li>
    <li><strong>Double sharps ♯♯</strong> are written as <code>^^</code> → They raise the note by a tone</li>
    <li><strong>Flats ♭</strong> are written as <code>_</code> → They lower the note by a semitone</li>
    <li><strong>Double flats ♭♭</strong> are written as <code>__</code> → They lower the note by a tone</li>
    <li><strong>Naturals ♮</strong> are written as <code>=</code> → They restore the pitch of a previously altered note</li>
      </ul>
    </p>
    </div>


    <div id="octaves" class="section">
      <h2>Octaves</h2>
    <p> In ABC Notation, <strong>octaves</strong> determine the pitch range of the notes. Notes can be written in different octaves using commas and apostrophes.</p>
    <img class="tutorial-image" src="/public/TUTORIAL/octaves.svg">
    <p>
      
      <ul>
    <li><strong>Uppercase and lowercase matter:</strong> <code>C</code> is C4 (middle C), <code>c</code> is C5 (one octave higher)</li>
    <li><strong>Lower octaves:</strong> use commas after the note (<code>C,</code> = one octave below middle C)</li>
    <li><strong>Higher octaves:</strong> use apostrophes after the note (<code>C'</code> = one octave above middle C, <code>C''</code> = two octaves above)</li>
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

    <div id="exname" class="section">
      <h2 >How To Use VoiceWorm</h2>
      <p>Now we will explain step by step how to use the VoiceWorm exercise generator. Open the <strong>Create</strong> page and get started.</p>
      <h2 >Exercise Name</h2>
      <p>
        By writing in the text field, you will be able to choose a <strong>name</strong>> for your exercise.
        I recommend choosing a significant, unique name, to avoid duplicates and confusion later on.
    </p>
     <img class="tutorial-image" src="/public/TUTORIAL/1-ExName.svg">
    </div>

    <div id="abcinput" class="section">
      <h2>ABC Input </h2>
    <p>
    This is where you will enter the notes of your score in <strong>ABC notation</strong>. 
    The text will change after generation! Make sure you have a valid header and that each bar is separated by <code>|</code>.
    The rendered score will appear below.
  </p>
     <img class="tutorial-image" src="/public/TUTORIAL/2-ABC.svg">
    </div>

<div id="controls" class="section">
  <h2>Controls</h2>
    <p>
    Here are the main commands you can use to interact with your score:
  </p>

  <ul class="command-list">
    <li><strong>Enter</strong> → Render the score based on the ABC notation you entered.</li>
    <li><strong>Play</strong> → Play the rendered score.</li>
    <li><strong>Pause / Resume</strong> → Pause or resume playback.</li>
    <li><strong>Save WAV</strong> → Export the score as a WAV audio file.</li>
    <li><strong>Save SVG</strong> → Export the score as an SVG image file.</li>
  </ul>

  <img class="tutorial-image" src="/public/TUTORIAL/3-Commands.svg">

  <p>Once you are satisfied with your settings, you can generate the warm-up:</p>

  <ul class="command-list">
    <li><strong>Generate</strong> → Generates a new score based on your settings.</li>
    <li><strong>Reset</strong> → Resets the score to the default state.</li>
  </ul>

  <img class="tutorial-image" src="/public/TUTORIAL/4-Actions.svg">

</div>

<div id="bpm" class="section">
  <h2>BPM (Beats Per Minute)</h2>
  <p>
    The <strong>BPM</strong>> indicates the playback speed of your score. 
    Make sure to set it <strong>before clicking Play</strong>. 
    You can adjust it in two ways:
  </p>

  <ul class="command-list">
    <li><strong>Slider:</strong> Move the range input to set the desired BPM.</li>
    <li><strong>Input:</strong> Enter a number directly (maximum 300 BPM).</li>
  </ul>

  <img class="tutorial-image" src="/public/TUTORIAL/5-BPM.svg">
</div>

<div id="steps" class="section">
  <h2>Steps</h2>
  <p>
    The warm-up you are creating will move <strong>up</strong> for a certain number of bars, 
    and then <strong>down</strong> for a certain number of bars.
    You can choose how gradual or steep the changes are:
  </p>

  <ul>
    <li><strong>Ascending Steps:</strong> Number of semitones to increase between each iteration during the ascent.</li>
    <li><strong>Descending Steps:</strong> Number of semitones to decrease between each iteration during the descent.</li>
  </ul>
  <img class="tutorial-image" src="/public/TUTORIAL/6-Ascending.svg">
</div>

<div id="transpose" class="section">
  <h2>Transposition Range</h2>
<p>
    The <strong>Starting Note</strong> field represents <strong>the note you want to start singing from.</strong>
    The program will transpose the first note of the score to the note you selected. This ensures the exercise begins in a range suited to your voice.
  </p>

  <ul class="command-list">
    <li><strong>Starting Note:</strong> The note where the warm-up will begin. All subsequent notes will be transposed accordingly.</li>
  </ul>
  <img class="tutorial-image" src="/public/TUTORIAL/7-Starting.svg">
  <p>
    The <strong>Highest Note</strong> field determines <strong>the top note your warm-up will reach.</strong>
    The highest note of your initial score will be transposed step by step until it matches the value of this field. This way, the warm-up completes its first ascending cycle smoothly.
  </p>

  <ul class="command-list">
    <li><strong>Highest Note:</strong> The target note for the end of the ascending phase. Transposition is gradual according to the steps defined in ascending steps.</li>
  </ul>
   <img class="tutorial-image" src="/public/TUTORIAL/8-Highest.svg">

   <p>
    The <strong>Lowest Note</strong> field determines <strong>how low the warm-up will descend.</strong>
    The warm-up starts from the lowest note of the last ascending iteration and gradually moves down to the value selected in this field. This way, the exercise completes its descending cycle smoothly.
  </p>

  <ul class="command-list">
    <li><strong>Lowest Note:</strong> The target note for the end of the descending phase. Transposition occurs step by step according to the steps defined in descending steps.</li>
  </ul>

  <img class="tutorial-image" src="/public/TUTORIAL/9-Lowest.svg">

   <p>
    At the end of your settings, your warm-up will follow this cycle:
  </p>
  <ol class="command-list">
    <li><strong>Starting Note:</strong> The warm-up begins from the note you selected in the <code>Starting Note</code> field. The first note of the score will be transposed to this value.</li>
    <li><strong>Ascending Phase:</strong> The warm-up gradually rises until the highest note in your initial score reaches the <code>Highest Note</code> value, step by step according to the <code>Ascending Steps</code> field.</li>
    <li><strong>Descending Phase:</strong> The warm-up then gradually descends until the lowest note reaches the <code>Lowest Note</code> value, following the <code>Descending Steps</code> field.</li>
  </ol>
</div>

<div id="tags" class="section">
  <h2>Tags and Visibility</h2>
  <p>
    Here you can assign <strong>tags</strong> to your warm-up exercises. Tags help you organize, search, and filter your exercises more easily.  
    You can choose the visibility of your exercise, deciding whether it should be <strong>private</strong> or <strong>public</strong>.
    Finally, you can <strong>save</strong> your exercise, whether private or public.
    </p>
  <img class="tutorial-image" src="/public/TUTORIAL/10-Tags.svg">
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
