import { VocalMode } from '../contracts';

export class VocalProcessor {
  private vocalNodes: AudioNode[] = [];

  constructor() {}

  /**
   * Build the vocal processing stage
   */
  buildVocalStage(
    audioContext: AudioContext,
    inputNode: AudioNode,
    mode: VocalMode
  ): AudioNode {
    // Clear previous nodes tracking if necessary, 
    // but usually we clear them before rebuilding in the engine.
    // Here we just return the new nodes and the engine tracks them.
    // Wait, the engine tracks them to disconnect them later.
    // So this function should probably return the nodes created AND the output node.
    
    // However, looking at the original code, it pushes to `this.vocalNodes`.
    // I should return the list of created nodes so the engine can track/disconnect them.

    this.vocalNodes = [];
    
    if (!audioContext) return inputNode;

    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    
    this.vocalNodes.push(splitter, merger);
    inputNode.connect(splitter);

    if (mode === VocalMode.KARAOKE) {
      // KARAOKE: Remove Center (Mid) by using Side signal (L-R)
      // L_out = L - R
      // R_out = R - L
      
      const lPos = audioContext.createGain();
      const rNeg = audioContext.createGain();
      const rPos = audioContext.createGain();
      const lNeg = audioContext.createGain();
      
      lPos.gain.value = 1;
      rNeg.gain.value = -1;
      rPos.gain.value = 1;
      lNeg.gain.value = -1;
      
      this.vocalNodes.push(lPos, rNeg, rPos, lNeg);
      
      // Creating L - R for Left Output
      splitter.connect(lPos, 0); // L -> lPos
      splitter.connect(rNeg, 1); // R -> rNeg
      lPos.connect(merger, 0, 0);
      rNeg.connect(merger, 0, 0);
      
      // Creating R - L for Right Output
      splitter.connect(rPos, 1); // R -> rPos
      splitter.connect(lNeg, 0); // L -> lNeg
      rPos.connect(merger, 0, 1);
      lNeg.connect(merger, 0, 1);
      
      return merger;

    } else if (mode === VocalMode.MUSICIAN) {
      // MUSICIAN: Isolate Center (Mid) = (L+R)/2 + Bandpass
      
      const sumGain = audioContext.createGain();
      sumGain.gain.value = 0.5; // Average L+R
      
      // Bandpass to focus on vocal range (approx 300Hz - 3400Hz)
      // Using 1kHz Center with wide Q
      const bandpass = audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1000;
      bandpass.Q.value = 0.5; 

      // Highpass to remove low rumble
      const highpass = audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 200;

      this.vocalNodes.push(sumGain, bandpass, highpass);
      
      // Mix L and R into sumGain
      splitter.connect(sumGain, 0);
      splitter.connect(sumGain, 1);
      
      sumGain.connect(highpass);
      highpass.connect(bandpass);
      
      // Output Mono to both channels
      bandpass.connect(merger, 0, 0);
      bandpass.connect(merger, 0, 1);
      
      return merger;
    }
    
    return inputNode;
  }

  getCreatedNodes(): AudioNode[] {
    return this.vocalNodes;
  }
}
