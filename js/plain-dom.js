
function count_indents(s) {
    return s.match(/^ */g)[0].length / 2; // todo consider to support 4 spaces and tabs
}

function parseDomLine(line) {
    let $result;
    let tokens = line.split(' ');
    tokens = tokens.filter((token) => token !== '');
    if (tokens.length > 0) {
        let first = tokens.shift();
        let first_parts = first.split('.');
        let tag = first_parts.shift();
        let id = '';
        if (tag.indexOf('#') > 0) {
            let tag_parts = tag.split('#');
            tag = tag_parts.shift();
            id = tag_parts.shift();
        }
        $result = $(`<${tag}>`);
        if (id) {
            $result.attr('id', id);
        }
        for (let cls of first_parts) {
            $result.addClass(cls);
        }
    }
    let key = '';
    for (const token of tokens) {
        if (key === '') {
            key = token;
        } else {
            if ((key === 'display') && (token === 'none')) {
                $result.hide();
            } else {
//                console.log(`key ${key}  token ${token}`);
                $result.attr(key, token);
            }
            key = '';
        }
    }
    return $result;
}

function parseDom(lines, selector) {
    let $parents = [];
    let previousDepth = -1;
    let $currentElement;

    for (const line of lines) {
        if (!line) {
            continue;
        }
//        console.log(line);
        let depth = count_indents(line);
        let tl = line.trim();
        if (!tl) {
            continue;
        }
        if (tl.startsWith('text ')) {
            //            console.log(`setting text of ${$parents[$parents.length - 1][0].classList} to ${tl.substring(5)}`);
            $parents[$parents.length - 1].text(tl.substring(5));
            continue;
        } else if (tl.startsWith('html ')) {
            //            console.log(`setting html of ${$parents[$parents.length - 1][0].classList} to ${tl.substring(5)}`);
            $parents[$parents.length - 1].html(tl.substring(5));
            continue;
        }
        //        console.log(`current depth ${depth}  previous depth ${previousDepth}  ${tl}`);
        $currentElement = parseDomLine(tl);
        $currentElement.attr('data-simple-dom-depth', depth);
        //        console.log($currentElement);
        if (depth === previousDepth) {
            if ($parents.length > 1) {
                let $previous = $parents[$parents.length - 1];
                let $previousPrevious = $parents[$parents.length - 2];
                if ($previousPrevious.attr('data-simple-dom-depth') < $previous.attr('data-simple-dom-depth')) {
                    let $child = $parents.pop();
                    $child.removeAttr('data-simple-dom-depth');
                    //            console.log(`appending ${$child[0].classList} to ${$parents[$parents.length - 1][0].classList}`);
                    $parents[$parents.length - 1].append($child);
                }
            }
        } else if (depth < previousDepth) {
            for (let i = previousDepth; i >= depth; i--) {
                //                console.log(`depth less than or equal to previous ${i}`);
                const childDepth = +$parents[$parents.length - 1].attr('data-simple-dom-depth');
                if (childDepth > 0) {
                    let $child = $parents.pop();
                    $child.removeAttr('data-simple-dom-depth');
                    //                console.log(`appending ${$child[0].classList} to ${$parents[$parents.length - 1][0].classList}`);
                    $parents[$parents.length - 1].append($child);
                } else {
                    break;
                }
            }
        }
        $parents.push($currentElement);
        previousDepth = depth;
    }
    for (let i = previousDepth - 1; i >= 0; i--) {
        let $child = $parents.pop();
        //        console.log(`appending ${$child[0].classList} to ${$parents[$parents.length - 1][0].classList}`);
        $child.removeAttr('data-simple-dom-depth');
        $parents[$parents.length - 1].append($child);
    }
    for (const $parent of $parents) {
        $parent.removeAttr('data-simple-dom-depth');
    }
    let target_selector = selector;
    if (!target_selector) {
        target_selector = 'body';
    }
    const $target = $(target_selector);
    $target.append($parents);
//    $body.find('.form').hide();
//    initializeAfterDom();
}

function plainDom(domString, selector) {
    const lines = domString.split('\n');
    parseDom(lines, selector);
}

async function basicFetch(path) {
    //    console.log(`basic fetch  path ${path}`);
    const response = await fetch(path, { cache: "no-store" });
    return await response.text();
}

function plainDomFetch(path, selector, onComplete) {
    basicFetch(path).then((domString) => {
        plainDom(domString, selector);
        if (onComplete) {
            onComplete();
        }
    });
}
