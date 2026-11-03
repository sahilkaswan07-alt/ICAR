/* =========================================================
   FIREBASE SETUP
   (Requires this file to be loaded as a module:
    <script type="module" src="tests.js">)
========================================================= */

import { app } from "./firebase-config.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   CONFIGURATION
========================================================= */

const TESTS_COLLECTION = "tests";
const ATTEMPTS_COLLECTION = "attempts";

const testsCollectionRef = collection(db, TESTS_COLLECTION);

let currentUser = null;


/* =========================================================
   DOM
========================================================= */

const testList =
    document.getElementById(
        "testList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );


/* =========================================================
   LOAD PUBLISHED TESTS FROM FIREBASE
========================================================= */

async function loadPublishedTests() {

    try {

        const publishedQuery =
            query(
                testsCollectionRef,
                where(
                    "status",
                    "==",
                    "published"
                )
            );

        const snapshot =
            await getDocs(
                publishedQuery
            );

        // Only Free tests belong on this page.
        // Tests saved before the visibility field existed
        // are treated as Free for backward compatibility.
        const tests =
            snapshot.docs
                .map(docSnapshot => docSnapshot.data())
                .filter(test =>
                    (test.visibility || "free") === "free"
                );

        // Most recently published first
        tests.sort(
            (a, b) =>
                new Date(b.publishedAt || 0) -
                new Date(a.publishedAt || 0)
        );

        const testsWithAttempts =
            await attachAttemptStatus(tests);

        renderTests(testsWithAttempts);

    } catch (error) {

        console.error(
            "Unable to load tests",
            error
        );

        renderTests([]);

    }

}


/* =========================================================
   ATTACH ATTEMPT STATUS
   (looks up attempts/{uid}_{testId} for each test so we
    know whether to show "Start test" or the past result)
========================================================= */

async function attachAttemptStatus(tests) {

    if (!currentUser) {

        return tests.map(test => ({
            ...test,
            attempt: null
        }));

    }

    const results =
        await Promise.all(
            tests.map(async test => {

                try {

                    const attemptSnap =
                        await getDoc(
                            doc(
                                db,
                                ATTEMPTS_COLLECTION,
                                `${currentUser.uid}_${test.id}`
                            )
                        );

                    return {
                        ...test,
                        attempt:
                            attemptSnap.exists()
                                ? attemptSnap.data()
                                : null
                    };

                } catch (error) {

                    console.error(
                        "Unable to check attempt status",
                        error
                    );

                    return {
                        ...test,
                        attempt: null
                    };

                }

            })
        );

    return results;

}


/* =========================================================
   RENDER TESTS
========================================================= */

function renderTests(tests) {

    // Remove only previously-rendered dynamic cards,
    // leaving any static cards (e.g. the sample
    // ICAR Mock Test card) untouched.
    testList
        .querySelectorAll(
            '[data-dynamic="true"]'
        )
        .forEach(
            card => card.remove()
        );

    if (tests.length === 0) {

        return;

    }

    const staticCount =
        testList.querySelectorAll(
            '[data-static="true"]'
        ).length;

    tests.forEach((test, index) => {

        const listItem =
            document.createElement(
                "li"
            );

        listItem.className =
            "test-card";

        listItem.dataset.dynamic =
            "true";

        const testNumber =
            String(
                staticCount + index + 1
            ).padStart(
                3,
                "0"
            );

        listItem.innerHTML = `

            <div class="test-card-main">
                <span class="test-no">Test No. ${testNumber}</span>
                <h2 class="test-name">${escapeHTML(test.name)}</h2>
                <div class="test-meta">
                    <span>${test.totalQuestions || test.questions?.length || 0} questions</span>
                    <span class="dot" aria-hidden="true"></span>
                    <span>${test.duration || 0} minutes</span>
                </div>
            </div>

            <div class="test-card-side">
                <span class="price-badge free">Free</span>
                ${
                    test.attempt
                    ? `
                        <span class="btn-primary start-btn" style="opacity:.6; pointer-events:none; cursor:default;">
                            Attempted${
                                typeof test.attempt.score !== "undefined"
                                    ? " \u2022 Score: " + escapeHTML(String(test.attempt.score)) +
                                      (test.marksPerQuestion && test.totalQuestions
                                          ? "/" + escapeHTML(String(test.totalQuestions * test.marksPerQuestion))
                                          : "")
                                    : ""
                            }
                        </span>
                    `
                    : `
                        <a class="btn-primary start-btn" href="take-test.html?id=${encodeURIComponent(test.id)}">Start test</a>
                    `
                }
            </div>

        `;

        testList.appendChild(
            listItem
        );

    });

}


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


/* =========================================================
   INITIALIZE
========================================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "auth.html";
        return;

    }

    currentUser = user;

    loadPublishedTests();

});