import os
import glob
from PIL import Image
import numpy as np
import imageio

brain_dir = r"C:\Users\ASUS TUF\.gemini\antigravity-ide\brain\daf534ad-6a8e-44e7-84bd-899f4a6b25b9"
out_project_mp4 = r"c:\Users\ASUS TUF\Documents\Rippl\rippl_demo_video.mp4"
out_client_mp4 = r"c:\Users\ASUS TUF\Documents\Rippl\client\public\demo.mp4"
out_brain_mp4 = os.path.join(brain_dir, "rippl_demo_video.mp4")

# Selected chronological keyframes covering the new complete product
ordered_frames = [
    # 1. Product Landing Page & Problem Exposition
    ("rippl_landing_hero_1792046371114.png", 8.0),
    (".system_generated/click_feedback_1792046380110.png", 3.0),
    ("rippl_retracted_state_1792046384302.png", 9.0),
    (".system_generated/click_feedback_1792046399794.png", 3.0),
    (".system_generated/click_feedback_1792046405401.png", 3.0),
    ("rippl_bento_grid_1792046417707.png", 9.0),

    # 2. Causal Graph Canvas & 113-Node FalkorDB Graph
    (".system_generated/click_feedback_1792046443786.png", 3.0),
    ("rippl_live_graph_rendered_1792046462142.png", 10.0),
    ("graph_detail_drawer_1792039668160.png", 7.0),
    ("invalidation_receipt_1792039733056.png", 8.0),

    # 3. Human-in-the-Loop Review Queue
    (".system_generated/click_feedback_1792046474956.png", 3.0),
    ("rippl_review_queue_1792046487410.png", 8.0),
    (".system_generated/click_feedback_1792046493478.png", 3.0),
    ("approval_receipt_modal_1792039809900.png", 7.0),

    # 4. Cypher Provenance Terminal
    (".system_generated/click_feedback_1792046505019.png", 3.0),
    ("rippl_cypher_terminal_1792046519283.png", 9.0),
    ("ask_query_response_1792039885568.png", 8.0),

    # 5. Empirical Ablation Benchmarks Lab
    (".system_generated/click_feedback_1792046559121.png", 3.0),
    ("rippl_benchmarks_1792046566835.png", 9.0),
    (".system_generated/click_feedback_1792046572139.png", 3.0),
    ("benchmark_rerun_1792039987367.png", 8.0),

    # 6. Return Home to Product Overview
    (".system_generated/click_feedback_1792046586789.png", 3.0),
    ("rippl_tour_complete_1792046605955.png", 7.0),
]

valid_pairs = []
for rel_path, duration in ordered_frames:
    p = os.path.join(brain_dir, rel_path.replace("/", os.sep))
    if os.path.exists(p):
        valid_pairs.append((p, duration))
    else:
        fname = os.path.basename(rel_path)
        matches = glob.glob(os.path.join(brain_dir, "**", fname), recursive=True)
        if matches:
            valid_pairs.append((matches[0], duration))

print(f"Found {len(valid_pairs)} matching keyframe images.")
total_duration = sum(d for _, d in valid_pairs)
print(f"Target duration: {total_duration:.1f} seconds (~{total_duration/60:.1f} minutes)")

target_seconds = 120.0  # Exactly 2 minutes
scale = target_seconds / total_duration if total_duration > 0 else 1.0

fps = 24
width, height = 1280, 720  # 720p HD

writer1 = imageio.get_writer(out_project_mp4, fps=fps, codec='libx264', quality=8)
writer2 = imageio.get_writer(out_client_mp4, fps=fps, codec='libx264', quality=8)
writer3 = imageio.get_writer(out_brain_mp4, fps=fps, codec='libx264', quality=8)

for idx, (img_path, duration) in enumerate(valid_pairs):
    scaled_dur = duration * scale
    frame_count = max(1, int(round(scaled_dur * fps)))
    
    with Image.open(img_path) as im:
        im = im.convert("RGB")
        # Crop 8px off outer borders to cleanly remove screen recorder / window focus blue edge glow
        w_orig, h_orig = im.size
        if w_orig > 30 and h_orig > 30:
            im = im.crop((8, 8, w_orig - 8, h_orig - 8))
        im.thumbnail((width, height), Image.Resampling.LANCZOS)
        
        canvas = Image.new("RGB", (width, height), (9, 9, 11))
        offset = ((width - im.width) // 2, (height - im.height) // 2)
        canvas.paste(im, offset)
        frame_np = np.array(canvas)

    for _ in range(frame_count):
        writer1.append_data(frame_np)
        writer2.append_data(frame_np)
        writer3.append_data(frame_np)

writer1.close()
writer2.close()
writer3.close()

print("Video generation successfully completed! Output files:")
print("-", out_project_mp4)
print("-", out_client_mp4)
print("-", out_brain_mp4)
