import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Sanitizer } from '../src/utils/Sanitizer.js';

describe('Sanitizer', () => {
  describe('sanitizeChannelName', () => {
    it('should sanitize basic channel names correctly', () => {
      assert.strictEqual(Sanitizer.sanitizeChannelName('Test Channel'), 'Test Channel');
      assert.strictEqual(Sanitizer.sanitizeChannelName('User-Room'), 'User-Room');
    });

    it('should remove dangerous characters', () => {
      assert.strictEqual(Sanitizer.sanitizeChannelName('Test<script>'), 'Testscript');
      assert.strictEqual(Sanitizer.sanitizeChannelName('Test@everyone'), 'Testeveryone');
      assert.strictEqual(Sanitizer.sanitizeChannelName('Test\n\nChannel'), 'Test Channel');
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(150);
      const result = Sanitizer.sanitizeChannelName(longName);
      assert.ok(result.length <= 100);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(Sanitizer.sanitizeChannelName(''), 'Unnamed Channel');
      assert.strictEqual(Sanitizer.sanitizeChannelName(null), 'Unnamed Channel');
      assert.strictEqual(Sanitizer.sanitizeChannelName(undefined), 'Unnamed Channel');
    });

    it('should trim whitespace', () => {
      assert.strictEqual(Sanitizer.sanitizeChannelName('  Test  '), 'Test');
      assert.strictEqual(Sanitizer.sanitizeChannelName('\tTest\t'), 'Test');
    });
  });

  describe('sanitizeUserId', () => {
    it('should accept valid user IDs', () => {
      assert.strictEqual(Sanitizer.sanitizeUserId('123456789012345678'), '123456789012345678');
    });

    it('should remove non-numeric characters', () => {
      assert.strictEqual(Sanitizer.sanitizeUserId('<@123456789012345678>'), '123456789012345678');
      assert.strictEqual(Sanitizer.sanitizeUserId('123abc456'), '123456');
    });

    it('should handle edge cases', () => {
      assert.strictEqual(Sanitizer.sanitizeUserId(''), null);
      assert.strictEqual(Sanitizer.sanitizeUserId(null), null);
      assert.strictEqual(Sanitizer.sanitizeUserId('abc'), null);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize general input strings', () => {
      assert.strictEqual(Sanitizer.sanitizeInput('Normal text'), 'Normal text');
      assert.strictEqual(Sanitizer.sanitizeInput('Test  spaces'), 'Test  spaces');
    });

    it('should remove dangerous HTML/Script tags', () => {
      const dangerous = '<script>alert("xss")</script>';
      const result = Sanitizer.sanitizeInput(dangerous);
      assert.ok(!result.includes('<script>'));
    });

    it('should handle special characters', () => {
      assert.strictEqual(Sanitizer.sanitizeInput('Test & Co.'), 'Test & Co.');
      assert.ok(!Sanitizer.sanitizeInput('Test@here').includes('@here'));
    });

    it('should handle null/undefined', () => {
      assert.strictEqual(Sanitizer.sanitizeInput(null), '');
      assert.strictEqual(Sanitizer.sanitizeInput(undefined), '');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      assert.strictEqual(Sanitizer.sanitizeNumber('42'), 42);
      assert.strictEqual(Sanitizer.sanitizeNumber('0'), 0);
      assert.strictEqual(Sanitizer.sanitizeNumber('99'), 99);
    });

    it('should enforce min/max bounds', () => {
      assert.strictEqual(Sanitizer.sanitizeNumber('150', 0, 100), 100);
      assert.strictEqual(Sanitizer.sanitizeNumber('-10', 0, 100), 0);
    });

    it('should return default for invalid input', () => {
      assert.strictEqual(Sanitizer.sanitizeNumber('abc', 0, 100, 10), 10);
      assert.strictEqual(Sanitizer.sanitizeNumber('', 0, 100, 5), 5);
      assert.strictEqual(Sanitizer.sanitizeNumber(null, 0, 100, 10), 10);
    });

    it('should handle floating point inputs', () => {
      assert.strictEqual(Sanitizer.sanitizeNumber('42.7'), 42);
      assert.strictEqual(Sanitizer.sanitizeNumber('99.99'), 99);
    });
  });
});
