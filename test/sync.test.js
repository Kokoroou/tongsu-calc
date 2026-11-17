const test = require('node:test');
const assert = require('node:assert');
const { decide } = require('../js/sync.js');

test('decide: máy chủ chưa có sổ', () => {
  assert.equal(decide({ rev: 0, dirty: false, empty: true }, { rev: 0 }), 'none');
  assert.equal(decide({ rev: 0, dirty: false, empty: false }, { rev: 0 }), 'push');
});
test('decide: cùng phiên bản', () => {
  assert.equal(decide({ rev: 3, dirty: false, empty: false }, { rev: 3 }), 'none');
  assert.equal(decide({ rev: 3, dirty: true, empty: false }, { rev: 3 }), 'push');
});
test('decide: máy chủ mới hơn', () => {
  assert.equal(decide({ rev: 3, dirty: false, empty: false }, { rev: 5 }), 'adopt');
  assert.equal(decide({ rev: 0, dirty: true, empty: true }, { rev: 2 }), 'adopt'); // thiết bị mới, chưa có gì
  assert.equal(decide({ rev: 3, dirty: true, empty: false }, { rev: 5 }), 'conflict');
});
