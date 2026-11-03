/* =========================================================
   FIREBASE SETUP
   (Requires this file to be loaded as a module:
    <script type="module" src="create-test.js"></script>)
========================================================= */

import { app } from "./firebase-config.js";

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const db = getFirestore(app);


/* =========================================================
   CONFIGURATION
========================================================= */

const TOTAL_QUESTIONS = 120;

const TESTS_COLLECTION = "tests";

const testsCollectionRef = collection(db, TESTS_COLLECTION);


/* =========================================================
   STATE
========================================================= */

let tests = [];

let currentTestId = null;

let currentQuestionIndex = 0;

let selectedCorrectAnswer = null;


/* =========================================================
   LOAD TESTS FROM FIREBASE
========================================================= */

async function loadTests() {

    try {

        const snapshot =
            await getDocs(
                testsCollectionRef
            );

        tests =
            snapshot.docs.map(
                docSnapshot =>
                    docSnapshot.data()
            );

    } catch (error) {

        console.error(
            "Unable to load tests",
            error
        );

        tests = [];

    }

}


/* =========================================================
   SAVE ALL TESTS
   (writes every test in memory to its own document,
    keyed by test.id, in the "tests" collection)
========================================================= */

async function saveTests() {

    try {

        await Promise.all(
            tests.map(test =>
                setDoc(
                    doc(
                        db,
                        TESTS_COLLECTION,
                        test.id
                    ),
                    test
                )
            )
        );

    } catch (error) {

        console.error(
            "Unable to save tests",
            error
        );

        showMessage(
            "Failed to save to the server. Check your connection."
        );

    }

}


/* =========================================================
   DOM
========================================================= */

const testListPage =
    document.getElementById(
        "testListPage"
    );

const testEditorPage =
    document.getElementById(
        "testEditorPage"
    );

const testsGrid =
    document.getElementById(
        "testsGrid"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const testName =
    document.getElementById(
        "testName"
    );

const testCode =
    document.getElementById(
        "testCode"
    );

const marksPerQuestion =
    document.getElementById(
        "marksPerQuestion"
    );

const negativeMarking =
    document.getElementById(
        "negativeMarking"
    );

const instructions =
    document.getElementById(
        "instructions"
    );

const questionText =
    document.getElementById(
        "questionText"
    );

const questionNumber =
    document.getElementById(
        "questionNumber"
    );

const questionGrid =
    document.getElementById(
        "questionGrid"
    );

const questionProgress =
    document.getElementById(
        "questionProgress"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const editorTestName =
    document.getElementById(
        "editorTestName"
    );

const editorStatus =
    document.getElementById(
        "editorStatus"
    );

const publishModal =
    document.getElementById(
        "publishModal"
    );


/* =========================================================
   INITIALIZE
========================================================= */

(async function initializeTestList() {

    await loadTests();

    renderTestList();

})();


/* =========================================================
   CREATE EMPTY QUESTION
========================================================= */

function createEmptyQuestion(number) {

    return {

        number: number,

        question: "",

        options: [
            "",
            "",
            "",
            ""
        ],

        correctAnswer: null,

        saved: false

    };

}


/* =========================================================
   CREATE NEW TEST
========================================================= */

function createNewTest() {

    const test = {

        id:
            "TEST-" +
            Date.now(),

        name:
            "New Test",

        code:
            "",

        duration:
            120,

        totalQuestions:
            120,

        marksPerQuestion:
            1,

        negativeMarking:
            0,

        instructions:
            "",

        visibility:
            "free",

        status:
            "draft",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        publishedAt:
            null,

        questions:
            Array.from(
                {
                    length:
                        TOTAL_QUESTIONS
                },
                (_, index) =>
                    createEmptyQuestion(
                        index + 1
                    )
            )

    };


    tests.push(test);

    saveTests();

    openTestEditor(test.id);

}


/* =========================================================
   BUTTONS
========================================================= */

document
    .getElementById(
        "createNewTest"
    )
    .addEventListener(
        "click",
        createNewTest
    );


document
    .getElementById(
        "emptyCreateBtn"
    )
    .addEventListener(
        "click",
        createNewTest
    );


document
    .getElementById(
        "newTestTop"
    )
    .addEventListener(
        "click",
        createNewTest
    );


/* =========================================================
   RENDER TEST LIST
========================================================= */

function renderTestList() {

    testsGrid.innerHTML = "";

    if (tests.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    tests.forEach(test => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "test-card";


        const savedCount =
            test.questions.filter(
                question =>
                    question.saved
            ).length;


        card.innerHTML = `

            <div class="test-card-top">

                <div>

                    <h2>
                        ${escapeHTML(test.name)}
                    </h2>

                    <div class="test-code">
                        ${escapeHTML(test.code || "No test code")}
                    </div>

                </div>

                <span class="status ${test.status}">
                    ${test.status === "published"
                        ? "Published"
                        : "Draft"}
                </span>

                <span class="visibility-tag ${test.visibility || "free"}">
                    ${(test.visibility || "free") === "premium"
                        ? "Premium"
                        : "Free"}
                </span>

            </div>


            <div class="test-card-info">

                <div>
                    <span>Questions</span>
                    <strong>
                        ${savedCount}/120
                    </strong>
                </div>

                <div>
                    <span>Duration</span>
                    <strong>
                        120 Minutes
                    </strong>
                </div>

                <div>
                    <span>Marks</span>
                    <strong>
                        ${test.marksPerQuestion}
                    </strong>
                </div>

                <div>
                    <span>Negative</span>
                    <strong>
                        ${test.negativeMarking === 0
                            ? "None"
                            : "-" + test.negativeMarking}
                    </strong>
                </div>

            </div>


            <div class="test-card-actions">

                <button
                    class="edit-test"
                    data-id="${test.id}">
                    ${test.status === "published"
                        ? "Edit"
                        : "Continue Editing"}
                </button>

                ${
                    test.status === "published"
                    ? `
                        <button
                            class="view-test"
                            data-id="${test.id}">
                            View
                        </button>
                    `
                    : ""
                }

                <button
                    class="delete-test"
                    data-id="${test.id}">
                    Delete
                </button>

            </div>

        `;


        testsGrid.appendChild(card);

    });


    /* EDIT */

    document
        .querySelectorAll(".edit-test")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    openTestEditor(
                        this.dataset.id
                    );

                }
            );

        });


    /* DELETE */

    document
        .querySelectorAll(".delete-test")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    deleteTest(
                        this.dataset.id
                    );

                }
            );

        });


    /* VIEW */

    document
        .querySelectorAll(".view-test")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    alert(
                        "Student test page can be connected here later."
                    );

                }
            );

        });

}


