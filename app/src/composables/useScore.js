
import { ref, computed, nextTick } from 'vue';
import abcjs from "abcjs";
import lodash from 'lodash';
import { Input, Score, Note, Tuplet, Chord } from '@/lib/abcp';
import { KEYS } from '@/lib/keys';

export function useScore() {
    const userText = ref("X:1\nK:C\nT:Aisja\nL:1/4\nM:4/4\n|[ceg]z2cdcd|");
    const renderedText = ref(null);

    const synth = ref(null);
    const isPaused = ref(false);
    const isPlaying = ref(false);
    const bpm = ref(85);
    let timer = null;

    const scrollbarLeft = ref(null);
    const scrollbarTop = ref(null);
    const scrollbarHeight = ref(null);

    const ascendingSteps = ref(1);
    const descendingSteps = ref(1);

    const startingNote = ref(0);
    const startingOctave = ref(4);
    const highestNote = ref(0);
    const highestOctave = ref(5);
    const lowestNote = ref(0);
    const lowestOctave = ref(3);

    const startingSemitones = computed(() => inputToSemitones(startingNote.value, startingOctave.value));
    const highestSemitones = computed(() => inputToSemitones(highestNote.value, highestOctave.value));
    const lowestSemitones = computed(() => inputToSemitones(lowestNote.value, lowestOctave.value));

    const baseHeader = ref("");
    const baseBody = ref("");
    const manualStartOffset = ref(0);
    const manualAscendingOffset = ref(0);
    const manualDescendingOffset = ref(0);
    const manualStep = ref(0);
    const originalBarCount = computed(() => countOriginalBars());

    const debouncedRender = lodash.debounce(renderScore, 250);

    function inputToSemitones(note, octave) {
        return (parseInt(octave)) * 12 + parseInt(note);
    }

    function semitonesToInput(semitones) {
        const octaveNum = Math.floor(semitones / 12);
        const noteIndex = ((semitones % 12) + 12) % 12;
        return { n: noteIndex, o: octaveNum };
    }

    function getSemitoneDifference(note1, note2) {
        if (note1 === null || note2 === null) return null;
        return (note2 - note1);
    }

    function splitAbcHeaderBody(abcString) {
        const lines = abcString.split("\n");
        const header = [];
        const body = [];
        let isBody = false;
        const fieldRegex = /^[A-Za-z]:/;

        for (let line of lines) {
            const trimmedLine = line.trim();
            if (isBody) {
                body.push(line);
            } else {
                const isHeaderLine = fieldRegex.test(trimmedLine) || trimmedLine.startsWith('%') || trimmedLine === '';
                if (isHeaderLine) {
                    header.push(line);
                } else {
                    isBody = true;
                    body.push(line);
                }
            }
        }
        return { header: header.join("\n").trim(), body: body.join("\n").trim() };
    }

    function getSheetKey(header) {
        if (!header) return 'C';
        const match = header.match(/^K:([^\s]+)/m);
        return match ? match[1] : 'C';
    }

    function countOriginalBars() {
        const { body } = splitAbcHeaderBody(baseBody.value);
        if (!body) return 0;
        const bars = body.split("|").filter(b => b.trim() !== "");
        return bars.length;
    }

    function getLastBar() {
        const { body } = splitAbcHeaderBody(userText.value);
        if (!body) return null;
        const bars = body.split("|").map(b => b.trim()).filter(b => b !== "");
        if (bars.length === 0) return null;
        const count = parseInt(originalBarCount.value);
        const lastBars = "|" + bars.slice(-count).join("|") + "|";
        return lastBars;
    }

    function removeLastBar() {
        const { header, body } = splitAbcHeaderBody(userText.value);
        if (!body) return;
        const bars = body.split("|").filter(b => b.trim() !== "");
        if (bars.length <= originalBarCount.value) return;
        const newBars = bars.slice(0, bars.length - 1);
        const newBody = "|" + newBars.map(b => b.trim()).join("|") + "|";
        userText.value = header + "\n" + newBody;
    }

    async function renderScore(elemId = "target") {
        stopSynthAndTimer();

        var options = {
            add_classes: true,
            selectTypes: true,
            staffwidth: 740,
            wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }
        };

        renderedText.value = abcjs.renderAbc(elemId, userText.value, options);

        if (synth.value) {
            synth.value.stop();
        }

        synth.value = new abcjs.synth.CreateSynth();
        const visualObj = renderedText.value[0];

        if (visualObj) {
            await synth.value.init({
                visualObj: visualObj,
                options: { qpm: bpm.value }
            });
        }
    }

    function stopSynthAndTimer() {
        if (synth.value) {
            synth.value.stop();
        }
        if (timer) {
            timer.stop();
            timer = null;
        }
        isPaused.value = false;
        isPlaying.value = false;
        scrollbarLeft.value = null;
        scrollbarTop.value = null;
        scrollbarHeight.value = null;
    }

    function pauseSynthAndTimer() {
        if (synth.value) synth.value.pause();
        if (timer) timer.pause();
    }

    function resumeSynthAndTimer() {
        if (synth.value) synth.value.start();
        if (timer) timer.start();
    }

    function togglePause() {
        if (isPaused.value) {
            resumeSynthAndTimer();
        } else {
            pauseSynthAndTimer();
        }
        isPaused.value = !isPaused.value;
    }

    function startTimingCallbacks(visualObj) {
        timer = new abcjs.TimingCallbacks(visualObj, {
            qpm: bpm.value,
            eventCallback: ev => {
                if (ev && ev.left !== undefined) {
                    nextTick(() => {
                        scrollbarLeft.value = Math.round(ev.left);
                        scrollbarTop.value = Math.round(ev.top);
                        scrollbarHeight.value = Math.round(ev.height);
                    });
                }
            },
            endCallback: () => {
                isPlaying.value = false;
                isPaused.value = false;
            }
        });

        synth.value.prime();
        synth.value.start();
        timer.start(synth.value.audioContext);
    }

    function play() {
        stopSynthAndTimer();
        isPlaying.value = true;
        if (!renderedText.value || !renderedText.value[0]) return;

        if (!synth.value) {
            synth.value = new abcjs.synth.CreateSynth();
        }

        const visualObj = renderedText.value[0];

        if (!synth.value.isInitialized) {
            synth.value.init({
                visualObj,
                options: { qpm: bpm.value }
            }).then(() => {
                synth.value.prime().then(() => {
                    startTimingCallbacks(visualObj);
                });
            });
        } else {
            if (timer) timer.stop();
            startTimingCallbacks(visualObj);
        }
    }

    function transposeAndRender() {
        isPaused.value = false;
        const { header, body } = splitAbcHeaderBody(userText.value);
        const key = getSheetKey(header);

        let input = new Input(body);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);

        let first_note = null;
        let highest_note = -Infinity;
        let lowest_note = Infinity;

        const updateLimits = (tone) => {
            if (first_note === null) first_note = tone;
            highest_note = Math.max(highest_note, tone);
            lowest_note = Math.min(lowest_note, tone);
        };

        for (let bar of score.bars) {
            for (let element of bar.elements) {
                if (element instanceof Note) {
                    updateLimits(element.data.tone);
                } else if (element instanceof Chord) {
                    const tones = element.elements.filter(se => se instanceof Note).map(se => se.data.tone);
                    if (tones.length > 0) {
                        updateLimits(Math.min(...tones));
                    }
                } else if (element instanceof Tuplet) {
                    for (let se of element.elements) {
                        if (se instanceof Note) updateLimits(se.data.tone);
                        else if (se instanceof Chord) {
                            const tones = se.elements.filter(e => e instanceof Note).map(e => e.data.tone);
                            if (tones.length > 0) updateLimits(Math.min(...tones));
                        }
                    }
                }
            }
        }

        if (first_note === null) return;

        const startingInterval = getSemitoneDifference(first_note, startingSemitones.value);
        score.transpose(startingInterval);

        const highestInterval = getSemitoneDifference(highest_note + startingInterval, highestSemitones.value);
        let acc = lodash.cloneDeep(score);
        let current = ascendingSteps.value;

        for (let i = 1; i <= highestInterval; i += ascendingSteps.value) {
            let tmp_score = lodash.cloneDeep(score);
            tmp_score.transpose(current);
            acc.extend(tmp_score);
            current += ascendingSteps.value;
        }

        const lowestInterval = getSemitoneDifference(lowest_note + startingInterval, lowestSemitones.value);
        current = -descendingSteps.value;
        for (let i = highestInterval - 1; i >= lowestInterval; i -= descendingSteps.value) {
            let tmp_score = lodash.cloneDeep(score);
            tmp_score.transpose(i);
            acc.extend(tmp_score);
            current -= descendingSteps.value;
        }

        userText.value = header + "\n" + acc.generate();
        renderScore();
    }

    function defineBase() {
        const { header, body } = splitAbcHeaderBody(userText.value);
        baseHeader.value = header;
        baseBody.value = body;
        renderScore();
    }

    function resetToDefault() {
        userText.value = "X:1\nK:C\nT:Aisja\nL:1/4\nM:4/4\n|[ceg]z2cdcd|";
        manualStep.value = 0;
        manualStartOffset.value = 0;
        manualAscendingOffset.value = 0;
        manualDescendingOffset.value = 0;
        renderScore();
    }

    function resetToLastSaved() {
        userText.value = baseHeader.value + "\n" + baseBody.value;
        manualStep.value = 0;
        manualStartOffset.value = 0;
        manualAscendingOffset.value = 0;
        manualDescendingOffset.value = 0;
    }

    function manualTranspose(direction, type) {
        const actualBody = splitAbcHeaderBody(userText.value).body;
        let key = getSheetKey(baseHeader.value);
        let input = new Input(actualBody);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);

        if (type === 'start') {
            const amount = direction;
            score.transpose(amount, KEYS[key.toUpperCase()]);
            let acc = lodash.cloneDeep(score);
            userText.value = baseHeader.value + "\n" + acc.generate();
        } else {

        }
        renderScore();
    }

    function incStart() {
        manualStartOffset.value++;
        const actualBody = splitAbcHeaderBody(userText.value).body;
        let key = getSheetKey(baseHeader.value);
        let input = new Input(actualBody);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);
        score.transpose(1, KEYS[key.toUpperCase()]);
        let acc = lodash.cloneDeep(score);
        userText.value = baseHeader.value + "\n" + acc.generate();
        renderScore();
    }

    function decStart() {
        manualStartOffset.value--;
        const actualBody = splitAbcHeaderBody(userText.value).body;
        let key = getSheetKey(baseHeader.value);
        let input = new Input(actualBody);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);
        score.transpose(-1, KEYS[key.toUpperCase()]);
        let acc = lodash.cloneDeep(score);
        userText.value = baseHeader.value + "\n" + acc.generate();
        renderScore();
    }

    function incAscending() {
        manualAscendingOffset.value++;
        const actualBody = splitAbcHeaderBody(userText.value).body;
        let key = getSheetKey(baseHeader.value);
        let input = new Input(actualBody);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);
        let acc = lodash.cloneDeep(score);
        let lastbar = new Input(getLastBar());
        let newbar = Score.parse(lastbar, KEYS[key.toUpperCase()]);
        newbar.transpose(1, KEYS[key.toUpperCase()]);
        acc.extend(newbar);
        userText.value = baseHeader.value + "\n" + acc.generate();
        renderScore();
    }

    function decAscending() {
        manualAscendingOffset.value = Math.max(0, manualAscendingOffset.value - 1);
        removeLastBar();
        renderScore();
    }

    function incDescending() {
        manualDescendingOffset.value++;
        const actualBody = splitAbcHeaderBody(userText.value).body;
        let key = getSheetKey(baseHeader.value);
        let input = new Input(actualBody);
        let score = Score.parse(input, KEYS[key.toUpperCase()]);
        let acc = lodash.cloneDeep(score);
        let lastbar = new Input(getLastBar());
        let newbar = Score.parse(lastbar, KEYS[key.toUpperCase()]);
        newbar.transpose(-1, KEYS[key.toUpperCase()]);
        acc.extend(newbar);
        userText.value = baseHeader.value + "\n" + acc.generate();
        renderScore();
    }

    function decDescending() {
        manualDescendingOffset.value = Math.max(0, manualDescendingOffset.value - 1);
        removeLastBar();
        renderScore();
    }

    async function downloadWav() {
        if (!renderedText.value) return;
        const tempSynth = new abcjs.synth.CreateSynth();
        await tempSynth.init({
            visualObj: renderedText.value[0],
            options: { qpm: bpm.value }
        });
        await tempSynth.prime();
        const audioBuffer = tempSynth.getAudioBuffer();

        function bufferToWave(abuffer) {
            const numOfChan = abuffer.numberOfChannels;
            const length = abuffer.length * numOfChan * 2 + 44;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            function writeString(s) { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); }
            const write16 = (data) => { view.setInt16(offset, data, true); offset += 2; };
            const write32 = (data) => { view.setUint32(offset, data, true); offset += 4; };

            writeString('RIFF'); write32(length - 8); writeString('WAVE');
            writeString('fmt '); write32(16); write16(1); write16(numOfChan);
            write32(abuffer.sampleRate); write32(abuffer.sampleRate * numOfChan * 2);
            write16(numOfChan * 2); write16(16);
            writeString('data'); write32(abuffer.length * numOfChan * 2);

            for (let i = 0; i < abuffer.length; i++)
                for (let channel = 0; channel < numOfChan; channel++) {
                    let sample = abuffer.getChannelData(channel)[i];
                    sample = Math.max(-1, Math.min(1, sample));
                    write16(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
                }
            return new Blob([buffer], { type: 'audio/wav' });
        }

        const wavBlob = bufferToWave(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exercise.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadSvg(elemSelector = "#target svg") {
        if (typeof elemSelector !== 'string') {
            elemSelector = "#target svg";
        }
        const svgElement = document.querySelector(elemSelector);
        if (!svgElement) return;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spartito.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function finishManualStep() {
        manualStep.value = 0;
        manualStartOffset.value = 0;
        manualAscendingOffset.value = 0;
        manualDescendingOffset.value = 0;
        defineBase();
    }

    return {
        userText,
        renderedText,
        synth,
        isPaused,
        isPlaying,
        bpm,
        scrollbarLeft,
        scrollbarTop,
        scrollbarHeight,
        ascendingSteps,
        descendingSteps,
        startingNote,
        startingOctave,
        highestNote,
        highestOctave,
        lowestNote,
        lowestOctave,
        startingSemitones,
        highestSemitones,
        lowestSemitones,
        manualStep,
        manualStartOffset,
        manualAscendingOffset,
        manualDescendingOffset,
        renderScore,
        play,
        togglePause,
        stopSynthAndTimer,
        transposeAndRender,
        resetToDefault,
        resetToLastSaved,
        defineBase,
        downloadWav,
        downloadSvg,
        inputToSemitones,
        semitonesToInput,
        incStart,
        decStart,
        incAscending,
        decAscending,
        incDescending,
        decDescending,
        finishManualStep,
        debouncedRender
    };
}
