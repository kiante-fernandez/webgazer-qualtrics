# WebGazer for Qualtrics

Add webcam-based eye tracking to your Qualtrics surveys using [jsPsych](https://www.jspsych.org/) and [WebGazer.js](https://webgazer.cs.brown.edu/).

**Live Demo:** [https://kiante-fernandez.github.io/webgazer-qualtrics/](https://kiante-fernandez.github.io/webgazer-qualtrics/)

## Quick Start

Add eye tracking to your Qualtrics survey in 3 steps:

### 1. Create a Text/Graphic Question

In your Qualtrics survey, add a new **Text/Graphic** question where you want eye tracking calibration to occur.

### 2. Paste the Iframe Code

Switch to **HTML view** (`<>` button) and paste this code:

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/minimal.html"
    width="100%"
    height="800px"
    allow="camera; microphone"
    style="border: none;">
  </iframe>
</div>

<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'eyetracking-complete') {
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_validation', JSON.stringify(event.data.validation));
      Qualtrics.SurveyEngine.setEmbeddedData('eyetracking_average_offset', event.data.validation.average_offset);
      setTimeout(() => document.querySelector('#NextButton').click(), 1000);
    }
  });
</script>

<style>
  #NextButton { display: none !important; }
</style>
```

### 3. Done!

The eye tracker will calibrate automatically, and validation data will be saved to Qualtrics embedded data. That's it!

For detailed instructions and different experiment variants, see the [Qualtrics Integration Guide](qualtrics/).

---

## Features

- ✅ **No Setup Required** - Uses hosted experiments, just copy-paste the iframe code
- ✅ **Three Variants** - Choose minimal (30s), standard (2min), or full (5min) based on your needs
- ✅ **Automatic Data Saving** - Validation data automatically saves to Qualtrics embedded data
- ✅ **Auto-Advance** - Moves to next question automatically when calibration completes
- ✅ **jsPsych Powered** - Built with the leading behavioral experiment framework
- ✅ **Open Source** - MIT licensed, fork and customize as needed

---

## Experiment Variants

Three pre-built experiments to choose from:

| Variant | Duration | Features | Best For |
|---------|----------|----------|----------|
| **[Minimal](experiments/minimal.html)** | ~30 sec | Camera init → Calibration → Validation | Experienced participants, quick setup |
| **[Standard](experiments/standard.html)** | ~2 min | Welcome → Instructions → Calibration → Validation | Most users, first-time participants |
| **[Full](experiments/full.html)** | ~5 min | Full instructions → Calibration → Validation → Recalibration option → Example trial | Research requiring high accuracy |

[Try the demos →](https://kiante-fernandez.github.io/webgazer-qualtrics/)

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

The validation data is saved as a JSON object in the `eyetracking_validation` embedded data field:

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

- **`average_offset`** - Average distance in pixels between predicted gaze and target points
  - Lower = better accuracy
  - Typical range: 50-200 pixels
  - Use for quality control (filter responses with offset > 250px)

- **`percent_in_roi`** - Percentage of predictions within region of interest per validation point
  - Array of 5 values (one per validation point)
  - Higher = better accuracy

- **`raw_gaze`** - All raw gaze coordinate pairs `[x, y]` during validation
  - Useful for detailed analysis

### Accessing Data

**In Qualtrics:**
1. Go to **Survey Flow** → Add **Embedded Data** element
2. Create fields: `eyetracking_validation`, `eyetracking_average_offset`
3. Place at the **top** of the survey flow
4. Data will appear in your exported responses

**In Exports:**
- Download data as CSV/JSON
- Parse the `eyetracking_validation` field (it's a JSON string)
- Use `eyetracking_average_offset` for quick filtering

---

## Installation

### Option A: Use Hosted Experiments (Recommended)

Just copy-paste the iframe code from the [Quick Start](#quick-start) section. No installation needed!

The experiments are hosted at: `https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/`

### Option B: Self-Host (Advanced)

If you need custom modifications:

1. **Fork this repository**
   ```bash
   git clone https://github.com/kiante-fernandez/webgazer-qualtrics.git
   ```

2. **Modify experiment files** in `experiments/` folder
   - Edit HTML to customize calibration points, instructions, etc.
   - All experiments use CDN-based dependencies (no build step)

3. **Enable GitHub Pages** in your fork
   - Settings → Pages → Source: Deploy from main branch
   - Use your GitHub Pages URL in the iframe `src`

4. **Or host elsewhere** (Netlify, Vercel, etc.)
   - Upload `experiments/` folder to any static host
   - Update iframe `src` to your hosting URL

---

## Customization

### Change Experiment Variant

Edit the iframe `src` attribute to use a different variant:

```html
<!-- Minimal -->
<iframe src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/minimal.html" ...>

<!-- Standard -->
<iframe src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/standard.html" ...>

<!-- Full -->
<iframe src="https://kiante-fernandez.github.io/webgazer-qualtrics/experiments/full.html" ...>
```

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

Fork the repository and edit the experiment HTML files:

```javascript
// In experiments/minimal.html (or standard.html, full.html)
timeline.push({
  type: jsPsychWebgazerCalibrate,
  calibration_points: [
    [10, 10], [50, 50], [90, 90],  // Your custom points
    [10, 90], [90, 10]
  ],
  repetitions_per_point: 3  // More reps = better accuracy
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

**Symptoms:** `average_offset` > 300 pixels consistently.

**Solutions:**
- Use the **Full** variant (allows recalibration)
- Add instructions emphasizing:
  - Good lighting on face
  - Stay still during calibration
  - Look directly at each dot
- Filter out low-quality responses in analysis

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
- Field names must match exactly: `eyetracking_validation`, `eyetracking_average_offset`
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

### v2.0.0 (Current)
- Complete rewrite using iframe approach
- Three experiment variants (minimal, standard, full)
- jsPsych 8.2.2 integration
- Automatic data saving via postMessage
- Comprehensive documentation

### v1.0.0 (Deprecated)
- Header-based approach (does not work due to CSP)

---

Made with ❤️ for behavioral researchers
