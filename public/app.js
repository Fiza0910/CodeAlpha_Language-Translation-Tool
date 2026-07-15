const sourceTextEl = document.getElementById('sourceText');
const sourceLangEl = document.getElementById('sourceLang');
const targetLangEl = document.getElementById('targetLang');
const translateButton = document.getElementById('translateButton');
const translatedTextEl = document.getElementById('translatedText');
const copyButton = document.getElementById('copyButton');
const speakButton = document.getElementById('speakButton');
const feedbackEl = document.getElementById('feedback');

let availableVoices = [];

const setFeedback = (text, isError = false) => {
  feedbackEl.textContent = text;
  feedbackEl.style.color = isError ? '#dc2626' : '#334155';
};

const loadVoices = () => {
  availableVoices = window.speechSynthesis.getVoices() || [];
};

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const translateText = async () => {
  const text = sourceTextEl.value.trim();
  const from = sourceLangEl.value;
  const to = targetLangEl.value;

  if (!text) {
    setFeedback('Please enter text to translate.', true);
    return;
  }

  translateButton.disabled = true;
  translateButton.textContent = 'Translating...';
  setFeedback('Translating text...', false);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, from, to })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error || 'Translation failed. Please try again.';
      setFeedback(message, true);
      translatedTextEl.value = '';
    } else {
      translatedTextEl.value = data.translatedText || '';
      setFeedback('Translation complete.');
    }
  } catch (error) {
    setFeedback('Unable to reach translation service.', true);
    translatedTextEl.value = '';
  } finally {
    translateButton.disabled = false;
    translateButton.textContent = 'Translate';
  }
};

const copyTranslation = async () => {
  const translated = translatedTextEl.value;
  if (!translated) {
    setFeedback('Nothing to copy.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(translated);
    setFeedback('Translated text copied to clipboard.');
  } catch (error) {
    setFeedback('Unable to copy text.', true);
  }
};

const speakTranslation = () => {
  const translated = translatedTextEl.value;
  if (!translated) {
    setFeedback('No translated text to speak.', true);
    return;
  }

  if (!window.speechSynthesis) {
    setFeedback('Speech synthesis is not available in this browser.', true);
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(translated);
  utterance.lang = targetLangEl.value;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voiceMatch = availableVoices.find((voice) => {
    return voice.lang.toLowerCase().startsWith(targetLangEl.value.toLowerCase());
  });

  if (voiceMatch) {
    utterance.voice = voiceMatch;
  }

  speakButton.disabled = true;
  speakButton.textContent = 'Speaking...';
  setFeedback('Speaking translation...');

  utterance.onend = () => {
    speakButton.disabled = false;
    speakButton.textContent = 'Speak';
    setFeedback('Speech complete.');
  };

  utterance.onerror = () => {
    speakButton.disabled = false;
    speakButton.textContent = 'Speak';
    setFeedback('Speech playback failed. Please try again.', true);
  };

  window.speechSynthesis.speak(utterance);
};

translateButton.addEventListener('click', translateText);
copyButton.addEventListener('click', copyTranslation);
speakButton.addEventListener('click', speakTranslation);

sourceTextEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    translateText();
  }
});
