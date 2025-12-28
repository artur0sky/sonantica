/**
 * Web Platform Folder Validator
 * 
 * Implements folder path validation for web platform using File System Access API.
 */

import type { FolderValidationResult } from '@sonantica/shared';
import type { IFolderValidator } from '@sonantica/media-library';

/**
 * Web-based folder validator using File System Access API
 */
export class WebFolderValidator implements IFolderValidator {
  async validatePath(path: string): Promise<FolderValidationResult> {
    // In web context, we can't validate paths directly
    // The path will be a handle reference or identifier
    // Validation happens when the user selects the folder
    
    if (!path || path.trim() === '') {
      return {
        valid: false,
        error: 'Folder path cannot be empty',
      };
    }

    return {
      valid: true,
    };
  }

  async pathExists(_path: string): Promise<boolean> {
    // In web, we rely on stored handles
    // This is a simplified check
    return true;
  }

  async isDirectory(_path: string): Promise<boolean> {
    // In web context, all selected folders are directories
    return true;
  }
}
