# Links for Github

A chrome extension (and greasemonkey userscript) to enable sane linking in markdown and other rendered text files on Github.

**tl;dr**: Addresses this long running Github feature request: [Branch relative links in markdown files](https://github.com/github/markup/issues/101)

## Install

  * [Chrome](https://chrome.google.com/webstore/detail/github-links/ofifaalchickdncbbfendodoamlimlkm)
  * [Firefox](https://raw.github.com/mal/github-links/master/src/github-links.user.js)
    (requires [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/))

## Problem

Github has long rendered various types of file within repositories; `README`, markdown files etc. However, due to the URL structure of these pages it has always been difficult to link to other rendered pages in a relative manner to form a cohesive experience.

### Absolute URLs

Typically users have linked these pages together using absolute URLs. This works very well when using a single branch on a single repository, however this is not so when trying to view pages on other branches, or in forked repositories, as all links point to the original fork's master branch.

### Relative URLs

An alternative is to use document relative URLs. The problem here can be seen most clearly on repository home pages (`/user/repo`), because these pages are also rendered on `/user/repo/blob/master/readme.md`. Any relative links will be broken on at least one of these two pages, which is far from ideal. This issue also occurs when viewing directories with and without a trailing `/`.

In addition, because raw files are served from `raw.github.com` there is no way to relatively embed an image.

## Solution

This extension uses javascript applied by the browser to manipulate links it finds on rendered Github pages (including images and edit page previews) to do a number of things:

### Correctly base links

Manipulate the base of rendered hyperlinks, such that relative links behave as expected even in the case of `/user/repo` and `/user/repo/blob/master/readme.md`.

### Allow branch relative URLs

Just like `../` goes one directory up, this plugin allows the use of `.../` to go up to the root of the current branch. This feature is intended to help alleviate the need to combine multiple `../` which must be updated in the event of the origin file being moved to a different level.

**WARNING**: *Using* `.../` *will break compatibility outside of github*

### Allow path agnostic URLs

Best way to think of this feature is wiki style linking. If the destination is in the same directory, and the filename is unique within the current branch, the link will point to that file, even if it is not really in the current directory.

See [example](#examples) below.

### All of the above for images

All the fixes described above are also applied to images, with the additional step of converting the URL to link to the correct place on `raw.github.com`. This allows the relative embedding of images!

## Examples

Confused? Hopefully this set of exmaples will help clear things up. Almost everything is intuitive, but documentation sometimes doesn't help it seem that way, oh well. Start off by imagining the following repository structure hosted at `github.com/user/repo`:

```
./
├─ readme.md
├─ abc/
│  ├─ def/
│  │  └─ ghi.md
│  └─ jkl.md
└─ mno/
   ├─ pqr/
   │  ├─ readme.md
   │  └─ stu.md
   └─ vwx.md
```

            | Legend
:----------:|:--------------------------------------------
 :octocat:  | **GitHub**
 :bookmark: | **GitHub** with **Links**
 ✓          | Correct
 ✗          | Broken/Erroneous
 ~          | Brittle (stuck on `/user/repo` at `master`)


**From** `/user/repo/abc/def/ghi.md` **link to** `/user/repo/mno/pqr/stu.md`

 :octocat: | :bookmark: | href
:---------:|:----------:|:-----
 ~         |            | `/user/repo/blob/master/mno/pqr/stu.md`
 ✓         | ✓          | `../../mno/pqr/stu.md`
 ✗         | ✓          | `.../mno/pqr/stu.md`
 ✗         | ✓          | `stu.md`

**From** `/user/repo/mno/vwx.md` **link to** `/user/repo/mno/pqr/readme.md`

 :octocat: | :bookmark: | href | notes
:---------:|:----------:|:-----|:------
 ~         |            | `/user/repo/blob/master/mno/pqr/readme.md`
 ✓         | ✓          | `pqr/readme.md`
 ✗         | ✓          | `.../mno/pqr/readme.md`
 ✗         | ✗          | `readme.md` | *not a unique filename, so is document relative*

**From** `/user/repo` **(main** `readme.md` **is rendered) link to** `/user/repo/mno/vwx.md`

 :octocat: | :bookmark: | href | notes
:---------:|:----------:|:-----|:------
 ~         |            | `/user/repo/blob/master/mno/vwx.md`
 ~         |            | `blob/master/mno/vwx.md` | *repo relative; but breaks on* `/user/repo/blob/master/readme.md`
 ✗         | ✓          | `mno/vwx.md`
 ✗         | ✓          | `.../mno/vwx.md`
 ✗         | ✓          | `vwx.md`