/* =========================================================
   OPEN TEST
========================================================= */

function openTestEditor(testId) {

    const test =
        tests.find(
            item =>
                item.id === testId
        );


    if (!test) return;


    currentTestId =
        testId;

    currentQuestionIndex =
        0;


    testListPage.classList.add(
        "hidden"
    );

    testEditorPage.classList.remove(
        "hidden"
    );


    loadTestInformation(test);

    createQuestionGrid();

    loadQuestion();

}


/* =========================================================
   LOAD TEST INFORMATION
========================================================= */

function loadTestInformation(test) {

    testName.value =
        test.name;

    testCode.value =
        test.code;

    marksPerQuestion.value =
        test.marksPerQuestion;

    negativeMarking.value =
        test.negativeMarking;

    instructions.value =
        test.instructions;


    editorTestName.textContent =
        test.name;


    updateStatus();

}


/* =========================================================
   GET CURRENT TEST
========================================================= */

function getCurrentTest() {

    return tests.find(
        test =>
            test.id === currentTestId
    );

}


/* =========================================================
   SAVE TEST INFORMATION
========================================================= */

function saveTestInformation() {

    const test =
        getCurrentTest();


    if (!test) return;


    test.name =
        testName.value.trim()
        || "Untitled Test";


    test.code =
        testCode.value.trim();


    test.marksPerQuestion =
        Number(
            marksPerQuestion.value
        ) || 1;


    test.negativeMarking =
        Number(
            negativeMarking.value
        ) || 0;


    test.instructions =
        instructions.value.trim();


    test.updatedAt =
        new Date().toISOString();


    editorTestName.textContent =
        test.name;


    saveTests();

}


/* =========================================================
   QUESTION GRID
========================================================= */

function createQuestionGrid() {

    questionGrid.innerHTML = "";


    for (
        let i = 0;
        i < TOTAL_QUESTIONS;
        i++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            i + 1;


        button.dataset.index =
            i;


        button.addEventListener(
            "click",
            function () {

                saveCurrentQuestion(false);

                currentQuestionIndex =
                    Number(
                        this.dataset.index
                    );

                loadQuestion();

            }
        );


        questionGrid.appendChild(
            button
        );

    }


    updateQuestionGrid();

}


/* =========================================================
   LOAD QUESTION
========================================================= */

