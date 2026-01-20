const QuizEngine = (() => {
  const STORE = "YORBRAYN::";

  function save(key, value) {
    localStorage.setItem(STORE + key, JSON.stringify(value));
  }

  function load(key) {
    const v = localStorage.getItem(STORE + key);
    return v ? JSON.parse(v) : null;
  }

  function gradeFromPercent(p) {
    if (p >= 85) return "A";
    if (p >= 70) return "B";
    if (p >= 55) return "C";
    if (p >= 40) return "D";
    return "F";
  }

  function parseQuizzes(text) {
    const blocks = text.split("\n---\n");
    return blocks.map(block => {
      const lines = block.split("\n");
      const quiz = { questions: [] };
      let currentQ = null;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("QUIZNAME:")) quiz.name = line.slice(9).trim();
        else if (line.startsWith("SUBJECT:")) quiz.subject = line.slice(8).trim();
        else if (line.startsWith("YEAR:")) quiz.year = Number(line.slice(5).trim());
        else if (line.startsWith("KEYWORDS:")) quiz.keywords = line.slice(9).split(",").map(s => s.trim());
        else if (line.startsWith("Q:")) {
          currentQ = { text: line.slice(2).trim(), answers: [], correct: null };
          quiz.questions.push(currentQ);
        }
        else if (line.startsWith("A:")) {
          currentQ.answers.push(line.slice(2).trim());
        }
        else if (line.startsWith("CA:")) {
          currentQ.correct = line.slice(3).trim();
          currentQ.answers.push(currentQ.correct);
        }
      }

      quiz.questions.forEach(q => {
        q.correctIndex = q.answers.indexOf(q.correct);
      });

      return quiz;
    });
  }

  async function loadAllQuizzes() {
    const res = await fetch("quizzes.create");
    const text = await res.text();
    return parseQuizzes(text);
  }

  function renderQuizFlow(quiz) {
    const root = document.getElementById("quizRoot");
    const state = { answers: [] };

    // KEYWORDS SCREEN
    root.innerHTML = `
      <div class="card">
        <h2>${quiz.name}</h2>
        <p><strong>Year:</strong> ${quiz.year}</p>
        <p><strong>Keywords:</strong></p>
        <ul>${quiz.keywords.map(k => `<li>${k}</li>`).join("")}</ul>
        <button id="beginBtn" class="btn glossy">Begin Quiz</button>
      </div>
    `;

    document.getElementById("beginBtn").onclick = () => {
      renderQuestions();
    };

    function renderQuestions() {
      root.innerHTML = quiz.questions.map((q, i) => `
        <div class="qcard">
          <div class="qtitle">${i + 1}. ${q.text}</div>
          ${q.answers.map((a, j) => `
            <label class="opt">
              <input type="radio" name="q${i}" value="${j}">
              ${a}
            </label>
          `).join("")}
        </div>
      `).join("") + `
        <button id="submitBtn" class="btn glossy">Submit</button>
      `;

      document.getElementById("submitBtn").onclick = submitQuiz;
    }

    function submitQuiz() {
      let correct = 0;

      quiz.questions.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        state.answers[i] = selected ? Number(selected.value) : null;
        if (state.answers[i] === q.correctIndex) correct++;
      });

      const percent = Math.round((correct / quiz.questions.length) * 100);
      const grade = gradeFromPercent(percent);

      save(quiz.name + ":last", { grade, percent });
      const best = load(quiz.name + ":best");
      if (!best || percent > best.percent) {
        save(quiz.name + ":best", { grade, percent });
      }

      reviewQuiz(correct, percent, grade);
    }

    function reviewQuiz(correct, percent, grade) {
      root.innerHTML = `
        <div class="card">
          <h2>Result</h2>
          <p><strong>Score:</strong> ${correct}/${quiz.questions.length}</p>
          <p><strong>Grade:</strong> ${grade}</p>
        </div>
      ` + quiz.questions.map((q, i) => `
        <div class="qcard">
          <div class="qtitle">${q.text}</div>
          ${q.answers.map((a, j) => {
            let cls = "";
            if (j === q.correctIndex) cls = "correct";
            if (state.answers[i] === j && j !== q.correctIndex) cls = "wrong";
            return `<div class="opt ${cls}">${a}</div>`;
          }).join("")}
        </div>
      `).join("") + `
        <button onclick="location.href='topic-math.html'" class="btn glossy">Finish</button>
      `;
    }
  }

  return { loadAllQuizzes, renderQuizFlow };
})();
