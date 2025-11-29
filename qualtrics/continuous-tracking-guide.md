# Continuous Eye Tracking Integration Guide

This guide shows you how to add continuous eye tracking throughout your entire Qualtrics survey, tracking where participants look on each survey question.

## Overview

This continuous tracking system:
- Calibrates eye tracking once at the start (Question 1)
- Uses a **single persistent iframe** for both calibration and tracking
- Tracks gaze coordinates on every subsequent survey question
- Offers optional recalibration every 10 questions
- Collects raw gaze streams (x, y coordinates at 15 Hz)
- Saves data to Qualtrics embedded data fields
- Supports arbitrarily large surveys (50+ questions)

## How It Works

1. **Question 1**: Participant completes eye tracking calibration. The same iframe automatically switches to tracking mode and becomes hidden.

2. **Questions 2+**: Each question sends commands to the persistent iframe, which streams gaze data using the calibrated WebGazer model.

3. **Questions 10, 20, 30, etc.**: The hidden iframe can be shown again for optional recalibration, then hidden to resume tracking.

4. **Data Export**: All gaze data exports with your Qualtrics responses.

## Architecture

**Single Iframe System**: ONE iframe handles both calibration and continuous tracking throughout the entire survey. After calibration completes, the iframe:
- Automatically switches to tracking mode
- Becomes hidden but stays loaded
- Maintains the calibrated WebGazer instance
- Persists across all questions

This ensures calibration data is never lost during page transitions.

## Quick Start (4 Steps)

### Step 1: Set Up Embedded Data Fields

1. Go to **Survey Flow** in Qualtrics
2. Click **"Add a New Element Here"** at the very top
3. Select **"Embedded Data"**
4. Add these fields (leave values blank):

**Calibration data:**
- `eyetracking_offset`
- `eyetracking_recalibrated`
- `eyetracking_attempts`
- `eyetracking_validation`
- `eyetracking_model_key`

**Gaze data (add one field per tracked question):**
- `gaze_Q2`
- `gaze_Q3`
- `gaze_Q4`
- ... (one for each question you want to track)

**Recalibration markers (optional):**
- `recalibrated_at_Q10`
- `recalibrated_at_Q20`
- ... (one for each recalibration point)

5. **Move this element to the TOP** of your Survey Flow
6. Click **"Save Flow"**

### Step 2: Create Question 1 (Calibration)

1. Add a new **"Text/Graphic"** question as your first survey question
2. Click the **HTML view** button (`<>`)
3. Copy the **"Question 1"** template from [example-question-code.js](example-question-code.js)
4. Paste into the HTML editor
5. Save the question

This question will:
- Show calibration interface to participant
- Initialize the hidden tracking iframe
- Auto-advance when calibration completes

### Step 3: Add Tracking to Questions 2+

For each regular survey question where you want eye tracking:

1. Create your question normally in Qualtrics
2. Click the gear icon → **"Add JavaScript"**
3. Copy the **"Questions 2+"** template from [example-question-code.js](example-question-code.js)
4. Paste into the JavaScript editor
5. **Change `questionId` to match your question** (e.g., 'Q2', 'Q3', 'Q4')
6. Save

Repeat for all questions you want to track (Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q11, Q12, etc.)

### Step 4: Add Recalibration Questions (Optional but Recommended)

For questions 10, 20, 30, 40, etc.:

1. Create a new **"Text/Graphic"** question at position Q10
2. Click **HTML view** and paste the **"Recalibration"** HTML template
3. Click **"Add JavaScript"** and paste the **"Recalibration"** JavaScript template
4. Update question numbers in both HTML and JavaScript
5. Save

Repeat for Q20, Q30, Q40, etc. if your survey is long.

## Detailed Setup Instructions

### Question 1: Calibration Setup

**What participants see:**
1. Welcome screen explaining eye tracking
2. Camera permission request
3. Calibration: Click on 5 dots while looking at them (2 repetitions each)
4. Validation: Look at 5 dots without clicking
5. Optional recalibration offer if accuracy is low (>200px offset)
6. Auto-advance to Question 2

