import { IEQBand, EQBandType } from '../contracts';
import { mapBandTypeToFilterType } from '../utils/audioUtils';

export class EQProcessor {
  private eqNodes: BiquadFilterNode[] = [];

  constructor() {}

  /**
   * Build the EQ processing chain
   * Returns the last node in the chain (or the input node if no bands are active)
   */
  buildEQChain(
    audioContext: AudioContext,
    inputNode: AudioNode,
    bands: IEQBand[]
  ): AudioNode {
    // We don't disconnect here; the caller is responsible for cleaning up old nodes 
    // using getCreatedNodes().
    this.eqNodes = [];

    if (!audioContext || bands.length === 0) {
      return inputNode;
    }

    let previousNode = inputNode;

    for (const band of bands) {
      if (!band.enabled) continue;

      const filter = audioContext.createBiquadFilter();
      
      // Configure filter
      filter.type = mapBandTypeToFilterType(band.type);
      filter.frequency.value = band.frequency;
      filter.Q.value = band.q;
      
      // Gain only applies to peaking, lowshelf, and highshelf based on the original logic
      if (band.type === EQBandType.PEAKING || 
          band.type === EQBandType.LOWSHELF || 
          band.type === EQBandType.HIGHSHELF) {
        filter.gain.value = band.gain;
      }

      // Connect to chain
      previousNode.connect(filter);
      previousNode = filter;
      
      this.eqNodes.push(filter);
    }

    return previousNode;
  }

  getCreatedNodes(): BiquadFilterNode[] {
    return this.eqNodes;
  }
}
