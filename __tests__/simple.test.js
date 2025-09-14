describe('Jest Setup', () => {
  test('should pass basic assertions', () => {
    expect(2 + 2).toBe(4);
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
