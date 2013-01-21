# Brief

## Problem

GitHub has long rendered various types of file within repositories; `README`, markdown files etc. However, due to the URL structure of these pages it has always been difficult to link to other rendered pages in a relative manner to form a cohesive experience.

### Absolute URLs

Typically users have linked these pages together using absolute URLs. This works very well when using a single branch on a single repository, however this is not so when trying to view pages on other branches, or in forked repositories, as all links point to the original fork's master branch.

### Relative URLs

An alternative is to use document relative URLs. The problem here can be seen most clearly on repository home pages (`/user/repo`), because these pages are also rendered on `/user/repo/blob/master/readme.md`. Any relative links will be broken on at least one of these two pages, which is far from ideal. This issue also occurs when viewing directories with and without a trailing `/`.

### Images

In addition, because raw files are served from `raw.github.com` there is no way to relatively embed an image.


## Goals

### Primary

  * Find a way to let relative links work as intended on GitHub
  * Allow images to be embedded relative to page

### Secondary

  * Wiki style linking (just the filename)
  * Branch relative linking to cut down on use of `..`


## Solution

This extension uses javascript applied by the browser to manipulate links it finds on rendered GitHub pages (including images and edit page previews) to do a number of things:

### Correctly base links

Manipulate the base of rendered hyperlinks, such that relative links behave as expected even in the case of `/user/repo` and `/user/repo/blob/master/readme.md`. [Goal#P1](#goals)

### Allow branch relative URLs

Just like `../` goes one directory up, this plugin allows the use of `.../` to go up to the root of the current branch. This feature is intended to help alleviate the need to combine multiple `../` which must be updated in the event of the origin file being moved to a different level. [Goal#S2](#goals)

**WARNING**: *Using* `.../` *will break compatibility outside of GitHub*

### Wiki style linking

Best way to think of this feature is path agnostic. If the destination is in the same directory, and the filename is unique within the current branch, the link will point to that file, even if it is not really in the current directory. [Goal#S2](#goals)

See [example](#examples) below.  
**WARNING**: *Using path agnostic linking will break compatibility outside of GitHub*

### All of the above for images

All the fixes described above are also applied to images, with the additional step of converting the URL to link to the correct place on `raw.github.com`. This allows the relative embedding of images! [Goal#P2](#goals)


## Usage Examples

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
 :sparkles: | **GitHub** with **Navi**
 ✓          | Correct
 ✗          | Broken/Erroneous
 ~          | Brittle (stuck on `/user/repo` at `master`)


**From** `/user/repo/abc/def/ghi.md` **link to** `/user/repo/mno/pqr/stu.md`

 :octocat: | :sparkles: | href
:---------:|:----------:|:-----
 ~         |            | `/user/repo/blob/master/mno/pqr/stu.md`
 ✓         | ✓          | `../../mno/pqr/stu.md`
 ✗         | ✓          | `.../mno/pqr/stu.md`
 ✗         | ✓          | `stu.md`

**From** `/user/repo/mno/vwx.md` **link to** `/user/repo/mno/pqr/readme.md`

 :octocat: | :sparkles: | href | notes
:---------:|:----------:|:-----|:------
 ~         |            | `/user/repo/blob/master/mno/pqr/readme.md`
 ✓         | ✓          | `pqr/readme.md`
 ✗         | ✓          | `.../mno/pqr/readme.md`
 ✗         | ✗          | `readme.md` *not a unique filename, so is document relative*

**From** `/user/repo` **(main** `readme.md` **is rendered) link to** `/user/repo/mno/vwx.md`

 :octocat: | :sparkles: | href
:---------:|:----------:|:-----
 ~         |            | `/user/repo/blob/master/mno/vwx.md`
 ✗         | ✓          | `mno/vwx.md`
 ✗         | ✓          | `.../mno/vwx.md`
 ✗         | ✓          | `vwx.md`
