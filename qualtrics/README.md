# Qualtrics Integration Guide

This guide shows you how to embed WebEyeTrack eye tracking into your Qualtrics surveys using a persistent iframe approach.

## Overview

The integration uses a **persistent iframe** strategy to maintain WebEyeTrack state throughout the survey:

1. **Header**: Creates a hidden 1px × 1px iframe running `calibration.html`
2. **Q1**: Makes iframe visible for calibration, then hides it
3. **Q2+**: Iframe streams gaze data to questions via `postMessage`

This approach ensures:
- **Continuous tracking**: One WebEyeTrack instance throughout survey
- **No model reload**: Calibration persists between questions
- **Simple integration**: Copy-paste JavaScript templates per question

---

## Setup Instructions

### Step 1: Add Header Code

1. In Qualtrics, go to **Look & Feel** → **General** tab
2. Scroll down to **Header** section
3. Click **Edit**
4. Paste this code:

```html
<script>
(function() {
  if (document.getElementById('calibration-iframe')) return;
  
  const iframe = document.createElement('iframe');
  iframe.id = 'calibration-iframe';
  iframe.src = 'https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html';
  iframe.allow = 'camera; microphone';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.left = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);
  
  console.log('[Header] Persistent iframe created');
})();
</script>
```

5. Click **Save**

**Important:** Change the `src` URL to your deployed `calibration.html` location.

### Step 2: Set Up Embedded Data

1. Go to **Survey Flow**
2. Click **Add a New Element Here** at the TOP
3. Select **Embedded Data**
4. Add these fields (leave values blank):

**Calibration Data:**
- `eyetracking_offset`
- `eyetracking_recalibrated`
- `eyetracking_attempts`
- `eyetracking_validation`
- `eyetracking_model_key`

**Gaze Data (one per tracked question):**
- `gaze_Q2`
- `gaze_Q3`
- `gaze_Q4`
- ... (add for each question you want to track)

5. Move this Embedded Data element to the **VERY TOP** of Survey Flow
6. Click **Save Flow**

### Step 3: Add Questions

Use the JavaScript templates from `example-question-code.js`:

- **Q1**: Use "Question 1: Calibration" template
- **Q2+**: Use "Standard Tracking Questions" template
- **Q10, Q20, etc.**: Optionally use "Recalibration Questions" template

---

## Code Templates

See `example-question-code.js` for full copy-paste templates. Here's a summary:

### Question 1 (Calibration)

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  const iframe = document.getElementById('calibration-iframe');
  
  // Make iframe visible
  iframe.style.width = '100%';
  iframe.style.height = '800px';
  iframe.style.visibility = 'visible';
  // ... more styling
  
  // Listen for calibration-complete
  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      // Save calibration data
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
      // ... save other fields
      
      // Hide iframe
      // ... reset styling to hidden
      
      // Auto-advance
      document.getElementById('NextButton').click();
    }
  });
});
```

### Standard Questions (Q2+)

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  const questionId = 'Q2'; // UPDATE THIS
  const iframe = document.getElementById('calibration-iframe');
  
  // Start tracking
  iframe.contentWindow.postMessage({
    type: 'start-tracking',
    questionId: questionId
  }, '*');
  
  // Collect gaze data
  let gazeData = [];
  window.addEventListener('message', function(event) {
    if (event.data.type === 'gaze-data') {
      gazeData.push({
        t: event.data.timestamp,
        x: event.data.x,
        y: event.data.y
      });
    }
  });
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
  // Pause tracking
  iframe.contentWindow.postMessage({ type: 'pause-tracking' }, '*');
  
  // Save data
  const compressed = gazeData.map(d => `${d.t},${d.x},${d.y}`).join('|');
  Qualtrics.SurveyEngine.setEmbeddedData('gaze_Q2', compressed);
});
```

---

## Data Output

### Calibration Metrics

- **`eyetracking_offset`**: RMSE accuracy (lower = better)
- **`eyetracking_recalibrated`**: `true` if user recalibrated
- **`eyetracking_attempts`**: Number of calibration attempts
- **`eyetracking_validation`**: JSON with full calibration data
- **`eyetracking_model_key`**: Unique identifier for this calibration

### Gaze Data Format

Stored in compressed format per question:
```
"t1,x1,y1|t2,x2,y2|t3,x3,y3|..."
```

Where:
- `t` = timestamp (ms, relative to question start)
- `x` = gaze x-coordinate (pixels, viewport-relative)
- `y` = gaze y-coordinate (pixels, viewport-relative)

**Example:**
```
"0,512,384|67,515,386|134,518,390|..."
```

### Parsing Examples

**R:**
```r
library(tidyr)
gaze_df <- data.frame(raw = unlist(strsplit(gaze_data, "\\|")))
gaze_df <- separate(gaze_df, raw, into = c("t", "x", "y"), sep = ",", convert = TRUE)
```

**Python:**
```python
import pandas as pd
samples = [s.split(',') for s in gaze_data.split('|')]
df = pd.DataFrame(samples, columns=['t', 'x', 'y'], dtype=int)
```

---

## Troubleshooting

### "Persistent iframe not found"
- Ensure Header code is added and saved
- Check browser console for errors
- Verify iframe is created: `document.getElementById('calibration-iframe')`

### No gaze data collected
- Verify participant granted camera permission on Q1
- Check that `start-tracking` message is sent
- Ensure embedded data fields exist in Survey Flow
- Check for JavaScript errors in console

### Poor calibration accuracy
- Offer recalibration (built-in for RMSE > threshold)
- Ensure good lighting and stable head position
- Filter low-quality responses using `eyetracking_offset`

### Coordinates seem wrong
- Ensure viewport updates are running (handles scrolling)
- Check that coordinate transformation is applied
- Verify no JavaScript errors

---

## Technical Details

### Why Persistent Iframe?

Qualtrics enforces Content Security Policy (CSP) that restricts JavaScript execution. WebEyeTrack requires TensorFlow.js and MediaPipe, which need a permissive environment. By hosting externally in an iframe, we bypass CSP restrictions.

### Why Not Reload Per Question?

Reloading WebEyeTrack on each question would:
- Require recalibration every time
- Lose model personalization
- Create poor user experience

The persistent iframe maintains calibration throughout the survey.

### Browser Compatibility

- **Supported**: Chrome, Edge, Firefox, Safari
- **Required**: HTTPS for camera access
- **Note**: Mobile webcam support varies

### Privacy

- Eye tracking runs entirely in browser
- No video sent to servers
- Only gaze coordinates (x, y pixels) saved
- Explicit camera permission required

---

## Support

For issues or questions:
- GitHub: [webgazer-qualtrics](https://github.com/kiante-fernandez/webgazer-qualtrics)
- Issues: [Open an Issue](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)

---

## Credits

This integration uses:
- [jsPsych](https://www.jspsych.org/) - Behavioral experiment framework
- [WebEyeTrack](https://github.com/RedForestAI/WebEyeTrack) - Eye tracking library
- [TensorFlow.js](https://www.tensorflow.org/js) - Machine learning
- [MediaPipe](https://mediapipe.dev/) - Face mesh detection
