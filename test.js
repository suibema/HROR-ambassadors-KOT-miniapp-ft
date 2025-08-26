const form = document.getElementById('test-form');
const resultEl = document.getElementById('result');
const errorEl = document.getElementById('error');
const timeDisplay = document.getElementById('time-display');
const DURATION = 15 * 60;
const SUPABASE_URL = 'https://supa.fut.ru';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU0MzM0MDAwLCJleHAiOjE5MTIxMDA0MDB9.GdP0c64JUT_I_81xXg5gbEU7ZtAxiD3jAMlTLvhE1oY';
const MAIN_TABLE = 'Регистрация_база_амб'
const LOG_TABLE = 'КОТ_база_ответов'
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const correctAnswers = { 
  q1: 'a', q2: 'c', q3: 'd', q4: 'b', q5: 'скрипка', q6: 'c', q7: 'c', q8: 'c', q9: 'c', q10: '125', 
  q11: 'ста', q12: '80', q13: 'c', q14: 'd', q15: '0,07', q16: 'никогда', q17: 'a', q18: '2', q19: 'ласка', q20: 'a',
  q21: '25', q22: '75', q23: 'a', q24: 'c', q25: '0,27', q26: 'b', q27: '150', q28: 'c', q29: 'abd', q30: 'a',
  q31: '12546', q32: 'ad', q33: '1,33', q34: 'a', q35: 'дельфин', q36: 'c', q37: '480', q38: 'c', q39: '20', q40: '1/6',
  q41: 'c', q42: '0,1', q43: 'a', q44: '50', q45: '25', q46: '3500', q47: 'be', q48: 'c', q49: '2', q50: '17'};

const questionTypes = {};
['q1', 'q2', 'q3', 'q4', 'q6', 'q7', 'q8', 'q9', 'q13', 'q14', 'q17', 'q20', 'q23', 'q24', 'q26', 'q28', 'q30', 'q34', 'q36', 'q38', 'q41', 'q43', 'q48'].forEach(q => questionTypes[q] = 'dropdown');
['q5', 'q10', 'q11', 'q12', 'q15', 'q16', 'q18', 'q19', 'q21', 'q22', 'q25', 'q27', 'q31', 'q33', 'q35', 'q37', 'q39', 'q40', 'q42', 'q44', 'q45', 'q46', 'q49', 'q50'].forEach(q => questionTypes[q] = 'text');
['q29', 'q32', 'q47'].forEach(q => questionTypes[q] = 'checkbox');

// Redirect if no id
const tg_id = localStorage.getItem('test_tg_id');
if (!tg_id) window.location.href = 'index.html';

// Save form data
function saveForm() {
  const formData = new FormData(form);
  const data = {};
  for (let i = 1; i <= 50; i++) {
    const qName = `q${i}`;
    if (questionTypes[qName] === 'checkbox') {
      data[qName] = Array.from(formData.getAll(qName));
    } else {
      data[qName] = formData.get(qName) || '';
    }
  }
  localStorage.setItem('test_data', JSON.stringify(data));
}

// Restore form data
function restoreForm() {
  const saved = JSON.parse(localStorage.getItem('test_data') || '{}');
  for (let i = 1; i <= 50; i++) {
    const qName = `q${i}`;
    if (questionTypes[qName] === 'checkbox' && Array.isArray(saved[qName])) {
      saved[qName].forEach(value => {
        const checkbox = document.querySelector(`input[name="${qName}"][value="${value}"]`);
        if (checkbox) checkbox.checked = true;
      });
    } else if (['dropdown', 'text'].includes(questionTypes[qName]) && saved[qName]) {
      const input = form.elements[qName];
      if (input) input.value = saved[qName];
    }
  }
}

// Format time as MM:SS
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// Timer logic
function startTimer() {
  if (!localStorage.getItem('start_time')) {
    localStorage.setItem('start_time', Date.now());
  }

  const checkInterval = setInterval(() => {
    const start = parseInt(localStorage.getItem('start_time'));
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = Math.max(0, DURATION - elapsed);
    localStorage.setItem('remaining_time', remaining);
    timeDisplay.textContent = formatTime(remaining);

    if (remaining <= 0) {
      clearInterval(checkInterval);
      timeDisplay.parentElement.style.display = 'none';
      submitForm(true);
    }
  }, 1000);
}

