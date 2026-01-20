const YORBRAYNQuiz = (() => {
  const STORAGE_PREFIX = "YORBRAYN::";

  function nowISO() {
    return new Date().toISOString();
  }

  function gradeFromPercent(p) {
    if (p >= 85) return "A";
    if (p >= 70) return "B";
    if (p >= 55) return "C";
    if (p >= 40) return "D";
    return "F";
  }

  function safeGet(k) {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PREFIX + k));
    } catch {
      return null;
    }
  }

  function safeSet(k, v) {
    try {
      localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v));
    } catch {}
  }

  function initProportionQuiz(cfg) {
    const questions = [
      {
        q: "If y is directly proportional to x and x doubles, what happens to y?",
        o: ["Halves", "Stays the same", "Doubles", "Becomes zero"],
        a: 2
      },
      {
        q: "Which describes direct proportion?",
        o: ["y decreases as x increases", "y/x is constant", "x·y is constant", "No relationship"],
        a: 1
      },
      {
        q: "If y is inversely proportional to x and x triples, y becomes:",
        o: ["3 times bigger", "Unchanged", "One third", "Zero"],
        a: 2
      },
      {
        q: "6 workers take 10 days. How long for 12 workers?",
        o: ["20 days", "10 days", "8 days", "5 days"],
        a: 3
      }
    ];

    const root = document.getElementById(cfg.quizRootId);
    const submitBtn = document.getElementById(cfg.submitBtnId);
    const resultBox = document.getElementById(cfg.resultBoxId);

    root.innerHTML = "";

    questions.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "qcard";
      div.innerHTML = `
        <div class="qtitle">${i + 1}. ${q.q}</div>
        ${q.o.map((opt, j) => `
          <label class="opt">
            <input type="radio" name="q${i}" value="${j}">
            ${opt}
          </label>
        `).join("")}
      `;
      root.appendChild(div);
    });

    submitBtn.onclick = () => {
      let score = 0;

      questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (sel && Number(sel.value) === q.a) score++;
      });

      const percent = Math.round((score / questions.length) * 100);
      const grade = gradeFromPercent(percent);

      const attempt = { score, total: questions.length, percent, grade, time: nowISO() };

      safeSet("proportion:last", attempt);

      const best = safeGet("proportion:best");
      if (!best || percent > best.percent) {
        safeSet("proportion:best", attempt);
      }

      resultBox.style.display = "block";
      resultBox.innerHTML = `
        <strong>Score:</strong> ${score}/${questions.length}<br>
        <strong>Grade:</strong> ${grade}
      `;
    };
  }

  return { initProportionQuiz };
})();