function loadQuestion() {

    const test =
        getCurrentTest();


    if (!test) return;


    const question =
        test.questions[
            currentQuestionIndex
        ];


    questionNumber.textContent =
        currentQuestionIndex + 1;


    questionText.value =
        question.question;


    for (let i = 0; i < 4; i++) {

        document.getElementById(
            `option${i}`
        ).value =
            question.options[i];

    }


    selectedCorrectAnswer =
        question.correctAnswer;


    updateCorrectButtons();

    updateQuestionGrid();

    updateProgress();


    document
        .getElementById(
            "previousQuestion"
        )
        .disabled =
            currentQuestionIndex === 0;


    document
        .getElementById(
            "nextQuestion"
        )
        .textContent =
            currentQuestionIndex ===
            TOTAL_QUESTIONS - 1
                ? "Finish"
                : "Next →";

}


/* =========================================================
   SAVE CURRENT QUESTION
========================================================= */

function saveCurrentQuestion(
    showMessage = true
) {

    const test =
        getCurrentTest();


    if (!test) return;


    const question =
        test.questions[
            currentQuestionIndex
        ];


    question.question =
        questionText.value.trim();


    for (let i = 0; i < 4; i++) {

        question.options[i] =
            document.getElementById(
                `option${i}`
            ).value.trim();

    }


    question.correctAnswer =
        selectedCorrectAnswer;


    /*
       A question is considered saved only
       when question + all four options +
       correct answer are completed.
    */

    question.saved =
        question.question !== "" &&
        question.options.every(
            option =>
                option !== ""
        ) &&
        question.correctAnswer !== null;


    test.updatedAt =
        new Date().toISOString();


    saveTestInformation();

    saveTests();

    updateQuestionGrid();

    updateProgress();


    if (showMessage) {

        showMessage(
            question.saved
                ? "Question saved successfully."
                : "Question is incomplete."
        );

    }

}


/* =========================================================
   SAVE QUESTION BUTTON
========================================================= */

document
    .getElementById(
        "saveQuestion"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(true);

        }
    );


/* =========================================================
   MARK CORRECT ANSWER
========================================================= */

document
    .querySelectorAll(".correct-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                selectedCorrectAnswer =
                    Number(
                        this.dataset.option
                    );


                updateCorrectButtons();

            }
        );

    });


/* =========================================================
   CORRECT BUTTON DISPLAY
========================================================= */

function updateCorrectButtons() {

    document
        .querySelectorAll(
            ".correct-btn"
        )
        .forEach(button => {

            const option =
                Number(
                    button.dataset.option
                );


            const row =
                button.closest(
                    ".option-row"
                );


            row.classList.remove(
                "correct"
            );


            button.textContent =
                "Mark Correct";


            if (
                selectedCorrectAnswer ===
                option
            ) {

                row.classList.add(
                    "correct"
                );

                button.textContent =
                    "✓ Correct";

            }

        });

}


/* =========================================================
   NEXT
========================================================= */

document
    .getElementById(
        "nextQuestion"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(false);


            if (
                currentQuestionIndex <
                TOTAL_QUESTIONS - 1
            ) {

                currentQuestionIndex++;

                loadQuestion();

            } else {

                showMessage(
                    "You are on Question 120."
                );

            }

        }
    );


/* =========================================================
   PREVIOUS
========================================================= */

document
    .getElementById(
        "previousQuestion"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(false);


            if (
                currentQuestionIndex > 0
            ) {

                currentQuestionIndex--;

                loadQuestion();

            }

        }
    );


/* =========================================================
   CLEAR QUESTION
========================================================= */

document
    .getElementById(
        "clearQuestion"
    )
    .addEventListener(
        "click",
        function () {

            questionText.value = "";

            for (let i = 0; i < 4; i++) {

                document.getElementById(
                    `option${i}`
                ).value = "";

            }


            selectedCorrectAnswer =
                null;


            const test =
                getCurrentTest();


            if (test) {

                test.questions[
                    currentQuestionIndex
                ] =
                    createEmptyQuestion(
                        currentQuestionIndex + 1
                    );

            }


            updateCorrectButtons();

            updateQuestionGrid();

            updateProgress();

            saveTests();

        }
    );


/* =========================================================
   UPDATE QUESTION GRID
========================================================= */

function updateQuestionGrid() {

    const test =
        getCurrentTest();


    if (!test) return;


    const buttons =
        questionGrid.querySelectorAll(
            "button"
        );


    buttons.forEach(
        (button, index) => {

            button.classList.remove(
                "saved",
                "current"
            );


            if (
                test.questions[index]
                    .saved
            ) {

                button.classList.add(
                    "saved"
                );

            }


            if (
                index ===
                currentQuestionIndex
            ) {

                button.classList.add(
                    "current"
                );

            }

        }
    );

}


/* =========================================================
   UPDATE PROGRESS
========================================================= */

