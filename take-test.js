/* =========================================================
   FIREBASE / FIRESTORE
========================================================= */

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

/* Loaded from Firestore after login */
let currentUser = null;
let testData = null;
let testId = null;


/* =========================================================
   TEST CONFIGURATION
========================================================= */

let TOTAL_QUESTIONS = 0; // set from the test document

// 120 minutes = 7200 seconds
let TEST_DURATION = 120 * 60; // set from the test document


/* =========================================================
   STUDENT INFORMATION
========================================================= */

let studentInfo = {
    name: "",
    email: ""
};

let testStartedAt = null;


/* =========================================================
   QUESTION BANK
=========================================================

IMPORTANT:

Replace these sample questions with your actual
120 questions later.

The correct answer is stored here only for the
evaluation system.

It is NEVER displayed to the student.
========================================================= */

let questions = []; // loaded from Firestore (tests/{id}.questions)


/* =========================================================
   TEST STATE
========================================================= */

let currentQuestion = 0;

let selectedAnswers =
    new Array(TOTAL_QUESTIONS).fill(null);

let visitedQuestions =
    new Array(TOTAL_QUESTIONS).fill(false);

let testSubmitted = false;

let submissionSaved = false;

let timeRemaining = TEST_DURATION;

let timerInterval = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const timerElement =
    document.getElementById("timer");

const timerBox =
    document.querySelector(".timer-box");

const questionText =
    document.getElementById("questionText");

const optionsContainer =
    document.getElementById("optionsContainer");

const currentQuestionNumber =
    document.getElementById("currentQuestionNumber");

const answeredStatus =
    document.getElementById("answeredStatus");

const previousBtn =
    document.getElementById("previousBtn");

const nextBtn =
    document.getElementById("nextBtn");

const questionNavigation =
    document.getElementById("questionNavigation");

const previewBtn =
    document.getElementById("previewBtn");

const previewModal =
    document.getElementById("previewModal");

const closePreview =
    document.getElementById("closePreview");

const backToTest =
    document.getElementById("backToTest");

const previewSubmit =
    document.getElementById("previewSubmit");

const submitTestBtn =
    document.getElementById("submitTestBtn");

const submitModal =
    document.getElementById("submitModal");

const cancelSubmit =
    document.getElementById("cancelSubmit");

const confirmSubmit =
    document.getElementById("confirmSubmit");

const resultPending =
    document.getElementById("resultPending");


/* =========================================================
   STUDENT ENTRY ELEMENTS
========================================================= */

const studentEntry =
    document.getElementById("studentEntry");

const studentEntryForm =
    document.getElementById("studentEntryForm");

const studentNameInput =
    document.getElementById("studentName");

const studentEmailInput =
    document.getElementById("studentEmail");


/* =========================================================
   CREATE QUESTION NAVIGATION
========================================================= */

function createQuestionNavigation() {

    questionNavigation.innerHTML = "";

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "question-number";

        button.textContent =
            i + 1;

        button.dataset.question =
            i;

        button.addEventListener(
            "click",
            function () {

                if (testSubmitted) return;

                currentQuestion = i;

                showQuestion();

            }
        );

        questionNavigation.appendChild(button);
    }
}


/* =========================================================
   SHOW QUESTION
========================================================= */

function showQuestion() {

    if (testSubmitted) return;

    const question =
        questions[currentQuestion];

    // Mark question as visited
    visitedQuestions[currentQuestion] = true;


    /* QUESTION NUMBER */

    currentQuestionNumber.textContent =
        currentQuestion + 1;


    /* QUESTION TEXT */

    questionText.textContent =
        question.question;


    /* ANSWER STATUS */

    if (
        selectedAnswers[currentQuestion] !== null
    ) {

        answeredStatus.textContent =
            "Answered";

        answeredStatus.classList.add(
            "answered"
        );

    } else {

        answeredStatus.textContent =
            "Not Answered";

        answeredStatus.classList.remove(
            "answered"
        );
    }


    /* OPTIONS */

    optionsContainer.innerHTML = "";


    question.options.forEach(
        (option, index) => {

            const optionButton =
                document.createElement("button");

            optionButton.type =
                "button";

            optionButton.className =
                "option";


            /* Previously selected option */

            if (
                selectedAnswers[currentQuestion] ===
                index
            ) {

                optionButton.classList.add(
                    "selected"
                );
            }


            /* LETTER */

            const letter =
                document.createElement("span");

            letter.className =
                "option-letter";

            letter.textContent =
                String.fromCharCode(65 + index);


            /* TEXT */

            const optionText =
                document.createElement("span");

            optionText.className =
                "option-text";

            optionText.textContent =
                option;


            optionButton.appendChild(
                letter
            );

            optionButton.appendChild(
                optionText
            );


            /* SELECT OPTION */

            optionButton.addEventListener(
                "click",
                function () {

                    selectAnswer(index);

                }
            );


            optionsContainer.appendChild(
                optionButton
            );

        }
    );


    /* BUTTON STATE */

    previousBtn.disabled =
        currentQuestion === 0;


    if (
        currentQuestion ===
        TOTAL_QUESTIONS - 1
    ) {

        nextBtn.textContent =
            "Finish →";

    } else {

        nextBtn.textContent =
            "Next →";

    }


    updateNavigation();

}


