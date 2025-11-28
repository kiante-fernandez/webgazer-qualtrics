Qualtrics.SurveyEngine.addOnload(function () {
    /* Place your JavaScript here to run when the page loads */
    console.log("Tracking Question Loaded");

    if (window.webgazerGlobal) {
        window.webgazerGlobal.startRecording();
    } else {
        console.warn("WebGazer global object not found!");
    }
});

Qualtrics.SurveyEngine.addOnReady(function () {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /* Place your JavaScript here to run when the page is unloaded */
    console.log("Tracking Question Unloaded");

    if (window.webgazerGlobal) {
        window.webgazerGlobal.stopRecording();
        window.webgazerGlobal.saveData();
    }
});