// Calculate score
function calculateScore(data) {
  let score = 0;
  for (let i = 1; i <= 50; i++) {
    const qName = `q${i}`;
    const answer = data[qName];
    const correct = correctAnswers[qName];
    if (questionTypes[qName] === 'checkbox') {
      // Score 1 if all correct options are selected
      if (Array.isArray(answer) && Array.isArray(correct.split('').sort()) && 
          JSON.stringify(answer.sort()) === JSON.stringify(correct.split('').sort())) {
        score++;
      }
    } else if (questionTypes[qName] === 'dropdown') {
      // Score 1 if exact match
      if (answer === correct) score++;
    } else if (questionTypes[qName] === 'text') {
      // Score 1 if case-insensitive match
      if (answer.trim().toLowerCase() === correct.toString().toLowerCase()) score++;
    }
  }
  return score;
}

// Submit form
async function submitForm(auto = false) {
  const formData = new FormData(form);
  const data = {};
  for (let i = 1; i <= 50; i++) {
    const qName = `q${i}`;
    if (questionTypes[qName] === 'checkbox') {
      data[qName] = Array.from(formData.getAll(qName));
    } else {
      data[qName] = formData.get(qName) || '';
    }
  }
  data.tg_id = tg_id;

  const score = calculateScore(data);
  console.log('Submitting', { ...data, score });

  const submitBtn = document.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'ОТПРАВЛЯЕТСЯ...'
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'ЗАВЕРШИТЬ'
  }, 5000);

  try {
    try {
      // 1) Ищем запись по tg-id в основной таблице
      const foundQ = await supabase
        .from(MAIN_TABLE)
        .select('id')          // ← если у тебя pk называется иначе (id), поменяй тут и ниже
        .eq('tg-id', tg_id)
        .maybeSingle();
    
      if (foundQ.error) throw foundQ.error;
      if (!foundQ.data) {
        errorEl.textContent = 'No record found for this tg id.';
        return;
      }
      const recordId = foundQ.data.id;
    
      // 2) Обновляем счёт и дату получения ответа
      const updateQ = await supabase
        .from(MAIN_TABLE)
        .update({
          'Результат КОТ': score,
          'Дата получения ответа на тест': new Date().toISOString()
        })
        .eq('id', recordId)     // если у тебя pk "id", тогда .eq('id', recordId)
        .select()
        .maybeSingle();
    
      if (updateQ.error) throw updateQ.error;
    
      // 3) Собираем объект для лога ответов
      const recordData = {};
      for (let i = 1; i <= 50; i++) {
        const key = `q${i}`;
        const col = `${i} вопрос`; // названия колонок в LOG_TABLE должны совпадать
        const val = data[key];
    
        // если колонка текстовая — превратим чекбоксы в строку
        if (Array.isArray(val)) {
          recordData[col] = val.join('');
          // если в таблице колонка jsonb — лучше сохранить как массив:
          // recordData[col] = val;
        } else {
          recordData[col] = (val ?? '').toString();
        }
      }
      recordData['tg-id'] = tg_id; // проверь точное имя колонки
      recordData['device'] = navigator.userAgent;
      recordData['таймер'] = localStorage.getItem('remaining_time');
      recordData['таймер (прошло при выходе)'] = parseInt(localStorage.getItem('time_elapsed') || '0', 10);
    
      // 4) Вставляем лог
      const insertLogQ = await supabase
        .from(LOG_TABLE)
        .insert(recordData);
    
      if (insertLogQ.error) throw insertLogQ.error;
    
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'Failed to update score. Please try again.';
      return;
    }
    

    localStorage.setItem('test_submitted', 'true');
    localStorage.removeItem('start_time');
    localStorage.removeItem('test_data');

    form.style.display = 'none';
    timeDisplay.parentNode.style.display = 'none';
    // resultEl.textContent = 'Спасибо, твой тест успешно принят!';
    window.location.href = 'bye.html'
    errorEl.textContent = '';
  } catch (err) {
    console.error('Submission error:', err);
    errorEl.textContent = 'Ошибка отправки теста';
  }
}

// Event listeners
form.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
});
form.addEventListener('input', saveForm);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  submitForm();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const start = parseInt(localStorage.getItem('start_time') || '0');
    if (start) {
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      localStorage.setItem('time_elapsed', elapsed);
    }
  }
});

// Initialize
restoreForm();
startTimer();


