_**MOTHBALLED** - MOST FUNCTIONALITY NATIVELY SUPPORTED BY GITHUB_

---

# Navi

Navi is a chrome extension (and greasemonkey userscript) to fix relative linking in markdown and other rendered text files on GitHub.

It was inspired by this long running GitHub feature request: [Branch relative links in markdown files](https://github.com/github/markup/issues/101).

## Install

  * [Chrome](https://chrome.google.com/webstore/detail/navi/ofifaalchickdncbbfendodoamlimlkm)
  * [Firefox](https://raw.github.com/mal/navi/master/src/navi.user.js)
    (requires [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/))

## Why?

*tl;dr: We needed a wiki, but we wanted more visibility and we love Git and GitHub.*

We'd already been using GitHub's markdown rendering for smaller projects such as coding standards. It was a good fit as it allowed our standards to be a dynamic document (with awesome syntax highlighting). All changes could be reviewed in pull requests sparking discussion (sometimes heated!) and ultimately helping reach a compromise everyone was happy with (or not).

When we looked at how we used GitHub for this purpose vs. how we were using (or not using) our wiki which contained more day to day information about various processes and components, we could see a huge difference.

While the wiki stagnated due to changing code, components and a general lack of visibility, the coding standards repository was getting updated not just with suggestions on style but with new languages, even if it was just a few lines at first, we were then having discussions and fleshing out these stubs as a team.

The main thing preventing us from `git init`ing the wiki-based knowledge base and switching to GitHub was the interlinking we'd need to maintain between pages and the [problems](https://github.com/mal/navi/blob/master/design.md#problem) associated with it. And thus Navi was born.

## Embed

Obviously as an extension, this can only benefit people using it, so if you plan to use it with your repo, be sure and include a link so your users can install it!

Example: **Requires Navi** for [Chrome](https://chrome.google.com/webstore/detail/navi/ofifaalchickdncbbfendodoamlimlkm) or [Firefox](https://raw.github.com/mal/navi/master/src/navi.user.js)

```markdown
**Requires Navi** for [Chrome](https://chrome.google.com/webstore/detail/navi/ofifaalchickdncbbfendodoamlimlkm) or [Firefox](https://raw.github.com/mal/navi/master/src/navi.user.js)
```

There are also several icons located in the `src/icons` directory that you can use for this purpose if you wish:

![Navi 128x128](https://raw.github.com/mal/navi/master/src/icons/128.png)
![Navi 48x48](https://raw.github.com/mal/navi/master/src/icons/48.png)
![Navi 16x16](https://raw.github.com/mal/navi/master/src/icons/16.png)

## Design Document

Available [here](https://github.com/mal/navi/blob/master/design.md).
