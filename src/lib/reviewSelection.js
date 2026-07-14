export function clearReviewSelection(selection) {
  try {
    if (!selection?.toString()) {
      return
    }

    selection.removeAllRanges?.()
  } catch {
    // Selection objects can become detached while the DOM updates; clearing is best-effort.
  }
}
