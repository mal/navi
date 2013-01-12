!function () {

    // vars and shit
    var base, index, tree,
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    // first things first
    function init() {
        // easy mode
        HTMLCollection.prototype.forEach = NodeList.prototype.forEach = Array.prototype.forEach;
        HTMLCollection.prototype.some = NodeList.prototype.some = Array.prototype.some;
        MutationObserver.prototype.watch = watch;

        // populate base and tree variables
        document.getElementsByTagName('link').some(function (link) {
            if ( link.rel === 'alternate' && link.type === 'application/atom+xml' )
                base = rewrite(link.href.substr(0, link.href.indexOf('.atom')));
            if ( link.rel === 'permalink' )
                tree = link.href.split('/')[6];
            return base && tree;
        });

        // unsupported page
        if ( ! base )
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

        xhr.onreadystatechange = function () {
            if ( xhr.readyState === 4 && xhr.status === 200 ) {
                tree = JSON.parse(xhr.responseText).paths;
                callback(tree);
            }
        }

        xhr.open('get', base[0] + 'tree-list/' + tree, true);
        xhr.send();
    }

    // actually fix shit
    function mutate() {
        var readme = document.getElementById('readme');

        // nowhere to fix things
        if ( ! readme )
            return;

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

    // magical rewriting
    function rewrite(uri, raw) {
        // lookup pathless links
        var url = search(uri),
            parts = /([a-z0-9]+:\/\/(?:[^\/]+\/){3})([^\/]+)(\/.*?)(?:\.\.\.(\/.*))?$/.exec(url);

        // return false on no change
        function out(url) {
            if ( uri === url )
                return false;
            return url;
        }

        // not valid, sack it off
        if ( !parts ) return out(url);

        parts.shift();

        // triple dot rebase
        if ( base && parts[3] !== undefined )
            parts = base.concat(parts[3]);

        // group parts 2 and up
        parts[2] = parts.slice(2).join('');
        parts = parts.slice(0, 3);

        // assume blob, unless we want raw explicitly
        parts[1] = raw ? 'raw' : 'blob';

        // trailing slash means it's really a tree
        if ( /\/(?:\?|#|$)/.test(parts[2]) )
            parts[1] = 'tree';

        // need base to be an array, no joining
        if ( ! base )
            return parts;

        // but normally we should join
        return out(parts.join(''));
    }

    // lookup in index
    function search(uri) {
        if ( ! (base && index) )
            return uri;

        // extract stem, strip stem from uri, validate uri is now pathless
        var location = window.location.toString(),
            pathless = /^([^\?\/#]+)?(\?[^#]+)?(#.+)?$/.exec(
                uri.replace(location.substr(0, location.lastIndexOf('/') + 1), '')
            );

        // lookup pathless urls
        if ( pathless ) {
            pathless.shift();
            var name = pathless.shift();
            if ( name in index )
                uri = base.join('') + '/' + index[name] + pathless.join('');
        }

        return uri;
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

    init();

}();