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

  // preserve the range unit token (e.g. "bytes") verbatim
  ranges.type = str.slice(0, index)

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
      // suffix-byte-range-spec: last `end` bytes
      // endpoints are inclusive, e.g. -400 of 1000 => 600-999
      start = Math.max(size - end, 0)
      end = size - 1
    } else if (endStr.length === 0) {
      // open-ended range: start through the final byte
      end = size - 1
    }

    // invalid format range
    if (isNaN(start) || isNaN(end)) {
      continue
    }

    // limit last-byte-pos to current length (inclusive index)
    if (end > size - 1) {
      end = size - 1
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
    // -1: well-formed but unsatisfiable; -2: malformed header
    return valid ? -1 : -2
  }

  return options && options.combine
    ? combineRanges(ranges)
    : ranges
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

    // only start a new group when a gap exists: adjacent ranges
    // (range.start === current.end + 1) and overlaps merge together
    if (range.start > current.end + 1) {
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
