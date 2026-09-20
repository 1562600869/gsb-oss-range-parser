# range-parser

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Range header field parser.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install range-parser
```

## API

<!-- eslint-disable no-unused-vars -->

```js
var parseRange = require('range-parser')
```

### parseRange(size, header, options)

Parse the given `header` string where `size` is the size of the selected
representation that is to be partitioned into subranges. An array of subranges
will be returned or negative numbers indicating an error parsing.

  * `-2` signals a malformed header string
  * `-1` signals an unsatisfiable range

<!-- eslint-disable no-undef -->

```js
// parse header from request
var subranges = parseRange(size, req.headers.range)

// the type of the subranges
if (subranges.type === 'bytes') {
  // the ranges
  subranges.forEach(function (r) {
    // do something with r.start and r.end
  })
}
```

#### Options

These properties are accepted in the options object.

##### combine

Specifies if overlapping & adjacent subranges should be combined, defaults to
`false`. When `true`, ranges will be combined and returned as if they were
specified that way in the header.

<!-- eslint-disable no-undef -->

```js
parseRange(100, 'bytes=50-55,0-10,5-10,56-60', { combine: true })
// => [
//      { start: 0,  end: 10 },
//      { start: 50, end: 60 }
//    ]
```

## 关键语义（中文说明）

本库依据 RFC 7233 解析 `Range` 请求头，零运行时依赖。

- 导出 `rangeParser(size, str, options?)`：`str` 非字符串时抛 `TypeError`。
- 返回值：解析完全失败（无 `=`、无任何合法区间）返回 `-2`；存在语法合法但不可满足的区间（起始越界或 `start > end`）返回 `-1`；成功则返回带 `.type` 属性的数组，`.type` 原样保留 `=` 前的单位串（如 `bytes`、`items`，不做大小写转换）。
- 每个区间为 `{ start, end }`，两端均为**含端点下标**，合法范围是 `0 ~ size-1`：
  - 后缀区间 `-N`：表示最后 N 个字节，`start = max(size - N, 0)`，`end = size - 1`；`-0` 不可满足（返回 `-1`），N 超过 size 时覆盖整个表示。
  - 开区间 `N-`：`end = size - 1`（含最后一个字节）。
  - 普通区间 `N-M`：`end` 超过 `size - 1` 时截断为 `size - 1`。
  - 多区间以逗号分隔，区间两侧允许空白；格式非法的单条被跳过。
- `options.combine`（默认 `false`）：为 `true` 时合并**重叠**与**相邻**（下一区间 `start <= 当前 end + 1` 即合并）的区间，并按各区间首次出现的顺序输出；缺省或 `false` 时保持输入顺序与条数，不做合并。

## License

[MIT](LICENSE)

[ci-image]: https://badgen.net/github/checks/jshttp/range-parser/master?label=ci
[ci-url]: https://github.com/jshttp/range-parser/actions/workflows/ci.yml
[coveralls-image]: https://badgen.net/coveralls/c/github/jshttp/range-parser/master
[coveralls-url]: https://coveralls.io/r/jshttp/range-parser?branch=master
[node-image]: https://badgen.net/npm/node/range-parser
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://badgen.net/npm/dm/range-parser
[npm-url]: https://npmjs.org/package/range-parser
[npm-version-image]: https://badgen.net/npm/v/range-parser

---

Upstream: https://github.com/jshttp/range-parser (MIT). GSB Mode A green init snapshot; slim for GSB.
