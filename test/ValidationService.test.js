import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ValidationService } from '../src/utils/ValidationService.js';

describe('ValidationService', () => {
  describe('validateUserId', () => {
    it('should accept valid user IDs', () => {
      assert.strictEqual(ValidationService.validateUserId('123456789012345678'), true);
      assert.strictEqual(ValidationService.validateUserId('987654321098765432'), true);
    });

    it('should reject invalid user IDs', () => {
      assert.strictEqual(ValidationService.validateUserId(''), false);
      assert.strictEqual(ValidationService.validateUserId('abc'), false);
      assert.strictEqual(ValidationService.validateUserId('123'), false);
      assert.strictEqual(ValidationService.validateUserId(null), false);
      assert.strictEqual(ValidationService.validateUserId(undefined), false);
    });

    it('should reject user IDs with special characters', () => {
      assert.strictEqual(ValidationService.validateUserId('123456789012345<script>'), false);
      assert.strictEqual(ValidationService.validateUserId('<@123456789012345678>'), false);
    });
  });

  describe('validateChannelName', () => {
    it('should accept valid channel names', () => {
      assert.strictEqual(ValidationService.validateChannelName('General Chat').valid, true);
      assert.strictEqual(ValidationService.validateChannelName('User-Room').valid, true);
      assert.strictEqual(ValidationService.validateChannelName('Gaming 123').valid, true);
    });

    it('should reject invalid channel names', () => {
      assert.strictEqual(ValidationService.validateChannelName('').valid, false);
      assert.strictEqual(ValidationService.validateChannelName('a').valid, false);
      assert.strictEqual(ValidationService.validateChannelName('a'.repeat(101)).valid, false);
      assert.strictEqual(ValidationService.validateChannelName(null).valid, false);
    });

    it('should reject channel names with forbidden characters', () => {
      assert.strictEqual(ValidationService.validateChannelName('Test<script>').valid, false);
      assert.strictEqual(ValidationService.validateChannelName('Test@everyone').valid, false);
      assert.strictEqual(ValidationService.validateChannelName('Test```code').valid, false);
    });
  });

  describe('validateUserLimit', () => {
    it('should accept valid user limits', () => {
      assert.strictEqual(ValidationService.validateUserLimit(0).valid, true);
      assert.strictEqual(ValidationService.validateUserLimit(5).valid, true);
      assert.strictEqual(ValidationService.validateUserLimit(99).valid, true);
      // Strings are also accepted and parsed
      assert.strictEqual(ValidationService.validateUserLimit('5').valid, true);
    });

    it('should reject invalid user limits', () => {
      assert.strictEqual(ValidationService.validateUserLimit(-1).valid, false);
      assert.strictEqual(ValidationService.validateUserLimit(100).valid, false);
      assert.strictEqual(ValidationService.validateUserLimit('abc').valid, false);
      assert.strictEqual(ValidationService.validateUserLimit(null).valid, false);
    });
  });

  describe('validateBitrate', () => {
    it('should accept valid bitrates', () => {
      assert.strictEqual(ValidationService.validateBitrate(8).valid, true);
      assert.strictEqual(ValidationService.validateBitrate(64).valid, true);
      assert.strictEqual(ValidationService.validateBitrate(96).valid, true);
      assert.strictEqual(ValidationService.validateBitrate(128).valid, true);
      // Strings are also accepted and parsed
      assert.strictEqual(ValidationService.validateBitrate('64').valid, true);
    });

    it('should reject invalid bitrates', () => {
      assert.strictEqual(ValidationService.validateBitrate(7).valid, false);
      assert.strictEqual(ValidationService.validateBitrate(385).valid, false);
      assert.strictEqual(ValidationService.validateBitrate('abc').valid, false);
      assert.strictEqual(ValidationService.validateBitrate(null).valid, false);
    });
  });

  describe('validateRegion', () => {
    it('should accept valid regions', () => {
      assert.strictEqual(ValidationService.validateRegion('us-west').valid, true);
      assert.strictEqual(ValidationService.validateRegion('europe').valid, true);
      assert.strictEqual(ValidationService.validateRegion('singapore').valid, true);
      assert.strictEqual(ValidationService.validateRegion('auto').valid, true);
    });

    it('should reject invalid regions', () => {
      assert.strictEqual(ValidationService.validateRegion('invalid-region').valid, false);
      assert.strictEqual(ValidationService.validateRegion('').valid, false);
      assert.strictEqual(ValidationService.validateRegion(null).valid, false);
    });
  });

  describe('validateInteraction', () => {
    it('should validate correct interaction objects', () => {
      const validInteraction = {
        user: { id: '123456789012345678' },
        guild: { id: '123456789012345678' },
        channelId: '123456789012345678'
      };
      assert.strictEqual(ValidationService.validateInteraction(validInteraction).valid, true);
    });

    it('should reject invalid interaction objects', () => {
      assert.strictEqual(ValidationService.validateInteraction(null).valid, false);
      assert.strictEqual(ValidationService.validateInteraction({}).valid, false);
      assert.strictEqual(ValidationService.validateInteraction({ user: null }).valid, false);
    });
  });
});
