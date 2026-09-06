from evidence_service import extract_audio_metadata

file_path = "sample.mp3"

result = extract_audio_metadata(file_path)

for key, value in result.items():
    print(f"{key}: {value}")