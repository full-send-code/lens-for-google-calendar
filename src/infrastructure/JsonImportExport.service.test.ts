import { JsonImportExportService } from './JsonImportExport.service';

// Simple tests focusing on static method availability
describe('JsonImportExportService', () => {
  describe('static methods', () => {
    it('should have exportToFile static method', () => {
      expect(typeof JsonImportExportService.exportToFile).toBe('function');
    });

    it('should have importFromFile static method', () => {
      expect(typeof JsonImportExportService.importFromFile).toBe('function');
    });
  });
});