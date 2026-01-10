import asyncio
import logging
import torch
import torchaudio
from transformers import AutoProcessor, ClapModel
from typing import List
import os

from ..domain.repositories import IAudioEmbedder
from .config import settings

logger = logging.getLogger(__name__)

class ClapEmbedder(IAudioEmbedder):
    def __init__(self):
        self.model_name = settings.AI_MODEL_NAME
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = None
        self._processor = None
        self._lock = asyncio.Lock()
        logger.info(f"ClapEmbedder initialized on {self.device}")

    def _load_model(self):
        if self._model is None:
            logger.info(f"Loading CLAP model: {self.model_name}")
            # Ensure cache dirs exist
            os.makedirs(settings.TORCH_HOME, exist_ok=True)
            os.makedirs(settings.HF_HOME, exist_ok=True)
            
            self._processor = AutoProcessor.from_pretrained(self.model_name)
            self._model = ClapModel.from_pretrained(self.model_name).to(self.device)
            self._model.eval()
            logger.info("CLAP model loaded successfully")

    async def generate_embedding(self, file_path: str) -> List[float]:
        async with self._lock:
            # Lazy load model in the first call to save memory if not used
            if self._model is None:
                await asyncio.to_thread(self._load_model)

            try:
                # Resolve full path
                full_path = file_path
                if not os.path.isabs(file_path):
                    full_path = os.path.join(settings.MEDIA_PATH, file_path)
                
                if not os.path.exists(full_path):
                    logger.error(f"❌ File does not exist: {full_path}")
                    raise FileNotFoundError(f"Audio file not found: {full_path}")

                # Load audio
                logger.info(f"🔊 Loading audio for embedding (max 60s): {full_path}")
                try:
                    # CLAP doesn't need the whole song to get the "vibe"
                    # Loading first 60 seconds is enough for similarity and prevents OOM
                    # 48000 * 60 = 2,880,000 frames
                    waveform, sample_rate = await asyncio.to_thread(torchaudio.load, full_path, frame_offset=0, num_frames=48000*60)
                    logger.info(f"✅ Loaded audio sample: {waveform.shape}, sr={sample_rate}")
                except Exception as load_err:
                    logger.error(f"❌ Torchaudio failed to load {full_path}: {load_err}")
                    raise load_err
                
                # If stereo, average to mono
                if waveform.shape[0] > 1:
                    logger.debug("Mixing down to mono")
                    waveform = torch.mean(waveform, dim=0, keepdim=True)
                
                # Resample to 48kHz if needed (CLAP requirement)
                if sample_rate != 48000:
                    logger.debug(f"Resampling from {sample_rate} to 48000")
                    resampler = torchaudio.transforms.Resample(sample_rate, 48000).to(waveform.device)
                    waveform = resampler(waveform)
                    sample_rate = 48000

                # Encode
                # Waveform is [1, T], CLAP processor expects [T] or list
                audio_np = waveform.squeeze().numpy()
                inputs = self._processor(audios=audio_np, sampling_rate=sample_rate, return_tensors="pt")
                inputs = {k: v.to(self.device).to(self._model.dtype) for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = self._model.get_audio_features(**inputs)
                
                # Convert to list and normalize
                vector = outputs.cpu().squeeze().tolist()
                return vector

            except Exception as e:
                logger.error(f"Error generating embedding for {file_path}: {e}")
                raise e

    def get_model_version(self) -> str:
        return self.model_name

    async def list_models(self) -> List[str]:
        return [self.model_name]
