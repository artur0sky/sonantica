/**
 * StereoScope - Advanced Channel Analysis
 * 
 * Responsibilities:
 * - Split Stereo Signal
 * - Calculate Phase Correlation (Vectorscope math)
 * - Monitor True Peaks per channel
 * - Calculate Crest Factor (Dynamic Range)
 * 
 * Performance Note: Uses Float32 arrays and optimized loops.
 */
import { StereoAnalysisData } from '../contracts';

export class StereoScope {
  private splitter: ChannelSplitterNode | null = null;
  private analyserL: AnalyserNode | null = null;
  private analyserR: AnalyserNode | null = null;
  
  // Buffers
  private bufferL: Float32Array | null = null;
  private bufferR: Float32Array | null = null;
  
  // Cache to prevent GC thrashing
  private lastMetrics: StereoAnalysisData = {
    correlation: 0,
    width: 0,
    balance: 0,
    peakL: 0,
    peakR: 0,
    dynamicRange: 0,
    clipping: false
  };

  /**
   * Setup splitter and analyzers
   */
  setup(context: AudioContext, source: AudioNode): void {
    // 1. Create Splitter
    this.splitter = context.createChannelSplitter(2);
    
    // 2. Create Analysers for each channel
    this.analyserL = context.createAnalyser();
    this.analyserR = context.createAnalyser();
    
    // Configure for high precision time-domain
    // 2048 is decent resolution for phase, not too heavy
    const FFT_SIZE = 2048; 
    this.analyserL.fftSize = FFT_SIZE;
    this.analyserR.fftSize = FFT_SIZE;
    
    // 3. Routing: Source -> Splitter -> Analysers
    source.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0); // Left to 0
    this.splitter.connect(this.analyserR, 1); // Right to 1
    
    // 4. Allocate Buffers
    this.bufferL = new Float32Array(FFT_SIZE);
    this.bufferR = new Float32Array(FFT_SIZE);
  }

  /**
   * Disconnect and cleanup
   */
  dispose(): void {
    if (this.splitter) {
        try { this.splitter.disconnect(); } catch {}
        this.splitter = null;
    }
    if (this.analyserL) {
        try { this.analyserL.disconnect(); } catch {}
        this.analyserL = null;
    }
    if (this.analyserR) {
        try { this.analyserR.disconnect(); } catch {}
        this.analyserR = null;
    }
    this.bufferL = null;
    this.bufferR = null;
  }

  /**
   * Calculate metrics for the current frame
   */
  getMetrics(): StereoAnalysisData {
    if (!this.analyserL || !this.analyserR || !this.bufferL || !this.bufferR) {
        return this.lastMetrics;
    }

    // 1. Get real data
    this.analyserL.getFloatTimeDomainData(this.bufferL as any);
    this.analyserR.getFloatTimeDomainData(this.bufferR as any);

    // 2. Variables for sums
    let sumL2 = 0; // Sum of L^2
    let sumR2 = 0; // Sum of R^2
    let sumLR = 0; // Sum of L*R (Covariance)
    let sumMid2 = 0; // Sum of Mid^2
    let sumSide2 = 0; // Sum of Side^2
    
    let peakL = 0;
    let peakR = 0;
    let clipping = false;

    const len = this.bufferL.length;

    // SINGLE LOOP for performance (O(N))
    for (let i = 0; i < len; i++) {
        const l = this.bufferL[i];
        const r = this.bufferR[i];

        // Peaks
        const absL = Math.abs(l);
        const absR = Math.abs(r);
        if (absL > peakL) peakL = absL;
        if (absR > peakR) peakR = absR;
        
        // Clipping detection (standard threshold 0.99 or 1.0)
        if (absL >= 0.99 || absR >= 0.99) clipping = true;

        // Correlation inputs
        sumL2 += l * l;
        sumR2 += r * r;
        sumLR += l * r;

        // Mid/Side inputs for Width
        const mid = l + r;
        const side = l - r;
        sumMid2 += mid * mid;
        sumSide2 += side * side;
    }

    // 3. Phase Correlation
    // Formula: sum(L*R) / sqrt(sum(L^2) * sum(R^2))
    const denominator = Math.sqrt(sumL2 * sumR2);
    let correlation = 0;
    if (denominator > 0.000001) {
        correlation = sumLR / denominator;
    }
    
    // Clamp rounding errors
    correlation = Math.max(-1, Math.min(1, correlation));

    // 4. Stereo Width
    // Formula: Side Energy / Mid Energy
    // 0 = Mono, 1 = Very Wide. Can go > 1 with phase tricks.
    // Normalized simple version: S / (M + S)
    let width = 0;
    const totalEnergy = sumMid2 + sumSide2;
    if (totalEnergy > 0.000001) {
        width = sumSide2 / totalEnergy;
    }

    // 5. Balance
    // -1 (Left only) to 1 (Right only)
    let balance = 0;
    const lEnergy = sumL2;
    const rEnergy = sumR2;
    if (lEnergy + rEnergy > 0.000001) {
       balance = (rEnergy - lEnergy) / (rEnergy + lEnergy);
    }

    // 6. Dynamic Range (Instantaneous Crest Factor)
    // Crest Factor = Peak / RMS
    // RMS = sqrt(mean square)
    const rmsL = Math.sqrt(sumL2 / len);
    const rmsR = Math.sqrt(sumR2 / len);
    const avgRms = (rmsL + rmsR) / 2;
    const maxPeak = Math.max(peakL, peakR);

    // Convert to dB
    let dr = 0;
    if (avgRms > 0.000001 && maxPeak > 0.000001) {
        const crestFactor = maxPeak / avgRms;
        dr = 20 * Math.log10(crestFactor);
    }

    this.lastMetrics = {
        correlation,
        width,
        balance,
        peakL,
        peakR,
        dynamicRange: dr,
        clipping
    };

    return this.lastMetrics;
  }

  /**
   * Get raw buffers for visualization
   */
  getBuffers(): { left: Float32Array; right: Float32Array } | null {
    if (!this.bufferL || !this.bufferR) return null;
    return { left: this.bufferL, right: this.bufferR };
  }
}