/* =========================================================
   SELECT ANSWER
========================================================= */

function selectAnswer(optionIndex) {

    if (testSubmitted) return;

    selectedAnswers[currentQuestion] =
        optionIndex;

    showQuestion();

}


/* =========================================================
   UPDATE QUESTION NAVIGATION
========================================================= */

function updateNavigation() {

    const buttons =
        document.querySelectorAll(
            ".question-number"
        );


    buttons.forEach(
        (button, index) => {

            button.classList.remove(
                "current",
                "visited",
                "answered"
            );


            /* Current question */

            if (
                index === currentQuestion
            ) {

                button.classList.add(
                    "current"
                );

            }


            /* Answered */

            if (
                selectedAnswers[index] !== null
            ) {

                button.classList.add(
                    "answered"
                );

            }

            /* Visited but not answered */

            else if (
                visitedQuestions[index]
            ) {

                button.classList.add(
                    "visited"
                );

            }

        }
    );

}


/* =========================================================
   NEXT QUESTION
========================================================= */

nextBtn.addEventListener(
    "click",
    function () {

        if (
            currentQuestion <
            TOTAL_QUESTIONS - 1
        ) {

            currentQuestion++;

            showQuestion();

            scrollQuestionToTop();

        } else {

            openSubmitModal();

        }

    }
);


/* =========================================================
   PREVIOUS QUESTION
========================================================= */

previousBtn.addEventListener(
    "click",
    function () {

        if (currentQuestion > 0) {

            currentQuestion--;

            showQuestion();

            scrollQuestionToTop();

        }

    }
);


/* =========================================================
   SCROLL QUESTION TO TOP
========================================================= */

function scrollQuestionToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   TIMER
========================================================= */

function updateTimer() {

    if (timeRemaining <= 0) {

        timeRemaining = 0;

        updateTimerDisplay();

        autoSubmitTest();

        return;
    }


    timeRemaining--;

    updateTimerDisplay();

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const hours =
        Math.floor(
            timeRemaining / 3600
        );

    const minutes =
        Math.floor(
            (timeRemaining % 3600) / 60
        );

    const seconds =
        timeRemaining % 60;


    let display;


    if (hours > 0) {

        display =
            String(hours).padStart(2, "0")
            + ":"
            + String(minutes).padStart(2, "0")
            + ":"
            + String(seconds).padStart(2, "0");

    } else {

        display =
            String(minutes).padStart(2, "0")
            + ":"
            + String(seconds).padStart(2, "0");

    }


    timerElement.textContent =
        display;


    /* WARNING */

    timerBox.classList.remove(
        "warning",
        "danger"
    );


    if (timeRemaining <= 300) {

        timerBox.classList.add(
            "danger"
        );

    }

    else if (timeRemaining <= 900) {

        timerBox.classList.add(
            "warning"
        );

    }

}


/* =========================================================
   STUDENT ENTRY / START TEST
========================================================= */

if (studentEntryForm) {

    studentEntryForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                studentNameInput.value.trim();

            const email =
                studentEmailInput.value
                    .trim()
                    .toLowerCase();


            if (!name) {

                alert(
                    "Please enter your name."
                );

                studentNameInput.focus();

                return;
            }


            if (!email) {

                alert(
                    "Please enter your email."
                );

                studentEmailInput.focus();

                return;
            }


            studentInfo = {

                name: name,

                email: email

            };


            startTestForStudent();

        }
    );

}


