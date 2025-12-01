# WebGazer for Qualtrics

> **Note:** This branch uses the legacy WebGazer.js library. For the latest version using WebEyeTrack with improved accuracy and features, please use the **[webeyetrack-qualtrics](https://github.com/kiante-fernandez/webgazer-qualtrics/tree/webeyetrack-qualtrics)** branch.

Add webcam-based eye tracking calibration to your Qualtrics surveys using [jsPsych](https://www.jspsych.org/) and [WebGazer.js](https://webgazer.cs.brown.edu/).

**Live Demo:** [https://kiante-fernandez.github.io/webgazer-qualtrics/](https://kiante-fernandez.github.io/webgazer-qualtrics/)

## Quick Start

Add eye tracking calibration to your Qualtrics survey in 3 steps:

### 1. Create a Text/Graphic Question

In your Qualtrics survey, add a new **Text/Graphic** question where you want eye tracking calibration to occur.

### 2. Paste the Code

Switch to **HTML view** (`<>` button) and paste this code:

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'calibration-complete') {
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_offset', event.data.average_offset);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_recalibrated', event.data.recalibrated);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_attempts', event.data.calibration_attempts);
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation_data));
      setTimeout(() => document.querySelector('#NextButton').click(), 1000);
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

### 3. Done!

The eye tracker will calibrate automatically, and calibration data will be saved to Qualtrics embedded data.

For detailed instructions, see the [Qualtrics Integration Guide](qualtrics/).

## Continuous Eye Tracking

Want to track where participants look throughout your **entire survey** - not just during calibration? Working on it:

This feature:
- Calibrates once at the start
- Tracks gaze on every survey question
- Supports arbitrarily large surveys (50+ questions)
- Collects raw gaze streams at 15 Hz
- Optional recalibration every N questions

**[→ Get Started with Continuous Tracking See](qualtrics/continuous-tracking-guide.md)**

---

## How It Works

### The Iframe Approach

This toolkit uses an **iframe-based approach** to bypass Qualtrics Content Security Policy (CSP) restrictions:

1. **Experiments are hosted externally** on GitHub Pages
2. **Embedded in Qualtrics via iframe** - experiments run in a separate origin
3. **Data is sent back via postMessage** - cross-origin communication
4. **Saved to embedded data** - standard Qualtrics data storage

### Why Not Direct Integration?

Qualtrics CSP blocks `eval()` in JavaScript, which WebGazer's regression models require. Direct integration (header-based or question JavaScript) **will not work**. The iframe approach is the only reliable method.

### Data Flow

```
Participant → Camera → WebGazer (in iframe) → jsPsych → postMessage → Qualtrics → Embedded Data
```

---

## Data Output

### What Data You Get

The calibration saves the following to Qualtrics embedded data:

- **`eyetracking_offset`** - Average offset in pixels (accuracy metric)
- **`eyetracking_recalibrated`** - Whether user chose to recalibrate (true/false)
- **`eyetracking_attempts`** - Number of calibration attempts (1 or 2)
- **`eyetracking_validation`** - Full validation data (JSON)

### Validation Data Structure

The `eyetracking_validation` field contains a JSON object:

```json
{
  "raw_gaze": [[x, y], [x, y], ...],
  "validation_points": [[x, y], [x, y], ...],
  "average_offset": 156.7,
  "percent_in_roi": [95, 90, 85, 80, 75],
  "...": "other jsPsych validation data"
}
```

### Metrics

- **`eyetracking_offset`** (also `average_offset` in validation data) - Average distance in pixels between predicted gaze and target points
  - Lower = better accuracy
  - Typical range: 50-200 pixels
  - If > 200px, user is offered optional recalibration
  - Use for quality control in analysis

- **`eyetracking_recalibrated`** - Indicates whether participant chose to recalibrate
  - Useful for understanding data quality improvements

- **`eyetracking_attempts`** - Number of calibration attempts
  - 1 = accepted initial calibration
  - 2 = chose to recalibrate

- **`percent_in_roi`** - Percentage of predictions within region of interest per validation point
  - Array of 5 values (one per validation point)
  - Higher = better accuracy

### Accessing Data

**In Qualtrics:**
1. Go to **Survey Flow** → Add **Embedded Data** element
2. Create fields: `eyetracking_offset`, `eyetracking_recalibrated`, `eyetracking_attempts`, `eyetracking_validation`
3. Place at the **top** of the survey flow
4. Data will appear in your exported responses

