/* =========================================================
   FIREBASE / FIRESTORE
========================================================= */

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);


/* =========================================================
   TEST CONFIGURATION
========================================================= */

const TOTAL_QUESTIONS = 120;

// 120 minutes = 7200 seconds
const TEST_DURATION = 120 * 60;


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

const questions = [

    {
        question: "Which vitamin is primarily associated with prevention of rickets in animals?",
        options: [
            "Vitamin A",
            "Vitamin B12",
            "Vitamin C",
            "Vitamin D"
        ],
        correct: 3
    },

    {
        question: "Which of the following is the normal body temperature range of cattle?",
        options: [
            "35–36°C",
            "38–39.5°C",
            "40–42°C",
            "42–44°C"
        ],
        correct: 1
    },

    {
        question: "Which organ is primarily responsible for filtering blood and producing urine?",
        options: [
            "Liver",
            "Kidney",
            "Spleen",
            "Pancreas"
        ],
        correct: 1
    },

    {
        question: "Which disease is commonly known as foot-and-mouth disease?",
        options: [
            "FMD",
            "BSE",
            "IBR",
            "HS"
        ],
        correct: 0
    }

];


/* =========================================================
   GENERATE REMAINING QUESTIONS
========================================================= */

while (questions.length < TOTAL_QUESTIONS) {

    const number = questions.length + 1;

    questions.push({

        question:
            `Sample ICAR Mock Test Question ${number}. Replace this question with your actual question from the question bank.`,

        options: [
            `Option A for Question ${number}`,
            `Option B for Question ${number}`,
            `Option C for Question ${number}`,
            `Option D for Question ${number}`
        ],

        // Correct answer remains hidden from student
        correct: Math.floor(Math.random() * 4)

    });
}


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
       CALCULATE SCORE
    ===================================================== */

    let correctAnswers = 0;


    questions.forEach(
        (question, index) => {

            if (
                selectedAnswers[index] ===
                question.correct
            ) {

                correctAnswers++;

            }

        }
    );


    const answered =
        selectedAnswers.filter(
            answer => answer !== null
        ).length;


    const wrongAnswers =
        answered - correctAnswers;


    const unanswered =
        TOTAL_QUESTIONS - answered;


    const percentage =
        Number(
            (
                (correctAnswers /
                    TOTAL_QUESTIONS) *
                100
            ).toFixed(2)
        );


    const submittedAt =
        new Date();


    const timeTakenSeconds =
        Math.max(
            0,
            Math.floor(
                (
                    submittedAt -
                    testStartedAt
                ) / 1000
            )
        );


    /* =====================================================
       SUBMISSION OBJECT
    ===================================================== */

    const answerPaper = {

        testId:
            "ICAR-MOCK-TEST",

        testNo:
            "001",

        testName:
            "ICAR Mock Test",

        testType:
            "free",


        /* STUDENT */

        studentName:
            studentInfo.name,

        studentEmail:
            studentInfo.email,


        /* TIME */

        startedAt:
            testStartedAt.toISOString(),

        submittedAt:
            submittedAt.toISOString(),


        /* RESULT */

        totalQuestions:
            TOTAL_QUESTIONS,

        answered:
            answered,

        correctAnswers:
            correctAnswers,

        wrongAnswers:
            wrongAnswers,

        unanswered:
            unanswered,

        score:
            correctAnswers,

        percentage:
            percentage,


        /* TIME TAKEN */

        timeTakenSeconds:
            timeTakenSeconds,


        /* STUDENT ANSWERS */

        answers:
            selectedAnswers,


        /* ADMIN RESULT */

        resultStatus:
            "submitted",

        rank:
            null,


        /* FIRESTORE SERVER TIME */

        createdAt:
            serverTimestamp()

    };


    /* =====================================================
       SAVE TO FIRESTORE
    ===================================================== */

    try {

        const submissionRef =
            await addDoc(
                collection(
                    db,
                    "submissions"
                ),
                answerPaper
            );


        submissionSaved =
            true;


        /* =================================================
           LOCAL BACKUP
        ================================================= */

        localStorage.setItem(

            "studentAnswerPaper",

            JSON.stringify({

                ...answerPaper,

                submissionId:
                    submissionRef.id,

                createdAt:
                    submittedAt.toISOString()

            })

        );


        /* CLOSE MODALS */

        submitModal.classList.remove(
            "show"
        );

        previewModal.classList.remove(
            "show"
        );


        /* DISABLE TEST */

        previousBtn.disabled =
            true;

        nextBtn.disabled =
            true;

        submitTestBtn.disabled =
            true;


        /* SHOW RESULT PENDING */

        resultPending.classList.add(
            "show"
        );


        /* Show student's name if element exists */

        const submittedStudentInfo =
            document.getElementById(
                "submittedStudentInfo"
            );


        if (submittedStudentInfo) {

            submittedStudentInfo.textContent =
                studentInfo.name;

        }


        console.log(
            "Test submission saved:",
            submissionRef.id
        );

    }

    catch (error) {

        console.error(
            "Firestore submission error:",
            error
        );


        /*
           Allow the student to try submission again
           if Firestore failed.
        */

        testSubmitted =
            false;


        alert(
            "Your test could not be saved. Please check your internet connection and try again."
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function goToDashboard() {

    window.location.href =
        "student-dashboard.html";

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
========================================================= */

createQuestionNavigation();

showQuestion();

updateTimerDisplay();