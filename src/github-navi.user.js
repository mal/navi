// ==UserScript==
// @name        Navi for GitHub
// @description Fix relative links in readmes and other text files on GitHub
// @namespace   com.github.mal
// @match       https://github.com/*/*
// @version     0.4.4
// @grant       none
// @icon        https://raw.github.com/mal/github-navi/master/src/icons/48.png
// @downloadURL https://raw.github.com/mal/github-navi/master/src/github-navi.user.js
// ==/UserScript==

!function () {

    // vars and shit
    var base, branch, index, repo, tree,
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    // first things first
    function init() {
        // easy mode
        HTMLCollection.prototype.forEach = NodeList.prototype.forEach = Array.prototype.forEach;
        HTMLCollection.prototype.some = NodeList.prototype.some = Array.prototype.some;
        MutationObserver.prototype.watch = watch;

        // populate repo, branch and tree variables
        document.getElementsByTagName('link').some(function (link) {
            var path;

            // swipe repo and branch from RSS link
            if ( link.rel === 'alternate' && link.type === 'application/atom+xml' ) {
                path = url.parse(link.href).pathname.split('/');
                repo = path.slice(0, 3).join('/');
                branch = path.slice(4).join('/').replace(/\.atom$/, '');
            }

            // swipe tree hash from permalink
            if ( link.rel === 'permalink' )
                tree = link.href.split('/')[6];

            // got everything? lets go
            return repo && tree;
        });

        // unsupported page
        if ( ! repo )
            return;

        // couldn't find tree, try elsewhere (for edit pages)
        if ( ! tree )
            document.getElementsByName('commit').some(function (commit) {
                return tree = commit.value;
            });

        // lookup file list and generate index
        files(function (paths) {
            index = {};

            // store file:path pairs, null repeat filenames
            paths.forEach(function (path) {
                var name = path.substr(path.lastIndexOf('/') + 1);
                if ( ! (name in index) )
                    index[name] = path;
                else
                    index[name] = null;
            });

            // clear nulls leaving unique filenames only
            for ( name in index )
                if ( index[name] === null )
                    delete index[name];

            // re-mutate once populated
            mutate();
        });

        // configure observer to watch for DOM changes
        var mo = new MutationObserver(function (mutations) {
            mutations.some(function (mutation) {
                return mutation.addedNodes.some(function (node) {
                    if ( node.id === 'readme' || node.querySelector('#readme') )
                        return mutate(), true;
                });
            });
        });

        // mutate when entering a page view using ajax slider
        mo.watch('#slider .frames');

        // mutate when entering an edit page's preview mode
        mo.watch('#files .js-commit-preview');

        // mutate page as is to fix everything
        mutate();
    }

    // fetch file list from github
    function files(callback) {
        // no tree? bail
        if ( ! tree )
            return;

        // can haz cache?
        if ( typeof tree === 'object' )
            return callback(tree);

        var xhr = new XMLHttpRequest();

        // parse result into tree and callback
        xhr.onreadystatechange = function () {
            if ( xhr.readyState === 4 && xhr.status === 200 ) {
                tree = JSON.parse(xhr.responseText).paths;
                callback(tree);
            }
        }

        // go fetch daddy some files!
        xhr.open('get', repo + '/tree-list/' + tree, true);
        xhr.send();
    }

    // make tree locations safe (trailing slash)
    function location() {
        var path = window.location.pathname.split('/'),
            frame = document.querySelector('#slider .frame');
        if ( frame && frame.dataset.type === 'tree' ) {
            // if branch not in location add it
            if ( path.length < 5 )
                path = [ repo, 'tree', branch ];

            // trailing slash
            if ( path[path.length - 1] !== '' )
                path.push('');
        }
        return path.join('/');
    }

    // actually fix shit
    function mutate() {
        var readme = document.getElementById('readme');

        // nowhere to fix things
        if ( ! readme )
            return;

        // ensure we're correctly based
        rebase();

        // fix links
        readme.getElementsByTagName('a').forEach(function (a) {
            // skip anchors
            if ( a.className === 'anchor' )
                return;
            var url = rewrite(a.href);
            if ( url )
                a.href = url;
        });

        // fix images
        readme.getElementsByTagName('img').forEach(function (img) {
            var url = rewrite(img.src, true);
            if ( url )
                img.src = url;
        });
    }

    // update base tag to ensure relative links work
    function rebase() {
        if ( ! base ) {
            // look for base tag
            base = document.getElementsByTagName('base')[0];
            if ( ! base ) {
                // fallback to creating one
                base = document.createElement('base');
                document.head.appendChild(base);
            }
        }

        // update location
        base.href = location();
    }

    // magical rewriting
    function rewrite(uri, raw) {
        var hri = url.parse(uri), path;

        // make returning easy
        function out(hri) {
            var tmp = url.build(hri);
            if ( uri === tmp )
                return false;
            return tmp;
        }

        // go github or go home
        if ( hri.host !== 'github.com' || hri.pathname.indexOf(repo) )
            return false;

        // lookup in index
        hri = search(hri);

        // path to parts and drop repo
        path = hri.pathname.split('/').slice(3);

        // not valid, sack it off
        if ( path.length < 0 )
            return out(url);

        // correct resource type
        path[0] = raw ? 'raw' : !path[path.length - 1] ? 'tree' : 'blob'

        // check for repo relative links
        dots = path.indexOf('...');

        // if repo relative, rebase on branch
        if ( ~dots )
            path.splice(1, dots, branch);

        // set the repo
        path.unshift(repo);

        // update path
        hri.pathname = path.join('/');

        // done
        return out(hri);
    }

    // lookup in index
    function search(hri) {
        // nothing to look in
        if ( ! index )
            return hri;

        // parse location, clone hri
        var stem = url.parse(base.href),
            tmp = Object.create(hri);

        // strip filename from stem
        with ( stem )
            pathname = pathname.substr(0, pathname.lastIndexOf('/') + 1);

        // nuke querystrings and fragments
        stem.search = stem.hash = tmp.search = tmp.hash = '';

        // prevent commit/tree/blob being a point of contention
        [stem, tmp].forEach(function (hri) {
            var tmp = hri.pathname.split('/');
            tmp[3] = 'obj';
            hri.pathname = tmp.join('/');
        });

        // strip stem out of temporary hri
        tmp = url.build(tmp).replace(url.build(stem), '');

        // no slashes? lookup in index, build agnostic url
        if ( !~tmp.indexOf('/') )
            if ( tmp in index )
                hri.pathname = repo + '/blob/' + branch + '/' + index[tmp];

        // found or not, return to sender
        return hri;
    }

    // start observing childLists on element
    function watch(el) {
        // assume selector if string
        if ( typeof el === 'string' )
            el = document.querySelector(el);

        // ignore if not valid element
        if ( el instanceof HTMLElement )
            this.observe(el, { attributes: false, childList: true, characterData: false });
    }

    // micro url building/parsing util
    var url = (function () {
        var attr = ['protocol', 'host', 'pathname', 'search', 'hash'],
            cache;

        function anchor() {
            if ( ! cache )
                cache = document.createElement('a');
            return cache;
        }

        function parse(uri) {
            var el = anchor(),
                out = {};
            el.href = uri;
            attr.forEach(function(prop) {
                out[prop] = el[prop];
            });
            el.href = '/';
            return out;
        }

        function build(uri) {
            var el = anchor();
            attr.forEach(function(prop) {
                el[prop] = uri[prop] || null;
            });
            return el.href;
        }

        return {
            build: build,
            parse: parse
        };
    })();

    // go go go
    init();
}();