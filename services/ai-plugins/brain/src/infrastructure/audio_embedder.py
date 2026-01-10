import asyncio
import logging
import torch
import torchaudio
from transformers import AutoProcessor, ClapAudioModel
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
            self._model = ClapAudioModel.from_pretrained(self.model_name).to(self.device)
            self._model.eval()
            logger.info("CLAP model loaded successfully")

    async def generate_embedding(self, file_path: str) -> List[float]:
        async with self._lock:
            # Lazy load model in the first call to save memory if not used
            if self._model is None:
                await asyncio.to_thread(self._load_model)

            try:
                # Load audio
                waveform, sample_rate = await asyncio.to_thread(torchaudio.load, file_path)
                
                # CLAP expects 48kHz usually, processor handles it but let's be safe
                # If stereo, average to mono
                if waveform.shape[0] > 1:
                    waveform = torch.mean(waveform, dim=0, keepdim=True)
                
                # Encode
                inputs = self._processor(audios=waveform.squeeze().numpy(), sampling_rate=sample_rate, return_tensors="pt")
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
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
