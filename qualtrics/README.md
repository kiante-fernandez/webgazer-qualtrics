# Qualtrics Integration

This folder contains everything you need to add eye tracking to your Qualtrics surveys.

## Getting Started

**For complete step-by-step instructions, see:**

**[continuous-tracking-guide.md](continuous-tracking-guide.md)**

This guide covers:
- Adding the header code to your survey
- Setting up embedded data fields
- Adding calibration to Question 1
- Adding tracking to subsequent questions
- Data format and analysis
- Troubleshooting

## Code Templates

**For copy-paste JavaScript code, see:**

**[example-question-code.js](example-question-code.js)**

This file contains ready-to-use templates for:
- Question 1: Calibration (with improved camera permission flow)
- Questions 2+: Standard tracking
- Questions 10, 20, etc.: Optional recalibration

## What This Integration Does

This integration adds browser-based eye tracking to Qualtrics surveys using WebEyeTrack:

1. **One-time calibration**: Participants calibrate on Question 1 with green dots
2. **Continuous tracking**: Eye gaze tracked throughout survey questions
3. **No hosting needed**: Uses pre-hosted files on GitHub Pages
4. **Simple setup**: Copy-paste JavaScript into Qualtrics questions

## Quick Reference

### Files in This Folder

- **continuous-tracking-guide.md** - Complete setup instructions
- **example-question-code.js** - Copy-paste code templates
- **README.md** - This file

### Integration Approach

Uses a **persistent iframe** strategy:
1. Header creates hidden 1px iframe with calibration.html
2. Q1 makes iframe visible for calibration, then hides it
3. Q2+ iframe streams gaze data via postMessage
4. Ensures continuous tracking without reloading

### Support

Questions or issues? [Open an issue on GitHub](https://github.com/kiante-fernandez/webgazer-qualtrics/issues)