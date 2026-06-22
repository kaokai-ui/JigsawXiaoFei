export function vibrateSuccess(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch {
    // ignore
  }
}

export function vibrateError(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  } catch {
    // ignore
  }
}