/* =========================================================
   START TEST
========================================================= */

function startTestForStudent() {

    testStartedAt =
        new Date();


    /* Hide entry screen */

    if (studentEntry) {

        studentEntry.classList.remove(
            "show"
        );

    }


    /* Start timer */

    updateTimerDisplay();


    timerInterval =
        setInterval(
            updateTimer,
            1000
        );

}


/* =========================================================
   PREVIEW
========================================================= */

previewBtn.addEventListener(
    "click",
    function () {

        updatePreview();

        previewModal.classList.add(
            "show"
        );

    }
);


/* =========================================================
   UPDATE PREVIEW
========================================================= */

function updatePreview() {

    const answered =
        selectedAnswers.filter(
            answer => answer !== null
        ).length;


    const unanswered =
        TOTAL_QUESTIONS - answered;


    document.getElementById(
        "previewTotal"
    ).textContent =
        TOTAL_QUESTIONS;


    document.getElementById(
        "previewAnswered"
    ).textContent =
        answered;


    document.getElementById(
        "previewUnanswered"
    ).textContent =
        unanswered;

}


/* =========================================================
   CLOSE PREVIEW
========================================================= */

closePreview.addEventListener(
    "click",
    function () {

        previewModal.classList.remove(
            "show"
        );

    }
);


backToTest.addEventListener(
    "click",
    function () {

        previewModal.classList.remove(
            "show"
        );

    }
);


/* =========================================================
   SUBMIT TEST BUTTON
========================================================= */

submitTestBtn.addEventListener(
    "click",
    function () {

        openSubmitModal();

    }
);


/* =========================================================
   PREVIEW SUBMIT
========================================================= */

previewSubmit.addEventListener(
    "click",
    function () {

        previewModal.classList.remove(
            "show"
        );

        openSubmitModal();

    }
);


/* =========================================================
   OPEN SUBMIT MODAL
========================================================= */

function openSubmitModal() {

    const answered =
        selectedAnswers.filter(
            answer => answer !== null
        ).length;


    const unanswered =
        TOTAL_QUESTIONS - answered;


    document.getElementById(
        "confirmAnswered"
    ).textContent =
        answered;


    document.getElementById(
        "confirmUnanswered"
    ).textContent =
        unanswered;


    submitModal.classList.add(
        "show"
    );

}


/* =========================================================
   CANCEL SUBMIT
========================================================= */

cancelSubmit.addEventListener(
    "click",
    function () {

        submitModal.classList.remove(
            "show"
        );

    }
);


/* =========================================================
   CONFIRM SUBMISSION
========================================================= */

confirmSubmit.addEventListener(
    "click",
    function () {

        submitTest();

    }
);


/* =========================================================
   AUTO SUBMIT
========================================================= */

function autoSubmitTest() {

    if (testSubmitted) return;

    submitTest();

}


/* =========================================================
   SUBMIT TEST + FIRESTORE
========================================================= */

