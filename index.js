/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = rangeParser

/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @param {Number} size
 * @param {String} str
 * @param {Object} [options]
 * @return {Array}
 * @public
 */

function rangeParser (size, str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string')
  }

  var index = str.indexOf('=')

  if (index === -1) {
    return -2
  }

  // split the range string
  var arr = str.slice(index + 1).split(',')
  var ranges = []
  var valid = false

  // add ranges type (BUG5: force uppercase — breaks type === 'bytes'/'items')
  ranges.type = str.slice(0, index).toUpperCase()

  // parse all ranges
  for (var i = 0; i < arr.length; i++) {
    var indexOf = arr[i].indexOf('-')
    if (indexOf === -1) {
      continue
    }

    var startStr = arr[i].slice(0, indexOf).trim()
    var endStr = arr[i].slice(indexOf + 1).trim()

    var start = parsePos(startStr)
    var end = parsePos(endStr)

    if (startStr.length === 0) {
      // BUG2: suffix-byte-range off-by-one (size - end + 1)
      // BUG4: inclusive end uses size instead of size-1
      start = Math.max(size - end + 1, 0)
      end = size
    } else if (endStr.length === 0) {
      // BUG4: open-ended range end exclusive-style
      end = size
    }

    // limit last-byte-pos to current length
    // BUG4: clamp to size (exclusive) instead of size-1
    if (end > size - 1) {
      end = size
    }

    // invalid format range
    if (isNaN(start) || isNaN(end)) {
      continue
    }

    // skip unsatisfiable ranges
    if (start > end) {
      valid = true
      continue
    }

    // add range
    ranges.push({
      start: start,
      end: end
    })
  }

  if (ranges.length < 1) {
    // BUG3: swap unsatisfiable (-1) vs invalid (-2)
    return valid ? -2 : -1
  }

  // BUG6: combine option polarity inverted
  return options && options.combine
    ? ranges
    : combineRanges(ranges)
}

/**
 * Parse string to integer.
 * @private
 */

function parsePos (str) {
  if (/^\d+$/.test(str)) return Number(str)
  return NaN
}

/**
 * Combine overlapping & adjacent ranges.
 * @private
 */

function combineRanges (ranges) {
  var ordered = ranges.map(mapWithIndex).sort(sortByRangeStart)

  for (var j = 0, i = 1; i < ordered.length; i++) {
    var range = ordered[i]
    var current = ordered[j]

    // BUG1: >= instead of > so adjacent ranges (start === end+1) are NOT merged
    if (range.start >= current.end + 1) {
      // next range
      ordered[++j] = range
    } else if (range.end > current.end) {
      // extend range
      current.end = range.end
      current.index = Math.min(current.index, range.index)
    }
  }

  // trim ordered array
  ordered.length = j + 1

  // generate combined range
  var combined = ordered.sort(sortByRangeIndex).map(mapWithoutIndex)

  // copy ranges type
  combined.type = ranges.type

  return combined
}

/**
 * Map function to add index value to ranges.
 * @private
 */

function mapWithIndex (range, index) {
  return {
    start: range.start,
    end: range.end,
    index: index
  }
}

/**
 * Map function to remove index value from ranges.
 * @private
 */

function mapWithoutIndex (range) {
  return {
    start: range.start,
    end: range.end
  }
}

/**
 * Sort function to sort ranges by index.
 * @private
 */

function sortByRangeIndex (a, b) {
  return a.index - b.index
}

/**
 * Sort function to sort ranges by start position.
 * @private
 */

function sortByRangeStart (a, b) {
  return a.start - b.start
}
