!function () {

    var base, index, tree;

    // first things first
    function init() {
        // populate base and tree variables
        foreach.call(
            document.getElementsByTagName('link'),
            function (link) {
                if ( link.rel === 'alternate' && link.type === 'application/atom+xml' )
                    base = rewrite(link.href.substr(0, link.href.indexOf('.atom')));
                if ( link.rel === 'permalink' )
                    tree = link.href.split('/')[6];
                if ( base && tree )
                    return;
            }
        );

        // unsupported page
        if ( ! base ) return;

        // couldn't find tree, try elsewhere (mainly for edit previews)
        if ( ! tree ) {
            tree = foreach.call(
                document.getElementsByName('commit'),
                function (commit) {
                    return commit.value;
                }
            );
        }

        // lookup file list and generate index; disallow duplicate names
        list(function (paths) {
            index = {};
            foreach.call(paths, function (path) {
                var name = path.substr(path.lastIndexOf('/') + 1);
                if ( ! ( name in index ) )
                    index[name] = path;
                else
                    index[name] = null;
            });
            for ( name in index )
                if ( index[name] === null )
                    delete index[name];
            // re-mutate once populate
            mutate();
        });

        // mutate when entering a page view using ajax slider
        watch(document.getElementById('slider'), function (e) {
            if ( e.target.className === 'frame' )
                mutate();
        });

        // mutate when entering an edit page's preview mode
        watch(document.getElementsByClassName('js-commit-preview')[0], function (e) {
            if ( e.target.id === 'readme' )
                mutate();
        });

        // mutate page as is to fix everything
        mutate();
    }

    // neater loops; with return values
    function foreach(_) {
        var i = 0,
            l = this.length,
            r;

        for ( ; i < l; i++ )
            if ( r = _(this[i], i) )
                return r;
    }

    // fetch file list from github
    function list(_) {
        // no tree? bail
        if ( ! tree ) return;

        // can haz cache?
        if ( typeof tree === 'object' )
            return _(tree);

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if ( xhr.readyState === 4 && xhr.status === 200 ) {
                tree = JSON.parse(xhr.responseText).paths;
                _(tree);
            }
        }

        xhr.open('get', base[0] + 'tree-list/' + tree, true);
        xhr.send();
    }

    // actually fix shit
    function mutate() {
        var readme = document.getElementById('readme');

        // nowhere to fix things
        if ( ! readme ) return;

        // fix anchors
        foreach.call(
            readme.getElementsByTagName('a'),
            function (a) {
                if ( a.className === 'anchor' )
                    return;
                var url = rewrite(a.href);
                if ( url )
                    a.href = url;
            }
        );

        // fix images
        foreach.call(
            readme.getElementsByTagName('img'),
            function (img) {
                var url = rewrite(img.src, true);
                if ( url )
                    img.src = url;
            }
        );
    }

    // magical rewriting
    function rewrite(uri, raw) {
        // lookup pathless links
        var url = search(uri),
            parts = /([a-z0-9]+:\/\/(?:[^\/]+\/){3})([^\/]+)(\/.*?)(?:\.\.\.(\/.*))?$/.exec(url);

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
        if ( base && index ) {
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
        }

        return uri;
    }

    // attach DOMNodeInserted listener
    function watch(el, handler) {
        if ( el instanceof HTMLElement )
            el.addEventListener('DOMNodeInserted', handler);
    }

    init();

}();
