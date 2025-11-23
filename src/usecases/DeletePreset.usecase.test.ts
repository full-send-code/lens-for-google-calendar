/**
 * Delete Preset Use Case Tests
 */

import { DeletePresetUseCase } from './DeletePreset.usecase';
import { PresetNotFoundError } from '../core/errors';
import type { PresetRepository } from '../core/repositories';

describe('DeletePresetUseCase', () => {
  let useCase: DeletePresetUseCase;
  let mockPresetRepository: jest.Mocked<PresetRepository>;

  beforeEach(() => {
    mockPresetRepository = {
      savePreset: jest.fn(),
      loadPreset: jest.fn(),
      getAllPresets: jest.fn(),
      deletePreset: jest.fn(),
      presetExists: jest.fn()
    };

    useCase = new DeletePresetUseCase(mockPresetRepository);
  });

  describe('execute', () => {
    it('should delete an existing preset', async () => {
      // Arrange
      mockPresetRepository.presetExists.mockResolvedValue(true);
      mockPresetRepository.deletePreset.mockResolvedValue();

      // Act
      await useCase.execute('work-preset');

      // Assert
      expect(mockPresetRepository.presetExists).toHaveBeenCalledWith('work-preset');
      expect(mockPresetRepository.deletePreset).toHaveBeenCalledWith('work-preset');
    });

    it('should throw error if preset name is empty', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow('Preset name cannot be empty');
      await expect(useCase.execute('   ')).rejects.toThrow('Preset name cannot be empty');
    });

    it('should throw PresetNotFoundError if preset does not exist', async () => {
      // Arrange
      mockPresetRepository.presetExists.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute('non-existent')).rejects.toThrow(PresetNotFoundError);
      await expect(useCase.execute('non-existent')).rejects.toThrow('non-existent');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockPresetRepository.presetExists.mockRejectedValue(new Error('Repository error'));

      // Act & Assert
      await expect(useCase.execute('test-preset')).rejects.toThrow('Repository error');
    });

    it('should handle delete operation errors', async () => {
      // Arrange
      mockPresetRepository.presetExists.mockResolvedValue(true);
      mockPresetRepository.deletePreset.mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(useCase.execute('test-preset')).rejects.toThrow('Delete failed');
    });
  });
});