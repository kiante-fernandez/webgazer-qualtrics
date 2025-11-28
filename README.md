# WebGazer for Qualtrics: Integration Guide

This toolkit allows you to integrate WebGazer.js eye tracking into any Qualtrics survey.

**Note**: The automated `.qsf` template is currently unavailable due to Qualtrics import restrictions. Please follow the manual setup steps below. It takes about 5 minutes.

## Prerequisites
*   A Qualtrics account.
*   Access to the `assets/` folder provided in this package.

## Step-by-Step Setup

### 1. Add Header Code (Includes CSS & JS)
1.  Open your survey in Qualtrics.
2.  Go to **Look & Feel** -> **General** -> **Header**.
3.  Click **Edit**.
4.  Click the **Source** icon (`<>`) to switch to HTML mode.
5.  Paste the **entire content** of `assets/webgazer-header.html`.
6.  Click **Save**.
    *   *Note: This file now includes all necessary CSS styles, so you do NOT need to host any external files.*

### 2. Setup Embedded Data
1.  Go to **Survey Flow**.
2.  Click **Add a New Element Here** -> **Embedded Data**.
3.  Create the following fields:
    *   `GazeData` (This will store the eye tracking coordinates)
    *   `ValidationScore` (This stores the accuracy of the calibration)
4.  Move this element to the **top** of the flow.
5.  Click **Save Flow**.

### 3. Create Calibration Question
1.  Create a new **Text/Graphic** question at the start of your survey.
2.  Change the Question Text to: "Click on the red dots to calibrate the eye tracker."
3.  Click the **JavaScript** option for this question (under Question behavior).
4.  Paste the content of `assets/calibration-question.js`.

### 4. Create Validation Question
1.  Create another **Text/Graphic** question immediately after calibration.
2.  Change the Question Text to: "Validation Phase. Please look at the blue dots."
3.  Click the **JavaScript** option.
4.  Paste the content of `assets/validation-question.js`.

### 5. Enable Tracking on Survey Questions
For *every* question where you want to record eye tracking data:
1.  Click the **JavaScript** option.
2.  Paste the content of `assets/tracking-question.js`.

## Data Output

The eye tracking data is stored in the `GazeData` embedded data field.
It is a JSON string containing an array of data points:
```json
[
  {"x": 500, "y": 300, "t": 12345, "p": "http://..."}
]
```
*   `x`, `y`: Screen coordinates (pixels).
*   `t`: Time since start (ms).
*   `p`: Page URL (to identify the question).

## Troubleshooting
*   **No Video?**: Check if your browser blocked the camera permission.
*   **Calibration Points don't appear?**: Ensure you pasted the Header code correctly including the `<style>` block.
*   **Data not saving?**: Ensure you added the `GazeData` field in Survey Flow *before* the questions block.
