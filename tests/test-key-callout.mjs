import test from 'node:test';
import assert from 'node:assert/strict';
import {compileKeyCallouts, KEY_CALLOUT_POLICY, KEY_CALLOUT_TEXT} from '../scripts/lib/key-callout.mjs';
const lines = (text = '여기서 중요한 한 가지!') => [
  {id: 's1', text: '본문입니다.', start: 0, end: 3, words: []},
  {id: 's2', text, start: 10, end: 11.2, words: []},
];
test('「여기서 중요한 한 가지」 문장 구간에 강조를 만든다', () => {
  const r = compileKeyCallouts({policy: KEY_CALLOUT_POLICY, lines: lines(), fps: 30, contentFrames: 900});
  assert.deepEqual(r.errors, []);
  assert.equal(r.key_callouts.length, 1);
  assert.equal(r.key_callouts[0].text, KEY_CALLOUT_TEXT);
  assert.equal(r.key_callouts[0].line, 's2');
  assert.equal(r.key_callouts[0].from, 297);
  assert.equal(r.key_callouts[0].end, 346);
});
test('띄어쓰기·문장부호가 달라도 같은 문구로 본다', () => {
  for (const text of ['여기서 중요한 한가지!', '여기서, 중요한 한 가지.', '여기서 중요한 한 가지! 이렇게 높은 가격에도']) {
    assert.equal(compileKeyCallouts({policy: KEY_CALLOUT_POLICY, lines: lines(text), fps: 30, contentFrames: 900}).key_callouts.length, 1, text);
  }
});
test('다른 문장·계약 없음은 강조하지 않고, 모르는 계약은 오류', () => {
  assert.equal(compileKeyCallouts({policy: KEY_CALLOUT_POLICY, lines: lines('중요한 건 하나입니다.'), fps: 30, contentFrames: 900}).key_callouts.length, 0);
  assert.deepEqual(compileKeyCallouts({policy: null, lines: lines(), fps: 30, contentFrames: 900}), {errors: [], key_callouts: []});
  assert.equal(compileKeyCallouts({policy: 'key-callout@9', lines: lines(), fps: 30, contentFrames: 900}).errors[0].code, 'key-callout-policy');
});
test('본문 끝을 넘지 않는다', () => {
  assert.equal(compileKeyCallouts({policy: KEY_CALLOUT_POLICY, lines: lines(), fps: 30, contentFrames: 340}).key_callouts[0].end, 340);
});
