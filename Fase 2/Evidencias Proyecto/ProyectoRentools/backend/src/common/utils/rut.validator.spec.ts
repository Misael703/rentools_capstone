import { RutValidator } from './rut.validator';

describe('RutValidator', () => {
  describe('validate', () => {
    it('should validate correct RUTs', () => {
      expect(RutValidator.validate('12345678-9')).toBe(false);
      expect(RutValidator.validate('12.345.678-9')).toBe(false);
      expect(RutValidator.validate('11111111-1')).toBe(true);
    });

    it('should reject invalid RUTs', () => {
      expect(RutValidator.validate('12345678-0')).toBe(false);
      expect(RutValidator.validate('11111111-2')).toBe(false);
      expect(RutValidator.validate('')).toBe(false);
      expect(RutValidator.validate('abc')).toBe(false);
    });

    it('should handle K as valid DV', () => {
      expect(RutValidator.validate('12312328-K')).toBe(true);
    });
  });

  describe('format', () => {
    it('should format RUT correctly', () => {
      expect(RutValidator.format('123456789')).toBe('12.345.678-9');
      expect(RutValidator.format('1111111K')).toBe('1.111.111-K');
    });
  });

  describe('calculateDV', () => {
    it('should calculate correct DV', () => {
      expect(RutValidator.calculateDV('12345678')).toBe('5');
      expect(RutValidator.calculateDV('11111111')).toBe('1');
    });
  });

  describe('formatSimple', () => {
    it('should format RUT correctly in simple format', () => {
      expect(RutValidator.formatSimple('12.345.678-9')).toBe('12345678-9');
      expect(RutValidator.formatSimple('1.111.111-K')).toBe('1111111-K');
    });
  });
});