**Behind the scenes:**
- Single iframe shows calibration UI
- User completes calibration
- Same iframe automatically switches to "tracking mode"
- Iframe becomes hidden and moves to document.body
- Same WebGazer instance (with calibration) persists throughout survey

**Code Template:** See `example-question-code.js` → "QUESTION 1: CALIBRATION + TRACKER INITIALIZATION"

### Questions 2+: Standard Tracking

**What participants see:**
- Your normal survey question (no indication of eye tracking)

**Behind the scenes:**
- JavaScript finds the persistent iframe (now in document.body)
- Sends "start-tracking" command to iframe
- Iframe streams gaze coordinates using the calibrated WebGazer (15 times per second)
- JavaScript buffers all gaze data for this question
- On page advance, data saves to embedded data field `gaze_Q#`
- Tracking pauses during page transition

**Code Template:** See `example-question-code.js` → "QUESTIONS 2+: STANDARD TRACKING QUESTIONS"

**Important:**
- Change `questionId` variable to match your question number
- Must update in BOTH `addOnload` and `addOnPageSubmit` functions

### Recalibration Questions (Q10, Q20, Q30, etc.)

**What participants see:**
1. Prompt: "Optional: Recalibrate Eye Tracking"
2. Two buttons: "Recalibrate" or "Skip"
3. If recalibrate: Full calibration interface appears
4. If skip: Immediately advances to next question

**Behind the scenes:**
- Continues tracking gaze during prompt
- If recalibrate: Hidden iframe is shown again, runs calibration, then hidden again
- Same iframe updates its WebGazer model in-place
- Tracking resumes automatically with updated calibration
- Saves recalibration event to embedded data
- All gaze data (including during prompt) saved to `gaze_Q10`

**Code Template:** See `example-question-code.js` → "RECALIBRATION QUESTIONS"

**Important:**
- Add recalibration questions every 10 questions (configurable)
- Helps maintain accuracy throughout long surveys
- Participant can always skip if they don't want to recalibrate

## Data Output

### Gaze Data Format

Each tracked question saves data to its own embedded data field in compressed format:

```
Format: "t1,x1,y1|t2,x2,y2|t3,x3,y3|..."
```

**Where:**
- `t` = Timestamp in milliseconds (relative to question start)
- `x` = Gaze x-coordinate in pixels (relative to viewport)
- `y` = Gaze y-coordinate in pixels (relative to viewport)

**Example:**
```
gaze_Q2 = "0,512,384|67,515,386|134,518,390|201,520,392|268,525,395|..."
```

This means:
- At time 0ms: looking at (512, 384)
- At time 67ms: looking at (515, 386)
- At time 134ms: looking at (518, 390)
- etc.

### Data Size

At 15 Hz sampling rate:
- ~15 samples per second
- ~1.1 KB per 5-second question
- 50 questions = ~55 KB total (well within Qualtrics limits)

## Configuration Options

### Sampling Rate

Default: **15 Hz** (15 samples per second)

To change, modify the `samplingRate` parameter in Question 1:

```javascript
trackingIframe.contentWindow.postMessage({
  type: 'init-tracking',
  modelKey: event.data.model_key,
  samplingRate: 15  // Change this value
}, '*');
```

**Options:**
- **15 Hz**: Lightweight, supports 100+ question surveys
- **30 Hz**: Higher fidelity, supports 50+ question surveys
- **60 Hz**: Maximum fidelity, supports ~25 question surveys

### Recalibration Frequency

Default: Every **10 questions** (Q10, Q20, Q30, etc.)

To change frequency:
- Add recalibration questions at different intervals (e.g., every 5 questions: Q5, Q10, Q15, Q20, etc.)
- Or skip recalibration entirely (just use standard tracking template for all questions)

### Tracked Questions

You don't have to track every question. Only add the tracking JavaScript to questions you want to track.

For example:
- Q1: Calibration
- Q2-Q5: Regular questions (no tracking)
- Q6-Q10: Tracked questions (add tracking JavaScript)
- Q11-Q15: Regular questions (no tracking)
- Q16-Q20: Tracked questions (add tracking JavaScript)

