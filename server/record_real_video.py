import os
import time
import sys
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
import imageio

sys.path.insert(0, os.path.dirname(__file__))
import seed

frames_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "frames"))
os.makedirs(frames_dir, exist_ok=True)

# Generate a distinct unique name per recording
custom_tag = sys.argv[1] if len(sys.argv) > 1 else time.strftime("%Y%m%d_%H%M%S")
unique_video_name = f"rippl_demo_{custom_tag}.mp4"

out_unique_mp4 = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", unique_video_name))
out_root_mp4 = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rippl_demo_video.mp4"))
out_client_mp4 = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "public", "demo.mp4"))
out_walkthrough_mp4 = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rippl_complete_walkthrough.mp4"))

captured = []

def record():
    # 0. Clean database seed
    print("Resetting database to pristine clean seed before recording...")
    seed.seed()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1280x720 720p HD resolution for maximum legibility on laptops
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 1. Landing Hero (Clean white title, Northwind Shard-09 card)
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(2000)
        f1 = os.path.join(frames_dir, "01_landing_hero.png")
        page.screenshot(path=f1)
        captured.append((f1, 8.0))

        # 2. Click Simulate Invalidation on Hero
        print("Clicking Simulate Invalidation...")
        sim_btn = page.locator("button:has-text('Simulate Invalidation')")
        if sim_btn.count() > 0:
            sim_btn.first.click()
            page.wait_for_timeout(2500)
        f2 = os.path.join(frames_dir, "02_hero_retracted.png")
        page.screenshot(path=f2)
        captured.append((f2, 8.0))

        # 3. Scroll down to Why Vector RAG Fails & Before vs After
        print("Scrolling to Before vs After comparison...")
        page.mouse.wheel(0, 580)
        page.wait_for_timeout(1800)
        f3 = os.path.join(frames_dir, "03_before_after.png")
        page.screenshot(path=f3)
        captured.append((f3, 8.0))

        # 4. Scroll down to 3-Step Protective Loop & Bento Grid
        print("Scrolling to 3-Step Protective Loop & Architecture Grid...")
        page.mouse.wheel(0, 680)
        page.wait_for_timeout(1800)
        f4 = os.path.join(frames_dir, "04_architecture_grid.png")
        page.screenshot(path=f4)
        captured.append((f4, 8.0))

        # 5. Scroll down to Quickstart Section
        print("Scrolling to Quickstart...")
        page.mouse.wheel(0, 550)
        page.wait_for_timeout(1500)
        f5 = os.path.join(frames_dir, "05_quickstart.png")
        page.screenshot(path=f5)
        captured.append((f5, 6.0))

        # 6. Graph DAG Explorer (/graph)
        print("Navigating to http://localhost:3000/graph...")
        page.goto("http://localhost:3000/graph", wait_until="networkidle")
        page.wait_for_timeout(2500)
        f6 = os.path.join(frames_dir, "06_dag_explorer.png")
        page.screenshot(path=f6)
        captured.append((f6, 10.0))

        # 7. Click node CLM-001 in DAG
        print("Selecting CLM-001 node...")
        node_clm = page.locator("text='CLM-001'")
        if node_clm.count() > 0:
            node_clm.first.click()
            page.wait_for_timeout(1500)
        f7 = os.path.join(frames_dir, "07_drawer_open.png")
        page.screenshot(path=f7)
        captured.append((f7, 9.0))

        # 8. Click Propose Retraction button in drawer
        print("Proposing Retraction in drawer...")
        retract_btn = page.locator("button:has-text('Propose Retraction')")
        if retract_btn.count() > 0:
            retract_btn.first.click()
            page.wait_for_timeout(2000)
        f8 = os.path.join(frames_dir, "08_retraction_proposed.png")
        page.screenshot(path=f8)
        captured.append((f8, 8.0))

        # 9. Review Queue (/review)
        print("Navigating to http://localhost:3000/review...")
        page.goto("http://localhost:3000/review", wait_until="networkidle")
        page.wait_for_timeout(2500)
        f9 = os.path.join(frames_dir, "09_review_queue.png")
        page.screenshot(path=f9)
        captured.append((f9, 10.0))

        # 10. Ask / Cypher Terminal (/ask)
        print("Navigating to http://localhost:3000/ask...")
        page.goto("http://localhost:3000/ask", wait_until="networkidle")
        page.wait_for_timeout(2000)
        # Click a sample query to demonstrate live latency measurement
        sample_pill = page.locator("button:has-text('Where did the shipping delay come from?')")
        if sample_pill.count() > 0:
            sample_pill.first.click()
            page.wait_for_timeout(2000)
        f10 = os.path.join(frames_dir, "10_cypher_terminal.png")
        page.screenshot(path=f10)
        captured.append((f10, 9.0))

        # 11. Ablation Lab (/ablation)
        print("Navigating to http://localhost:3000/ablation...")
        page.goto("http://localhost:3000/ablation", wait_until="networkidle")
        page.wait_for_timeout(2500)
        f11 = os.path.join(frames_dir, "11_ablation_benchmarks.png")
        page.screenshot(path=f11)
        captured.append((f11, 9.0))

        # 12. Scroll to ablation head-to-head comparison
        print("Scrolling ablation details...")
        page.mouse.wheel(0, 450)
        page.wait_for_timeout(1500)
        f12 = os.path.join(frames_dir, "12_ablation_grid.png")
        page.screenshot(path=f12)
        captured.append((f12, 8.0))

        # 13. Return to Landing Home
        print("Navigating back to home...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        f13 = os.path.join(frames_dir, "13_return_home.png")
        page.screenshot(path=f13)
        captured.append((f13, 6.0))

        browser.close()

    print(f"\nSuccessfully captured {len(captured)} live screenshots at 1280x720!")

    # Video Encoding (1280x720 720p HD at 24 fps, total 100 seconds)
    total_raw_dur = sum(d for _, d in captured)
    target_dur = 100.0
    scale = target_dur / total_raw_dur
    fps = 24
    width, height = 1280, 720

    print(f"Stitching {len(captured)} frames into 720p MP4 videos (1280x720, 24fps)...")
    writers = [
        imageio.get_writer(out_unique_mp4, fps=fps, codec='libx264', quality=8),
        imageio.get_writer(out_root_mp4, fps=fps, codec='libx264', quality=8),
        imageio.get_writer(out_client_mp4, fps=fps, codec='libx264', quality=8),
        imageio.get_writer(out_walkthrough_mp4, fps=fps, codec='libx264', quality=8),
    ]

    for p, dur in captured:
        frame_count = max(1, int(round(dur * scale * fps)))
        with Image.open(p) as im:
            im = im.convert("RGB")
            im = im.resize((width, height), Image.Resampling.LANCZOS)
            arr = np.array(im)
            for _ in range(frame_count):
                for w in writers:
                    w.append_data(arr)

    for w in writers:
        w.close()

    print(f"\nVideo generation successfully finished with unique filename:")
    print(f">> UNIQUE: {out_unique_mp4}")
    print(f"- {out_root_mp4}")
    print(f"- {out_client_mp4}")
    print(f"- {out_walkthrough_mp4}")

if __name__ == "__main__":
    record()
