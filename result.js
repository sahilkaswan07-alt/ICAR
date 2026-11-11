/* =========================================================
   RESULT PAGE
   result.html?id=<testId>
   Reads attempts/{uid}_{testId} (the student's answers) and
   tests/{testId} (the questions + answer key), recalculates
   the result from Firestore and shows the full paper.
   No ranking.
========================================================= */

import { app } from "./firebase-config.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const loadingScreen = document.getElementById("loadingScreen");
const appEl = document.getElementById("app");

let rows = [];


onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    const testId = new URLSearchParams(window.location.search).get("id");

    if (!testId) {
        window.location.href = "tests.html";
        return;
    }

    try {

        const [attemptSnap, testSnap] = await Promise.all([
            getDoc(doc(db, "attempts", `${user.uid}_${testId}`)),
            getDoc(doc(db, "tests", testId)).catch(() => null)
        ]);

        /* Not attempted yet -> send to the exam */
        if (!attemptSnap.exists()) {
            window.location.replace(
                "take-test.html?id=" + encodeURIComponent(testId)
            );
            return;
        }

        const attempt = attemptSnap.data();
        const test = testSnap && testSnap.exists() ? testSnap.data() : null;

        render(attempt, test);

        loadingScreen.style.display = "none";
        appEl.style.display = "block";

    } catch (error) {

        console.error("Unable to load result:", error);

        loadingScreen.querySelector("p").textContent =
            "Couldn't load your result. Please refresh the page.";
    }
});


function render(attempt, test) {

    document.getElementById("testName").textContent =
        (test && test.name) || attempt.testName || "Result";

    if (attempt.submittedAt) {
        document.getElementById("submittedOn").textContent =
            "Submitted on " +
            new Date(attempt.submittedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
            });
    }

    const answers = attempt.answers || [];
    const marks = Number(attempt.marksPerQuestion) || 1;
    const negative = Number(attempt.negativeMarking) || 0;

    /* Test removed by admin: show the saved summary only */
    if (!test || !Array.isArray(test.questions)) {

        showSummary({
            correct: attempt.correctAnswers || 0,
            wrong: attempt.wrongAnswers || 0,
            skipped: attempt.unanswered || 0,
            total: attempt.totalQuestions || 0,
            score: attempt.score || 0,
            maxScore: attempt.maxScore || 0,
            seconds: attempt.timeTakenSeconds
        });

        const note = document.getElementById("paperNote");
        note.textContent =
            "The question paper for this test is no longer available, so only your saved score is shown.";
        note.style.display = "block";

        document.getElementById("paperSection").style.display = "none";

        return;
    }

    /* Recalculate everything from the answer key in Firestore */
    let correct = 0, wrong = 0, skipped = 0;

    rows = test.questions.map((question, index) => {

        const chosen =
            typeof answers[index] === "number" ? answers[index] : null;

        let status;

        if (chosen === null) {
            status = "skipped";
            skipped++;
        } else if (chosen === question.correctAnswer) {
            status = "correct";
            correct++;
        } else {
            status = "wrong";
            wrong++;
        }

        return { index, question, chosen, status };
    });

    showSummary({
        correct,
        wrong,
        skipped,
        total: test.questions.length,
        score: correct * marks - wrong * negative,
        maxScore: test.questions.length * marks,
        seconds: attempt.timeTakenSeconds
    });

    renderPaper("all");

    document.querySelectorAll("#filters button").forEach(button => {
        button.addEventListener("click", () => {
            document
                .querySelectorAll("#filters button")
                .forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            renderPaper(button.dataset.filter);
        });
    });
}


function showSummary(s) {

    const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(2);

    document.getElementById("scoreValue").textContent = fmt(s.score);
    document.getElementById("maxScore").textContent = fmt(s.maxScore);

    const pct = s.maxScore > 0
        ? Math.max(0, (s.score / s.maxScore) * 100)
        : 0;

    document.getElementById("percentage").textContent =
        pct.toFixed(2) + "%";

    document.getElementById("statCorrect").textContent = s.correct;
    document.getElementById("statWrong").textContent = s.wrong;
    document.getElementById("statSkipped").textContent = s.skipped;
    document.getElementById("statTotal").textContent = s.total;

    if (typeof s.seconds === "number") {
        const h = Math.floor(s.seconds / 3600);
        const m = Math.floor((s.seconds % 3600) / 60);
        const sec = s.seconds % 60;
        document.getElementById("timeTaken").textContent =
            (h > 0 ? h + "h " : "") + m + "m " + sec + "s";
    }
}


function renderPaper(filter) {

    const paper = document.getElementById("paper");
    paper.innerHTML = "";

    const visible = rows.filter(
        row => filter === "all" || row.status === filter
    );

    if (visible.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No questions in this list.";
        paper.appendChild(empty);
        return;
    }

    const badgeText = {
        correct: "Correct",
        wrong: "Wrong",
        skipped: "Not answered"
    };

    visible.forEach(row => {

        const card = document.createElement("div");
        card.className = "q-card";

        const top = document.createElement("div");
        top.className = "q-top";

        const no = document.createElement("span");
        no.className = "q-no";
        no.textContent = "Question " + (row.index + 1);

        const badge = document.createElement("span");
        badge.className = "badge " + row.status;
        badge.textContent = badgeText[row.status];

        top.append(no, badge);

        const text = document.createElement("div");
        text.className = "q-text";
        text.textContent = row.question.question;

        card.append(top, text);

        (row.question.options || []).forEach((optionText, i) => {

            const option = document.createElement("div");
            option.className = "opt";

            const isCorrect = i === row.question.correctAnswer;
            const isChosen = i === row.chosen;

            let tag = "";

            if (isCorrect) {
                option.classList.add("correct");
                tag = isChosen ? "Your answer ✓" : "Correct answer";
            } else if (isChosen) {
                option.classList.add("wrong");
                tag = "Your answer ✗";
            }

            const letter = document.createElement("span");
            letter.className = "letter";
            letter.textContent = String.fromCharCode(65 + i);

            const txt = document.createElement("span");
            txt.className = "txt";
            txt.textContent = optionText;

            option.append(letter, txt);

            if (tag) {
                const tagEl = document.createElement("span");
                tagEl.className = "tag";
                tagEl.textContent = tag;
                option.appendChild(tagEl);
            }

            card.appendChild(option);
        });

        paper.appendChild(card);
    });
}