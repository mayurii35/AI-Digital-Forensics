import io
import os
from functools import lru_cache
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


IMAGE_AUTHENTICITY_MODEL = os.getenv("IMAGE_AUTHENTICITY_MODEL", "agasta/virtus")


@lru_cache(maxsize=1)
def _load_image_authenticity_model():
    # Lazy loading avoids model downloads for non-image analysis.
    import torch
    from transformers import AutoImageProcessor, AutoModelForImageClassification

    processor = AutoImageProcessor.from_pretrained(IMAGE_AUTHENTICITY_MODEL)
    model = AutoModelForImageClassification.from_pretrained(IMAGE_AUTHENTICITY_MODEL)
    model.eval()
    return torch, processor, model


def classify_image_authenticity(image_path: str) -> dict:
    """Use a pretrained vision transformer to screen face images for deepfakes."""
    if not image_path or not os.path.isfile(image_path):
        return {"status": "error", "error": "Image file not found on disk", "model": IMAGE_AUTHENTICITY_MODEL}

    try:
        from PIL import ImageOps

        torch, processor, model = _load_image_authenticity_model()
        with Image.open(image_path) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")

        with torch.inference_mode():
            probabilities = torch.softmax(model(**inputs).logits[0], dim=-1)

        labels = model.config.id2label
        scores = {
            str(labels.get(index, f"class_{index}")): round(float(probability) * 100, 2)
            for index, probability in enumerate(probabilities)
        }
        predicted_index = int(torch.argmax(probabilities).item())
        predicted_label = str(labels.get(predicted_index, f"class_{predicted_index}"))
        normalized_label = predicted_label.lower().replace("_", " ").replace("-", " ")

        if any(word in normalized_label for word in ("fake", "deepfake", "synthetic", "artificial")):
            verdict = "suspected_fake"
        elif any(word in normalized_label for word in ("real", "authentic", "genuine")):
            verdict = "likely_real"
        else:
            verdict = "unmapped_label"

        return {
            "status": "analysis_complete",
            "model": IMAGE_AUTHENTICITY_MODEL,
            "scope": "real-vs-deepfake classification for face images",
            "verdict": verdict,
            "predicted_label": predicted_label,
            "confidence": round(float(probabilities[predicted_index]) * 100, 2),
            "class_probabilities": scores,
            "limitation": (
                "Research screening only. The model is intended for face images; "
                "it does not detect arbitrary suspicious objects or guarantee authenticity."
            ),
        }
    except ImportError as error:
        return {
            "status": "model_unavailable",
            "model": IMAGE_AUTHENTICITY_MODEL,
            "error": "Install the backend image-model dependencies (torch and transformers).",
            "details": str(error),
        }
    except Exception as error:
        return {"status": "error", "model": IMAGE_AUTHENTICITY_MODEL, "error": str(error)}
