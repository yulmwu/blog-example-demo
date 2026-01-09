export const parsePositiveInt = (v) => {
    if (v == null) return null
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n > 0 ? n : null
}

export const clampInt = (n, min, max) => {
    if (!Number.isFinite(n)) return min
    return Math.min(max, Math.max(min, n))
}
