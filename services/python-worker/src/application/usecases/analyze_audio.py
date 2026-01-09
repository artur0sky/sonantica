import logging
import os
from ...utils.audio_analyzer import analyze_audio
from ...config.settings import settings

logger = logging.getLogger("AudioWorker")

class AnalyzeAudioUseCase:
    def __init__(self, audio_repo):
        self.audio_repo = audio_repo

    def execute(self, job_data):
        rel_path = job_data.get("file_path")
        full_path = os.path.join(job_data.get("root", settings.MEDIA_PATH), rel_path)
        trace_id = job_data.get("trace_id", "N/A")
        
        logger.info(f"🎧 Analyzing audio: {rel_path}", extra={"trace_id": trace_id})
        
        meta = analyze_audio(full_path, settings.MEDIA_PATH)
        if meta:
            self.audio_repo.save_track(meta, rel_path)
            return {"status": "success", "track": meta["title"]}
        
        return {"status": "failed", "path": rel_path}
