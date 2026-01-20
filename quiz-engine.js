const QuizEngine = (() => {

  function parseQuizzes(text) {
    return text.split("\n---\n").map(block => {
      const quiz = { questions: [], keywords: [] };
      let currentQ = null;

      block.split("\n").forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("QUIZNAME:")) quiz.name = line.slice(9).trim();
        else if (line.startsWith("SUBJECT:")) quiz.subject = line.slice(8).trim();
        else if (line.startsWith("KEY:")) {
          const [term, meaning] = line.slice(4).split("=");
          quiz.keywords.push({ term: term.trim(), meaning: meaning.trim() });
        }
        else if (line.startsWith("Q:")) {
          currentQ = { text: line.slice(2).trim(), answers: [], correct: null };
          quiz.questions.push(currentQ);
        }
        else if (line.startsWith("A:")) currentQ.answers.push(line.slice(2).trim());
        else if (line.startsWith("CA:")) {
          currentQ.correct = line.slice(3).trim();
          currentQ.answers.push(currentQ.correct);
        }
      });

      quiz.questions.forEach(q => q.correctIndex = q.answers.indexOf(q.correct));
      return quiz;
    });
  }

  async function load() {
    const res = await fetch("quizzes.create");
    return parseQuizzes(await res.text());
  }

  function save(key, val) {
    localStorage.setItem("YORBRAYN::" + key, JSON.stringify(val));
  }

  function loadSave(key) {
    const v = localStorage.getItem("YORBRAYN::" + key);
    return v ? JSON.parse(v) : null;
  }

  function grade(p) {
    if (p >= 85) return "A";
    if (p >= 70) return "B";
    if (p >= 55) return "C";
    if (p >= 40) return "D";
    return "F";
  }

  function renderQuiz(quiz) {
    const root = document.getElementById("quizRoot");

    root.innerHTML = `
      <div class="card keywords-box">
        <h3>Key words</h3>
        <ul class="keywords-list">
          ${quiz.keywords.map(k => `<li><b>${k.term}:</b> ${k.meaning}</li>`).join("")}
        </ul>
        <button id="begin" class="btn glossy">Begin Quiz</button>
      </div>
    `;

    document.getElementById("begin").onclick = () => startQuiz(quiz);
  }

  function startQuiz(quiz) {
    const root = document.getElementById("quizRoot");
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
    `).join("") + `<button id="submit" class="btn glossy">Submit</button>`;

    document.getElementById("submit").onclick = () => finishQuiz(quiz);
  }

  function finishQuiz(quiz) {
    const root = document.getElementById("quizRoot");
    let correct = 0;
    const answers = [];

    quiz.questions.forEach((q, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      answers[i] = sel ? Number(sel.value) : null;
      if (answers[i] === q.correctIndex) correct++;
    });

    const percent = Math.round((correct / quiz.questions.length) * 100);
    const g = grade(percent);

    save(quiz.name + ":last", { g, percent });
    const best = loadSave(quiz.name + ":best");
    if (!best || percent > best.percent) save(quiz.name + ":best", { g, percent });

    root.innerHTML = `
      <div class="card">
        <h2>Result</h2>
        <p>Score: ${correct}/${quiz.questions.length}</p>
        <p>Grade: <b>${g}</b></p>
      </div>
    ` + quiz.questions.map((q, i) => `
      <div class="qcard">
        ${q.answers.map((a, j) => {
          let cls = j === q.correctIndex ? "correct" :
                    answers[i] === j ? "wrong" : "";
          return `<div class="opt ${cls}">${a}</div>`;
        }).join("")}
      </div>
    `).join("") + `
      <button onclick="location.href='topic-math.html'" class="btn glossy finish-btn">Finish</button>
    `;
  }

  return { load, renderQuiz };
})();
