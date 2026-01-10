"""
Infrastructure Layer: Demucs Stem Separator (Adapter)
Implements IStemSeparator interface using Demucs library
"""

import logging
from typing import List, Dict
from pathlib import Path

from src.domain.repositories import IStemSeparator

logger = logging.getLogger(__name__)


class DemucsStemSeparator(IStemSeparator):
    """
    Demucs implementation of IStemSeparator.
    Follows Dependency Inversion Principle - Implements abstract interface.
    """
    
    def __init__(self):
        self._torch = None
        self._torchaudio = None
        self._demucs_model = None
        self._device = None
    
    def _lazy_import(self):
        """Lazy import heavy dependencies to speed up startup"""
        if self._torch is None:
            import torch
            import torchaudio
            from demucs.pretrained import get_model
            
            self._torch = torch
            self._torchaudio = torchaudio
            self._get_model = get_model
            
            # Determine device
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {self._device}")
    
    async def separate(
        self,
        audio_path: str,
        output_dir: str,
        model: str,
        stems: List[str]
    ) -> Dict[str, str]:
        """
        Separate audio into stems using Demucs.
        
        Returns:
            Dictionary mapping stem names to relative output paths
        """
        self._lazy_import()
        
        from demucs.apply import apply_model
        
        # Load model
        logger.info(f"Loading Demucs model: {model}")
        demucs_model = self._get_model(model)
        demucs_model.to(self._device)
        
        # Load audio
        logger.info(f"Loading audio: {audio_path}")
        wav, sr = self._torchaudio.load(audio_path)
        wav = wav.to(self._device)
        
        # Apply model
        logger.info("Separating stems...")
        with self._torch.no_grad():
            sources = apply_model(demucs_model, wav[None], device=self._device)[0]
        
        # Save stems
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Demucs output order
        stem_names = ["drums", "bass", "other", "vocals"]
        result = {}
        
        for i, stem_name in enumerate(stem_names):
            if stem_name in stems:
                stem_file = output_path / f"{stem_name}.wav"
                self._torchaudio.save(str(stem_file), sources[i].cpu(), sr)
                
                # Return relative path from output base
                result[stem_name] = f"{output_path.name}/{stem_name}.wav"
                logger.info(f"✓ Saved {stem_name}: {stem_file}")
        
        return result
    
    def is_gpu_available(self) -> bool:
        """Check if GPU acceleration is available"""
        self._lazy_import()
        return self._torch.cuda.is_available()
    
    def get_model_info(self, model: str) -> dict:
        """Get information about a specific model"""
        # Model metadata (could be extended)
        models = {
            "htdemucs": {
                "name": "Hybrid Transformer Demucs",
                "stems": ["vocals", "drums", "bass", "other"],
                "sample_rate": 44100,
                "quality": "high"
            },
            "htdemucs_ft": {
                "name": "Hybrid Transformer Demucs (Fine-tuned)",
                "stems": ["vocals", "drums", "bass", "other"],
                "sample_rate": 44100,
                "quality": "very high"
            }
        }
        
        return models.get(model, {
            "name": model,
            "stems": ["vocals", "drums", "bass", "other"],
            "sample_rate": 44100,
            "quality": "unknown"
        })
