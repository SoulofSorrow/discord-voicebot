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
      assert.strictEqual(ValidationService.validateChannelName('General Chat'), true);
      assert.strictEqual(ValidationService.validateChannelName('User-Room'), true);
      assert.strictEqual(ValidationService.validateChannelName('Gaming 123'), true);
    });

    it('should reject invalid channel names', () => {
      assert.strictEqual(ValidationService.validateChannelName(''), false);
      assert.strictEqual(ValidationService.validateChannelName('a'), false);
      assert.strictEqual(ValidationService.validateChannelName('a'.repeat(101)), false);
      assert.strictEqual(ValidationService.validateChannelName(null), false);
    });

    it('should reject channel names with forbidden characters', () => {
      assert.strictEqual(ValidationService.validateChannelName('Test<script>'), false);
      assert.strictEqual(ValidationService.validateChannelName('Test@everyone'), false);
      assert.strictEqual(ValidationService.validateChannelName('Test\n\nNewline'), false);
    });
  });

  describe('validateUserLimit', () => {
    it('should accept valid user limits', () => {
      assert.strictEqual(ValidationService.validateUserLimit(0), true);
      assert.strictEqual(ValidationService.validateUserLimit(5), true);
      assert.strictEqual(ValidationService.validateUserLimit(99), true);
    });

    it('should reject invalid user limits', () => {
      assert.strictEqual(ValidationService.validateUserLimit(-1), false);
      assert.strictEqual(ValidationService.validateUserLimit(100), false);
      assert.strictEqual(ValidationService.validateUserLimit('5'), false);
      assert.strictEqual(ValidationService.validateUserLimit(null), false);
    });
  });

  describe('validateBitrate', () => {
    it('should accept valid bitrates', () => {
      assert.strictEqual(ValidationService.validateBitrate(8), true);
      assert.strictEqual(ValidationService.validateBitrate(64), true);
      assert.strictEqual(ValidationService.validateBitrate(96), true);
      assert.strictEqual(ValidationService.validateBitrate(128), true);
    });

    it('should reject invalid bitrates', () => {
      assert.strictEqual(ValidationService.validateBitrate(7), false);
      assert.strictEqual(ValidationService.validateBitrate(385), false);
      assert.strictEqual(ValidationService.validateBitrate('64'), false);
      assert.strictEqual(ValidationService.validateBitrate(null), false);
    });
  });

  describe('validateRegion', () => {
    it('should accept valid regions', () => {
      assert.strictEqual(ValidationService.validateRegion('us-west'), true);
      assert.strictEqual(ValidationService.validateRegion('europe'), true);
      assert.strictEqual(ValidationService.validateRegion('singapore'), true);
      assert.strictEqual(ValidationService.validateRegion('auto'), true);
    });

    it('should reject invalid regions', () => {
      assert.strictEqual(ValidationService.validateRegion('invalid-region'), false);
      assert.strictEqual(ValidationService.validateRegion(''), false);
      assert.strictEqual(ValidationService.validateRegion(null), false);
    });
  });

  describe('validateInteraction', () => {
    it('should validate correct interaction objects', () => {
      const validInteraction = {
        user: { id: '123456789012345678' },
        guild: { id: '123456789012345678' },
        channelId: '123456789012345678'
      };
      assert.strictEqual(ValidationService.validateInteraction(validInteraction), true);
    });

    it('should reject invalid interaction objects', () => {
      assert.strictEqual(ValidationService.validateInteraction(null), false);
      assert.strictEqual(ValidationService.validateInteraction({}), false);
      assert.strictEqual(ValidationService.validateInteraction({ user: null }), false);
    });
  });
});
