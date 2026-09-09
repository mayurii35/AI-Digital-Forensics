import io
import os
import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ExifTags

def perform_error_level_analysis(image_path: str, quality: int = 90) -> dict:
    """
    Executes real Error Level Analysis (ELA) on an evidence image to detect
    digital tampering, photomontage, and localized re-compression anomalies.
    """
    if not os.path.exists(image_path):
        return {
            "error": "Image file not found on disk",
            "tamper_score": 0,
            "is_tampered": False
        }

    try:
        with Image.open(image_path) as original:
            original = original.convert("RGB")

            # 1. Resave in-memory at defined compression quality (default 90%)
            buffer = io.BytesIO()
            original.save(buffer, "JPEG", quality=quality)
            buffer.seek(0)
            resaved = Image.open(buffer)

            # 2. Compute absolute pixel difference matrix
            diff = ImageChops.difference(original, resaved)

            # 3. Analyze extrema and compute mean square error
            diff_array = np.array(diff, dtype=np.float32)
            mean_diff = float(np.mean(diff_array))
            max_diff = float(np.max(diff_array))
            std_diff = float(np.std(diff_array))

            # 4. Localized variance detection (spliced objects have high local variance)
            # High standard deviation relative to mean indicates uneven compression (tampering)
            variance_ratio = std_diff / (mean_diff + 1e-5)

            # 5. Compute Normalized Tamper Score (0 to 100)
            # Pristine camera images generally have mean_diff between 1.5 - 5.5 and variance_ratio < 1.8
            raw_score = (mean_diff * 4.5) + (variance_ratio * 12.0)
            tamper_score = min(100.0, max(0.0, round(raw_score, 2)))

            is_tampered = tamper_score >= 50.0

            # 6. EXIF software analysis
            exif_data = {}
            editing_software_detected = []
            try:
                raw_exif = original.getexif()
                if raw_exif:
                    for tag_id, value in raw_exif.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        exif_data[tag_name] = str(value)
                        if tag_name in ["Software", "ProcessingSoftware", "ImageDescription"]:
                            val_lower = str(value).lower()
                            for tool in ["photoshop", "gimp", "canva", "lightroom", "midjourney", "stable diffusion", "facetune"]:
                                if tool in val_lower:
                                    editing_software_detected.append(tool.title())
            except Exception:
                pass

            # Deepfake / AI synthesis heuristic indicator
            is_synthetic_ai = False
            if "midjourney" in str(editing_software_detected).lower() or "stable diffusion" in str(editing_software_detected).lower():
                is_synthetic_ai = True
            elif mean_diff < 0.8 and max_diff < 15.0:
                # Completely uniform zero-compression artifacts characteristic of raw PNG renders
                is_synthetic_ai = True

            # Forensic Summary
            if is_tampered or editing_software_detected or is_synthetic_ai:
                assessment = "High probability of digital manipulation or artificial generation."
                confidence = "High" if len(editing_software_detected) > 0 else "Medium"
            elif tamper_score >= 30.0:
                assessment = "Moderate compression variance detected. Further timeline correlation suggested."
                confidence = "Medium"
            else:
                assessment = "Uniform error level distribution. Consistent with camera-original capture."
                confidence = "High"

            return {
                "status": "analysis_complete",
                "tamper_score": tamper_score,
                "is_tampered": is_tampered,
                "is_synthetic_ai": is_synthetic_ai,
                "mean_error_level": round(mean_diff, 2),
                "max_error_level": round(max_diff, 2),
                "variance_ratio": round(variance_ratio, 2),
                "editing_software": list(set(editing_software_detected)),
                "assessment": assessment,
                "confidence": confidence,
                "method": "Error Level Analysis (ELA 90%) + EXIF Header Triage"
            }

    except Exception as e:
        return {
            "error": f"ELA computation failed: {str(e)}",
            "tamper_score": 0.0,
            "is_tampered": False
        }
