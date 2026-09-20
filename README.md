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

## 关键语义（中文）

本库零运行时依赖，用于解析 RFC 7233 的 Range 请求头，端点下标均为**含端点**：

- **返回值**：解析失败（语法畸形）返回 `-2`；语法合法但全部区间不可满足返回 `-1`；成功则返回带 `.type` 属性的区间数组，每项为 `{ start, end }`。`str` 非字符串时抛 `TypeError`。
- **单位原样保留**：`.type` 为 `=` 前的原始子串，如 `bytes`、`items`（不做大小写转换）。
- **后缀区间** `-N`：表示最后 N 个字节，`start = max(size - N, 0)`、`end = size - 1`；N 超过 size 时覆盖整个表示（如 100 字节时 `-101` → `0-99`）。
- **开区间** `N-`：从第 N 字节到末尾，`end = size - 1`；超出 size 的 end 一律 clamp 到 `size - 1`（绝不会返回 `size`）。
- **多区间与空白**：逗号分隔，区间两侧空白会被 trim；`start > end` 的单条区间视为不可满足跳过。
- **combine 选项**：默认（缺省或 `false`）保持输入顺序与条数，不做合并；仅 `{ combine: true }` 时合并重叠与**相邻**（`start === end + 1`）区间，合并结果按各区间首次出现的原始顺序输出。

## 测试

```sh
$ npm test   # mocha test/range-parser.js（零运行时依赖，devDeps 仅 mocha + deep-equal）
# 39 passing, 0 failing
# 用例组：parseRange(len, str) 主组（返回码、单/后缀/开区间/多区间、
#         空白、非 bytes 单位）+ when combine: true 子组（重叠/相邻合并、
#         保留原序）+ combine 极性与相邻合并回归
```

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