## Troubleshooting

### Problem: Camera Permission Denied

**Symptoms:** Calibration doesn't start, or shows permission error

**Solutions:**
- Ensure survey is accessed via **HTTPS** (required for camera access)
- Ask participants to check browser permissions and allow camera
- Test in different browsers (Chrome/Edge work best)

### Problem: Tracking Iframe Not Found

**Symptoms:** JavaScript error: "Cannot read property 'contentWindow' of null"

**Solutions:**
- Verify Question 1 (calibration) was completed
- Check that participant didn't skip Question 1
- Ensure iframe was successfully moved to document.body after calibration
- Look for `calibration-iframe` element in document.body (use browser dev tools)

### Problem: No Gaze Data Collected

**Symptoms:** Embedded data fields are empty for `gaze_Q#`

**Solutions:**
- Verify participant granted camera permission on Q1
- Check browser console for JavaScript errors
- Look for `[Calibration] WebGazer is producing predictions:` in console (should show coordinates)
- Ensure embedded data fields are set up in Survey Flow **before** Question 1
- Verify tracking JavaScript is added to the question
- Check that `questionId` matches in both `addOnload` and `addOnPageSubmit`
- Verify iframe successfully switched to tracking mode after calibration

### Problem: Data Shows NaN or Null Values

**Symptoms:** Gaze data contains "NaN" or null coordinates

**Solutions:**
- Verify calibration completed successfully
- Check console for `[Calibration] Tracking mode active` message
- Verify WebGazer is producing predictions (check console logs)
- Ensure iframe switched to tracking mode successfully
- Try recalibration if accuracy is poor

### Problem: Coordinates Seem Wrong

**Symptoms:** Gaze coordinates don't match where participant is looking

**Solutions:**
- Check that viewport updates are running (look for console logs)
- Verify no JavaScript errors in coordinate transformation
- Test with and without scrolling
- Consider offering recalibration if accuracy is poor

### Problem: Too Much Data / Hitting Size Limits

**Symptoms:** Embedded data fields truncated or survey errors

**Solutions:**
- Reduce sampling rate from 15 Hz to 10 Hz or lower
- Track fewer questions (only critical questions)
- Split data across multiple surveys
- Use external server for data storage instead of embedded data

## Browser Compatibility

**Supported:**
- Chrome (desktop): Full support
- Edge (desktop): Full support
- Firefox (desktop): Full support
- Safari (desktop): Partial support (may require permission re-grant)

**Limited/Not Supported:**
- Mobile browsers: Limited WebGazer support
- Internet Explorer: Not supported

**Recommendation:** Instruct participants to use Chrome or Edge on desktop for best results.

## Privacy & Data

- Eye tracking runs entirely in participant's browser
- No video or images are sent to any server
- Only gaze coordinates (x, y pixel positions) are saved
- Participants must explicitly grant camera permission
- Camera only active during survey, stops when survey closes

## Performance Tips

1. **Use 15 Hz sampling** for surveys with 50+ questions
2. **Offer recalibration** every 10-20 questions for long surveys
3. **Track selectively** - only add tracking to questions where you need it
4. **Test first** - run pilot with small sample to verify setup
5. **Monitor data size** - check embedded data fields don't exceed limits

## Example Survey Structure

Here's a recommended structure for a 30-question survey:

- **Q1**: Calibration (required)
- **Q2-Q9**: Survey questions with tracking
- **Q10**: Recalibration question
- **Q11-Q19**: Survey questions with tracking
- **Q20**: Recalibration question
- **Q21-Q29**: Survey questions with tracking
- **Q30**: Final question with tracking

Total data: ~30 questions × 1.1 KB = ~33 KB (well within limits)

## Support

For issues, questions, or feature requests:
- [GitHub Repository](https://github.com/kiante-fernandez/webgazer-qualtrics)
- [Open an Issue](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)
- [Code Templates](example-question-code.js)

## Credits

This continuous tracking system uses:
- [jsPsych](https://www.jspsych.org/) - Behavioral experiment framework
- [WebGazer.js](https://webgazer.cs.brown.edu/) - Eye tracking library
