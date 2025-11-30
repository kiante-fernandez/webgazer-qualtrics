import pandas as pd
import base64
import json
import sys
import os

def process_qualtrics_data(input_file, output_file=None):
    """
    Reads a Qualtrics CSV export, decodes/decompresses WebEyeTrack gaze data,
    and saves a clean long-format CSV.
    """
    print(f"Reading {input_file}...")
    
    # Read CSV, skipping the 2nd and 3rd header rows typically found in Qualtrics exports
    # We keep the first row as header
    try:
        df = pd.read_csv(input_file)
        # If row 1 contains "ImportId" (typical Qualtrics format), drop rows 1 and 2
        if df.iloc[0].astype(str).str.contains('ImportId').any():
            print("Detected Qualtrics 3-row header format. Removing metadata rows.")
            df = df.iloc[2:].reset_index(drop=True)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Find all columns starting with 'gaze_' but NOT 'gaze_json_'
    gaze_cols = [c for c in df.columns if c.startswith('gaze_') and not c.startswith('gaze_json_')]
    
    if not gaze_cols:
        print("No 'gaze_Q*' columns found in the CSV.")
        return

    print(f"Found {len(gaze_cols)} gaze columns: {', '.join(gaze_cols)}")
    
    all_samples = []

    for index, row in df.iterrows():
        response_id = row.get('ResponseId', f'Row_{index}')
        
        for col in gaze_cols:
            question_id = col.replace('gaze_', '')
            encoded_data = row[col]
            
            if pd.isna(encoded_data) or str(encoded_data).strip() == '':
                continue
                
            try:
                # 0. Check for JSON format (new method)
                str_val = str(encoded_data).strip()
                if str_val.startswith('[') and str_val.endswith(']'):
                    try:
                        json_data = json.loads(str_val)
                        for item in json_data:
                            all_samples.append({
                                'ResponseId': response_id,
                                'QuestionId': question_id,
                                'Time': item.get('t', 0),
                                'X': item.get('x', 0),
                                'Y': item.get('y', 0)
                            })
                        continue # Success, move to next column
                    except json.JSONDecodeError:
                        print(f"Warning: Column {col} looked like JSON but failed to parse.")

                # 1. Base64 Decode (Legacy method)
                # Check if it looks like Base64 (simple heuristic: no commas, has alphanumeric + +/=)
                # The raw compressed string has commas, so if it has commas, it might not be base64 encoded (legacy data)
                compressed_str = ""
                if ',' in str(encoded_data) and ';' in str(encoded_data):
                     # Likely raw compressed string (not base64)
                     compressed_str = str(encoded_data)
                else:
                    try:
                        decoded_bytes = base64.b64decode(str(encoded_data))
                        compressed_str = decoded_bytes.decode('utf-8')
                    except:
                        # Fallback: maybe it was raw string?
                        compressed_str = str(encoded_data)

                if not compressed_str or compressed_str == 'error':
                    continue

                # 2. Decompress (Delta Decoding)
                # Format: "t0,x0,y0;dt1,x1,y1;dt2,x2,y2..."
                samples = [s for s in compressed_str.split(';') if s.strip()]
                
                if not samples:
                    continue
                
                # Helper to safely parse float
                def safe_float(val):
                    if not val or not val.strip(): return 0.0
                    return float(val)

                # Parse first sample
                first = samples[0].split(',')
                if len(first) < 3: 
                    print(f"Skipping malformed first sample in {col}: {samples[0]}")
                    continue
                    
                try:
                    t_curr = int(safe_float(first[0]))
                    x_curr = int(safe_float(first[1]))
                    y_curr = int(safe_float(first[2]))
                except ValueError as e:
                    print(f"Error parsing first sample in {col}: {first} - {e}")
                    continue
                
                all_samples.append({
                    'ResponseId': response_id,
                    'QuestionId': question_id,
                    'Time': t_curr,
                    'X': x_curr,
                    'Y': y_curr
                })
                
                # Parse subsequent samples
                for i in range(1, len(samples)):
                    parts = samples[i].split(',')
                    if len(parts) < 3:
                        continue
                        
                    try:
                        dt = int(safe_float(parts[0]))
                        x = int(safe_float(parts[1]))
                        y = int(safe_float(parts[2]))
                        
                        t_curr += dt
                        
                        all_samples.append({
                            'ResponseId': response_id,
                            'QuestionId': question_id,
                            'Time': t_curr,
                            'X': x,
                            'Y': y
                        })
                    except ValueError:
                        # Skip individual bad samples but keep processing the rest if possible
                        continue
                        
            except Exception as e:
                print(f"Error processing row {index}, col {col}: {e}")
                # Print a snippet of the data for debugging
                if 'compressed_str' in locals() and compressed_str:
                    print(f"  Data snippet: {compressed_str[:50]}...")
                continue

    if not all_samples:
        print("No valid gaze data extracted.")
        return

    # Create output DataFrame
    result_df = pd.DataFrame(all_samples)
    
    if output_file is None:
        output_file = os.path.splitext(input_file)[0] + '_PROCESSED.csv'
        
    print(f"Saving {len(result_df)} samples to {output_file}...")
    result_df.to_csv(output_file, index=False)
    print("Done!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_qualtrics_data.py <path_to_qualtrics_csv>")
    else:
        process_qualtrics_data(sys.argv[1])