**In Exports:**
- Download data as CSV/JSON
- Parse the `eyetracking_validation` field (it's a JSON string)
- Use `eyetracking_offset` for quick filtering
- Use `eyetracking_recalibrated` and `eyetracking_attempts` to understand calibration quality

---

## Installation

### Option A: Use Hosted Experiment (Recommended)

Just copy-paste the code from the [Quick Start](#quick-start) section. No installation needed!

The experiment is hosted at: `https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/calibration.html`

### Option B: Self-Host (Advanced)

If you need custom modifications:

1. **Fork this repository**
   ```bash
   git clone https://github.com/kiante-fernandez/webgazer-qualtrics.git
   ```

2. **Modify experiment file** at `experiments/calibration.html`
   - Customize calibration points, instructions, etc.
   - Uses CDN-based dependencies (no build step)

3. **Enable GitHub Pages** in your fork
   - Settings → Pages → Source: Deploy from main branch
   - Use your GitHub Pages URL in the iframe `src`

4. **Or host elsewhere** (Netlify, Vercel, etc.)
   - Upload `experiments/` folder to any static host
   - Update iframe `src` to your hosting URL

---

## Customization

### Disable Auto-Advance

Remove these lines from the iframe code:

```javascript
setTimeout(() => document.querySelector('#NextButton').click(), 1000);
```

And remove:

```html
<style>
  #NextButton { display: none !important; }
</style>
```

### Adjust Iframe Size

Change `height` in both the `<div>` and `<iframe>` tags:

```html
<div style="width: 100%; height: 900px;">  <!-- Changed from 800px -->
  <iframe ... height="900px"> <!-- Changed from 800px -->
```

### Custom Calibration Points

Fork the repository and edit `experiments/calibration.html`:

```javascript
// In the create_calibration_sequence() function
sequence.push({
  type: jsPsychWebgazerCalibrate,
  calibration_points: [
    [10, 10], [50, 50], [90, 90],  // Your custom points
    [10, 90], [90, 10]
  ],
  repetitions_per_point: 3,  // More reps = better accuracy
  calibration_mode: 'click'
});
```

Calibration points are in **percentage coordinates**: `[25, 25]` = 25% from left, 25% from top.

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | Full | Recommended |
| Edge | Full | Recommended |
| Firefox | Full | Works well |
| Safari | Limited | Desktop only, some issues |
| Mobile | Limited | Front-facing cameras have limited support |
**Requirements:**
- HTTPS connection (for camera access)
- Modern browser (last 2 major versions)
- Working webcam
- JavaScript enabled

---

## Technical Details

### Architecture

```
Qualtrics Survey (with CSP restrictions)
  ├─ Text/Graphic Question (with iframe)
  │   └─ Iframe (separate origin, no CSP)
  │       └─ jsPsych Experiment
  │           ├─ WebGazer.js (eye tracking)
  │           ├─ Calibration
  │           ├─ Validation
  │           └─ postMessage (sends data back)
  │
  └─ JavaScript Listener (receives data via postMessage)
      └─ Saves to Embedded Data
```

### Security & Privacy

- **No server communication** - Everything runs in the browser
- **No video uploaded** - Only gaze coordinates (x, y pixels) are saved
- **Explicit consent** - Participants must grant camera permission
- **HTTPS required** - Browser-enforced security for camera access

---

## Credits & License

### Built With

- **[jsPsych](https://www.jspsych.org/)** - JavaScript library for behavioral experiments (MIT License)
- **[WebGazer.js](https://webgazer.cs.brown.edu/)** - Webcam eye tracking library (GPL-3.0)

### License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file.

### Citation

If you use this in research, please cite:

- **jsPsych:** de Leeuw, J. R. (2015). jsPsych: A JavaScript library for creating behavioral experiments in a Web browser. *Behavior Research Methods*, 47(1), 1-12.

- **WebGazer.js:** Papoutsaki, A., Sangkloy, P., Laskey, J., Daskalova, N., Huang, J., & Hays, J. (2016). WebGazer: Scalable Webcam Eye Tracking Using User Interactions. *Proceedings of the 25th International Joint Conference on Artificial Intelligence (IJCAI)*, 3839-3845.

---

## Support

- **Integration Guide:** See [qualtrics/README.md](qualtrics/) for detailed Qualtrics setup
- **Issues:** [GitHub Issues](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)
- **Discussions:** [GitHub Discussions](https://github.com/kiante-fernandez/webgazer-qualtrics/discussions)
- **Documentation:** [jsPsych Eye Tracking Guide](https://www.jspsych.org/v8/overview/eye-tracking/)
