# WebGazer for Qualtrics

Add webcam-based eye tracking calibration to your Qualtrics surveys using [jsPsych](https://www.jspsych.org/) and [WebGazer.js](https://webgazer.cs.brown.edu/).

**Live Demo:** [https://kiante-fernandez.github.io/webgazer-qualtrics/](https://kiante-fernandez.github.io/webgazer-qualtrics/)

## Quick Start

Add eye tracking calibration to your Qualtrics survey in 3 steps:

### 1. Create a Text/Graphic Question

In your Qualtrics survey, add a new **Text/Graphic** question where you want eye tracking calibration to occur.

### 2. Paste the Iframe Code

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

The eye tracker will calibrate automatically, and calibration data will be saved to Qualtrics embedded data. All participants continue to the survey regardless of calibration quality.

For detailed instructions, see the [Qualtrics Integration Guide](qualtrics/).

---

## Features

- **No Setup Required** - Uses hosted experiment, just copy-paste the iframe code
- **Calibration Data Collection** - Records calibration quality without blocking participants
- **Optional Recalibration** - Offers one recalibration attempt if initial accuracy is low (offset > 200px)
- **Automatic Data Saving** - Calibration data automatically saves to Qualtrics embedded data
- **Auto-Advance** - Moves to next question automatically when calibration completes
- **jsPsych Powered** - Built with the leading behavioral experiment framework
- **Open Source** - MIT licensed, fork and customize as needed

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

### Key Metrics

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

Just copy-paste the iframe code from the [Quick Start](#quick-start) section. No installation needed!

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

## Troubleshooting

### Camera Permission Denied

**Symptoms:** Participants see "Permission denied" or camera doesn't start.

**Solutions:**
- Ensure survey is accessed via **HTTPS** (required for camera access)
- Ask participants to check browser permissions and allow camera
- Test in different browsers (Chrome/Edge work best)

### Poor Calibration Accuracy

**Symptoms:** `eyetracking_offset` > 300 pixels consistently.

**Solutions:**
- If offset > 200px, participants are offered optional recalibration
- Add instructions emphasizing:
  - Good lighting on face
  - Stay still during calibration
  - Look directly at each dot
- Filter out low-quality responses in analysis using `eyetracking_offset` field

### Iframe Not Displaying

**Symptoms:** Blank space or error message.

**Solutions:**
- Check browser console for errors (F12)
- Verify iframe `src` URL is correct and accessible
- Some corporate networks block iframes - test on different network
- Ensure Qualtrics account allows iframe embedding

### Data Not Saving

**Symptoms:** Embedded data fields are empty.

**Solutions:**
- Create embedded data fields in **Survey Flow** (before the eye tracking question)
- Field names must match exactly: `eyetracking_offset`, `eyetracking_recalibrated`, `eyetracking_attempts`, `eyetracking_validation`
- Check browser console for JavaScript errors
- Verify the postMessage listener code is included

### Works in Preview But Not Live

**Symptoms:** Functions in Qualtrics preview mode but fails in live survey.

**Solutions:**
- Check if participants are using incompatible browsers (try Chrome/Edge)
- Verify camera permissions are granted
- Some participants may have webcam blocked by security software

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Edge | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari | ⚠️ Limited | Desktop only, some issues |
| Mobile | ❌ Limited | Front-facing cameras have limited support |

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

### Why CSP Matters

- Qualtrics blocks `unsafe-eval` in Content Security Policy
- WebGazer uses `new Function()` and `eval()` for regression models
- Running in iframe = different origin = different CSP context
- postMessage = secure cross-origin communication

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

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Changelog

### v3.0.0 (Current)
- Single calibration experiment with optional recalibration
- Calibration data collection focus (no pass/fail logic)
- All participants continue to survey regardless of accuracy
- Optional recalibration if offset > 200px
- jsPsych 8.2.2 integration
- Automatic data saving via postMessage

### v2.0.0 (Deprecated)
- Three experiment variants (minimal, standard, full)
- Iframe approach with postMessage

### v1.0.0 (Deprecated)
- Header-based approach (does not work due to CSP)

---

Made for behavioral researchers
