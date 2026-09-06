import hashlib
import mimetypes
from pathlib import Path
import pandas as pd
from pypdf import PdfReader
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from mutagen import File as MutagenFile
from hachoir.parser import createParser
from hachoir.metadata import extractMetadata


def calculate_file_hash(file_path: str) -> str:
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while chunk := file.read(4096):
            sha256.update(chunk)

    return sha256.hexdigest()


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def _extract_gps(exif_data: dict):
    """Convert raw EXIF GPS IFD into a readable lat/lon dict, if present."""
    gps_info = exif_data.get("GPSInfo")
    if not gps_info:
        return None

    gps_readable = {}
    for key, value in gps_info.items():
        tag_name = GPSTAGS.get(key, key)
        gps_readable[tag_name] = value

    return gps_readable or None


def extract_image_metadata(file_path: str) -> dict:
    """
    Real forensic metadata extraction for image evidence using Pillow.
    Returns dimensions, format, color mode, and any embedded EXIF data
    (camera model, timestamps, GPS coordinates if present).
    """
    metadata = {
        "file_type": "image",
        "width": None,
        "height": None,
        "format": None,
        "mode": None,
        "exif": {},
    }

    try:
        with Image.open(file_path) as img:
            metadata["width"] = img.width
            metadata["height"] = img.height
            metadata["format"] = img.format
            metadata["mode"] = img.mode

            raw_exif = img.getexif()
            if raw_exif:
                exif_readable = {}
                for tag_id, value in raw_exif.items():
                    tag_name = TAGS.get(tag_id, tag_id)
                    # Skip huge/binary blobs that aren't useful as text
                    if isinstance(value, bytes):
                        continue
                    exif_readable[str(tag_name)] = str(value)

                gps = _extract_gps(raw_exif)
                if gps:
                    exif_readable["GPS"] = str(gps)

                metadata["exif"] = exif_readable
    except Exception as e:
        metadata["error"] = f"Could not read image metadata: {str(e)}"

    return metadata


def extract_basic_file_metadata(file_path: str, file_type: str) -> dict:
    """
    Lightweight, dependency-free metadata fallback. Not used for
    audio/video anymore now that mutagen (audio) and hachoir (video)
    handle those with real duration/codec/resolution extraction.
    """
    path = Path(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)

    metadata = {
        "file_type": file_type,
        "size_bytes": path.stat().st_size if path.is_file() else None,
        "mime_type": mime_type,
    }
    return metadata


def extract_audio_metadata(file_path: str) -> dict:
    """
    Real forensic metadata extraction for audio evidence using mutagen.
    Supports MP3, WAV, M4A, FLAC, OGG.
    Returns duration, bitrate, sample_rate, channels, and format/codec.
    """
    path = Path(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)

    metadata = {
        "file_type": "audio",
        "size_bytes": path.stat().st_size if path.is_file() else None,
        "mime_type": mime_type,
        "duration": None,
        "bitrate": None,
        "sample_rate": None,
        "channels": None,
        "format": None,
    }

    try:
        audio = MutagenFile(file_path)

        if audio is None:
            metadata["error"] = "Unsupported or unreadable audio file."
            return metadata

        info = audio.info

        metadata["duration"] = getattr(info, "length", None)
        metadata["bitrate"] = getattr(info, "bitrate", None)
        metadata["sample_rate"] = getattr(info, "sample_rate", None)
        metadata["channels"] = getattr(info, "channels", None)

        # WAV फाइल्समध्ये अनेकदा info.bitrate थेट मिळत नाही,
        # म्हणून sample_rate * bits_per_sample * channels वरून calculate करतो
        if not metadata["bitrate"] and metadata["sample_rate"] and metadata["channels"]:
            bits_per_sample = getattr(info, "bits_per_sample", 16)
            metadata["bitrate"] = (
                metadata["sample_rate"] * bits_per_sample * metadata["channels"]
            )

        codec = getattr(info, "codec", None)

        metadata["format"] = (
            codec
            if codec
            else path.suffix.lstrip(".").upper()
        )

    except Exception as e:
        metadata["error"] = f"Could not read audio metadata: {str(e)}"

    return metadata


def extract_video_metadata(file_path: str) -> dict:
    """
    Real forensic metadata extraction for video evidence using hachoir.
    Supports MP4, MOV, AVI, MKV, WEBM.
    Returns duration, resolution, codec, fps, bitrate.
    """
    path = Path(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)

    metadata = {
        "file_type": "video",
        "size_bytes": path.stat().st_size if path.is_file() else None,
        "mime_type": mime_type,
        "duration": None,
        "width": None,
        "height": None,
        "codec": None,
        "fps": None,
        "bitrate": None,
        "format": path.suffix.lstrip(".").upper(),
    }

    try:
        parser = createParser(str(file_path))
        if parser is None:
            metadata["error"] = "Unsupported or unreadable video file."
            return metadata

        with parser:
            hachoir_metadata = extractMetadata(parser)

        if hachoir_metadata is None:
            metadata["error"] = "Could not extract metadata (file may be corrupted)."
            return metadata

        if hachoir_metadata.has("duration"):
            metadata["duration"] = hachoir_metadata.get("duration").total_seconds()

        if hachoir_metadata.has("width"):
            metadata["width"] = hachoir_metadata.get("width")

        if hachoir_metadata.has("height"):
            metadata["height"] = hachoir_metadata.get("height")

        if hachoir_metadata.has("frame_rate"):
            metadata["fps"] = hachoir_metadata.get("frame_rate")

        if hachoir_metadata.has("bit_rate"):
            metadata["bitrate"] = hachoir_metadata.get("bit_rate")

        if hachoir_metadata.has("compression"):
            metadata["codec"] = str(hachoir_metadata.get("compression"))

    except Exception as e:
        metadata["error"] = f"Could not read video metadata: {str(e)}"

    return metadata


def extract_evidence_metadata(file_path: str) -> dict:
    """
    Dispatch to the right metadata extractor based on file extension.
    Returns {} for file types with no dedicated extractor (falls back
    to text extraction only).
    """
    extension = get_file_extension(file_path)

    if extension in IMAGE_EXTENSIONS:
        return extract_image_metadata(file_path)

    if extension in AUDIO_EXTENSIONS:
        return extract_audio_metadata(file_path)

    if extension in VIDEO_EXTENSIONS:
        return extract_video_metadata(file_path)

    return {}


def extract_text_from_file(file_path: str) -> str:

    extension = get_file_extension(file_path)

    if extension in [".txt", ".log"]:
        with open(
            file_path,
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as file:
            return file.read()

    if extension == ".pdf":
        reader = PdfReader(file_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text

    if extension == ".csv":
        dataframe = pd.read_csv(file_path)

        return dataframe.to_string(index=False)

    return ""


def verify_file_hash(file_path: str, stored_hash: str) -> bool:
    current_hash = calculate_file_hash(file_path)

    return current_hash == stored_hash