async function submitTest() {

    if (
        testSubmitted ||
        submissionSaved
    ) {
        return;
    }


    /* Make sure student started correctly */

    if (
        !studentInfo.name ||
        !studentInfo.email ||
        !testStartedAt
    ) {

        alert(
            "Student details are missing. Please restart the test."
        );

        return;
    }


    testSubmitted = true;


    /* Stop timer */

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    /* =====================================================
       CALCULATE SCORE (against the questions loaded from Firestore)
    ===================================================== */

    const marks = Number(testData.marksPerQuestion) || 1;
    const negative = Number(testData.negativeMarking) || 0;

    let correctAnswers = 0;

    questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correct) {
            correctAnswers++;
        }
    });

    const answered =
        selectedAnswers.filter(answer => answer !== null).length;

    const wrongAnswers = answered - correctAnswers;
    const unanswered = TOTAL_QUESTIONS - answered;

    const score = correctAnswers * marks - wrongAnswers * negative;
    const maxScore = TOTAL_QUESTIONS * marks;

    const percentage =
        Number(Math.max(0, (score / maxScore) * 100).toFixed(2));

    const submittedAt = new Date();

    const timeTakenSeconds =
        Math.max(0, Math.floor((submittedAt - testStartedAt) / 1000));

    /* =====================================================
       ATTEMPT DOCUMENT  ->  attempts/{uid}_{testId}
       One document per student per test = one attempt only.
    ===================================================== */

    const attempt = {
        uid: currentUser.uid,
        testId: testId,
        testName: testData.name || "Test",
        visibility: testData.visibility || "free",

        studentName: studentInfo.name,
        studentEmail: studentInfo.email,

        startedAt: testStartedAt.toISOString(),
        submittedAt: submittedAt.toISOString(),
        timeTakenSeconds: timeTakenSeconds,

        totalQuestions: TOTAL_QUESTIONS,
        answered: answered,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        unanswered: unanswered,

        marksPerQuestion: marks,
        negativeMarking: negative,
        score: score,
        maxScore: maxScore,
        percentage: percentage,

        answers: selectedAnswers,

        createdAt: serverTimestamp()
    };

    try {

        await setDoc(
            doc(db, "attempts", `${currentUser.uid}_${testId}`),
            attempt
        );

        submissionSaved = true;

        window.location.href =
            "result.html?id=" + encodeURIComponent(testId);

    } catch (error) {

        console.error("Firestore submission error:", error);

        /* Let the student try again if saving failed */
        testSubmitted = false;

        if (timeRemaining > 0 && !timerInterval) {
            timerInterval = setInterval(updateTimer, 1000);
        }

        alert(
            "Your test could not be saved. Please check your internet connection and try again.\n\n" +
            "If you have already submitted this test, open it from your dashboard to see your result."
        );
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   PREVENT ACCIDENTAL PAGE EXIT
========================================================= */

window.addEventListener(
    "beforeunload",
    function (event) {

        if (
            !testSubmitted &&
            selectedAnswers.some(
                answer => answer !== null
            )
        ) {

            event.preventDefault();

            event.returnValue = "";

        }

    }
);


/* =========================================================
   INITIALIZE
   login -> already attempted? -> free/premium check -> load test
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    currentUser = user;

    testId = new URLSearchParams(window.location.search).get("id");

    if (!testId) {
        alert("No test selected.");
        window.location.href = "tests.html";
        return;
    }

    try {

        const [testSnap, userSnap, attemptSnap] = await Promise.all([
            getDoc(doc(db, "tests", testId)),
            getDoc(doc(db, "users", user.uid)),
            getDoc(doc(db, "attempts", `${user.uid}_${testId}`))
        ]);

        /* 1. One attempt only: already attempted -> show result paper */
        if (attemptSnap.exists()) {
            window.location.replace(
                "result.html?id=" + encodeURIComponent(testId)
            );
            return;
        }

        /* 2. Test must exist and be published */
        if (!testSnap.exists() || testSnap.data().status !== "published") {
            alert("This test is not available.");
            window.location.href = "tests.html";
            return;
        }

        testData = testSnap.data();

        const userData = userSnap.exists() ? userSnap.data() : {};

        /* 3. Premium tests: premium students only */
        if (testData.visibility === "premium" && userData.premium !== true) {
            alert("This is a premium test. Please upgrade to unlock it.");
            window.location.href = "payment.html";
            return;
        }

        /* 4. Load questions */
        questions = (testData.questions || []).map(item => ({
            question: item.question,
            options: item.options,
            correct: item.correctAnswer
        }));

        if (questions.length === 0) {
            alert("This test has no questions yet.");
            window.location.href = "tests.html";
            return;
        }

        TOTAL_QUESTIONS = questions.length;
        TEST_DURATION = (Number(testData.duration) || 120) * 60;
        timeRemaining = TEST_DURATION;

        selectedAnswers = new Array(TOTAL_QUESTIONS).fill(null);
        visitedQuestions = new Array(TOTAL_QUESTIONS).fill(false);

        /* 5. Student details come from the logged-in account */
        const name = userData.name || user.displayName || "Student";
        const email = userData.email || user.email || "";

        if (studentNameInput) {
            studentNameInput.value = name;
            studentNameInput.readOnly = true;
        }

        if (studentEmailInput) {
            studentEmailInput.value = email;
            studentEmailInput.readOnly = true;
        }

        updateTimerDisplay();
        createQuestionNavigation();
        showQuestion();

    } catch (error) {

        console.error("Unable to load test:", error);

        if (error.code === "permission-denied") {
            alert("This test is not available to your account. Premium tests need a premium account.");
            window.location.href = "tests.html";
            return;
        }

        alert(
            "Could not load this test (" +
            (error.code || error.message) +
            "). Please try again."
        );

        window.location.href = "tests.html";
    }

});