function updateProgress() {

    const test =
        getCurrentTest();


    if (!test) return;


    const savedCount =
        test.questions.filter(
            question =>
                question.saved
        ).length;


    questionProgress.textContent =
        `${savedCount}/120`;


    const percentage =
        (savedCount / 120) * 100;


    progressBar.style.width =
        percentage + "%";

}


/* =========================================================
   SAVE DRAFT
========================================================= */

document
    .getElementById(
        "saveDraft"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(false);

            saveTestInformation();

            saveTests();

            updateStatus();

            showMessage(
                "Test draft saved."
            );

        }
    );


/* =========================================================
   UPDATE STATUS
========================================================= */

function updateStatus() {

    const test =
        getCurrentTest();


    if (!test) return;


    editorStatus.textContent =
        test.status === "published"
            ? "Published"
            : "Draft";

}


/* =========================================================
   PUBLISH TEST
========================================================= */

document
    .getElementById(
        "publishTest"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(false);

            saveTestInformation();


            const test =
                getCurrentTest();


            if (!test) return;


            const savedCount =
                test.questions.filter(
                    question =>
                        question.saved
                ).length;


            if (
                test.name.trim() === ""
            ) {

                alert(
                    "Please enter a test name."
                );

                return;

            }


            if (
                savedCount !==
                TOTAL_QUESTIONS
            ) {

                alert(
                    `You have completed ${savedCount}/120 questions.\n\n` +
                    `All 120 questions must be completed before publishing.`
                );

                return;

            }


            document.getElementById(
                "modalTestName"
            ).textContent =
                test.name;


            document.getElementById(
                "modalQuestionCount"
            ).textContent =
                `${savedCount}/120`;


            const visibilityToCheck =
                (test.visibility || "free") === "premium"
                    ? "visPremium"
                    : "visFree";

            document.getElementById(
                visibilityToCheck
            ).checked = true;


            publishModal.classList.add(
                "show"
            );

        }
    );


/* =========================================================
   CANCEL PUBLISH
========================================================= */

document
    .getElementById(
        "cancelPublish"
    )
    .addEventListener(
        "click",
        function () {

            publishModal.classList.remove(
                "show"
            );

        }
    );


/* =========================================================
   CONFIRM PUBLISH
========================================================= */

document
    .getElementById(
        "confirmPublish"
    )
    .addEventListener(
        "click",
        function () {

            const test =
                getCurrentTest();


            if (!test) return;


            const selectedVisibility =
                document.querySelector(
                    'input[name="testVisibility"]:checked'
                );

            test.visibility =
                selectedVisibility
                    ? selectedVisibility.value
                    : "free";


            test.status =
                "published";


            test.publishedAt =
                new Date().toISOString();


            test.updatedAt =
                new Date().toISOString();


            saveTests();


            publishModal.classList.remove(
                "show"
            );


            updateStatus();


            showMessage(
                "Test published successfully."
            );

        }
    );


/* =========================================================
   BACK TO TEST LIST
========================================================= */

document
    .getElementById(
        "backToTests"
    )
    .addEventListener(
        "click",
        function () {

            saveCurrentQuestion(false);

            saveTestInformation();

            saveTests();

            currentTestId =
                null;

            testEditorPage.classList.add(
                "hidden"
            );

            testListPage.classList.remove(
                "hidden"
            );

            renderTestList();

        }
    );


/* =========================================================
   DELETE TEST
========================================================= */

async function deleteTest(testId) {

    const test =
        tests.find(
            item =>
                item.id === testId
        );


    if (!test) return;


    const confirmed =
        confirm(
            `Delete "${test.name}"?\n\nThis will permanently remove the test from the database.`
        );


    if (!confirmed) return;


    tests =
        tests.filter(
            item =>
                item.id !== testId
        );


    renderTestList();


    try {

        await deleteDoc(
            doc(
                db,
                TESTS_COLLECTION,
                testId
            )
        );

    } catch (error) {

        console.error(
            "Unable to delete test",
            error
        );

        showMessage(
            "Failed to delete from the server. Check your connection."
        );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

    const existing =
        document.querySelector(
            ".toast-message"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast-message";


    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    setTimeout(
        function () {

            toast.remove();

        },
        2200
    );

}


/* =========================================================
   TOAST STYLE
========================================================= */

const toastStyle =
    document.createElement(
        "style"
    );


toastStyle.textContent = `

.toast-message {

    position: fixed;

    right: 25px;

    bottom: 25px;

    z-index: 5000;

    background: #17324d;

    color: white;

    padding: 13px 20px;

    border-radius: 6px;

    font-size: 13px;

    font-weight: 600;

    box-shadow:
        0 6px 20px rgba(0,0,0,0.2);

}

`;


document.head.appendChild(
    toastStyle
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}